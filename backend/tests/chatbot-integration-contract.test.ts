import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCustomerN8nPayload,
  CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
  sanitizeCustomerChatbotResponse,
  normalizeChatbotWorkflowResponse,
  prepareCustomerChatbotResponse,
} from '../src/routes/chatbot.routes';
import { createChatbotRouter } from '../src/routes/chatbot.routes';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { groundChatbotProse } from '../src/services/chatbot-response-grounding';
import {
  ChatbotCatalogInputError,
  parseChatbotCatalogIds,
  resolveChatbotCatalogProducts,
} from '../src/services/chatbot-catalog.service';
import {
  beginTrackingChallenge,
  createTrackingLookupFingerprint,
  normalizeTrackingContact,
  verifyTrackingChallenge,
} from '../src/services/order-tracking-security';
import { safeErrorSummary } from '../src/utils/safe-error-summary';

test('safe backend error summary keeps Prisma/OS codes but omits messages and connection credentials', () => {
  const cause = Object.assign(new Error('postgresql://db-user:do-not-log@host/db'), {
    code: 'SELF_SIGNED_CERT_IN_CHAIN',
  });
  const error = Object.assign(new Error('database password=do-not-log'), {
    name: 'PrismaClientInitializationError',
    code: 'P1001',
    cause,
  });

  const summary = safeErrorSummary(error);
  assert.deepEqual(summary, {
    name: 'PrismaClientInitializationError',
    code: 'P1001',
    cause: { name: 'Error', code: 'SELF_SIGNED_CERT_IN_CHAIN' },
  });
  assert.equal(JSON.stringify(summary).includes('do-not-log'), false);
});

test('quotation workflow claims fail closed and only permit Backend-rehydrated product IDs', () => {
  const response = sanitizeCustomerChatbotResponse({
    result_type: 'quotation',
    response_type: 'file',
    success: true,
    quote_status: 'ready',
    quote_number: 'LLM-123',
    file_name: 'public.pdf',
    download_url: 'https://example.invalid/public.pdf',
    total: 1,
    total_display: '1 VND',
    response: 'Quotation created',
    products: [{ id: 'catalog-quote-1', price: 1, quantity: 99 }],
  }, 'guest-session');

  assert.deepEqual(response, {
    sessionId: 'guest-session',
    result_type: 'product_search',
    response: CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
    products: [{ id: 'catalog-quote-1' }],
  });
});

test('file URL claims are treated as quotations even if the workflow omits result_type', () => {
  const response = sanitizeCustomerChatbotResponse({
    response_type: 'file',
    download_url: '/api/chatbot/quotation-files/guess.pdf',
  }, 'guest-session') as Record<string, unknown>;
  assert.equal(response.result_type, 'text');
  assert.equal('download_url' in response, false);
});

test('product search response carries only suggested IDs; prose and prices are backend-owned', () => {
  const response = sanitizeCustomerChatbotResponse({
    result_type: 'product_search',
    response: 'Gemini says it costs 1 VND',
    products: [{ id: 'catalog-1', name: 'Fake name', price: 1, stock: 99, image_url: 'https://bad.invalid/x' }],
  }, 'guest-session') as Record<string, any>;

  assert.equal(response.response.includes('Gemini'), false);
  assert.deepEqual(response.products, [{ id: 'catalog-1' }]);
});

test('recommendation and product-detail LLM prose is replaced and only catalog IDs survive', () => {
  const recommendation = sanitizeCustomerChatbotResponse({
    result_type: 'recommendation',
    response: 'Buy this for 1 VND',
    products: [{ id: 'catalog-2', name: 'Unverified', price: 1 }],
  }, 'guest-session') as Record<string, any>;
  const detail = sanitizeCustomerChatbotResponse({
    result_type: 'product_detail',
    response: 'This product costs 1 VND',
    product: { id: 'catalog-3', price: 1 },
  }, 'guest-session') as Record<string, any>;
  const fallback = sanitizeCustomerChatbotResponse({
    result_type: 'text', response: 'The current price is 1 VND',
  }, 'guest-session') as Record<string, any>;

  assert.equal(recommendation.response.includes('1 VND'), false);
  assert.deepEqual(recommendation.products, [{ id: 'catalog-2' }]);
  assert.equal(detail.response.includes('1 VND'), false);
  assert.deepEqual(detail.products, [{ id: 'catalog-3' }]);
  assert.equal(fallback.response.includes('1 VND'), false);
});

