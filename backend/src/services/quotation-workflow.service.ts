import { isValidPriceSnapshot, quotationPriceSnapshotMatches } from './pricing.service';
import {
  generateOrderCode,
  OrderCodeRetryOptions,
  withOrderCodeCollisionRetry,
} from './order-code.service';
import { reservePromoUsage } from './promo-usage.service';
import {
  canCustomerConfirmQuotation,
  canReadQuotation,
  canStaffApproveQuotation,
  isQuotationAdmin,
  QuotationPrincipal,
  QuotationStateRecord,
} from './quotation-policy';

type DbMethod = (args: any) => Promise<any>;

export type QuotationTransaction = {
  $queryRaw: (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;
  quotation: {
    findUnique: DbMethod;
    create: DbMethod;
    updateMany: DbMethod;
  };
  quotationReview: { findUnique: DbMethod; create: DbMethod };
  productVariant: { findMany: DbMethod; updateMany: DbMethod };
  campaign: { findMany: DbMethod };
  rewardMilestone: { findMany: DbMethod };
  promoCode: { findUnique: DbMethod; updateMany: DbMethod };
  order: { findUnique: DbMethod; create: DbMethod };
};

export type QuotationDatabase = {
  $transaction<T>(
    work: (transaction: QuotationTransaction) => Promise<T>,
    options?: { isolationLevel: 'Serializable' },
  ): Promise<T>;
  order: { findUnique: DbMethod };
  quotation: { findUnique: DbMethod };
  quotationReview: { findUnique: DbMethod };
};

export class QuotationWorkflowError extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string,
  ) {
    super(message);
    this.name = 'QuotationWorkflowError';
  }
}

export type QuoteLineRequest = { variantId: string; quantity: number };

export type QuotePriceSnapshot = {
  unitPrice: number;
  originalUnitPrice: number | null;
  saleUnitPrice: number | null;
};

export type QuoteTotals = {
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
};

export type CreateQuotationInput = {
  items: QuoteLineRequest[];
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  deliveryMethod?: 'delivery' | 'pickup';
  promoCode?: string | null;
  note?: string | null;
  sourceSessionId?: string | null;
  /** Supplied by trusted backend configuration, never copied from the customer request. */
  expiresAt: Date;
};

export type QuotationPricing = {
  resolveVariantPrice(variant: any): QuotePriceSnapshot;
  calculateTotals(subtotal: number): QuoteTotals;
  generateQuoteNumber(): string;
  deliveryMethod?: 'delivery' | 'pickup';
  getAppliedPromoCodeId?(subtotal: number): string | null;
};

export type QuotationPricingProvider = (
  transaction: QuotationTransaction,
  quotationOrInput?: any,
) => QuotationPricing | Promise<QuotationPricing>;

export type QuotationOrderConverter = {
  /** Must perform database writes only, inside this transaction; never send email or call external services. */
  createOrder(transaction: QuotationTransaction, quotation: any, orderCode?: string): Promise<any>;
};

export type QuotationBankTransferData = {
  transferContent: string;
  qrData: string | null;
  expiresAt: Date;
};

