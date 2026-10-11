import assert from 'node:assert/strict';
import test from 'node:test';
import { buildQuotationNotificationEnvelope } from '../src/services/quotation-notification-contract';

test('quotation notification envelope uses a deterministic dedupe key and Customer-owned template contract', () => {
  const first = buildQuotationNotificationEnvelope({
    eventType: 'quotation.created', quotationId: 'quote-1', quotationVersion: 2,
    customerId: 'customer-1', eventId: 'event-1', occurredAt: new Date('2026-10-10T00:00:00Z'),
  });
  const replay = buildQuotationNotificationEnvelope({
    eventType: 'quotation.created', quotationId: 'quote-1', quotationVersion: 2,
    customerId: 'customer-1', eventId: 'event-2', occurredAt: new Date('2026-10-10T00:00:01Z'),
  });
  assert.equal(first.eventId, 'event-1');
  assert.equal(first.templateKey, 'quotation-created');
  assert.deepEqual(first.recipient, { role: 'customer', userId: 'customer-1' });
  assert.equal(first.deduplicationKey, replay.deduplicationKey);
  assert.notEqual(first.eventId, replay.eventId);
});

test('staff assignment targets the assigned Staff and changes dedupe scope by assignee', () => {
  const a = buildQuotationNotificationEnvelope({
    eventType: 'quotation.staff_assigned', quotationId: 'quote-2', quotationVersion: 1,
    customerId: 'customer-2', assignedStaffId: 'staff-a',
  });
  const b = buildQuotationNotificationEnvelope({
    eventType: 'quotation.staff_assigned', quotationId: 'quote-2', quotationVersion: 1,
    customerId: 'customer-2', assignedStaffId: 'staff-b',
  });
  assert.deepEqual(a.recipient, { role: 'staff', userId: 'staff-a' });
  assert.notEqual(a.deduplicationKey, b.deduplicationKey);
});

test('review and order events require persisted identifiers for idempotent deduplication', () => {
  assert.throws(() => buildQuotationNotificationEnvelope({
    eventType: 'quotation.staff_approved', quotationId: 'quote-3', customerId: 'customer-3',
  }), /review id/);
  const order = buildQuotationNotificationEnvelope({
    eventType: 'order.created', orderId: 'order-3', customerId: 'customer-3',
  });
  assert.equal(order.ownerType, 'order');
  assert.equal(order.deduplicationKey, 'order:order-3:created');
});