test('n8n payload contains no authenticated Customer identity or bearer token', () => {
  const payload = buildCustomerN8nPayload({
    message: 'Find a phone',
    sessionId: 'guest-session',
    history: [],
    conversationState: null,
    customerId: 'should-not-pass',
    token: 'secret-token',
  } as any);
  assert.deepEqual(Object.keys(payload).sort(), [
    'chatInput', 'conversationId', 'conversationState', 'history', 'sessionId', 'source',
  ]);
  assert.equal(JSON.stringify(payload).includes('secret-token'), false);
  assert.equal(JSON.stringify(payload).includes('customerId'), false);
});

test('n8n context redacts obvious credentials and private quotation PDF URLs while preserving ordinary text', () => {
  const payload = buildCustomerN8nPayload({
    message: 'My password: hiddensecret and call me at minh@example.test',
    sessionId: 'guest-session',
    history: [{ role: 'user', content: 'OTP=123456 Bearer eyJabcdefghijk.abcdefghijk.abcdefghijk' }],
    conversationState: {
      customerId: 'customer-private-id',
      quotationPdfUrl: 'https://shop.invalid/api/quotations/q-1/pdf',
      attachmentLink: 'https://shop.invalid/api/quotations/q-1/pdf',
      category: 'phone',
      active_filters: { brand: 'Apple', price_max: 40000000, privateText: 'do not forward' },
      last_result_set: [{ id: 'product-1', name: 'iPhone', price: 100, stock: 2, description: 'private free text' }],
      nested: { accessToken: 'secret-token', note: 'safe note' },
    },
  });
  const serialized = JSON.stringify(payload);
  assert.equal(serialized.includes('hiddensecret'), false);
  assert.equal(serialized.includes('123456'), false);
  assert.equal(serialized.includes('abcdefghijk'), false);
  assert.equal(serialized.includes('secret-token'), false);
  assert.equal(serialized.includes('api/quotations/q-1/pdf'), false);
  assert.equal(serialized.includes('minh@example.test'), true);
  assert.equal(serialized.includes('customer-private-id'), false);
  assert.equal(serialized.includes('privateText'), false);
  assert.equal(serialized.includes('private free text'), false);
  assert.equal(serialized.includes('"price":100'), false);
  assert.deepEqual((payload.conversationState as any).last_result_set, [{ id: 'product-1', name: 'iPhone', position: 1 }]);
  assert.deepEqual((payload.conversationState as any).active_filters, { brand: 'Apple', price_max: 40000000 });
});

test('n8n receives only a bounded recent chat window and bounded free-text snippets', () => {
  const history = Array.from({ length: 20 }, (_, index) => ({ role: 'user' as const, content: `${'x'.repeat(1000)}${index}` }));
  const payload = buildCustomerN8nPayload({
    message: 'find a phone', sessionId: 'guest-session', history, conversationState: null,
  });
  assert.equal(payload.history.length, 6);
  assert.equal(payload.history[0].content.endsWith('14'), true);
  assert.ok(payload.history.every(message => message.content.length <= 600));
});

test('catalog parser accepts bounded opaque IDs and rejects raw LLM product objects', () => {
  assert.deepEqual(parseChatbotCatalogIds(['product-1', 'product-1', 'product_2']), ['product-1', 'product_2']);
  assert.throws(() => parseChatbotCatalogIds([{ id: 'product-1', price: 1 }]), ChatbotCatalogInputError);
  assert.throws(() => parseChatbotCatalogIds(Array.from({ length: 13 }, (_, i) => `product-${i}`)), ChatbotCatalogInputError);
});