export function createQuotationOrderConverter(options: {
  /** Pure, synchronous local data builder only; never call a remote payment service here. */
  createBankTransferData?: (orderCode: string, amount: number) => QuotationBankTransferData;
  generateOrderCode?: () => string;
} = {}): QuotationOrderConverter {
  const nextOrderCode = options.generateOrderCode || generateOrderCode;

  return {
    async createOrder(transaction, quotation, reservedOrderCode) {
      if (quotation.paymentMethod !== 'COD' && quotation.paymentMethod !== 'BANK_TRANSFER') {
        fail('INVALID_PAYMENT_METHOD', 409, 'Quotation payment method is no longer supported.');
      }
      const orderCode = reservedOrderCode || nextOrderCode();
      if (typeof orderCode !== 'string' || !orderCode.trim()) {
        fail('INVALID_ORDER_CODE', 500, 'Backend order-code generator returned an invalid value.');
      }
      const paymentData = quotation.paymentMethod === 'BANK_TRANSFER'
        ? options.createBankTransferData?.(orderCode, quotation.totalAmount)
        : undefined;
      if (quotation.paymentMethod === 'BANK_TRANSFER' && !paymentData) {
        fail('BANK_TRANSFER_CONFIGURATION_REQUIRED', 503, 'Bank-transfer instructions are not configured.');
      }

      const items = (quotation.items as Array<any>).map(item => ({
        variantId: item.variantId,
        productName: item.productName,
        variantInfo: Object.values(item.variantAttributes || {}).map(value => String(value)).filter(Boolean).join(' · ') || 'Mặc định',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }));
      if (items.some(item => !item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
        fail('INVALID_QUOTATION_SNAPSHOT', 409, 'Quotation items cannot be converted to Order items.');
      }

      const promoCodeId = quotation.promoCodeId || null;
      if (promoCodeId) {
        if (!await reservePromoUsage(transaction, promoCodeId, new Date())) {
          fail('PROMO_RECONFIRM_REQUIRED', 409, 'Promo eligibility changed; Customer confirmation is required again.');
        }
      }

      return transaction.order.create({
        data: {
          orderCode,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          assignedStaffId: quotation.assignedStaffId,
          paymentMethod: quotation.paymentMethod,
          status: quotation.paymentMethod === 'BANK_TRANSFER' ? 'pending_payment' : 'confirmed',
          paymentStatus: 'PENDING',
          shippingAddress: quotation.shippingAddress,
          shippingPhone: quotation.shippingPhone,
          shippingFee: quotation.shippingFee,
          discountAmount: quotation.discountAmount,
          totalAmount: quotation.totalAmount,
          promoCodeId,
          note: quotation.note,
          items: { create: items },
          ...(paymentData ? {
            Payment: {
              create: {
                method: 'BANK_TRANSFER',
                amount: quotation.totalAmount,
                status: 'PENDING',
                transferContent: paymentData.transferContent,
                qrData: paymentData.qrData,
                expiresAt: paymentData.expiresAt,
              },
            },
          } : {}),
        },
        include: { items: true, Payment: true },
      });
    },
  };
}

export type ApprovalResult =
  | { outcome: 'converted' | 'already_converted'; order: any }
  | { outcome: 'expired' }
  | {
      outcome: 'needs_requote';
      reason: string;
      revisedQuotation?: { id: string; quoteNumber: string; version: number; totalAmount: number };
    };

function fail(code: string, status: number, message: string): never {
  throw new QuotationWorkflowError(code, status, message);
}

function isApproverForQuotation(principal: QuotationPrincipal, quotation: { assignedStaffId: string | null }): boolean {
  return isQuotationAdmin(principal)
    || (principal.role === 'staff'
      && typeof principal.id === 'string'
      && principal.id === quotation.assignedStaffId);
}

function validateTotals(subtotal: number, totals: QuoteTotals): void {
  const values = [subtotal, totals.discountAmount, totals.shippingFee, totals.totalAmount];
  if (values.some(value => !Number.isSafeInteger(value) || value < 0)) {
    fail('INVALID_QUOTE_TOTALS', 400, 'Quotation pricing returned invalid totals.');
  }
  if (totals.discountAmount > subtotal
    || totals.totalAmount !== Math.max(0, subtotal - totals.discountAmount) + totals.shippingFee) {
    fail('INVALID_QUOTE_TOTALS', 400, 'Quotation totals do not reconcile.');
  }
}

function validatePriceSnapshot(snapshot: QuotePriceSnapshot): void {
  if (!isValidPriceSnapshot(snapshot)) {
    fail('INVALID_QUOTE_PRICE', 400, 'Quotation pricing returned an invalid price snapshot.');
  }
}

export async function createQuotationDraftInTransaction(
  transaction: QuotationTransaction,
  principal: QuotationPrincipal,
  input: CreateQuotationInput,
  pricing: QuotationPricing | QuotationPricingProvider,
  now = new Date(),
): Promise<any> {
  if (principal.role !== 'customer' || typeof principal.id !== 'string' || !principal.id) {
    fail('CUSTOMER_AUTH_REQUIRED', 403, 'Only an authenticated Customer can create a quotation.');
  }
  if (!Array.isArray(input.items) || input.items.length === 0
    || input.items.some(item => typeof item.variantId !== 'string' || !item.variantId
      || !Number.isSafeInteger(item.quantity) || item.quantity <= 0)) {
    fail('INVALID_QUOTATION_ITEMS', 400, 'Quotation items must contain valid variant IDs and positive quantities.');
  }
  if (!input.shippingAddress.trim() || !input.shippingPhone.trim()
    || !(input.expiresAt instanceof Date)
    || input.expiresAt.getTime() <= now.getTime()) {
    fail('INVALID_QUOTATION_DETAILS', 400, 'Quotation delivery details or expiry are invalid.');
  }

  const activePricing = typeof pricing === 'function' ? await pricing(transaction, input) : pricing;
  const ids = [...new Set(input.items.map(item => item.variantId))];
  const variants = await transaction.productVariant.findMany({
    where: { id: { in: ids } },
    include: { product: true },
  });
  const variantsById = new Map(variants.map((variant: any) => [variant.id, variant]));
  const quantityById = new Map<string, number>();
  for (const item of input.items) {
    quantityById.set(item.variantId, (quantityById.get(item.variantId) || 0) + item.quantity);
  }
  for (const [variantId, quantity] of quantityById) {
    const variant = variantsById.get(variantId) as any;
    if (!variant || variant.product?.status !== 'active') {
      fail('VARIANT_UNAVAILABLE', 409, 'A requested product variant is unavailable.');
    }
    if (variant.stock < quantity) fail('OUT_OF_STOCK', 409, 'A requested product variant is out of stock.');
  }

  const itemSnapshots = input.items.map(item => {
    const variant = variantsById.get(item.variantId) as any;
    const price = activePricing.resolveVariantPrice(variant);
    validatePriceSnapshot(price);
    const lineTotal = price.unitPrice * item.quantity;
    if (!Number.isSafeInteger(lineTotal)) fail('INVALID_QUOTE_TOTALS', 400, 'Quotation line total is invalid.');
    return {
      productId: variant.productId,
      variantId: variant.id,
      productName: variant.product.name,
      variantSku: variant.sku,
      variantAttributes: variant.attributes,
      quantity: item.quantity,
      unitPrice: price.unitPrice,
      originalUnitPrice: price.originalUnitPrice,
      saleUnitPrice: price.saleUnitPrice,
      lineTotal,
    };
  });
  const subtotal = itemSnapshots.reduce((sum: number, item: any) => sum + item.lineTotal, 0);
  if (!Number.isSafeInteger(subtotal)) fail('INVALID_QUOTE_TOTALS', 400, 'Quotation subtotal is invalid.');
  const totals = activePricing.calculateTotals(subtotal);
  validateTotals(subtotal, totals);
  const quoteNumber = activePricing.generateQuoteNumber();
  if (typeof quoteNumber !== 'string' || !quoteNumber.trim()) {
    fail('INVALID_QUOTE_NUMBER', 500, 'Backend quotation number generator returned an invalid value.');
  }
  if (!['COD', 'BANK_TRANSFER'].includes(input.paymentMethod)) {
    fail('INVALID_PAYMENT_METHOD', 400, 'Quotation payment method is invalid.');
  }

  return transaction.quotation.create({
    data: {
      quoteNumber,
      customerId: principal.id,
      status: 'PENDING_CUSTOMER_CONFIRMATION',
      subtotal,
      discountAmount: totals.discountAmount,
      shippingFee: totals.shippingFee,
      totalAmount: totals.totalAmount,
      paymentMethod: input.paymentMethod,
      deliveryMethod: input.deliveryMethod || activePricing.deliveryMethod || 'delivery',
      promoCodeId: activePricing.getAppliedPromoCodeId?.(subtotal) || null,
      shippingAddress: input.shippingAddress.trim(),
      shippingPhone: input.shippingPhone.trim(),
      note: input.note || null,
      sourceSessionId: input.sourceSessionId || null,
      expiresAt: input.expiresAt,
      items: { create: itemSnapshots },
    },
    include: { items: true },
  });
}

export async function createQuotationDraft(
  database: QuotationDatabase,
  principal: QuotationPrincipal,
  input: CreateQuotationInput,
  pricing: QuotationPricing | QuotationPricingProvider,
  now = new Date(),
): Promise<any> {
  return database.$transaction(
    transaction => createQuotationDraftInTransaction(transaction, principal, input, pricing, now),
    { isolationLevel: 'Serializable' },
  );
}

export async function confirmQuotation(
  database: QuotationDatabase,
  principal: QuotationPrincipal,
  quotationId: string,
  now = new Date(),
): Promise<any> {
  if (principal.role !== 'customer' || typeof principal.id !== 'string') {
    fail('CUSTOMER_AUTH_REQUIRED', 403, 'Only the owning Customer can confirm a quotation.');
  }
  try {
    return await database.$transaction(async transaction => {
      const quotation = await transaction.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation) fail('QUOTATION_NOT_FOUND', 404, 'Quotation not found.');
      if (quotation.customerId !== principal.id) fail('QUOTATION_FORBIDDEN', 403, 'Quotation belongs to another Customer.');
      // Confirmation retries return the persisted decision; they never create an Order.
      if (quotation.status === 'CUSTOMER_CONFIRMED') {
        return transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
      }
      if (quotation.expiresAt.getTime() <= now.getTime()) fail('QUOTATION_EXPIRED', 410, 'Quotation has expired.');
      if (!canCustomerConfirmQuotation(principal, quotation as QuotationStateRecord, now)) {
        fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation cannot be confirmed in its current state.');
      }
      const claimed = await transaction.quotation.updateMany({
        where: {
          id: quotationId,
          customerId: principal.id,
          status: 'PENDING_CUSTOMER_CONFIRMATION',
          expiresAt: { gt: now },
        },
        data: { status: 'CUSTOMER_CONFIRMED', customerConfirmedAt: now },
      });
      if (claimed.count !== 1) {
        const latest = await transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
        if (latest?.status === 'CUSTOMER_CONFIRMED' && latest.customerId === principal.id) return latest;
        fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation was changed by another request.');
      }
      return transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof QuotationWorkflowError) throw error;
    if ((error as { code?: string })?.code === 'P2034') {
      const latest = await database.quotation.findUnique({ where: { id: quotationId } });
      if (latest?.customerId === principal.id && latest.status === 'CUSTOMER_CONFIRMED') return latest;
    }
    throw error;
  }
}

/** Customer decline is a terminal, replay-safe decision for a pending quote version. */
export async function declineQuotation(
  database: QuotationDatabase,
  principal: QuotationPrincipal,
  quotationId: string,
  now = new Date(),
): Promise<any> {
  if (principal.role !== 'customer' || typeof principal.id !== 'string' || !principal.id) {
    fail('CUSTOMER_AUTH_REQUIRED', 403, 'Only the owning Customer can decline a quotation.');
  }
  try {
    return await database.$transaction(async transaction => {
      const quotation = await transaction.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation) fail('QUOTATION_NOT_FOUND', 404, 'Quotation not found.');
      if (quotation.customerId !== principal.id) fail('QUOTATION_FORBIDDEN', 403, 'Quotation belongs to another Customer.');
      if (quotation.status === 'CUSTOMER_REJECTED') {
        return transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
      }
      if (quotation.status !== 'PENDING_CUSTOMER_CONFIRMATION' || quotation.expiresAt.getTime() <= now.getTime()) {
        fail('QUOTATION_STATE_CONFLICT', 409, 'Only a live, unconfirmed quotation can be declined.');
      }
      const claimed = await transaction.quotation.updateMany({
        where: {
          id: quotationId,
          customerId: principal.id,
          status: 'PENDING_CUSTOMER_CONFIRMATION',
          expiresAt: { gt: now },
        },
        data: { status: 'CUSTOMER_REJECTED', customerRejectedAt: now },
      });
      if (claimed.count !== 1) {
        const latest = await transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
        if (latest?.status === 'CUSTOMER_REJECTED' && latest.customerId === principal.id) return latest;
        fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation was changed by another request.');
      }
      return transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof QuotationWorkflowError) throw error;
    if ((error as { code?: string })?.code === 'P2034') {
      const latest = await database.quotation.findUnique({ where: { id: quotationId } });
      if (latest?.customerId === principal.id && latest.status === 'CUSTOMER_REJECTED') return latest;
    }
    throw error;
  }
}

export type RejectionResult =
  | { outcome: 'rejected' | 'already_rejected'; quotation?: any }
  | { outcome: 'expired' };

/** Rejects only a live, customer-confirmed quotation assigned to this Staff member or Admin. */
export async function rejectQuotation(
  database: QuotationDatabase,
  principal: QuotationPrincipal,
  quotationId: string,
  idempotencyKey: string,
  note: string | null = null,
  now = new Date(),
): Promise<RejectionResult> {
  if (!/^[A-Za-z0-9:_-]{8,128}$/.test(idempotencyKey)) {
    fail('IDEMPOTENCY_KEY_REQUIRED', 400, 'A valid idempotency key is required.');
  }
  if (typeof principal.id !== 'string' || !principal.id) {
    fail('APPROVER_AUTH_REQUIRED', 403, 'An authenticated Staff or Admin identity is required.');
  }

  try {
    return await database.$transaction(async transaction => {
      const quotation = await transaction.quotation.findUnique({ where: { id: quotationId } });
      if (!quotation) fail('QUOTATION_NOT_FOUND', 404, 'Quotation not found.');
      if (!isApproverForQuotation(principal, quotation)) {
        fail('QUOTATION_APPROVAL_FORBIDDEN', 403, 'Only the assigned Staff member or an Admin can reject.');
      }

      const existingReview = await transaction.quotationReview.findUnique({ where: { idempotencyKey } });
      if (existingReview) {
        if (existingReview.quotationId !== quotationId
          || existingReview.reviewerUserId !== principal.id
          || existingReview.decision !== 'REJECTED') {
          fail('IDEMPOTENCY_KEY_CONFLICT', 409, 'This idempotency key was used for another quotation action.');
        }
        return { outcome: 'already_rejected' };
      }
      if (quotation.status === 'REJECTED') {
        fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation has already been rejected.');
      }
      if (!canStaffApproveQuotation(principal, quotation as QuotationStateRecord, now)) {
        if (quotation.status === 'CUSTOMER_CONFIRMED' && quotation.expiresAt.getTime() <= now.getTime()) {
          const expired = await transaction.quotation.updateMany({
            where: { id: quotationId, status: 'CUSTOMER_CONFIRMED', expiresAt: { lte: now } },
            data: { status: 'EXPIRED' },
          });
          if (expired.count === 1) return { outcome: 'expired' };
        }
        fail('QUOTATION_STATE_CONFLICT', 409, 'Customer confirmation is required before Staff review.');
      }

      const claimed = await transaction.quotation.updateMany({
        where: {
          id: quotationId,
          assignedStaffId: quotation.assignedStaffId,
          status: 'CUSTOMER_CONFIRMED',
          customerConfirmedAt: { not: null },
          expiresAt: { gt: now },
        },
        data: { status: 'REJECTED' },
      });
      if (claimed.count !== 1) fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation was changed during review.');

      await transaction.quotationReview.create({
        data: {
          quotationId,
          reviewerUserId: principal.id,
          decision: 'REJECTED',
          note,
          idempotencyKey,
        },
      });
      return {
        outcome: 'rejected',
        quotation: await transaction.quotation.findUnique({ where: { id: quotationId }, include: { items: true } }),
      };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof QuotationWorkflowError) throw error;
    const databaseError = error as { code?: string };
    if (databaseError?.code === 'P2002' || databaseError?.code === 'P2034') {
      const existingReview = await database.quotationReview.findUnique({ where: { idempotencyKey } });
      if (existingReview?.quotationId === quotationId
        && existingReview.reviewerUserId === principal.id
        && existingReview.decision === 'REJECTED') {
        return { outcome: 'already_rejected' };
      }
      fail('QUOTATION_REJECTION_CONFLICT', 409, 'Another request is processing this quotation.');
    }
    throw error;
  }
}

export async function approveAndConvertQuotation(
  database: QuotationDatabase,
  principal: QuotationPrincipal,
  quotationId: string,
  idempotencyKey: string,
  pricing: QuotationPricing | QuotationPricingProvider,
  converter: QuotationOrderConverter,
  now = new Date(),
  orderCodeRetryOptions: OrderCodeRetryOptions = {},
  getRequoteExpiry?: (now: Date) => Date,
): Promise<ApprovalResult> {
  if (!/^[A-Za-z0-9:_-]{8,128}$/.test(idempotencyKey)) {
    fail('IDEMPOTENCY_KEY_REQUIRED', 400, 'A valid idempotency key is required.');
  }
  if (typeof principal.id !== 'string' || !principal.id) {
    fail('APPROVER_AUTH_REQUIRED', 403, 'An authenticated Staff or Admin identity is required.');
  }

  try {
    return await withOrderCodeCollisionRetry(orderCode => database.$transaction(async transaction => {
      // Same first lock as DELETE: conversion and deletion cannot work on this parent concurrently.
      await transaction.$queryRaw`SELECT "id" FROM "Quotation" WHERE "id" = ${quotationId} FOR UPDATE`;
      const quotation = await transaction.quotation.findUnique({
        where: { id: quotationId },
        include: { items: true },
      });
      if (!quotation) fail('QUOTATION_NOT_FOUND', 404, 'Quotation not found.');
      if (!isApproverForQuotation(principal, quotation)) {
        fail('QUOTATION_APPROVAL_FORBIDDEN', 403, 'Only the assigned Staff member or an Admin can approve.');
      }
      if (quotation.status === 'CONVERTED') {
        const order = await transaction.order.findUnique({ where: { quotationId } });
        if (!order) fail('CONVERTED_ORDER_MISSING', 500, 'Converted quotation has no linked Order.');
        return { outcome: 'already_converted', order };
      }
      const previousRequoteReview = await transaction.quotationReview.findUnique({ where: { idempotencyKey } });
      if (previousRequoteReview) {
        if (previousRequoteReview.quotationId !== quotationId
          || previousRequoteReview.reviewerUserId !== principal.id
          || previousRequoteReview.decision !== 'NEEDS_REQUOTE') {
          fail('IDEMPOTENCY_KEY_CONFLICT', 409, 'This idempotency key was used for another quotation action.');
        }
        const revised = await transaction.quotation.findUnique({ where: { previousVersionId: quotationId } });
        return {
          outcome: 'needs_requote',
          reason: quotation.requoteReason || previousRequoteReview.note || 'price_changed',
          ...(revised ? { revisedQuotation: {
            id: revised.id,
            quoteNumber: revised.quoteNumber,
            version: revised.version ?? ((quotation.version ?? 1) + 1),
            totalAmount: revised.totalAmount,
          } } : {}),
        };
      }
      if (!canReadQuotation(principal, quotation)
        || !canStaffApproveQuotation(principal, quotation as QuotationStateRecord, now)) {
        if (quotation.expiresAt.getTime() <= now.getTime()
          && quotation.status === 'CUSTOMER_CONFIRMED') {
          await transaction.quotation.updateMany({
            where: { id: quotationId, status: 'CUSTOMER_CONFIRMED', expiresAt: { lte: now } },
            data: { status: 'EXPIRED' },
          });
          return { outcome: 'expired' };
        }
        fail('QUOTATION_STATE_CONFLICT', 409, 'Customer confirmation is required before Staff approval.');
      }

      const activePricing = typeof pricing === 'function' ? await pricing(transaction, quotation) : pricing;

      const snapshots = quotation.items as Array<any>;
      const variantIds = [...new Set(snapshots.map(item => item.variantId).filter(Boolean))];
      const variants = await transaction.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });
      const variantsById = new Map(variants.map((variant: any) => [variant.id, variant]));
      let unavailableReason: string | null = null;
      let priceChanged = false;
      const requiredQuantity = new Map<string, number>();
      const currentItemSnapshots: Array<any> = [];
      for (const item of snapshots) {
        if (!item.variantId || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
          unavailableReason = 'variant_unavailable';
          continue;
        }
        requiredQuantity.set(item.variantId, (requiredQuantity.get(item.variantId) || 0) + item.quantity);
        const variant = variantsById.get(item.variantId) as any;
        if (!variant || variant.product?.status !== 'active') {
          unavailableReason = 'variant_unavailable';
          continue;
        }
        const currentPrice = activePricing.resolveVariantPrice(variant);
        validatePriceSnapshot(currentPrice);
        if (!quotationPriceSnapshotMatches({
          unitPrice: item.unitPrice,
          originalUnitPrice: item.originalUnitPrice ?? null,
          saleUnitPrice: item.saleUnitPrice ?? null,
        }, currentPrice)) {
          priceChanged = true;
        }
        const lineTotal = currentPrice.unitPrice * item.quantity;
        if (!Number.isSafeInteger(lineTotal)) fail('INVALID_QUOTE_TOTALS', 400, 'Quotation line total is invalid.');
        currentItemSnapshots.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          variantSku: variant.sku,
          variantAttributes: variant.attributes,
          quantity: item.quantity,
          unitPrice: currentPrice.unitPrice,
          originalUnitPrice: currentPrice.originalUnitPrice,
          saleUnitPrice: currentPrice.saleUnitPrice,
          lineTotal,
        });
      }
      let outOfStock = false;
      if (!unavailableReason) {
        for (const [variantId, quantity] of requiredQuantity) {
          const variant = variantsById.get(variantId) as any;
          if (!variant || variant.stock < quantity) {
            outOfStock = true;
            break;
          }
        }
      }
      const allItemsPriced = currentItemSnapshots.length === snapshots.length;
      let currentSubtotal = 0;
      let currentTotals: QuoteTotals | null = null;
      let totalsChanged = false;
      if (allItemsPriced) {
        currentSubtotal = currentItemSnapshots.reduce((sum: number, item: any) => sum + item.lineTotal, 0);
        if (!Number.isSafeInteger(currentSubtotal)) fail('INVALID_QUOTE_TOTALS', 400, 'Quotation subtotal is invalid.');
        currentTotals = activePricing.calculateTotals(currentSubtotal);
        validateTotals(currentSubtotal, currentTotals);
        const currentPromoCodeId = activePricing.getAppliedPromoCodeId?.(currentSubtotal) || null;
        totalsChanged = currentSubtotal !== quotation.subtotal
          || currentTotals.discountAmount !== quotation.discountAmount
          || currentTotals.shippingFee !== quotation.shippingFee
          || currentTotals.totalAmount !== quotation.totalAmount
          || currentPromoCodeId !== (quotation.promoCodeId || null);
      }
      const staleReason = unavailableReason || (outOfStock ? 'out_of_stock' : null)
        || (priceChanged ? 'price_changed' : null)
        || (totalsChanged ? 'totals_changed' : null);
      if (staleReason) {
        const moved = await transaction.quotation.updateMany({
          where: { id: quotationId, status: 'CUSTOMER_CONFIRMED' },
          data: { status: 'NEEDS_REQUOTE', requoteReason: staleReason },
        });
        if (moved.count !== 1) fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation changed during review.');
        await transaction.quotationReview.create({
          data: {
            quotationId,
            reviewerUserId: principal.id,
            decision: 'NEEDS_REQUOTE',
            note: staleReason,
            idempotencyKey,
          },
        });
        let revisedQuotation: { id: string; quoteNumber: string; version: number; totalAmount: number } | undefined;
        if ((priceChanged || totalsChanged) && !unavailableReason && !outOfStock && allItemsPriced && currentTotals) {
          if (!getRequoteExpiry) {
            fail('QUOTATION_REQUOTE_POLICY_UNAVAILABLE', 503, 'Quotation expiry policy is required to issue a revised quote.');
          }
          const expiresAt = getRequoteExpiry(now);
          if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= now) {
            fail('QUOTATION_REQUOTE_POLICY_UNAVAILABLE', 503, 'Quotation expiry policy is invalid.');
          }
          const quoteNumber = activePricing.generateQuoteNumber();
          if (typeof quoteNumber !== 'string' || !quoteNumber.trim()) {
            fail('INVALID_QUOTE_NUMBER', 500, 'Backend quotation number generator returned an invalid value.');
          }
          const created = await transaction.quotation.create({
            data: {
              quoteNumber,
              customerId: quotation.customerId,
              assignedStaffId: quotation.assignedStaffId,
              status: 'PENDING_CUSTOMER_CONFIRMATION',
              version: (quotation.version ?? 1) + 1,
              previousVersionId: quotation.id,
              subtotal: currentSubtotal,
              discountAmount: currentTotals.discountAmount,
              shippingFee: currentTotals.shippingFee,
              totalAmount: currentTotals.totalAmount,
              paymentMethod: quotation.paymentMethod,
              deliveryMethod: activePricing.deliveryMethod || quotation.deliveryMethod || 'delivery',
              promoCodeId: activePricing.getAppliedPromoCodeId?.(currentSubtotal) || null,
              shippingAddress: quotation.shippingAddress,
              shippingPhone: quotation.shippingPhone,
              note: quotation.note,
              sourceSessionId: quotation.sourceSessionId ?? null,
              expiresAt,
              items: { create: currentItemSnapshots },
            },
            include: { items: true },
          });
          revisedQuotation = {
            id: created.id,
            quoteNumber: created.quoteNumber,
            version: created.version,
            totalAmount: created.totalAmount,
          };
        }
        return { outcome: 'needs_requote', reason: staleReason, ...(revisedQuotation ? { revisedQuotation } : {}) };
      }

      const claimed = await transaction.quotation.updateMany({
        where: {
          id: quotationId,
          assignedStaffId: quotation.assignedStaffId,
          status: 'CUSTOMER_CONFIRMED',
          customerConfirmedAt: { not: null },
          expiresAt: { gt: now },
        },
        data: { status: 'APPROVED', approvedAt: now },
      });
      if (claimed.count !== 1) fail('QUOTATION_STATE_CONFLICT', 409, 'Quotation was changed by another request.');

      for (const [variantId, quantity] of requiredQuantity) {
        const variant = variantsById.get(variantId) as any;
        const price = activePricing.resolveVariantPrice(variant);
        const decremented = await transaction.productVariant.updateMany({
          where: {
            id: variantId,
            price: variant.price,
            salePrice: variant.salePrice,
            stock: { gte: quantity },
            product: { is: { status: 'active' } },
          },
          data: { stock: { decrement: quantity } },
        });
        if (decremented.count !== 1 || price.unitPrice !== snapshots.find(item => item.variantId === variantId)?.unitPrice) {
          fail('QUOTATION_REVALIDATION_RACE', 409, 'Price or stock changed while the quotation was being approved.');
        }
      }

      await transaction.quotationReview.create({
        data: {
          quotationId,
          reviewerUserId: principal.id,
          decision: 'APPROVED',
          idempotencyKey,
        },
      });
      const order = await converter.createOrder(transaction, quotation, orderCode);
      if (!order || order.orderCode !== orderCode
        || order.quotationId !== quotationId || order.customerId !== quotation.customerId) {
        fail('ORDER_CONVERSION_INVALID', 500, 'Order converter did not persist the reserved code and quotation link.');
      }
      const converted = await transaction.quotation.updateMany({
        where: { id: quotationId, status: 'APPROVED' },
        data: { status: 'CONVERTED', convertedAt: now },
      });
      if (converted.count !== 1) fail('QUOTATION_CONVERSION_CONFLICT', 409, 'Quotation conversion did not complete.');
      return { outcome: 'converted', order };
    }, { isolationLevel: 'Serializable' }), orderCodeRetryOptions);
  } catch (error) {
    if (error instanceof QuotationWorkflowError) throw error;
    const databaseError = error as { code?: string };
    if (databaseError?.code === 'P2002' || databaseError?.code === 'P2034') {
      const completedReview = await database.quotationReview.findUnique({ where: { idempotencyKey } });
      if (completedReview?.quotationId === quotationId
        && completedReview.reviewerUserId === principal.id
        && completedReview.decision === 'NEEDS_REQUOTE') {
        const [latestQuotation, revised] = await Promise.all([
          database.quotation.findUnique({ where: { id: quotationId } }),
          database.quotation.findUnique({ where: { previousVersionId: quotationId } }),
        ]);
        return {
          outcome: 'needs_requote',
          reason: latestQuotation?.requoteReason || completedReview.note || 'price_changed',
          ...(revised ? { revisedQuotation: {
            id: revised.id,
            quoteNumber: revised.quoteNumber,
            version: revised.version ?? ((latestQuotation?.version ?? 1) + 1),
            totalAmount: revised.totalAmount,
          } } : {}),
        };
      }
      const existingOrder = await database.order.findUnique({ where: { quotationId } });
      if (existingOrder && isApproverForQuotation(principal, { assignedStaffId: existingOrder.assignedStaffId ?? null })) {
        return { outcome: 'already_converted', order: existingOrder };
      }
      fail('QUOTATION_APPROVAL_CONFLICT', 409, 'Another request is processing this quotation; no automatic retry was performed.');
    }
    throw error;
  }
}
