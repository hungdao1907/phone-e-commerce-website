import assert from 'node:assert/strict';
import test from 'node:test';
import { createCustomerQuotation, QuotationApiError, quotationApiStatusMessage, recoverCustomerQuotation } from './quotation-api';
import {
  clearQuotationCreateRecoveryMarker,
  generateQuotationCreateKey,
  getQuotationCreateIntent,
  loadQuotationCreateRecoveryMarker,
  QUOTATION_CREATE_RECOVERY_STORAGE_KEY,
  saveQuotationCreateRecoveryMarker,
} from './quotation-create-idempotency';

test('Quotation UI gives explicit, non-success messages for HTTP authorization and availability errors', () => {
  assert.match(quotationApiStatusMessage(401), /đăng nhập lại/i);
  assert.match(quotationApiStatusMessage(403), /không có quyền/i);
  assert.match(quotationApiStatusMessage(404, 'list'), /chưa được kích hoạt/i);
  assert.match(quotationApiStatusMessage(404, 'action'), /chưa kích hoạt/i);
  assert.match(quotationApiStatusMessage(404, 'detail'), /Không tìm thấy/i);
  assert.match(quotationApiStatusMessage(409), /tải lại/i);
  assert.match(quotationApiStatusMessage(500), /chưa có thao tác nào được xác nhận thành công/i);
});

test('Create Quotation sends only variant/quantity and customer form fields with the authenticated token', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify({ quotation: {
      id: 'quote-1', quoteNumber: 'Q-1', status: 'PENDING_CUSTOMER_CONFIRMATION',
      subtotal: 100, discountAmount: 0, shippingFee: 10, totalAmount: 110,
      expiresAt: '2026-10-11T00:00:00.000Z', items: [],
    } }), { status: 201 });
  }) as typeof fetch;

  try {
    const quotation = await createCustomerQuotation({
      items: [{ variantId: 'variant-1', quantity: 2 }],
      shippingAddress: 'Address', shippingPhone: '0900000000',
      recipientName: 'Trần Văn B',
      paymentMethod: 'COD', deliveryMethod: 'delivery',
    }, 'customer-jwt', 'safe-idempotency-key-00001');
    assert.equal(quotation.id, 'quote-1');
    assert.ok(captured);
    assert.equal(captured!.url.endsWith('/api/quotations'), true);
    const headers = new Headers(captured!.init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer customer-jwt');
    assert.equal(headers.get('Idempotency-Key'), 'safe-idempotency-key-00001');
    const body = JSON.parse(String(captured!.init?.body));
    assert.deepEqual(Object.keys(body).sort(), ['deliveryMethod', 'items', 'paymentMethod', 'recipientName', 'shippingAddress', 'shippingPhone']);
    assert.equal(body.recipientName, 'Trần Văn B');
    assert.deepEqual(body.items, [{ variantId: 'variant-1', quantity: 2 }]);
    for (const forbidden of ['email', 'customerEmail', 'fullName', 'productId', 'customerId', 'unitPrice', 'discountAmount', 'shippingFee', 'grandTotal', 'totalAmount', 'token', 'sessionId']) {
      assert.equal(JSON.stringify(body).includes(forbidden), false);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Create Quotation API not activated response is an error and never returns success', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'Not found' }), { status: 404 })) as typeof fetch;
  try {
    await assert.rejects(
      createCustomerQuotation({
        items: [{ variantId: 'variant-1', quantity: 1 }],
        shippingAddress: 'Address', shippingPhone: '0900000000',
        paymentMethod: 'COD', deliveryMethod: 'delivery',
      }, 'customer-jwt', 'safe-idempotency-key-00002'),
      error => error instanceof Error && error.message.includes('Quotation API'),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('429 preserves Retry-After and tells the Customer to reuse the same key and payload', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ code: 'QUOTATION_CREATE_RATE_LIMITED', message: 'rate limited' }), {
    status: 429, headers: { 'Retry-After': '37' },
  })) as typeof fetch;
  try {
    await assert.rejects(
      createCustomerQuotation({
        items: [{ variantId: 'variant-1', quantity: 1 }],
        shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD', deliveryMethod: 'delivery',
      }, 'customer-jwt', 'retry-after-key-0000001'),
      error => error instanceof QuotationApiError
        && error.status === 429
        && error.retryAfterSeconds === 37
        && /Idempotency-Key/.test(error.message),
    );
  } finally { globalThis.fetch = originalFetch; }
});