test('catalog adapter filters active products and computes display price from Backend sale/campaign data', async () => {
  let productQuery: any;
  const now = new Date('2026-10-10T00:00:00.000Z');
  const database = {
    product: {
      findMany: async (args: any) => {
        productQuery = args;
        return [{
          id: 'product-1', name: 'Catalog phone', brand: 'WebPhone', description: 'Verified',
          image: '/uploads/catalog.jpg', categoryId: 'phones', status: 'active',
          variants: [{ id: 'variant-1', attributes: { color: 'Black', storage: '256GB', private: { ignored: true } }, price: 100000, salePrice: 90000, stock: 3 }],
        }];
      },
    },
    campaign: {
      findMany: async () => [{
        id: 'campaign-1', isActive: true, startDate: new Date('2026-10-01'), endDate: new Date('2026-10-20'),
        appliesTo: 'all', targetIds: [], discountType: 'percentage', discountValue: 20,
      }],
    },
  };

  const products = await resolveChatbotCatalogProducts(database, ['product-1'], now);
  assert.deepEqual(productQuery.where, { id: { in: ['product-1'] }, status: 'active' });
  assert.deepEqual(products, [{
    id: 'product-1', name: 'Catalog phone', brand: 'WebPhone', description: 'Verified',
    image_url: '/uploads/catalog.jpg', price: 80000, original_price: 100000,
    variants: [{ id: 'variant-1', attributes: { color: 'Black', storage: '256GB' }, stock: 3, price: 80000, original_price: 100000, availability: 'in_stock' }],
    stock: 3, availability: 'in_stock',
  }]);
});

test('chatbot catalog resolves only Backend variants and marks zero-stock variants unavailable', async () => {
  const database = {
    product: { findMany: async () => [{
      id: 'product-2', name: 'Verified phone', status: 'active', variants: [
        { id: 'variant-available', attributes: { color: 'Blue' }, price: 100000, salePrice: null, stock: 2 },
        { id: 'variant-empty', attributes: { color: 'Red' }, price: 100000, salePrice: null, stock: 0 },
      ],
    }] },
    campaign: { findMany: async () => [] },
  };
  const [product] = await resolveChatbotCatalogProducts(database, ['product-2'], new Date('2026-10-10T00:00:00.000Z'));
  assert.equal(product.variants[0].id, 'variant-available');
  assert.equal(product.variants[0].price, 100000);
  assert.equal(product.variants[0].availability, 'in_stock');
  assert.equal(product.variants[1].availability, 'out_of_stock');
});

test('chatbot catalog preserves Vietnamese variant attributes and safe SKU fallback', async () => {
  let query: any;
  const database = {
    product: { findMany: async (args: any) => {
      query = args;
      return [{
        id: 'iphone-17', name: 'iPhone 17 PRO MAX', status: 'active', variants: [{
          id: 'variant-internal-id', sku: 'IPHO-256GB-XANHNAVY',
          attributes: { 'Màu sắc': 'Xanh Navy', 'Dung lượng': '256GB' },
          price: 25000000, salePrice: null, stock: 3,
        }],
      }];
    } },
    campaign: { findMany: async () => [] },
  };

  const [product] = await resolveChatbotCatalogProducts(database, ['iphone-17'], new Date('2026-10-10T00:00:00.000Z'));
  assert.equal(query.select.variants.select.sku, true);
  assert.deepEqual(product.variants[0], {
    id: 'variant-internal-id', sku: 'IPHO-256GB-XANHNAVY',
    attributes: { 'Màu sắc': 'Xanh Navy', 'Dung lượng': '256GB' },
    stock: 3, price: 25000000, original_price: 25000000, availability: 'in_stock',
  });
});

test('public order lookup keeps OTP bound to order/contact and rejects replay', () => {
  const contact = normalizeTrackingContact('0900000123');
  assert.ok(contact);
  const fingerprint = createTrackingLookupFingerprint('DH-TEST-2D1-UNIQUE', contact!);
  const challenge = beginTrackingChallenge('order-2d1-unique', fingerprint, '123456');
  const first = verifyTrackingChallenge(challenge.challengeId, '123456', 'test-ip-2d1');
  const replay = verifyTrackingChallenge(challenge.challengeId, '123456', 'test-ip-2d1');
  assert.deepEqual(first, { ok: true, orderId: 'order-2d1-unique' });
  assert.deepEqual(replay, { ok: false, reason: 'invalid' });
});

const capturedGreeting = 'Chào bạn! WebPhone rất vui được hỗ trợ bạn. \n\nBạn đang quan tâm đến dòng điện thoại nào hoặc cần tìm hiểu thông tin gì về sản phẩm, chính sách của chúng tôi? Hãy cho WebPhone biết rõ hơn để được hỗ trợ tốt nhất nhé!';
const capturedState = { category: null, active_filters: {}, preferred_brands: [], excluded_brands: [], rejected_products: [], last_result_set: [],
  selected_product_id: null, selected_variant_id: null, last_intent: 'default', last_turn_action: 'NEW_TOPIC', pending_question: null, state_version: 2 };

