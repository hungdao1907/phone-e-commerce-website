import crypto from 'crypto';

const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._~-]{16,128}$/;

export type DirectCheckoutIdempotencyPayload = {
  items: Array<{ variantId: string; quantity: number }>;
  promoCode?: string | null;
  deliveryMethod: 'delivery' | 'pickup';
  paymentMethod?: string | null;
  shippingAddress: string;
  shippingPhone: string;
  note?: string | null;
  estimatedDelivery?: string | Date | null;
};

export class CheckoutIdempotencyError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 409) {
    super(message);
    this.name = 'CheckoutIdempotencyError';
  }
}

export type CheckoutIdempotencyTransaction = {
  checkoutIdempotency: {
    create(args: any): Promise<{ id: string }>;
    update(args: any): Promise<unknown>;
  };
};

export type CheckoutIdempotencyDatabase<TTransaction extends CheckoutIdempotencyTransaction> = {
  $transaction<T>(
    work: (transaction: TTransaction) => Promise<T>,
    options: { isolationLevel: 'Serializable' },
  ): Promise<T>;
  checkoutIdempotency: { findUnique(args: any): Promise<{ requestHash: string; orderId: string | null } | null> };
  order: { findUnique(args: any): Promise<any | null> };
};

export const MAX_CHECKOUT_TRANSACTION_RETRIES = 3;

function digest(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Generate one opaque key per intentional checkout; never reuse it for another cart. */
export function generateCheckoutIdempotencyKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashCheckoutIdempotencyKey(value: unknown): string {
  if (typeof value !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new CheckoutIdempotencyError(
      'IDEMPOTENCY_KEY_REQUIRED',
      'A valid per-checkout idempotency key is required.',
      400,
    );
  }
  return digest(value);
}

/** Enforces a fail-closed API contract while allowing the legacy route with no key. */
export function resolveCheckoutIdempotencyRequest(
  enabled: boolean,
  rawKey: unknown,
): { enabled: boolean; key: string | null } {
  if (!enabled) {
    if (rawKey !== undefined && rawKey !== null) {
      throw new CheckoutIdempotencyError(
        'IDEMPOTENCY_NOT_ACTIVATED',
        'Durable checkout retry protection is not activated yet. Do not retry an uncertain request until its order status is checked.',
        503,
      );
    }
    return { enabled: false, key: null };
  }
  if (typeof rawKey !== 'string') {
    throw new CheckoutIdempotencyError(
      'IDEMPOTENCY_KEY_REQUIRED',
      'Send a unique Idempotency-Key for this checkout attempt.',
      400,
    );
  }
  hashCheckoutIdempotencyKey(rawKey);
  return { enabled: true, key: rawKey };
}

function normalizePayload(customerId: string, payload: DirectCheckoutIdempotencyPayload) {
  if (!customerId || !Array.isArray(payload?.items) || payload.items.length === 0) {
    throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout payload is invalid.', 400);
  }
  if (payload.deliveryMethod !== 'delivery' && payload.deliveryMethod !== 'pickup') {
    throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout delivery method is invalid.', 400);
  }
  if (typeof payload.shippingAddress !== 'string' || typeof payload.shippingPhone !== 'string'
    || !payload.shippingAddress.trim() || !payload.shippingPhone.trim()) {
    throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout delivery details are invalid.', 400);
  }
  if (payload.note !== undefined && payload.note !== null && typeof payload.note !== 'string') {
    throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout note is invalid.', 400);
  }

  const quantityByVariant = new Map<string, number>();
  for (const item of payload.items) {
    const variantId = typeof item?.variantId === 'string' ? item.variantId.trim() : '';
    const quantity = item?.quantity;
    if (!variantId || !Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout items are invalid.', 400);
    }
    const total = (quantityByVariant.get(variantId) || 0) + quantity;
    if (!Number.isSafeInteger(total)) {
      throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Checkout quantities exceed the supported range.', 400);
    }
    quantityByVariant.set(variantId, total);
  }

  let estimatedDelivery: string | null = null;
  if (payload.estimatedDelivery !== undefined && payload.estimatedDelivery !== null && payload.estimatedDelivery !== '') {
    const date = payload.estimatedDelivery instanceof Date
      ? payload.estimatedDelivery
      : new Date(payload.estimatedDelivery);
    if (!Number.isFinite(date.getTime())) {
      throw new CheckoutIdempotencyError('INVALID_IDEMPOTENCY_PAYLOAD', 'Estimated delivery date is invalid.', 400);
    }
    estimatedDelivery = date.toISOString();
  }

  const paymentMethod = payload.paymentMethod === 'BANK' || payload.paymentMethod === 'BANK_TRANSFER'
    ? 'BANK_TRANSFER'
    : 'COD';
  return {
    customerId,
    items: [...quantityByVariant.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([variantId, quantity]) => ({ variantId, quantity })),
    promoCode: payload.promoCode?.trim().toLocaleUpperCase('en-US') || null,
    deliveryMethod: payload.deliveryMethod,
    paymentMethod,
    // Preserve the exact strings because those are the values currently persisted to Order.
    shippingAddress: payload.shippingAddress,
    shippingPhone: payload.shippingPhone,
    note: payload.note ?? null,
    estimatedDelivery,
  };
}

export function fingerprintDirectCheckoutRequest(
  customerId: string,
  payload: DirectCheckoutIdempotencyPayload,
): string {
  return digest(normalizePayload(customerId, payload));
}

/** Match only the compound unique key; unrelated P2002 errors must escape unchanged. */
export function isCheckoutIdempotencyUniqueCollision(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const databaseError = error as {
    code?: unknown;
    meta?: { modelName?: unknown; target?: unknown; constraint?: unknown };
  };
  if (databaseError.code !== 'P2002' || !databaseError.meta) return false;
  const { modelName, target, constraint } = databaseError.meta;
  if (modelName !== undefined && modelName !== 'CheckoutIdempotency') return false;

  const exactTarget = (value: unknown): boolean => {
    if (Array.isArray(value)) {
      return value.length === 2
        && value.includes('customerId')
        && value.includes('keyHash');
    }
    return value === 'customerId_keyHash'
      || value === 'CheckoutIdempotency_customerId_keyHash_key';
  };
  return exactTarget(target) || exactTarget(constraint);
}

/** Prisma P2034 means a serializable transaction conflicted or deadlocked. */
export function isCheckoutSerializationConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: unknown }).code === 'P2034');
}