test('Quotation create key uses secure randomness and stays stable only for the same in-memory intent', () => {
  let counter = 0;
  const deterministicCrypto = {
    getRandomValues<T extends ArrayBufferView>(array: T): T {
      new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(++counter);
      return array;
    },
  } as Pick<Crypto, 'getRandomValues'>;
  assert.match(generateQuotationCreateKey(deterministicCrypto), /^[a-f0-9]{64}$/);

  const request = {
    items: [{ variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000',
    paymentMethod: 'COD' as const, deliveryMethod: 'delivery' as const,
  };
  let generated = 0;
  const createKey = () => `intent-key-${++generated}`;
  const first = getQuotationCreateIntent(null, request, createKey);
  const retry = getQuotationCreateIntent(first, request, createKey);
  const changed = getQuotationCreateIntent(first, { ...request, items: [{ variantId: 'variant-2', quantity: 1 }] }, createKey);
  assert.equal(retry.key, first.key);
  assert.notEqual(changed.key, first.key);
  assert.equal(generated, 2);
});

test('Quotation create exposes ambiguous timeout, payload-conflict, and pending semantics', async () => {
  const originalFetch = globalThis.fetch;
  const input = {
    items: [{ variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000',
    paymentMethod: 'COD' as const, deliveryMethod: 'delivery' as const,
  };
  try {
    globalThis.fetch = (async () => { throw new Error('network timeout'); }) as typeof fetch;
    await assert.rejects(
      createCustomerQuotation(input, 'customer-jwt', 'same-key-after-timeout-0001'),
      error => error instanceof Error && /kết nối bị gián đoạn/i.test(error.message),
    );

    globalThis.fetch = (async () => new Response(JSON.stringify({ code: 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' }), { status: 409 })) as typeof fetch;
    await assert.rejects(
      createCustomerQuotation(input, 'customer-jwt', 'same-key-after-timeout-0001'),
      error => (error as any).code === 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH' && (error as any).status === 409,
    );

    globalThis.fetch = (async () => new Response(JSON.stringify({ code: 'IDEMPOTENCY_REQUEST_IN_PROGRESS' }), { status: 409 })) as typeof fetch;
    await assert.rejects(
      createCustomerQuotation(input, 'customer-jwt', 'same-key-after-timeout-0001'),
      error => (error as any).code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS' && (error as any).status === 409,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('refresh recovery storage persists only an opaque key and timestamp and supports privacy cleanup', () => {
  const values = new Map<string, string>();
  const storage = {
    setItem: (key: string, value: string) => values.set(key, value),
    getItem: (key: string) => values.get(key) || null,
    removeItem: (key: string) => { values.delete(key); },
  };
  const marker = { key: 'opaque-recovery-key-0001', createdAt: 1791590400000 };
  assert.equal(saveQuotationCreateRecoveryMarker(marker, storage), true);
  assert.deepEqual(loadQuotationCreateRecoveryMarker(storage), marker);
  const serialized = values.get(QUOTATION_CREATE_RECOVERY_STORAGE_KEY) || '';
  assert.equal(serialized.includes('phone'), false);
  assert.equal(serialized.includes('address'), false);
  assert.equal(serialized.includes('token'), false);
  assert.deepEqual(Object.keys(JSON.parse(serialized)).sort(), ['createdAt', 'key']);
  clearQuotationCreateRecoveryMarker(storage);
  assert.equal(loadQuotationCreateRecoveryMarker(storage), null);
});

test('authenticated recovery lookup sends only the opaque key and never resubmits quotation payload', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify({ quotation: {
      id: 'quote-recovered', quoteNumber: 'Q-RECOVERED', status: 'PENDING_CUSTOMER_CONFIRMATION',
      subtotal: 100, discountAmount: 0, shippingFee: 0, totalAmount: 100,
      expiresAt: '2026-10-11T00:00:00.000Z', items: [],
    }, recovered: true }), { status: 200 });
  }) as typeof fetch;
  try {
    const result = await recoverCustomerQuotation('opaque-recovery-key-0002', 'customer-jwt');
    assert.equal(result.status, 'found');
    if (result.status === 'found') assert.equal(result.quotation.id, 'quote-recovered');
    assert.ok(captured);
    assert.equal(captured!.url.endsWith('/api/quotations/recovery'), true);
    assert.equal(captured!.init?.method, 'POST');
    assert.equal(captured!.init?.body, undefined);
    const headers = new Headers(captured!.init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer customer-jwt');
    assert.equal(headers.get('Idempotency-Key'), 'opaque-recovery-key-0002');
  } finally { globalThis.fetch = originalFetch; }
});

test('recovery 404 remains unresolved unless Backend explicitly marks no committed result at this check', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ code: 'IDEMPOTENCY_RESULT_NOT_FOUND' }), { status: 404 })) as typeof fetch;
  try {
    assert.deepEqual(await recoverCustomerQuotation('opaque-recovery-key-0003', 'customer-jwt'), { status: 'not_found_at_check' });
    globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'route not mounted' }), { status: 404 })) as typeof fetch;
    await assert.rejects(recoverCustomerQuotation('opaque-recovery-key-0003', 'customer-jwt'), error => (error as any).code === null);
  } finally { globalThis.fetch = originalFetch; }
});
