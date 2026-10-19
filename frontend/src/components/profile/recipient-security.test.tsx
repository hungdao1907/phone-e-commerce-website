import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { savedDeliveryAddress, validProfileEmail } from './delivery-contact';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); }, clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null, get length() { return values.size; } };
}
Object.defineProperty(globalThis, 'localStorage', { value: storage(), configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: storage(), configurable: true });
const { useAuthStore } = await import('../../store/authStore');
const { useCheckoutStore, loadCheckoutProfile, checkoutProfileError } = await import('../../store/useCheckoutStore');
const { useQuotationContactStore } = await import('../../store/useQuotationContactStore');
const { getCheckoutIntent } = await import('../checkout/checkout-idempotency');
const { saveQuotationCreateRecoveryMarker, loadQuotationCreateRecoveryMarker } = await import('../quotations/quotation-create-idempotency');
const user = (id: string) => ({ id, username: id, role: 'CUSTOMER' });
const profile = { id: 'A', fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567',
  address: JSON.stringify({ recipientName: 'Trần Văn B', recipientPhone: '0987654321', city: 'Thành phố', cityCode: 1,
    district: 'Quận', districtCode: 2, ward: 'Phường', wardCode: 3, detailAddress: 'Địa chỉ giao hàng test' }) };
const mockProfile = (value: unknown, status = 200) => (async () => new Response(JSON.stringify(value), { status })) as typeof fetch;

test('authenticated defaults use saved recipient; editable email overrides are ignored and profile is unchanged', async () => {
  useAuthStore.getState().setAuth('token-A', user('A'));
  let authorization = '';
  await loadCheckoutProfile((async (_url, init) => {
    authorization = (init?.headers as Record<string, string>).Authorization;
    return new Response(JSON.stringify(profile));
  }) as typeof fetch, 'http://mock');
  assert.equal(authorization, 'Bearer token-A');
  const state = useCheckoutStore.getState();
  assert.equal(state.profileEmail, profile.email);
  assert.equal(state.deliveryInfo.fullName, 'Trần Văn B');
  assert.equal(state.deliveryInfo.phone, '0987654321');
  assert.equal(state.deliveryInfo.address, 'Địa chỉ giao hàng test');
  assert.equal(checkoutProfileError(), '');
  state.setDeliveryInfo({ fullName: 'Tên mới', phone: '0977777777', email: 'attacker@example.com', address: '' });
  assert.equal(useCheckoutStore.getState().deliveryInfo.email, '');
  assert.equal(useCheckoutStore.getState().profileEmail, profile.email);
  await loadCheckoutProfile(mockProfile(profile), 'http://mock');
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, 'Tên mới');
  assert.equal(useCheckoutStore.getState().deliveryInfo.address, '', 'intentional clearing survives profile reload/remount');
  assert.equal(profile.fullName, 'Nguyễn Văn A');
  assert.equal(useQuotationContactStore.getState().contact.recipientName, 'Trần Văn B', 'quote defaults come from profile, not checkout edits');
});

test('A → B → A and logout clear visible contacts but preserve customer-scoped uncertain retry keys', async () => {
  useQuotationContactStore.getState().update({ recipientName: 'Quote edited' });
  const revision = useCheckoutStore.getState().sessionRevision;
  const payload = { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'delivery' as const,
    recipientName: 'Recipient A', shippingPhone: '0987654321', shippingAddress: 'Private address' };
  const intent = await getCheckoutIntent('A', payload);
  const marker = { accountId: 'A', key: 'uncertain-key-for-account-A', createdAt: Date.now() };
  assert.ok(saveQuotationCreateRecoveryMarker(marker));
  const legacy = { key: 'legacy-uncertain-key-with-unknown-owner', createdAt: 1 };
  assert.ok(saveQuotationCreateRecoveryMarker(legacy));
  useAuthStore.getState().setAuth('refreshed-A', user('A'));
  assert.equal(useCheckoutStore.getState().sessionRevision, revision);
  assert.ok(sessionStorage.getItem('webphone:checkout-intent:v1:A'));
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, 'Tên mới');
  useAuthStore.getState().logout();
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, '');
  assert.equal(useCheckoutStore.getState().profileEmail, '');
  assert.equal(useQuotationContactStore.getState().contact.recipientName, '');
  assert.ok(sessionStorage.getItem('webphone:checkout-intent:v1:A'));
  assert.deepEqual(loadQuotationCreateRecoveryMarker(undefined, 'B'), legacy, 'unknown legacy owner requires recovery, even after logout');
  assert.deepEqual(loadQuotationCreateRecoveryMarker(undefined, 'A'), marker);
  assert.ok(checkoutProfileError());
  useAuthStore.getState().setAuth('token-B', user('B'));
  await loadCheckoutProfile(mockProfile({ ...profile, id: 'B', email: 'b@example.com', fullName: 'Account B', address: '' }), 'http://mock');
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, 'Account B');
  assert.equal(useCheckoutStore.getState().profileEmail, 'b@example.com');
  const bIntent = await getCheckoutIntent('B', payload);
  assert.notEqual(bIntent.key, intent.key);
  useAuthStore.getState().setAuth('token-A', user('A'));
  assert.equal(useCheckoutStore.getState().profileEmail, '');
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, '');
  assert.deepEqual(await getCheckoutIntent('A', payload), intent);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(undefined, 'A'), marker);
});

