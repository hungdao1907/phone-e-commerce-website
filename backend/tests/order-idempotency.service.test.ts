import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CheckoutIdempotencyError,
  CheckoutIdempotencyDatabase,
  CheckoutIdempotencyTransaction,
  MAX_CHECKOUT_TRANSACTION_RETRIES,
  fingerprintDirectCheckoutRequest,
  generateCheckoutIdempotencyKey,
  hashCheckoutIdempotencyKey,
  isCheckoutIdempotencyUniqueCollision,
  isCheckoutSerializationConflict,
  runIdempotentCheckout,
  resolveCheckoutIdempotencyRequest,
} from '../src/services/order-idempotency.service';

type TestOrder = { id: string; customerId: string; status: string };
type TestTransaction = CheckoutIdempotencyTransaction & {
  order: { create(args: { data: TestOrder }): Promise<TestOrder> };
};

function uniqueError(target: unknown = ['customerId', 'keyHash']) {
  return Object.assign(new Error('unique constraint'), {
    code: 'P2002', meta: { modelName: 'CheckoutIdempotency', target },
  });
}

function memoryDatabase(): CheckoutIdempotencyDatabase<TestTransaction> {
  let claims = new Map<string, { id: string; customerId: string; keyHash: string; requestHash: string; orderId: string | null }>();
  let orders = new Map<string, TestOrder>();
  let nextId = 0;
  let transactionTail: Promise<void> = Promise.resolve();

  const database: any = {
    async $transaction(work: (transaction: TestTransaction) => Promise<any>) {
      const previous = transactionTail;
      let release!: () => void;
      transactionTail = new Promise<void>(resolve => { release = resolve; });
      await previous;
      const stagedClaims = new Map(claims);
      const stagedOrders = new Map(orders);
      const transaction: TestTransaction = {
        checkoutIdempotency: {
          async create({ data }: any) {
            const compoundKey = JSON.stringify([data.customerId, data.keyHash]);
            if (stagedClaims.has(compoundKey)) throw uniqueError();
            const row = { id: `claim-${++nextId}`, ...data, orderId: null };
            stagedClaims.set(compoundKey, row);
            return { id: row.id };
          },
          async update({ where, data }: any) {
            for (const [compoundKey, row] of stagedClaims) {
              if (row.id === where.id) stagedClaims.set(compoundKey, { ...row, ...data });
            }
          },
        },
        order: {
          async create({ data }) {
            stagedOrders.set(data.id, data);
            return data;
          },
        },
      };
      try {
        const result = await work(transaction);
        claims = stagedClaims;
        orders = stagedOrders;
        return result;
      } finally {
        release();
      }
    },
    checkoutIdempotency: {
      async findUnique({ where }: any) {
        return claims.get(JSON.stringify([
          where.customerId_keyHash.customerId,
          where.customerId_keyHash.keyHash,
        ])) || null;
      },
    },
    order: {
      async findUnique({ where }: any) { return orders.get(where.id) || null; },
    },
  };
  return database;
}

const payload = {
  items: [{ variantId: 'v2', quantity: 1 }, { variantId: 'v1', quantity: 2 }, { variantId: 'v1', quantity: 3 }],
  promoCode: ' save10 ', deliveryMethod: 'delivery' as const, paymentMethod: 'BANK',
  shippingAddress: 'Address 1', shippingPhone: '0900000000', note: null,
  estimatedDelivery: '2026-10-12T10:00:00.000Z',
};

test('checkout keys are CSPRNG-sized and stored as a one-way hash', () => {
  const key = generateCheckoutIdempotencyKey();
  assert.match(key, /^[A-Za-z0-9_-]{40,}$/);
  assert.notEqual(hashCheckoutIdempotencyKey(key), key);
  assert.throws(() => hashCheckoutIdempotencyKey('short'), CheckoutIdempotencyError);
});