for (const [input, response] of [['xin chào', capturedGreeting], ['cảm ơn', 'Rất vui được hỗ trợ bạn!'], ['tạm biệt', 'Tạm biệt bạn, hẹn gặp lại!'], ['hello', 'Hello! How can I help you?']]) {
  test(`normal conversation preserves n8n text without requiring product IDs: ${input}`, () => {
    const dto: any = sanitizeCustomerChatbotResponse([{ result_type: 'text', response, sessionId: 'upstream-session', conversation_state: capturedState }], 'client-session');
    assert.equal(dto.response, response); assert.equal(dto.result_type, 'text'); assert.equal(dto.sessionId, 'client-session');
    assert.deepEqual(dto.conversation_state, capturedState); assert.equal('products' in dto, false);
  });
}

test('FAQ without current catalog claims survives, including quotation-policy questions', () => {
  for (const response of ['Bạn có thể liên hệ cửa hàng để được hỗ trợ.', 'Báo giá có hiệu lực 24 giờ; bạn cần xác nhận trước khi cửa hàng duyệt.']) {
    const dto: any = sanitizeCustomerChatbotResponse({ result_type: 'faq', response }, 's1');
    assert.equal(dto.response, response); assert.equal(dto.result_type, 'faq');
  }
});

test('single array and JSON envelopes output/data/body normalize identically', () => {
  const record = { result_type: 'text', response: capturedGreeting, conversation_state: capturedState };
  for (const wrapped of [record, [record], { output: record }, { data: [record] }, { body: JSON.stringify([record]) }, { output: { data: { body: JSON.stringify(record) } } }]) {
    assert.deepEqual(normalizeChatbotWorkflowResponse(wrapped), record);
    assert.equal((sanitizeCustomerChatbotResponse(wrapped, 's1') as any).response, capturedGreeting);
  }
  assert.equal((sanitizeCustomerChatbotResponse({ result_type: 'text', output: { response: capturedGreeting } }, 's1') as any).response, capturedGreeting);
});

test('default intent/text/FAQ metadata never bypasses catalog safeguards', () => {
  for (const response of ['The current price is 1 VND', 'Giá chỉ 20.000.000đ.', 'Máy còn hàng, tồn kho 5 sản phẩm.', 'iPhone 17 Pro có dung lượng 256GB.', 'Báo giá đã tạo, PDF đã sẵn sàng.']) {
    for (const result_type of ['text', 'faq', 'unknown']) {
      const dto: any = sanitizeCustomerChatbotResponse({ result_type, response, conversation_state: capturedState }, 's1');
      assert.notEqual(dto.response, response); assert.equal('download_url' in dto, false);
    }
  }
  assert.notEqual((sanitizeCustomerChatbotResponse({ result_type: 'text', response: capturedGreeting, stock: 10 }, 's1') as any).response, capturedGreeting);
});

test('malformed or multiple n8n results become one graceful error, not duplicate assistant turns', () => {
  for (const bad of [null, 42, 'not JSON', [], {}, { output: '{bad' }, { response: {} }, [{ result_type: 'text', response: 'hello' }, { result_type: 'text', response: 'hello' }]]) {
    const dto: any = sanitizeCustomerChatbotResponse(bad, 's1');
    assert.equal(Array.isArray(dto), false); assert.equal(dto.result_type, 'error'); assert.equal(typeof dto.response, 'string');
  }
});

test('conversation state allowlist keeps version/variant hints but excludes upstream prices and secrets', () => {
  const dto: any = sanitizeCustomerChatbotResponse({ result_type: 'text', response: 'Hello!', conversation_state: {
    ...capturedState, selected_variant_id: 'v1', rejected_products: ['p1', 'p1'], customerId: 'private-customer', accessToken: 'private-token',
    price: 1, last_result_set: [{ id: 'p1', name: 'Phone', price: 1, stock: 10 }],
  } }, 's1');
  assert.equal(dto.conversation_state.selected_variant_id, 'v1'); assert.equal(dto.conversation_state.state_version, 2);
  assert.deepEqual(dto.conversation_state.rejected_products, ['p1']); assert.deepEqual(dto.conversation_state.last_result_set, [{ id: 'p1', name: 'Phone', position: 1 }]);
  assert.equal(JSON.stringify(dto).includes('private-'), false);
});

