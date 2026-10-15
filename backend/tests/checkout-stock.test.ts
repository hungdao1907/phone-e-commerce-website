import assert from 'node:assert/strict';
import test from 'node:test';
import { reserveCheckoutStock, validateAndAggregateCheckoutItems } from '../src/routes/order.routes';

test('checkout rejects missing, fractional, non-positive, and non-numeric quantities', () => {
  for (const items of [undefined, [], [{ variantId: 'v1', quantity: 0 }], [{ variantId: 'v1', quantity: -1 }], [{ variantId: 'v1', quantity: 1.5 }], [{ variantId: 'v1', quantity: '2' }]]) {
    assert.equal(validateAndAggregateCheckoutItems(items).ok, false);
  }
});

test('checkout aggregates duplicate variant rows into one reservation quantity', () => {
  const result = validateAndAggregateCheckoutItems([
    { variantId: ' v1 ', quantity: 2 },
    { variantId: 'v1', quantity: 3 },
    { variantId: 'v2', quantity: 1 },
  ]);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual([...result.quantityByVariantId.entries()], [['v1', 5], ['v2', 1]]);
  assert.equal(result.items.length, 3);
});

test('conditional reservation makes one update per unique variant and never takes stock below zero', async () => {
  const stock = new Map([['v1', 5], ['v2', 2]]);
  const calls: any[] = [];
  const tx = {
    productVariant: {
      updateMany: async (args: any) => {
        calls.push(args);
        const available = stock.get(args.where.id) ?? 0;
        if (available < args.where.stock.gte) return { count: 0 };
        stock.set(args.where.id, available - args.data.stock.decrement);
        return { count: 1 };
      },
    },
  } as any;
  await reserveCheckoutStock(tx, new Map([['v1', 4], ['v2', 2]]), new Map());
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(call => call.where.id), ['v1', 'v2']);
  assert.equal(stock.get('v1'), 1);
  assert.equal(stock.get('v2'), 0);
});

test('a later out-of-stock variant rolls back all earlier reservations in the transaction', async () => {
  const committed = new Map([['v1', 3], ['v2', 0]]);
  const runTransaction = async (work: (tx: any) => Promise<void>) => {
    const working = new Map(committed);
    const tx = {
      productVariant: {
        updateMany: async ({ where, data }: any) => {
          const available = working.get(where.id) ?? 0;
          if (available < where.stock.gte) return { count: 0 };
          working.set(where.id, available - data.stock.decrement);
          return { count: 1 };
        },
      },
    };
    await work(tx);
    committed.clear();
    for (const [id, quantity] of working) committed.set(id, quantity);
  };
  await assert.rejects(runTransaction(tx => reserveCheckoutStock(
    tx as any,
    new Map([['v1', 2], ['v2', 1]]),
    new Map([['v2', 'Phone']]),
  )), /không đủ tồn kho/i);
  assert.deepEqual([...committed.entries()], [['v1', 3], ['v2', 0]]);
});
