import assert from 'node:assert/strict';
import test from 'node:test';
import { clearCheckoutIntent, getCheckoutIntent } from './checkout-idempotency';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

const payload = {
  items: [{ variantId: 'v2', quantity: 1 }, { variantId: 'v1', quantity: 2 }, { variantId: 'v1', quantity: 3 }],
  promoCode: ' save10 ',
  deliveryMethod: 'delivery' as const,
  paymentMethod: 'BANK',
  shippingAddress: 'Private street 1',
  shippingPhone: '0900000000',
  note: '',
};

test('checkout retry reuses key and estimated-delivery data without storing checkout PII', async () => {
  const storage = memoryStorage();
  const first = await getCheckoutIntent('customer-1', payload, storage, undefined, 1_800_000_000_000);
  const retry = await getCheckoutIntent('customer-1', {
    ...payload,
    items: [{ variantId: 'v1', quantity: 5 }, { variantId: 'v2', quantity: 1 }],
    promoCode: 'SAVE10',
    paymentMethod: 'BANK_TRANSFER',
  }, storage, undefined, 1_800_000_100_000);
  assert.deepEqual(retry, first);
  assert.match(first.key, /^[a-f0-9]{64}$/);
  const stored = [...storage.values.values()].join(' ');
  assert.equal(stored.includes(payload.shippingAddress), false);
  assert.equal(stored.includes(payload.shippingPhone), false);
});

test('changed checkout intent rotates the key and successful completion clears only its key', async () => {
  const storage = memoryStorage();
  const first = await getCheckoutIntent('customer-1', payload, storage, undefined, 1_800_000_000_000);
  const changed = await getCheckoutIntent('customer-1', { ...payload, items: [{ variantId: 'v1', quantity: 6 }] }, storage, undefined, 1_800_000_100_000);
  assert.notEqual(changed.key, first.key);
  clearCheckoutIntent('customer-1', first.key, storage);
  assert.equal(storage.values.size, 1);
  clearCheckoutIntent('customer-1', changed.key, storage);
  assert.equal(storage.values.size, 0);
});

test('recipient changes rotate named checkout keys, but an uncertain legacy checkout keeps its original payload and key', async () => {
  const storage = memoryStorage();
  const named = await getCheckoutIntent('named', { ...payload, recipientName: 'Recipient A' }, storage);
  const retry = await getCheckoutIntent('named', { ...payload, recipientName: 'Recipient A' }, storage);
  assert.deepEqual(retry, named);
  const changed = await getCheckoutIntent('named', { ...payload, recipientName: 'Recipient B' }, storage);
  assert.notEqual(changed.key, named.key);
  const legacy = await getCheckoutIntent('legacy', payload, storage);
  const upgraded = await getCheckoutIntent('legacy', { ...payload, recipientName: 'New default' }, storage);
  assert.equal(upgraded.key, legacy.key);
  assert.equal(upgraded.estimatedDelivery, legacy.estimatedDelivery);
  assert.equal(upgraded.omitRecipientName, true);
  const oldRetry = await getCheckoutIntent('legacy', payload, storage);
  assert.deepEqual(oldRetry, legacy);
});

test('account change during fingerprint hashing never recreates an invalidated key', async () => {
  const storage = memoryStorage();
  await assert.rejects(getCheckoutIntent('old-account', payload, storage, undefined, Date.now(), () => false), /account changed/);
  assert.equal(storage.values.size, 0);
});
