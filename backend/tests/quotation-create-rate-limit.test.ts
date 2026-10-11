import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuotationCreateRateLimiter } from '../src/services/quotation-create-rate-limit';

test('quotation limiter counts unique create keys per Customer and allows same-key retries', () => {
  const limiter = createQuotationCreateRateLimiter({ windowMs: 60_000, customerLimit: 2, ipLimit: 10 });
  const consume = (key: string, now: number) => limiter.consume({
    customerId: 'customer-private-a', ip: '192.0.2.10', idempotencyKeyHash: key, now,
  });

  assert.deepEqual(consume('key-hash-1', 1_000), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(consume('key-hash-1', 2_000), { allowed: true, retryAfterSeconds: 0 });
  assert.deepEqual(consume('key-hash-2', 3_000), { allowed: true, retryAfterSeconds: 0 });
  const limited = consume('key-hash-3', 4_000);
  assert.equal(limited.allowed, false);
  if (!limited.allowed) assert.equal(limited.retryAfterSeconds, 57);
});

test('quotation limiter applies an IP abuse ceiling across authenticated Customers', () => {
  const limiter = createQuotationCreateRateLimiter({ windowMs: 30_000, customerLimit: 10, ipLimit: 2 });
  const first = limiter.consume({ customerId: 'customer-a', ip: '198.51.100.3', idempotencyKeyHash: 'hash-a', now: 10_000 });
  const second = limiter.consume({ customerId: 'customer-b', ip: '198.51.100.3', idempotencyKeyHash: 'hash-b', now: 11_000 });
  const blocked = limiter.consume({ customerId: 'customer-c', ip: '198.51.100.3', idempotencyKeyHash: 'hash-c', now: 12_000 });
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.equal(blocked.retryAfterSeconds, 28);
});

test('quotation limiter releases a slot after its rolling window expires', () => {
  const limiter = createQuotationCreateRateLimiter({ windowMs: 1_000, customerLimit: 1, ipLimit: 10 });
  assert.equal(limiter.consume({ customerId: 'customer-a', ip: 'ip-a', idempotencyKeyHash: 'old', now: 10 }).allowed, true);
  assert.equal(limiter.consume({ customerId: 'customer-a', ip: 'ip-a', idempotencyKeyHash: 'new', now: 1_011 }).allowed, true);
});