test('HTTP contract keeps legacy checkout when disabled but fails closed on mismatched or missing activation', () => {
  assert.deepEqual(resolveCheckoutIdempotencyRequest(false, undefined), { enabled: false, key: null });
  assert.throws(
    () => resolveCheckoutIdempotencyRequest(false, 'checkout-key-00000009'),
    (error: unknown) => error instanceof CheckoutIdempotencyError
      && error.code === 'IDEMPOTENCY_NOT_ACTIVATED' && error.status === 503,
  );
  assert.throws(
    () => resolveCheckoutIdempotencyRequest(true, undefined),
    (error: unknown) => error instanceof CheckoutIdempotencyError
      && error.code === 'IDEMPOTENCY_KEY_REQUIRED' && error.status === 400,
  );
  assert.throws(() => resolveCheckoutIdempotencyRequest(true, 'short'), CheckoutIdempotencyError);
  assert.deepEqual(resolveCheckoutIdempotencyRequest(true, 'checkout-key-00000009'), {
    enabled: true,
    key: 'checkout-key-00000009',
  });
});

test('request fingerprint is customer-bound and canonical across item order/duplicate lines', () => {
  const reordered = {
    ...payload,
    items: [{ variantId: 'v1', quantity: 5 }, { variantId: 'v2', quantity: 1 }],
    promoCode: 'SAVE10', paymentMethod: 'BANK_TRANSFER',
  };
  assert.equal(fingerprintDirectCheckoutRequest('customer-1', payload), fingerprintDirectCheckoutRequest('customer-1', reordered));
  assert.notEqual(fingerprintDirectCheckoutRequest('customer-1', payload), fingerprintDirectCheckoutRequest('customer-2', payload));
  assert.notEqual(fingerprintDirectCheckoutRequest('customer-1', payload), fingerprintDirectCheckoutRequest('customer-1', { ...payload, shippingAddress: 'Address 2' }));
});

test('same key and same payload concurrent requests return one Order and run writes once', async () => {
  const database = memoryDatabase();
  let createCalls = 0;
  const create = async (tx: TestTransaction) => {
    createCalls += 1;
    return tx.order.create({ data: { id: 'order-1', customerId: 'customer-1', status: 'confirmed' } });
  };
  const [first, replay] = await Promise.all([
    runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000001', payload, create),
    runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000001', payload, create),
  ]);
  assert.equal(createCalls, 1);
  assert.equal(first.order.id, replay.order.id);
  assert.deepEqual([first.replayed, replay.replayed].sort(), [false, true]);
  let notificationCalls = 0;
  for (const result of [first, replay]) if (!result.replayed) notificationCalls += 1;
  assert.equal(notificationCalls, 1, 'post-commit notification is emitted only for the committed creation');
});

test('same key with a different payload is rejected without exposing another Customer Order', async () => {
  const database = memoryDatabase();
  const create = async (tx: TestTransaction) => tx.order.create({
    data: { id: 'order-private', customerId: 'customer-1', status: 'confirmed' },
  });
  await runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000002', payload, create);
  await assert.rejects(
    runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000002', { ...payload, items: [{ variantId: 'v1', quantity: 1 }] }, create),
    (error: unknown) => error instanceof CheckoutIdempotencyError && error.code === 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' && error.status === 409,
  );
});

test('independent keys create independent valid Orders', async () => {
  const database = memoryDatabase();
  let nextOrder = 0;
  const create = async (tx: TestTransaction) => tx.order.create({
    data: { id: `order-${++nextOrder}`, customerId: 'customer-1', status: 'confirmed' },
  });
  const first = await runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000003', payload, create);
  const second = await runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000004', payload, create);
  assert.notEqual(first.order.id, second.order.id);
  assert.equal(nextOrder, 2);
});

