import crypto from 'crypto';

export type QuotationCreateRateLimitResult =
  | { allowed: true; retryAfterSeconds: 0 }
  | { allowed: false; retryAfterSeconds: number };

type Attempt = { keyHash: string; at: number };
type Bucket = { attempts: Attempt[]; touchedAt: number };

export type QuotationCreateRateLimiterOptions = {
  windowMs?: number;
  customerLimit?: number;
  ipLimit?: number;
  maxBuckets?: number;
};

/**
 * Process-local abuse guard. Counts distinct idempotency keys, so a retry of
 * the same logical request does not consume another slot. Durable committed
 * replays are checked before this guard by the route.
 */
export function createQuotationCreateRateLimiter(options: QuotationCreateRateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 10 * 60 * 1000;
  const customerLimit = options.customerLimit ?? 10;
  const ipLimit = options.ipLimit ?? 30;
  const maxBuckets = options.maxBuckets ?? 20_000;
  const buckets = new Map<string, Bucket>();

  function scopeKey(type: 'customer' | 'ip', value: string): string {
    return `${type}:${crypto.createHash('sha256').update(value || 'unknown').digest('hex')}`;
  }

  function activeAttempts(key: string, now: number): Attempt[] {
    const bucket = buckets.get(key);
    if (!bucket) return [];
    bucket.attempts = bucket.attempts.filter(attempt => attempt.at > now - windowMs);
    bucket.touchedAt = now;
    if (bucket.attempts.length === 0) buckets.delete(key);
    return bucket.attempts;
  }

  function retryAfter(attempts: Attempt[], now: number): number {
    const oldest = attempts.reduce((value, attempt) => Math.min(value, attempt.at), Number.POSITIVE_INFINITY);
    return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
  }

  function record(key: string, attempt: Attempt, now: number): void {
    const bucket = buckets.get(key) || { attempts: [], touchedAt: now };
    bucket.attempts.push(attempt);
    bucket.touchedAt = now;
    buckets.set(key, bucket);
  }

  return {
    consume(input: { customerId: string; ip: string; idempotencyKeyHash: string; now?: number }): QuotationCreateRateLimitResult {
      const now = input.now ?? Date.now();
      const customerKey = scopeKey('customer', input.customerId);
      const ipKey = scopeKey('ip', input.ip);
      const customerAttempts = activeAttempts(customerKey, now);
      const ipAttempts = activeAttempts(ipKey, now);

      // A repeated key is a retry/replay of one intent, not a new create.
      if (customerAttempts.some(attempt => attempt.keyHash === input.idempotencyKeyHash)) {
        return { allowed: true, retryAfterSeconds: 0 };
      }

      const blockedCustomer = customerAttempts.length >= customerLimit;
      const blockedIp = ipAttempts.length >= ipLimit;
      if (blockedCustomer || blockedIp) {
        const waits = [
          blockedCustomer ? retryAfter(customerAttempts, now) : 0,
          blockedIp ? retryAfter(ipAttempts, now) : 0,
        ];
        return { allowed: false, retryAfterSeconds: Math.max(...waits) };
      }

      const attempt = { keyHash: input.idempotencyKeyHash, at: now };
      record(customerKey, attempt, now);
      record(ipKey, attempt, now);

      // Bound memory growth if a process receives many distinct principals/IPs.
      if (buckets.size > maxBuckets) {
        const staleBefore = now - windowMs;
        for (const [key, bucket] of buckets) {
          bucket.attempts = bucket.attempts.filter(item => item.at > staleBefore);
          if (bucket.attempts.length === 0 || bucket.touchedAt < staleBefore) buckets.delete(key);
        }
        while (buckets.size > maxBuckets) buckets.delete(buckets.keys().next().value as string);
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
    clear(): void { buckets.clear(); },
  };
}

export const quotationCreateRateLimiter = createQuotationCreateRateLimiter();
