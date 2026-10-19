import assert from 'node:assert/strict';
import test from 'node:test';
import { clearQuotationCreateRecoveryMarker, getQuotationCreateIntent, loadQuotationCreateRecoveryMarker, quotationCreateFingerprint, saveQuotationCreateRecoveryMarker, QUOTATION_CREATE_RECOVERY_STORAGE_KEY } from './quotation-create-idempotency';
import type { CustomerQuotationCreateRequest } from './quotation-api';

const request: CustomerQuotationCreateRequest = { items: [{ variantId: 'v1', quantity: 1 }], shippingAddress: 'Test street',
  shippingPhone: '0987654321', paymentMethod: 'COD', deliveryMethod: 'delivery' };

test('quotation names are fingerprinted; legacy requests retain the exact previous fingerprint', () => {
  assert.equal(quotationCreateFingerprint(request), JSON.stringify({ items: request.items, shippingAddress: request.shippingAddress,
    shippingPhone: request.shippingPhone, paymentMethod: request.paymentMethod, deliveryMethod: request.deliveryMethod }));
  const first = getQuotationCreateIntent(null, { ...request, recipientName: 'Trần Văn B' }, () => 'first');
  assert.equal(getQuotationCreateIntent(first, { ...request, recipientName: ' Trần Văn B ' }, () => 'unused'), first);
  assert.equal(getQuotationCreateIntent(first, { ...request, recipientName: 'Other' }, () => 'changed').key, 'changed');
});

test('legacy upgrade keeps unknown-owner quotation recovery blocking and clears only its exact slot after owner recovery', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const legacy = { key: 'legacy-uncertain-quotation-key', createdAt: 1 };
  saveQuotationCreateRecoveryMarker(legacy, storage);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'A'), legacy);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'B'), legacy, 'unknown owner requires authenticated recovery, not a new POST');
  const b = { accountId: 'B', key: 'new-quotation-for-account-B', createdAt: 2 };
  saveQuotationCreateRecoveryMarker(b, storage);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'B'), b);
  clearQuotationCreateRecoveryMarker(storage, 'B');
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'A'), legacy, 'B completion never deletes the legacy marker');
  const recovered = loadQuotationCreateRecoveryMarker(storage, 'A')!;
  clearQuotationCreateRecoveryMarker(storage, recovered.accountId);
  assert.equal(loadQuotationCreateRecoveryMarker(storage, 'A'), null);
});

test('quotation recovery is scoped to accountId; completing B never removes A’s uncertain key', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  const a = { accountId: 'A', key: 'recovery-key-for-account-A', createdAt: 1 };
  const b = { accountId: 'B', key: 'recovery-key-for-account-B', createdAt: 2 };
  saveQuotationCreateRecoveryMarker(a, storage);
  assert.equal(loadQuotationCreateRecoveryMarker(storage, 'B'), null);
  saveQuotationCreateRecoveryMarker(b, storage);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'A'), a);
  clearQuotationCreateRecoveryMarker(storage, 'B');
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage, 'A'), a);
  assert.equal(loadQuotationCreateRecoveryMarker(storage, 'B'), null);
  values.set(`${QUOTATION_CREATE_RECOVERY_STORAGE_KEY}:B`, JSON.stringify(a));
  assert.equal(loadQuotationCreateRecoveryMarker(storage, 'B'), null, 'mismatched account metadata is never used');
});