test('the same opaque key is isolated by authenticated Customer identity', async () => {
  const database = memoryDatabase();
  const create = async (customerId: string, tx: TestTransaction) => tx.order.create({
    data: { id: `order-${customerId}`, customerId, status: 'confirmed' },
  });
  const customerA = await runIdempotentCheckout(database, 'customer-a', 'checkout-key-shared-0001', payload,
    tx => create('customer-a', tx));
  const customerB = await runIdempotentCheckout(database, 'customer-b', 'checkout-key-shared-0001', payload,
    tx => create('customer-b', tx));
  assert.equal(customerA.order.id, 'order-customer-a');
  assert.equal(customerB.order.id, 'order-customer-b');
  assert.equal(customerB.replayed, false);
});

test('failed transaction leaves no claim; same key can be retried after rollback', async () => {
  const database = memoryDatabase();
  await assert.rejects(runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000005', payload, async () => {
    throw new Error('simulated transaction failure');
  }), /simulated transaction failure/);
  const successful = await runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000005', payload, async tx => tx.order.create({
    data: { id: 'order-after-rollback', customerId: 'customer-1', status: 'confirmed' },
  }));
  assert.equal(successful.replayed, false);
  assert.equal(successful.order.id, 'order-after-rollback');
});

test('only the exact idempotency unique constraint is consumed as a replay', async () => {
  assert.equal(isCheckoutIdempotencyUniqueCollision(uniqueError()), true);
  assert.equal(isCheckoutIdempotencyUniqueCollision(uniqueError(['orderCode'])), false);
  assert.equal(isCheckoutIdempotencyUniqueCollision({ code: 'P2002', meta: { modelName: 'Order', target: ['customerId', 'keyHash'] } }), false);
  assert.equal(isCheckoutIdempotencyUniqueCollision({ code: 'P2034', meta: { modelName: 'CheckoutIdempotency', target: ['customerId', 'keyHash'] } }), false);

  const database = memoryDatabase();
  const unrelated = Object.assign(new Error('other unique collision'), {
    code: 'P2002', meta: { modelName: 'Order', target: ['orderCode'] },
  });
  await assert.rejects(runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000006', payload, async () => {
    throw unrelated;
  }), error => error === unrelated);
});

test('known Serializable conflict retries only after transaction rollback', async () => {
  const database: any = memoryDatabase();
  const originalTransaction = database.$transaction.bind(database);
  let transactionCalls = 0;
  database.$transaction = async (work: any, options: any) => {
    transactionCalls += 1;
    if (transactionCalls === 1) {
      return originalTransaction(async (tx: any) => {
        await work(tx);
        throw Object.assign(new Error('serialization conflict'), { code: 'P2034' });
      }, options);
    }
    return originalTransaction(work, options);
  };

  let orderWrites = 0;
  const result = await runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000007', payload, async tx => {
    orderWrites += 1;
    return tx.order.create({ data: { id: `order-${orderWrites}`, customerId: 'customer-1', status: 'confirmed' } });
  });
  assert.equal(isCheckoutSerializationConflict(Object.assign(new Error(), { code: 'P2034' })), true);
  assert.equal(isCheckoutSerializationConflict({ code: 'P2002' }), false);
  assert.equal(transactionCalls, 2);
  assert.equal(orderWrites, 2, 'callback reran only after the first transaction rejected and rolled back');
  assert.equal(result.order.id, 'order-2');
  assert.equal(result.replayed, false);
});

test('Serializable conflict retries are bounded', async () => {
  const database: any = memoryDatabase();
  let transactionCalls = 0;
  database.$transaction = async () => {
    transactionCalls += 1;
    throw Object.assign(new Error('serialization conflict'), { code: 'P2034' });
  };
  let calls = 0;
  await assert.rejects(runIdempotentCheckout(database, 'customer-1', 'checkout-key-00000008', payload, async () => {
    calls += 1;
    return { id: 'order-never-committed', customerId: 'customer-1' };
  }), /serialization conflict/);
  assert.equal(calls, 0);
  assert.equal(transactionCalls, MAX_CHECKOUT_TRANSACTION_RETRIES);
  assert.equal(MAX_CHECKOUT_TRANSACTION_RETRIES, 3);
});
