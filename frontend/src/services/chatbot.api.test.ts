import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMarkdown } from '../components/chatbot/ChatMarkdown';
import { resolveQuotationIntent } from '../components/chatbot/quotation-intent';
import { extractSuggestedProductIds, fetchChatbotCatalogProducts, readVerifiedChatbotProducts, resolveChatbotProductResponse, searchChatbotCatalogProducts, sendChatMessage } from './chatbot.api';

for (const [input, text] of [['xin chào', 'Chào bạn! WebPhone rất vui được hỗ trợ bạn.'], ['cảm ơn', 'Rất vui được hỗ trợ bạn!'], ['tạm biệt', 'Tạm biệt bạn, hẹn gặp lại!'], ['Chính sách bảo hành?', 'Bạn có thể liên hệ cửa hàng để được hỗ trợ.']]) {
  test(`Backend conversational DTO renders actual text with no catalog lookup: ${input}`, async () => {
    const previousFetch = globalThis.fetch;
    let requests = 0;
    globalThis.fetch = (async (url: any) => {
      requests++; assert.ok(String(url).endsWith('/api/chatbot/message'));
      return Response.json({ result_type: 'text', response: text, sessionId: 'fixture-session' });
    }) as typeof fetch;
    try {
      const dto = await sendChatMessage(input, 'fixture-session');
      const intent = await resolveQuotationIntent(input, dto, [], {
        byIds: async () => { throw new Error('must not load catalog'); }, byName: async () => { throw new Error('must not search catalog'); },
      });
      assert.equal(intent, null); assert.equal(requests, 1);
      Object.assign(globalThis, { React });
      const markup = renderToStaticMarkup(React.createElement(ChatMarkdown, { content: dto.response }));
      assert.ok(markup.includes(text)); assert.equal((markup.match(/chatbot-markdown/g) || []).length, 1);
      assert.ok(!markup.includes('Tôi chưa thể xác minh'));
    } finally { globalThis.fetch = previousFetch; }
  });
}

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
    const body = JSON.parse(String(captured!.init?.body));
    assert.equal(body.message, 'hello');
    assert.equal(body.sessionId, 'guest-session');
    assert.match(body.requestId, /^[0-9a-f-]{36}$/i);
    assert.equal(body.sessionToken, undefined);
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

const verifiedCards = Array.from({ length: 5 }, (_, i) => ({ id: `p-${i + 1}`, name: `Phone ${i + 1}`, price: (i + 1) * 100000,
  stock: i + 1, variants: [{ id: `v-${i + 1}`, price: (i + 1) * 100000, original_price: (i + 1) * 100000,
    stock: i + 1, attributes: { color: 'Blue', storage: '256GB' }, availability: 'in_stock' as const }] }));

test('all MAIN product types preserve natural Backend prose and five verified cards without redundant lookup', async () => {
  for (const result_type of ['product_search', 'product_detail', 'product_compare', 'recommendation', 'no_result']) {
    const dto = { result_type, response: 'WebPhone có bán iPhone. Bạn muốn xem mẫu nào?', total: 5, products: verifiedCards, catalog_verified: true };
    const result = await resolveChatbotProductResponse(dto, async () => { throw new Error('redundant catalog request'); });
    assert.equal(result.text, dto.response); assert.equal(result.products.length, dto.total);
    assert.deepEqual(result.products.map(p => p.id), verifiedCards.map(p => p.id));
    assert.deepEqual(result.products.map(p => p.variants?.[0].id), verifiedCards.map(p => p.variants[0].id));
    assert.equal(result.isError, false);
  }
});

test('legacy hinted IDs still require catalog rehydration and cannot supply client price/stock', async () => {
  const result = await resolveChatbotProductResponse({ result_type: 'product_detail', response: 'Bạn muốn xem thêm?', product: { id: 'p-1', price: 1, stock: 999 } }, async ids => {
    assert.deepEqual(ids, ['p-1']); return [verifiedCards[0]];
  });
  assert.equal(result.products[0].price, 100000); assert.equal(result.products[0].stock, 1); assert.equal(result.text, 'Bạn muốn xem thêm?');
});

test('invalid verified payload is not used, and lookup errors remain recoverable', async () => {
  assert.equal(readVerifiedChatbotProducts({ catalog_verified: true, products: [{ id: 'p1', price: -1, stock: -1 }] }), null);
  const result = await resolveChatbotProductResponse({ result_type: 'product_search', response: 'intro', products: [{ id: 'p1' }] }, async () => { throw new Error('fixture unavailable'); });
  assert.equal(result.isError, true); assert.deepEqual(result.products, []);
});

test('duplicate verified IDs cannot produce duplicate carousel keys or repeated messages', async () => {
  const result = await resolveChatbotProductResponse({ catalog_verified: true, response: 'intro', products: [verifiedCards[0], verifiedCards[0]] });
  assert.equal(result.products.length, 1); assert.equal(result.text, 'intro');
});