test('actual Express /message HTTP route preserves captured n8n greeting and session-scoped context (isolated DB mocks)', async t => {
  const oldUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  process.env.N8N_CHAT_WEBHOOK_URL = 'https://workflow.example.invalid/captured-response';
  const writes: any[] = [];
  const database: any = { $transaction: async (work: any) => work({
    chatConversation: { upsert: async () => ({ id: 'conversation-fixture', context: null }) },
    chatMessage: { findMany: async () => [], create: async (args: any) => { writes.push(args); } },
  }),
  chatConversation: { upsert: async (args: any) => { assert.equal(args.where.sessionId, 'http-test-session'); return { id: 'conversation-fixture' }; } },
  chatMessage: { create: async (args: any) => { writes.push(args); } },
  product: { findMany: async () => [{ id: 'catalog-real', name: 'Backend phone', status: 'active', variants: [{ id: 'variant-real', price: 100000, stock: 3, attributes: {} }] }] },
  campaign: { findMany: async () => [] },
  };
  const originalFetch = globalThis.fetch;
  let workflowCalls = 0;
  const fetcher = (async (url: any, options: any) => {
    if (String(url) === process.env.N8N_CHAT_WEBHOOK_URL) {
      workflowCalls++;
      if (JSON.parse(options.body).chatInput === 'find phone') return Response.json({ result_type: 'product_search', response: 'Invented price 1 VND', products: [{ id: 'catalog-real', price: 1, stock: 999 }] });
      assert.equal(JSON.parse(options.body).chatInput, 'xin chào');
      return Response.json({ body: [{ result_type: 'text', response: capturedGreeting, sessionId: 'untrusted-other-session', conversation_state: capturedState }] });
    }
    return originalFetch(url, options);
  }) as typeof fetch;
  const app = express(); app.use(express.json()); app.use('/api/chatbot', createChatbotRouter({ database, fetcher }));
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>(resolve => server.once('listening', resolve));
    const response = await originalFetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chatbot/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'xin chào', sessionId: 'http-test-session' }),
    });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'private, no-store');
    const dto: any = await response.json(); assert.equal(dto.response, capturedGreeting); assert.equal(dto.sessionId, 'http-test-session');
    assert.deepEqual(dto.conversation_state, capturedState); assert.equal(workflowCalls, 1);
    assert.deepEqual(writes.map(write => write.data.role), ['user', 'assistant']);
    assert.equal(writes[1].data.content, capturedGreeting);
    const suggested = await originalFetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chatbot/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'find phone', sessionId: 'http-test-session' }),
    });
    const suggestion: any = await suggested.json(); assert.equal(suggested.status, 200);
    assert.equal(suggestion.catalog_verified, true); assert.equal(suggestion.total, 1);
    assert.equal(suggestion.products[0].id, 'catalog-real'); assert.equal(suggestion.products[0].price, 100000);
    assert.equal(suggestion.products[0].stock, 3); assert.ok(!suggestion.response.includes('1 VND'));
    const catalog = await originalFetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chatbot/catalog`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: ['catalog-real'] }),
    });
    assert.equal(catalog.status, 200); const verified: any = await catalog.json();
    assert.equal(verified.products[0].price, 100000); assert.equal(verified.products[0].stock, 3); assert.equal(workflowCalls, 2);
  } finally {
    server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (oldUrl === undefined) delete process.env.N8N_CHAT_WEBHOOK_URL; else process.env.N8N_CHAT_WEBHOOK_URL = oldUrl;
  }
});

const responseCatalog = Array.from({ length: 5 }, (_, i) => ({ id: `phone-${i + 1}`, name: `iPhone ${i + 13}`, brand: 'Apple', status: 'active',
  category: { name: 'Phone', slug: 'phone', isActive: true }, image: `/uploads/phone-${i + 1}.png`, specifications: [{ key: 'Camera', value: '48MP' }],
  variants: [{ id: `variant-${i + 1}`, sku: `SKU-${i + 1}`, attributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Xanh' }, price: 100000 * (i + 1), salePrice: null, stock: i + 1 }] }));
function responseDatabase(records = responseCatalog) {
  return { product: { findMany: async ({ where }: any) => [...records].reverse().filter(p => where.id.in.includes(p.id)) }, campaign: { findMany: async () => [] } } as any;
}
function searchRecord() {
  return { result_type: 'product_search', total: 5,
    response: 'WebPhone có bán nhiều dòng sản phẩm iPhone. Dưới đây là 5 sản phẩm để bạn tham khảo:\n\n'
      + responseCatalog.map((p, i) => `### ${i + 1}. ${p.name}\n\n**Giá:** 1 VND\n\n- Tồn kho: 999`).join('\n\n')
      + '\n\nBạn quan tâm đến mẫu nào để mình tư vấn tiếp?',
    products: responseCatalog.map(p => ({ id: p.id, name: p.name, price: 1, stock: 999 })),
    conversation_state: { ...capturedState, last_intent: 'product_search', last_turn_action: 'CONTINUE',
      last_result_set: responseCatalog.map((p, i) => ({ id: p.id, position: i + 1, name: p.name, price_min: 1, price_max: 1 })) },
  };
}

