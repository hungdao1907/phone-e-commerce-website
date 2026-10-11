import assert from 'node:assert/strict';
import test from 'node:test';
import { extractSuggestedProductIds, fetchChatbotCatalogProducts, searchChatbotCatalogProducts, sendChatMessage } from './chatbot.api';

test('guest chatbot message sends no auth token or customer identity to n8n relay', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify({ result_type: 'faq', response: 'ok' }), { status: 200 });
  }) as typeof fetch;

  try {
    await sendChatMessage('hello', 'guest-session');
    assert.ok(captured);
    assert.equal(captured!.url.endsWith('/api/chatbot/message'), true);
    assert.deepEqual(JSON.parse(String(captured!.init?.body)), { message: 'hello', sessionId: 'guest-session' });
    assert.equal('Authorization' in (captured!.init?.headers as Record<string, string>), false);
    assert.equal(String(captured!.init?.body).includes('customerId'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('product cards are resolved only through the Backend-owned catalog endpoint', async () => {
  const originalFetch = globalThis.fetch;
  let captured: { url: string; init?: RequestInit } | null = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), init };
    return new Response(JSON.stringify({ products: [{ id: 'p1', name: 'Backend product', price: 99000 }] }), { status: 200 });
  }) as typeof fetch;

  try {
    const products = await fetchChatbotCatalogProducts(['p1', 'p1']);
    assert.equal(captured!.url.endsWith('/api/chatbot/catalog'), true);
    assert.deepEqual(JSON.parse(String(captured!.init?.body)), { productIds: ['p1'] });
    assert.equal('Authorization' in (captured!.init?.headers as Record<string, string>), false);
    assert.deepEqual(products, [{ id: 'p1', name: 'Backend product', price: 99000 }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('chatbot quotation claims contribute only bounded product IDs, never price or PDF data', () => {
  assert.deepEqual(extractSuggestedProductIds({
    result_type: 'quotation',
    products: [
      { id: ' product-1 ', price: 1, total: 1, download_url: 'https://public.invalid/quote.pdf' },
      { id: 'product-1', price: 999999999 },
      { id: '', price: 2 },
      'product-2',
    ],
    total: 1,
    download_url: 'https://public.invalid/quote.pdf',
  }), ['product-1']);
  assert.deepEqual(extractSuggestedProductIds({ products: Array.from({ length: 14 }, (_, i) => ({ id: `p-${i}` })) }),
    Array.from({ length: 12 }, (_, i) => `p-${i}`));
});

test('catalog name search uses only extracted name and rehydrates backend product IDs', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    if (url.includes('/api/products/search?')) {
      return new Response(JSON.stringify({ data: [{ id: 'phone-17' }] }), { status: 200 });
    }
    return new Response(JSON.stringify({ products: [{ id: 'phone-17', name: 'iPhone 17', variants: [] }] }), { status: 200 });
  }) as typeof fetch;

  try {
    const products = await searchChatbotCatalogProducts('iPhone 17');
    const searchUrl = new URL(requests[0]);
    assert.equal(searchUrl.pathname, '/api/products/search');
    assert.equal(searchUrl.searchParams.get('search'), 'iPhone 17');
    assert.equal(searchUrl.searchParams.get('page'), '1');
    assert.equal(searchUrl.searchParams.get('limit'), '12');
    assert.equal(requests[1].endsWith('/api/chatbot/catalog'), true);
    assert.deepEqual(products.map(product => product.name), ['iPhone 17']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