/**
 * Claim, order writes and claim completion must share one Serializable transaction.
 * The caller must run emails/notifications only after commit and only when replayed is false.
 */
export async function runIdempotentCheckout<
  TOrder extends { id: string; customerId: string },
  TTransaction extends CheckoutIdempotencyTransaction,
>(
  database: CheckoutIdempotencyDatabase<TTransaction>,
  customerId: string,
  rawKey: unknown,
  payload: DirectCheckoutIdempotencyPayload,
  createOrder: (transaction: TTransaction) => Promise<TOrder>,
): Promise<{ order: TOrder; replayed: boolean }> {
  const keyHash = hashCheckoutIdempotencyKey(rawKey);
  const requestHash = fingerprintDirectCheckoutRequest(customerId, payload);

  for (let attempt = 1; attempt <= MAX_CHECKOUT_TRANSACTION_RETRIES; attempt += 1) {
    try {
      const order = await database.$transaction(async transaction => {
        // PostgreSQL's unique index serializes concurrent claims for the same Customer/key.
        const claim = await transaction.checkoutIdempotency.create({
          data: { customerId, keyHash, requestHash },
        });
        const createdOrder = await createOrder(transaction);
        if (!createdOrder?.id || createdOrder.customerId !== customerId) {
          throw new Error('Checkout idempotency callback did not create an Order for the authenticated Customer.');
        }
        await transaction.checkoutIdempotency.update({
          where: { id: claim.id },
          data: { orderId: createdOrder.id },
        });
        return createdOrder;
      }, { isolationLevel: 'Serializable' });
      return { order, replayed: false };
    } catch (error) {
      if (isCheckoutIdempotencyUniqueCollision(error)) {
        // Prisma returns only after the losing transaction has rolled back.
        const existing = await database.checkoutIdempotency.findUnique({
          where: { customerId_keyHash: { customerId, keyHash } },
        });
        if (!existing) throw error;
        if (existing.requestHash !== requestHash) {
          throw new CheckoutIdempotencyError(
            'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH',
            'This idempotency key was already used for a different checkout payload.',
          );
        }
        if (!existing.orderId) {
          throw new CheckoutIdempotencyError(
            'IDEMPOTENCY_RESULT_UNAVAILABLE',
            'The previous checkout result is unavailable; contact support before retrying.',
            410,
          );
        }
        const order = await database.order.findUnique({
          where: { id: existing.orderId },
          include: { items: true, customer: true, Payment: true },
        });
        if (!order || order.customerId !== customerId) {
          throw new CheckoutIdempotencyError(
            'IDEMPOTENCY_RESULT_UNAVAILABLE',
            'The previous checkout result is unavailable; contact support before retrying.',
            410,
          );
        }
        return { order: order as TOrder, replayed: true };
      }

      // Retrying is safe only because Prisma rejects after rolling back the entire
      // transaction; no network side effects are allowed inside createOrder.
      if (!isCheckoutSerializationConflict(error) || attempt === MAX_CHECKOUT_TRANSACTION_RETRIES) throw error;
    }
  }

  throw new Error('Checkout transaction retry loop exited unexpectedly.');
}