test('iPhone search keeps natural introduction/follow-up, verifies five cards and preserves n8n order', async () => {
  const dto: any = await prepareCustomerChatbotResponse(searchRecord(), 'customer-A-session', responseDatabase());
  assert.equal(dto.result_type, 'product_search'); assert.equal(dto.total, 5); assert.equal(dto.catalog_verified, true);
  assert.deepEqual(dto.products.map((p: any) => p.id), responseCatalog.map(p => p.id));
  assert.deepEqual(dto.products.map((p: any) => p.variants[0].id), responseCatalog.map(p => p.variants[0].id));
  assert.ok(dto.response.includes('WebPhone có bán nhiều dòng sản phẩm iPhone')); assert.ok(dto.response.includes('Bạn quan tâm đến mẫu nào'));
  assert.ok(!dto.response.includes('Danh sách dưới đây được xác minh')); assert.ok(!dto.response.includes('### 1.')); assert.ok(!dto.response.includes('1 VND'));
  assert.equal(dto.products[0].price, 100000); assert.equal(dto.products[0].stock, 1);
  assert.equal(dto.conversation_state.last_result_set[4].id, 'phone-5'); assert.equal(dto.conversation_state.last_result_set[4].position, 5);
  assert.equal(dto.conversation_state.last_result_set[4].price_min, 500000);
});

test('stale price/stock sentence is removed without replacing valid surrounding conversation', async () => {
  const record = { result_type: 'product_detail', product: { id: 'phone-5', name: 'iPhone 17', price: 1, stock: 999 },
    response: 'Đây là iPhone 17. Giá bán iPhone 17 là 1 VND. iPhone 17 tồn kho 999 máy. Bạn muốn xem thêm màu nào?' };
  const dto: any = await prepareCustomerChatbotResponse(record, 's1', responseDatabase());
  assert.equal(dto.result_type, 'product_detail'); assert.equal(dto.product.id, 'phone-5');
  assert.ok(dto.response.includes('Đây là iPhone 17.')); assert.ok(dto.response.includes('Bạn muốn xem thêm màu nào?'));
  assert.ok(!dto.response.includes('1 VND')); assert.ok(!dto.response.includes('999')); assert.equal(dto.product.stock, 5);
});

test('fully verified product detail money, stock and storage facts remain verbatim', async () => {
  const response = 'iPhone 17 giá bán 500.000 đ, còn 5 máy. Dung lượng 256GB. Bạn muốn xem thêm?';
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5' }, response }, 's1', responseDatabase());
  assert.equal(dto.response, response);
});

test('every actual MAIN result type keeps its type/metadata and Backend catalog facts', async () => {
  for (const kind of ['product_search', 'product_detail', 'product_compare', 'recommendation', 'no_result']) {
    const dto: any = await prepareCustomerChatbotResponse({ result_type: kind, response: 'Bạn muốn xem thêm lựa chọn nào?', products: [{ id: 'phone-1' }, { id: 'phone-2' }],
      total_requested: 3, ready_to_compare: false, missing_products: ['missing model'], filters: { brand: 'Apple', price_max: 500000 } }, 's1', responseDatabase());
    assert.equal(dto.result_type, kind); assert.equal(dto.total, 2); assert.equal(dto.products[0].price, 100000);
    assert.equal(dto.response, 'Bạn muốn xem thêm lựa chọn nào?'); assert.deepEqual(dto.filters, { brand: 'Apple', price_max: 500000 });
    if (kind === 'product_compare') { assert.equal(dto.total_found, 2); assert.equal(dto.total_requested, 3); assert.equal(dto.ready_to_compare, false); }
  }
  for (const kind of ['text', 'faq', 'error', 'no_result']) {
    const dto: any = await prepareCustomerChatbotResponse({ result_type: kind, response: 'Vui lòng cho biết thêm nhu cầu.', faq_topic: 'warranty', faq_found: true }, 's1', responseDatabase());
    assert.equal(dto.result_type, kind); assert.equal(dto.response, 'Vui lòng cho biết thêm nhu cầu.');
    if (kind === 'faq') assert.equal(dto.faq_topic, 'warranty');
  }
});