test('late profile responses cannot prefill another account, including logout then same-account login', async () => {
  useAuthStore.getState().setAuth('token-A', user('A'));
  let resolve!: (response: Response) => void;
  const pending = loadCheckoutProfile((() => new Promise<Response>(done => { resolve = done; })) as typeof fetch, 'http://mock');
  useCheckoutStore.getState().setDeliveryInfo({ fullName: 'Typed while loading' });
  useAuthStore.getState().logout();
  useAuthStore.getState().setAuth('token-A', user('A'));
  resolve(new Response(JSON.stringify(profile)));
  await pending;
  assert.equal(useCheckoutStore.getState().profileEmail, '');
  assert.equal(useCheckoutStore.getState().deliveryInfo.fullName, '');
  assert.ok(checkoutProfileError());
});

test('failed profile, invalid email, and wrong profile identity block submission; successful reload clears error', async () => {
  for (const [value, status] of [[{ message: 'failed' }, 503], [{ ...profile, email: 'invalid' }, 200], [{ ...profile, id: 'B' }, 200], [{ ...profile, id: undefined }, 200]] as const) {
    await loadCheckoutProfile(mockProfile(value, status), 'http://mock');
    assert.equal(useCheckoutStore.getState().profileStatus, 'error');
    assert.equal(useCheckoutStore.getState().profileEmail, '');
    assert.ok(checkoutProfileError());
  }
  await loadCheckoutProfile(mockProfile(profile), 'http://mock');
  assert.equal(checkoutProfileError(), '');
  assert.equal(useCheckoutStore.getState().profileError, '');
  assert.equal(validProfileEmail('a@b.test'), true);
  assert.equal(validProfileEmail('a@b'), false);
});

test('quotation SSR shows trusted read-only email and editable recipient defaults; preserves contact on remount', async () => {
  const { saveQuotationDraft } = await import('../quotations/quotation-draft');
  const { CustomerQuotationRequestForm } = await import('../quotations/CustomerQuotationRequestForm');
  saveQuotationDraft([{ productId: 'p1', variantId: 'v1', quantity: 1 }]);
  useQuotationContactStore.getState().update({ recipientName: 'Trần Văn B', shippingPhone: '0987654321', shippingAddress: 'Địa chỉ giao hàng test' });
  const render = () => renderToStaticMarkup(createElement(CustomerQuotationRequestForm, { onCreated: () => {} }));
  // Zustand SSR intentionally reads initial state. Supply the hydrated client snapshots
  // here to verify the form markup against the mocked authenticated state.
  const restore = [useAuthStore, useCheckoutStore, useQuotationContactStore].map(store => {
    const initial = store.getInitialState();
    const original = { ...initial };
    Object.assign(initial, store.getState());
    return () => { Object.assign(initial, original); };
  });
  try {
    const html = render();
    assert.match(html, /type="email"[^>]*readOnly=""/);
    assert.ok(html.includes(profile.email));
    assert.ok(html.includes('Trần Văn B'));
    assert.ok(html.includes('0987654321'));
    assert.equal(render(), html);
  } finally { restore.forEach(reset => reset()); }
});

test('legacy plain addresses and structured addresses are read without fabricating recipient identity', () => {
  assert.equal(savedDeliveryAddress('Legacy street').address, 'Legacy street');
  assert.equal(savedDeliveryAddress(profile.address).cityCode, 1);
  assert.equal(savedDeliveryAddress('null').address, '');
});

test('Checkout SSR uses read-only authenticated email and retains edited recipient across repeated rendering', async () => {
  const { MemoryRouter } = await import('react-router-dom');
  const { CheckoutPage } = await import('../../pages/checkout/CheckoutPage');
  const { useCartStore } = await import('../../store/useCartStore');
  useCartStore.setState({ items: [{ id: 'v1', productId: 'p1', variantId: 'v1', quantity: 1, name: 'Test phone',
    productSlug: 'test-phone', brand: 'Test', image: '', sku: 'T1', colorName: '', storageLabel: '', price: 100, originalPrice: 100, stock: 5 }] });
  useCheckoutStore.getState().setDeliveryInfo({ fullName: 'Edited recipient', email: 'override@example.com' });
  const restore = [useAuthStore, useCheckoutStore, useCartStore].map(store => {
    const initial = store.getInitialState();
    const original = { ...initial };
    Object.assign(initial, store.getState());
    return () => { Object.assign(initial, original); };
  });
  try {
    const render = () => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CheckoutPage)));
    const html = render();
    assert.match(html, /type="email"[^>]*readOnly=""/);
    assert.ok(html.includes(profile.email));
    assert.ok(html.includes('Edited recipient'));
    assert.equal(html.includes('override@example.com'), false);
    assert.equal(render(), html);
  } finally { restore.forEach(reset => reset()); }
});
