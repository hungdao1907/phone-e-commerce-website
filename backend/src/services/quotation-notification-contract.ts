import { randomUUID } from 'crypto';

export const QUOTATION_NOTIFICATION_EVENT_TYPES = [
  'quotation.created',
  'quotation.customer_confirmation_required',
  'quotation.needs_requote',
  'quotation.staff_assigned',
  'quotation.staff_approved',
  'quotation.staff_rejected',
  'order.created',
] as const;

export type QuotationNotificationEventType = typeof QUOTATION_NOTIFICATION_EVENT_TYPES[number];
export type QuotationNotificationEnvelope = {
  schemaVersion: 1;
  eventId: string;
  eventType: QuotationNotificationEventType;
  ownerType: 'quotation' | 'order';
  ownerId: string;
  recipient: { role: 'customer' | 'staff'; userId: string };
  templateKey: string;
  deduplicationKey: string;
  occurredAt: string;
};

export type QuotationNotificationInput = {
  eventType: QuotationNotificationEventType;
  quotationId?: string;
  quotationVersion?: number;
  customerId: string;
  assignedStaffId?: string | null;
  reviewId?: string;
  orderId?: string;
  eventId?: string;
  occurredAt?: Date;
};

/** Builds an immutable outbox-ready contract; it deliberately sends nothing. */
export function buildQuotationNotificationEnvelope(input: QuotationNotificationInput): QuotationNotificationEnvelope {
  const quotationId = input.quotationId?.trim();
  const customerId = input.customerId.trim();
  if (!customerId) throw new Error('A notification recipient is required.');

  const quotationEvent = input.eventType.startsWith('quotation.');
  const ownerId = quotationEvent ? quotationId : input.orderId?.trim();
  if (!ownerId) throw new Error('A quotation or order owner is required.');

  const version = input.quotationVersion;
  const versionPart = Number.isSafeInteger(version) && (version as number) > 0 ? `:v${version}` : '';
  let recipient: QuotationNotificationEnvelope['recipient'] = { role: 'customer', userId: customerId };
  let templateKey: string;
  let deduplicationKey: string;

  switch (input.eventType) {
    case 'quotation.created':
      templateKey = 'quotation-created';
      deduplicationKey = `quotation:${ownerId}:created${versionPart}`;
      break;
    case 'quotation.customer_confirmation_required':
      templateKey = 'quotation-confirmation-required';
      deduplicationKey = `quotation:${ownerId}:confirmation-required${versionPart}`;
      break;
    case 'quotation.needs_requote':
      templateKey = 'quotation-needs-requote';
      deduplicationKey = `quotation:${ownerId}:needs-requote${versionPart}`;
      break;
    case 'quotation.staff_assigned':
      if (!input.assignedStaffId?.trim()) throw new Error('An assigned Staff recipient is required.');
      recipient = { role: 'staff', userId: input.assignedStaffId.trim() };
      templateKey = 'quotation-assigned-to-staff';
      deduplicationKey = `quotation:${ownerId}:staff-assigned:${recipient.userId}${versionPart}`;
      break;
    case 'quotation.staff_approved':
    case 'quotation.staff_rejected':
      if (!input.reviewId?.trim()) throw new Error('A persisted review id is required for a review notification.');
      templateKey = input.eventType === 'quotation.staff_approved' ? 'quotation-approved' : 'quotation-rejected';
      deduplicationKey = `quotation:${ownerId}:review:${input.reviewId.trim()}`;
      break;
    case 'order.created':
      templateKey = 'order-created';
      deduplicationKey = `order:${ownerId}:created`;
      break;
    default: {
      const exhaustive: never = input.eventType;
      throw new Error(`Unsupported quotation event: ${String(exhaustive)}`);
    }
  }

  return {
    schemaVersion: 1,
    eventId: input.eventId || randomUUID(),
    eventType: input.eventType,
    ownerType: quotationEvent ? 'quotation' : 'order',
    ownerId,
    recipient,
    templateKey,
    deduplicationKey,
    occurredAt: (input.occurredAt || new Date()).toISOString(),
  };
}