test('inactive/missing products are not displayed and total/state match remaining cards', async () => {
  const dto: any = await prepareCustomerChatbotResponse(searchRecord(), 's1', responseDatabase(responseCatalog.slice(0, 4).map((p, i) => i === 0 ? { ...p, status: 'inactive' } : p)));
  assert.equal(dto.products.length, 3); assert.equal(dto.total, 3); assert.equal(dto.conversation_state.last_result_set.length, 3);
  assert.equal(dto.conversation_state.last_result_set[2].position, 3); assert.ok(dto.response.includes('3 sản phẩm'));
});

test('catalog outage keeps suitable prose but never forwards unverified product facts', async () => {
  const dto: any = await prepareCustomerChatbotResponse(searchRecord(), 's1', { product: { findMany: async () => { throw Object.assign(new Error('fixture outage'), { code: 'P1001' }); } }, campaign: { findMany: async () => [] } } as any);
  assert.deepEqual(dto.products, []); assert.equal(dto.total, 0); assert.equal(dto.catalog_verified, false);
  assert.ok(dto.response.includes('Bạn quan tâm đến mẫu nào')); assert.ok(dto.response.includes('tạm thời không khả dụng'));
  assert.ok(!dto.response.includes('1 VND'));
});

test('fifth-result and variant follow-ups carry verified positions/prices and selection to n8n, isolated by session', async () => {
  const dto: any = await prepareCustomerChatbotResponse(searchRecord(), 'A', responseDatabase());
  const catalog = await resolveChatbotCatalogProducts(responseDatabase(), responseCatalog.map(p => p.id));
  const payload: any = buildCustomerN8nPayload({ message: 'cho tôi xem mẫu thứ 5', sessionId: 'A', history: [], conversationState: dto.conversation_state, verifiedCatalog: catalog });
  assert.equal(payload.conversationState.last_result_set[4].id, 'phone-5'); assert.equal(payload.conversationState.last_result_set[4].position, 5);
  assert.equal(payload.conversationState.last_result_set[4].price_min, 500000);
  const detail: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5' }, response: 'Bạn muốn xem thêm màu nào?',
    conversation_state: { ...dto.conversation_state, selected_product_id: 'phone-5', selected_variant_id: 'variant-5', active_filters: { storage_gb: 256 }, last_turn_action: 'SELECT' } }, 'A', responseDatabase());
  const colors: any = buildCustomerN8nPayload({ message: 'bản 256GB có màu gì?', sessionId: 'A', history: [], conversationState: detail.conversation_state, verifiedCatalog: catalog });
  assert.equal(colors.conversationState.selected_product_id, 'phone-5'); assert.equal(colors.conversationState.selected_variant_id, 'variant-5');
  assert.equal(colors.conversationState.active_filters.storage_gb, 256);
  const unrelated: any = buildCustomerN8nPayload({ message: 'hello', sessionId: 'B', history: [], conversationState: null });
  assert.equal(unrelated.conversationState, null); assert.equal(unrelated.sessionId, 'B');
});

test('unknown or malformed type fails closed; legacy AI PDF cannot become an official quotation', async () => {
  const unknown: any = await prepareCustomerChatbotResponse({ result_type: 'invented-success', response: 'Done' }, 's1', responseDatabase());
  assert.equal(unknown.result_type, 'error');
  const quote: any = await prepareCustomerChatbotResponse({ result_type: 'quotation', download_url: 'https://untrusted.invalid/q.pdf', success: true }, 's1', responseDatabase());
  assert.equal('download_url' in quote, false); assert.equal('success' in quote, false);
});

test('unverified technical facts disappear while natural detail follow-up remains', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5' },
    response: 'iPhone 17 có camera 999MP. Bạn cần tư vấn thêm không?' }, 's1', responseDatabase());
  assert.ok(!dto.response.includes('999MP')); assert.ok(dto.response.includes('Bạn cần tư vấn thêm không?'));
});

