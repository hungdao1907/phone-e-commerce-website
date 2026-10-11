import { randomInt } from 'crypto';

const ORDER_CODE_PATTERN = /^DH\d{11}$/;
export const MAX_ORDER_CODE_ATTEMPTS = 3;

/** Keeps the existing DH + 11 digit lookup/payment format without a database count. */
export function generateOrderCode(): string {
  const digits = randomInt(0, 100_000_000_000).toString().padStart(11, '0');
  return `DH${digits}`;
}

/** Retry only when Prisma identifies the unique Order.orderCode constraint/field. */
export function isOrderCodeUniqueCollision(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const databaseError = error as {
    code?: unknown;
    meta?: { modelName?: unknown; target?: unknown; constraint?: unknown };
  };
  if (databaseError.code !== 'P2002' || !databaseError.meta) return false;

  const { modelName, target, constraint } = databaseError.meta;
  if (modelName !== undefined && modelName !== 'Order') return false;

  const matchesOrderCodeTarget = (value: unknown): boolean => {
    if (Array.isArray(value)) {
      return value.length === 1
        && (value[0] === 'orderCode'
          || value[0] === 'Order_orderCode_key');
    }
    return value === 'Order_orderCode_key'
      || value === 'orderCode';
  };

  return matchesOrderCodeTarget(target) || matchesOrderCodeTarget(constraint);
}

export type OrderCodeRetryOptions = {
  /** Total transaction attempts, including the first attempt. Defaults to three. */
  maxAttempts?: number;
  /** Injection seam for deterministic unit tests; production defaults to CSPRNG. */
  generateOrderCode?: () => string;
};

/**
 * Runs a complete database transaction per attempt. The transaction promise must
 * reject only after Prisma has rolled that attempt back; do not put external side
 * effects in work because a confirmed order-code collision reruns the callback.
 */
export async function withOrderCodeCollisionRetry<T>(
  work: (orderCode: string) => Promise<T>,
  options: OrderCodeRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? MAX_ORDER_CODE_ATTEMPTS;
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) {
    throw new RangeError('Order-code retry attempts must be an integer from 1 to 10.');
  }
  const nextOrderCode = options.generateOrderCode || generateOrderCode;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const orderCode = nextOrderCode();
    if (!ORDER_CODE_PATTERN.test(orderCode)) {
      throw new Error('Order-code generator returned an invalid code format.');
    }
    try {
      return await work(orderCode);
    } catch (error) {
      if (!isOrderCodeUniqueCollision(error) || attempt === maxAttempts) throw error;
    }
  }

  throw new Error('Order-code retry loop exited unexpectedly.');
}
