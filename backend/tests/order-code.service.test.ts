import assert from 'node:assert/strict';
import test from 'node:test';
import {
  generateOrderCode,
  isOrderCodeUniqueCollision,
  withOrderCodeCollisionRetry,
} from '../src/services/order-code.service';

function collision(target: unknown = ['orderCode']) {
  return Object.assign(new Error('unique constraint'), {
    code: 'P2002',
    meta: { modelName: 'Order', target },
  });
}

test('order code uses the existing lookup format and independent random generation', () => {
  assert.match(generateOrderCode(), /^DH\d{11}$/);
  const calls: string[] = [];
  return withOrderCodeCollisionRetry(async code => {
    calls.push(code);
    return code;
  }, { generateOrderCode: () => 'DH00000000001' }).then(result => {
    assert.equal(result, 'DH00000000001');
    assert.deepEqual(calls, ['DH00000000001']);
  });
});

test('only a P2002 collision specifically targeting Order.orderCode is retriable', () => {
  assert.equal(isOrderCodeUniqueCollision(collision()), true);
  assert.equal(isOrderCodeUniqueCollision(collision(['email'])), false);
  assert.equal(isOrderCodeUniqueCollision({ code: 'P2002', meta: { modelName: 'Customer', target: ['orderCode'] } }), false);
  assert.equal(isOrderCodeUniqueCollision({ code: 'P2034', meta: { modelName: 'Order', target: ['orderCode'] } }), false);
});

test('order-code collision retries a complete transaction after the failed attempt rejects', async () => {
  const committedOrders: string[] = [];
  const generated = ['DH00000000001', 'DH00000000002'];
  let attempts = 0;
  const result = await withOrderCodeCollisionRetry(async code => {
    attempts += 1;
    const transactionWrites = [code];
    if (attempts === 1) throw collision();
    committedOrders.push(...transactionWrites);
    return code;
  }, { generateOrderCode: () => generated.shift()! });
  assert.equal(result, 'DH00000000002');
  assert.equal(attempts, 2);
  assert.deepEqual(committedOrders, ['DH00000000002']);
});

test('non-order-code unique errors are not retried and collision retries are bounded', async () => {
  let calls = 0;
  await assert.rejects(withOrderCodeCollisionRetry(async () => {
    calls += 1;
    throw collision(['promoCodeId']);
  }, { generateOrderCode: () => 'DH00000000001' }), /unique constraint/);
  assert.equal(calls, 1);

  calls = 0;
  await assert.rejects(withOrderCodeCollisionRetry(async () => {
    calls += 1;
    throw collision();
  }, { generateOrderCode: () => 'DH00000000001', maxAttempts: 2 }), /unique constraint/);
  assert.equal(calls, 2);
});