test('verified comparison table stays intact; only stale fact rows are removed', async () => {
  const text = '| Tiêu chí | iPhone 16 | iPhone 17 |\n|---|---|---|\n| Giá | 400.000 đ | 500.000 đ |\n| Tồn kho | 4 | 5 |\n| Camera | 999MP | 999MP |\n\nBạn muốn chọn mẫu nào?';
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_compare', response: text, products: [{ id: 'phone-4' }, { id: 'phone-5' }] }, 's1', responseDatabase());
  assert.ok(dto.response.includes('| Giá | 400.000 đ | 500.000 đ |')); assert.ok(dto.response.includes('| Tồn kho | 4 | 5 |'));
  assert.ok(!dto.response.includes('999MP')); assert.ok(dto.response.includes('Bạn muốn chọn mẫu nào?'));
});

test('new search state does not append previous hidden cards or use their stale prices', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ ...searchRecord(), products: [{ id: 'phone-5' }], total: 1 }, 's1', responseDatabase());
  assert.equal(dto.total, 1); assert.equal(dto.conversation_state.last_result_set.length, 1);
  assert.equal(dto.conversation_state.last_result_set[0].id, 'phone-5'); assert.equal(dto.conversation_state.last_result_set[0].price_min, 500000);
});

test('variant-specific prose cannot borrow another variant price or capacity', async () => {
  const database = responseDatabase([{ ...responseCatalog[4], variants: [...responseCatalog[4].variants,
    { ...responseCatalog[4].variants[0], id: 'variant-512', attributes: { 'Dung lượng': '512GB', 'Màu sắc': 'Đen' }, price: 900000, stock: 1 }] }]);
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5', variants: [{ id: 'variant-5' }] },
    response: 'iPhone 17 giá bán 900.000 đ, dung lượng 512GB. Bạn muốn xem thêm không?' }, 's1', database);
  assert.ok(!dto.response.includes('900.000')); assert.ok(!dto.response.includes('512GB')); assert.ok(dto.response.includes('Bạn muốn xem thêm không?'));
  assert.equal(dto.product.variants.length, 2);
});

test('invented model/color and mismatched sale-original pair are not promoted to verified facts', async () => {
  const db = responseDatabase([{ ...responseCatalog[4], variants: [{ ...responseCatalog[4].variants[0], price: 600000, salePrice: 500000 },
    { ...responseCatalog[4].variants[0], id: 'variant-other', price: 900000, salePrice: 800000 }] }]);
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5' },
    response: 'iPhone 99 có bán tại đây.\n- Đỏ (còn hàng)\niPhone 17 giá 500.000 đ (đã giảm từ 900.000 đ).\nBạn muốn xem thêm không?' }, 's1', db);
  assert.ok(!dto.response.includes('iPhone 99')); assert.ok(!dto.response.includes('Đỏ')); assert.ok(!dto.response.includes('900.000'));
  assert.ok(dto.response.includes('Bạn muốn xem thêm không?'));
});

test('comparison headings scope valid prices/specifications to the corresponding Backend product', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_compare', products: [{ id: 'phone-4' }, { id: 'phone-5' }],
    response: '### iPhone 16\n\n**Giá:** 400.000 đ\n\n- **Camera:** 48MP\n\n### iPhone 17\n\n**Giá:** 500.000 đ\n\n- **Chip:** A99\n\nBạn muốn xem mẫu nào?' }, 's1', responseDatabase());
  assert.ok(dto.response.includes('400.000 đ')); assert.ok(dto.response.includes('500.000 đ')); assert.ok(dto.response.includes('48MP'));
  assert.ok(!dto.response.includes('A99')); assert.ok(dto.response.includes('Bạn muốn xem mẫu nào?'));
});

test('standalone color-list entries are checked against actual Backend variant attributes', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', product: { id: 'phone-5' },
    response: 'Bản 256GB có các màu sắc sau:\n\n- Đỏ\n- Xanh\n\nBạn muốn chọn màu nào?' }, 's1', responseDatabase());
  assert.ok(!dto.response.includes('Đỏ')); assert.ok(dto.response.includes('- Xanh')); assert.ok(dto.response.includes('Bạn muốn chọn màu nào?'));
});
