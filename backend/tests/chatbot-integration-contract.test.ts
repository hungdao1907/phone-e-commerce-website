import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCustomerN8nPayload,
  CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
  sanitizeCustomerChatbotResponse,
} from '../src/routes/chatbot.routes';
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
  assert.deepEqual((payload.conversationState as any).last_result_set, [{ id: 'product-1', name: 'iPhone' }]);
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
