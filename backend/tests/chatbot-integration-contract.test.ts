import assert from 'node:assert/strict';
import test from 'node:test';
import { chatbotWebhookHeaders } from '../src/services/chatbot-webhook-auth';

test('webhook Header Auth is taken only from server configuration', () => {
  assert.deepEqual(chatbotWebhookHeaders({ N8N_CHAT_AUTH_HEADER: 'X-WebPhone-Key', N8N_CHAT_AUTH_VALUE: 'test-only-fixture' }, true),
    { 'Content-Type': 'application/json', 'X-WebPhone-Key': 'test-only-fixture' });
  assert.deepEqual(chatbotWebhookHeaders({}), { 'Content-Type': 'application/json' });
  assert.throws(() => chatbotWebhookHeaders({}, true));
});

test('invalid webhook auth cannot inject headers or overwrite transport configuration', () => {
  for (const name of ['Content-Type', 'Host', 'Cookie', 'invalid header', 'X-Key\r\nInjected']) {
    assert.throws(() => chatbotWebhookHeaders({ N8N_CHAT_AUTH_HEADER: name, N8N_CHAT_AUTH_VALUE: 'test-only' }, true));
  }
  assert.throws(() => chatbotWebhookHeaders({ N8N_CHAT_AUTH_HEADER: 'X-Key', N8N_CHAT_AUTH_VALUE: 'fixture\r\nInjected: value' }, true));
  assert.throws(() => chatbotWebhookHeaders({ N8N_CHAT_AUTH_HEADER: 'X-Key' }, true));
});
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
import { readFileSync } from 'node:fs';
import path from 'node:path';
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
import { safeErrorSummary, safeFetchErrorSummary } from '../src/utils/safe-error-summary';
import { parseGroundedBudget, parseGroundedConstraints, requestedGroundedBudget, validatedStateTimestamp, GroundedContractError } from '../src/services/chatbot-grounded-constraints';

const groundedCategories = [
  { id: 'phone-root', parentId: null, isActive: true }, { id: 'tablet-root', parentId: null, isActive: true },
  { id: 'laptop-root', parentId: null, isActive: true }, { id: 'watch-root', parentId: null, isActive: true },
  { id: 'phone-child', parentId: 'phone-root', isActive: true },
];
const groundedRecords = [
  ['asus', 'ASUS Vivobook', 'ASUS', 'laptop-root'], ['vivo', 'Vivo V40', 'Vivo', 'phone-root'],
  ['iphone', 'iPhone 16', 'Apple', 'phone-child'], ['ipad', 'iPad Pro', 'Apple', 'tablet-root'],
  ['galaxy', 'Samsung Galaxy S25', 'Samsung', 'phone-root'], ['tab', 'Samsung Galaxy Tab S10', 'Samsung', 'tablet-root'],
  ['watch', 'Apple Watch Ultra', 'Apple', 'watch-root'],
].map(([id, name, brand, categoryId]) => ({ id, name, brand, categoryId, status: 'active', category: { name: categoryId, slug: categoryId, isActive: true },
  variants: [
    { id: id + '-cheap', price: 2900000, salePrice: null, stock: 2, attributes: { 'Dung lượng': '128GB', 'Màu sắc': 'Bạc' } },
    { id: id + '-edge', price: 3000000, salePrice: null, stock: 0, attributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Bạc' } },
    { id: id + '-expensive', price: 5000000, salePrice: null, stock: 3, attributes: { 'Dung lượng': '512GB', 'Màu sắc': 'Xanh' } },
  ] }));
function groundedDb(rows = groundedRecords) {
  return { product: { findMany: async ({ where }: any) => rows.filter(p => where.id.in.includes(p.id)) },
    campaign: { findMany: async () => [] }, category: { findMany: async () => groundedCategories } } as any;
}
function groundedRecord(overrides: Record<string, any> = {}, ids = ['iphone']) {
  return { result_type: 'recommendation', response: 'Invented extra product price 1 VND', products: ids.map(id => ({ id, variants: groundedRecords.find(p => p.id === id)!.variants.map(v => ({ id: v.id, price: 1, stock: 999 })) })),
    grounding: { constraints: { brands: [], categoryIds: [], modelIds: [], modelTokens: [], attrTerms: [], inStock: false, outOfStock: false, budget: null, ...overrides } },
    conversation_state: { state_version: 2, updated_at: new Date().toISOString(), active_filters: {}, last_result_set: [] } };
}

for (const [label, budget, expected] of [
  ['strict under 3 million', { max: 3000000, maxInclusive: false }, ['iphone-cheap']],
  ['inclusive at most 3 million', { max: 3000000, maxInclusive: true }, ['iphone-cheap', 'iphone-edge']],
  ['inclusive 3 to 5 million', { min: 3000000, minInclusive: true, max: 5000000, maxInclusive: true }, ['iphone-edge', 'iphone-expensive']],
  ['strict above 3 million', { min: 3000000, minInclusive: false }, ['iphone-expensive']],
  ['at least 3 million', { min: 3000000, minInclusive: true }, ['iphone-edge', 'iphone-expensive']],
] as const) test('grounded adapter budget: ' + label, async () => {
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget }), 'grounded-A', groundedDb());
  assert.deepEqual(dto.products[0].variants.map((v: any) => v.id), expected); assert.ok(!dto.response.includes('1 VND'));
  assert.equal(dto.products[0].price, Math.min(...dto.products[0].variants.map((v: any) => v.price)));
});
for (const text of ['dưới 3 triệu', 'dưới 3tr', 'dưới 3.000.000đ']) test('server request budget overrides relaxed workflow ceiling: ' + text, async () => {
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget: { max: 9000000, maxInclusive: true } }), 'grounded-A', groundedDb(), { message: text });
  assert.deepEqual(dto.products[0].variants.map((v: any) => v.id), ['iphone-cheap']);
  assert.deepEqual(dto.conversation_state.active_filters.grounded_budget, { max: 3000000, maxInclusive: false });
});
test('approximate budget without an approved tolerance asks a range and returns no cards', async () => {
  assert.equal(requestedGroundedBudget('khoảng 20 triệu'), 'clarification');
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget: { min: 1000000, max: 40000000, minInclusive: true, maxInclusive: true } }), 'A', groundedDb(), { message: 'khoảng 20 triệu' });
  assert.equal(dto.result_type, 'clarification'); assert.deepEqual(dto.products, []);
});
test('bounded approved explicit tolerance survives state validation without deriving new money policy', () => {
  const b = { min: 19000000, max: 21000000, minInclusive: true, maxInclusive: true, toleranceBps: 500 };
  assert.deepEqual(parseGroundedBudget(b), b);
});
test('bare VND and shorthand parse without confusing storage with a budget', () => {
  for (const text of ['3tr', '3.000.000đ', '3000000']) assert.deepEqual(requestedGroundedBudget(text), { max: 3000000, maxInclusive: true });
  assert.equal(requestedGroundedBudget('iPhone 16 256GB'), null);
  assert.deepEqual(requestedGroundedBudget('từ 3 đến 5 triệu'), { min: 3000000, max: 5000000, minInclusive: true, maxInclusive: true });
});
test('invalid budgets reject strings, NaN, inverted bounds, missing operators and excess numeric range', async () => {
  for (const b of [{ max: '3000000', maxInclusive: true }, { max: NaN, maxInclusive: true }, { min: 5000000, max: 3000000, minInclusive: true, maxInclusive: true }, { max: 3000000 }, { max: 1e15, maxInclusive: true }, { min: 3, minInclusive: false, max: 3, maxInclusive: true }]) {
    assert.throws(() => parseGroundedBudget(b), GroundedContractError);
    const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget: b }), 'A', groundedDb());
    assert.equal(dto.result_type, 'error'); assert.deepEqual(dto.products, []);
  }
});
test('missing budget keeps only verified hinted variants, no extra expensive variant reappears', async () => {
  const record = groundedRecord(); record.products[0].variants = [{ id: 'iphone-cheap', price: 1, stock: 999 }];
  const dto: any = await prepareCustomerChatbotResponse(record, 'A', groundedDb());
  assert.deepEqual(dto.products[0].variants.map((v: any) => v.id), ['iphone-cheap']); assert.equal(dto.products[0].price, 2900000); assert.equal(dto.products[0].stock, 2);
});
test('stock and partial existence are rebuilt from current database rather than AI stock', async () => {
  const stock: any = await prepareCustomerChatbotResponse(groundedRecord({ inStock: true }), 'A', groundedDb());
  assert.deepEqual(stock.products[0].variants.map((v: any) => v.id), ['iphone-cheap', 'iphone-expensive']);
  const all: any = await prepareCustomerChatbotResponse(groundedRecord(), 'A', groundedDb()); assert.equal(all.products[0].existence_status, 'PARTIALLY_AVAILABLE');
  const out: any = await prepareCustomerChatbotResponse(groundedRecord({ outOfStock: true }), 'A', groundedDb());
  assert.equal(out.products[0].stock, 0); assert.equal(out.products[0].availability, 'out_of_stock'); assert.equal(out.products[0].existence_status, 'OUT_OF_STOCK');
});
test('nonexistent and other-product variant IDs cannot be promoted into cards', async () => {
  const record = groundedRecord(); record.products[0].variants = [{ id: 'ipad-cheap', price: 1, stock: 999 }, { id: 'fake', price: 1, stock: 999 }];
  const dto: any = await prepareCustomerChatbotResponse(record, 'A', groundedDb()); assert.deepEqual(dto.products, []); assert.equal(dto.total, 0);
});
test('duplicates in product/product-list and variants do not create duplicate cards', async () => {
  const record: any = groundedRecord(); record.products.push(record.products[0]); record.product = record.products[0];
  const dto: any = await prepareCustomerChatbotResponse(record, 'A', groundedDb()); assert.equal(dto.products.length, 1); assert.equal(dto.products[0].variants.length, 3);
});
for (const [label, brands, categoryIds, expected] of [
  ['ASUS laptop', ['ASUS'], ['laptop-root'], ['asus']], ['Vivo smartphone', ['Vivo'], ['phone-root'], ['vivo']],
  ['Apple smartphone excludes iPad and Watch', ['Apple'], ['phone-root'], ['iphone']], ['Apple tablet excludes iPhone', ['Apple'], ['tablet-root'], ['ipad']],
  ['Samsung phone excludes Galaxy Tab', ['Samsung'], ['phone-root'], ['galaxy']], ['Samsung tablet excludes Galaxy Phone', ['Samsung'], ['tablet-root'], ['tab']],
  ['Apple watch excludes iPhone', ['Apple'], ['watch-root'], ['watch']],
] as const) test('grounded adapter brand/category: ' + label, async () => {
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ brands, categoryIds }, groundedRecords.map(p => p.id)), 'A', groundedDb());
  assert.deepEqual(dto.products.map((p: any) => p.id), expected);
});
test('Vivobook does not match Vivo using brand equality and token boundaries', async () => {
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ brands: ['Vivo'], modelTokens: ['Vivobook'] }, ['asus', 'vivo']), 'A', groundedDb()); assert.deepEqual(dto.products, []);
});
test('inactive category ancestors and cycles fail closed', async () => {
  for (const parents of [[{ id: 'phone-child', parentId: 'phone-root', isActive: true }, { id: 'phone-root', parentId: null, isActive: false }], [{ id: 'phone-child', parentId: 'phone-root', isActive: true }, { id: 'phone-root', parentId: 'phone-child', isActive: true }]]) {
    const db = groundedDb(); db.category.findMany = async () => parents;
    const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ categoryIds: ['phone-root'] }), 'A', db); assert.deepEqual(dto.products, []);
  }
});
test('attributes and current sale-price are revalidated without trusting raw price', async () => {
  const records = groundedRecords.map(p => ({ ...p, variants: p.variants.map(v => v.id === 'iphone-edge' ? { ...v, salePrice: 2700000, stock: 1 } : v) }));
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ attrTerms: [{ kind: 'capacity', term: '256GB' }, { kind: 'color', term: 'Bạc' }], budget: { max: 3000000, maxInclusive: false }, inStock: true }), 'A', groundedDb(records));
  assert.deepEqual(dto.products[0].variants.map((v: any) => v.id), ['iphone-edge']); assert.equal(dto.products[0].price, 2700000);
});
test('legacy Product Detail keeps complete variants and Quotation is not filtered globally', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'product_detail', response: 'Bạn muốn xem thêm phiên bản nào?', product: { id: 'iphone', variants: [{ id: 'iphone-cheap' }] }, conversation_state: { state_version: 2, active_filters: { price_max: 3000000 } } }, 'A', groundedDb());
  assert.equal(dto.product.variants.length, 3);
});
test('grounded budget survives Backend public DTO -> server payload round-trip', async () => {
  const b = { min: 3000000, max: 5000000, minInclusive: false, maxInclusive: true };
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget: b }), 'A', groundedDb());
  const payload: any = buildCustomerN8nPayload({ message: 'tiếp tục', sessionId: 'A', history: [], conversationState: dto.conversation_state });
  assert.deepEqual(payload.conversationState.active_filters.grounded_budget, b); assert.ok(validatedStateTimestamp(payload.conversationState.updated_at));
  assert.equal(payload.sessionId, 'A'); assert.equal(buildCustomerN8nPayload({ message: 'hello', sessionId: 'B', history: [], conversationState: null }).conversationState, null);
});
test('grounded contract without optional upstream state still emits bounded Backend-owned V2 state', async () => {
  const record: any = groundedRecord({ budget: { max: 3000000, maxInclusive: false } }); delete record.conversation_state;
  const dto: any = await prepareCustomerChatbotResponse(record, 'A', groundedDb()); assert.equal(dto.conversation_state.state_version, 2);
  assert.deepEqual(dto.conversation_state.active_filters.grounded_budget, { max: 3000000, maxInclusive: false });
  assert.equal(dto.conversation_state.last_result_set[0].id, 'iphone'); assert.ok(validatedStateTimestamp(dto.conversation_state.updated_at));
});
test('changed current request constraints replace previous workflow budget safely', async () => {
  const dto: any = await prepareCustomerChatbotResponse(groundedRecord({ budget: { max: 3000000, maxInclusive: false } }), 'A', groundedDb(), { message: 'từ 3 đến 5 triệu' });
  assert.deepEqual(dto.products[0].variants.map((v: any) => v.id), ['iphone-edge', 'iphone-expensive']); assert.equal(dto.conversation_state.active_filters.grounded_budget.min, 3000000);
});
test('valid server prior budget survives follow-up even if workflow drops it; new topic does not inherit globally', async () => {
  const priorState = { state_version: 2, updated_at: new Date().toISOString(), active_filters: { grounded_budget: { max: 3000000, maxInclusive: false } } };
  const follow: any = await prepareCustomerChatbotResponse(groundedRecord(), 'A', groundedDb(), { message: 'máy này', priorState });
  assert.deepEqual(follow.products[0].variants.map((v: any) => v.id), ['iphone-cheap']);
  const topic: any = await prepareCustomerChatbotResponse(groundedRecord(), 'A', groundedDb(), { message: 'xem iPhone 16', priorState }); assert.equal(topic.products[0].variants.length, 3);
  const changed: any = await prepareCustomerChatbotResponse(groundedRecord(), 'A', groundedDb(), { message: 'máy này từ 3 đến 5 triệu', priorState }); assert.equal(changed.products[0].variants.length, 2);
});
test('valid quotation pending state survives sanitization with strict budget and timestamp', () => {
  const state = { state_version: 2, updated_at: new Date().toISOString(), active_filters: { grounded_budget: { max: 3000000, maxInclusive: false } }, selected_product_id: 'iphone', selected_variant_id: 'iphone-cheap', pending_question: { type: 'quotation', field: 'variant', product_id: 'iphone', options: [{ id: 'iphone-cheap' }] } };
  const payload: any = buildCustomerN8nPayload({ message: 'bảo hành thế nào?', sessionId: 'A', history: [], conversationState: state });
  assert.deepEqual(payload.conversationState.active_filters.grounded_budget, state.active_filters.grounded_budget); assert.equal(payload.conversationState.pending_question.product_id, 'iphone'); assert.equal(payload.conversationState.selected_variant_id, 'iphone-cheap');
});
test('expired, malformed and future timestamps cannot refresh shopping/quotation selections', () => {
  for (const updated_at of ['2000-01-01T00:00:00.000Z', 'not-a-date', new Date(Date.now() + 3600000).toISOString()]) {
    const payload: any = buildCustomerN8nPayload({ message: 'tiếp tục', sessionId: 'A', history: [], conversationState: { state_version: 2, updated_at, active_filters: { grounded_budget: { max: 3000000, maxInclusive: false } }, selected_product_id: 'iphone', pending_question: { type: 'quotation', product_id: 'iphone' } } });
    assert.deepEqual(payload.conversationState.active_filters, {}); assert.equal(payload.conversationState.selected_product_id, null); assert.equal(payload.conversationState.pending_question, null);
  }
});
test('malformed state budget fails closed; extra catalog/identity/secret fields never spread', () => {
  const invalid: any = buildCustomerN8nPayload({ message: 'hello', sessionId: 'A', history: [], conversationState: { active_filters: { grounded_budget: { max: '3000000' } } } }); assert.deepEqual(invalid.conversationState.active_filters, {});
  const valid: any = buildCustomerN8nPayload({ message: 'hello', sessionId: 'A', history: [], conversationState: { state_version: 2, updated_at: new Date().toISOString(), active_filters: { grounded_budget: { max: 3000000, maxInclusive: false }, stock: 999, jwt: 'private-fixture' }, verifiedCatalog: [{ id: 'fake', price: 1 }], customerId: 'private', secret: 'private' } });
  assert.ok(!/private|999|fake/.test(JSON.stringify(valid.conversationState)));
});
test('malformed grounding types fail closed instead of silently dropping filters', () => {
  for (const overrides of [{ inStock: 'true' }, { categoryIds: ['../../private'] }, { brands: 'ASUS' }, { attrTerms: [{ kind: 'unknown', term: 'X' }] }]) assert.throws(() => parseGroundedConstraints(groundedRecord(overrides)), GroundedContractError);
});
test('actual message handler loads session-specific server state and ignores client-forged catalog/constraints', async () => {
  const oldUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  process.env.N8N_CHAT_WEBHOOK_URL = 'https://workflow.example.invalid/mock-only';
  const b = { max: 3000000, maxInclusive: false };
  const database: any = { ...groundedDb(), $transaction: async (work: any) => work({
    chatConversation: { upsert: async ({ where }: any) => ({ id: where.sessionId, context: where.sessionId === 'A' ? { state_version: 2, updated_at: new Date().toISOString(), active_filters: { grounded_budget: b } } : null }) },
    chatMessage: { findMany: async () => [], create: async () => ({}) },
  }), chatConversation: { upsert: async () => ({ id: 'mock' }) }, chatMessage: { create: async () => ({}) } };
  const payloads: any[] = [];
  try {
    const router: any = createChatbotRouter({ database, fetcher: (async (_url: any, options: any) => { payloads.push(JSON.parse(options.body)); return Response.json({ result_type: 'text', response: 'Xin chào' }); }) as any });
    const handler = router.stack.find((entry: any) => entry.route?.path === '/message').route.stack[0].handle;
    for (const sessionId of ['A', 'B']) {
      let httpStatus = 200, reply: any;
      const headers: Record<string, string> = {};
      await handler({ body: { message: 'hello', sessionId, conversationState: { active_filters: { grounded_budget: { max: 999999999999 } }, stock: 999, price: 1 }, products: [{ id: 'forged' }] } }, {
        setHeader(name: string, value: string) { headers[name.toLowerCase()] = value; return this; },
        status(value: number) { httpStatus = value; return this; }, json(value: any) { reply = value; return this; },
      });
      assert.equal(httpStatus, 200); assert.equal(reply.result_type, 'text'); assert.equal(reply.sessionId, sessionId);
      assert.equal(headers['cache-control'], 'private, no-store');
    }
    assert.deepEqual(payloads[0].conversationState.active_filters.grounded_budget, b); assert.equal(payloads[1].conversationState, null);
    assert.ok(!/forged|999999999999/.test(JSON.stringify(payloads)));
    let invalidStatus = 200, invalidReply: any;
    await handler({ body: { message: '', sessionId: 'A' } }, { status(value: number) { invalidStatus = value; return this; }, json(value: any) { invalidReply = value; return this; }, setHeader() {} });
    assert.equal(invalidStatus, 400); assert.equal(invalidReply.result_type, 'error'); assert.equal(payloads.length, 2);
  } finally { if (oldUrl === undefined) delete process.env.N8N_CHAT_WEBHOOK_URL; else process.env.N8N_CHAT_WEBHOOK_URL = oldUrl; }
});
test('captured universal candidate -> actual Backend adapter: every active product and variant stays verified (offline DB mocks)', async () => {
  const folder = path.resolve(__dirname, '../scripts/n8n-quotation/universal-grounding');
  const fixture = JSON.parse(readFileSync(path.join(folder, 'catalog.fixture.json'), 'utf8'));
  const candidate = JSON.parse(readFileSync(path.join(folder, 'candidate.workflow.json'), 'utf8'));
  const code = candidate.nodes.find((n: any) => n.name === 'Universal Product Grounding').parameters.jsCode;
  const rows = fixture.products;
  const campaignGroups = new Map<string, any>();
  for (const p of rows) if (p.activeCampaign) {
    const group = campaignGroups.get(p.activeCampaign.id) || { ...p.activeCampaign, appliesTo: 'product', targetIds: [], isActive: true, startDate: new Date(Date.now() - 60000), endDate: new Date(Date.now() + 60000) };
    group.targetIds.push(p.id); campaignGroups.set(p.activeCampaign.id, group);
  }
  const database: any = { product: { findMany: async ({ where }: any) => rows.filter((p: any) => where.id.in.includes(p.id)) },
    campaign: { findMany: async () => [...campaignGroups.values()] }, category: { findMany: async () => fixture.categories } };
  const active = rows.filter((p: any) => p.status === 'active'); assert.equal(active.length, 58);
  for (const p of active) {
    const normalized = { chatInput: p.name, sessionId: 'offline-product-' + p.id, conversationState: null };
    const upstream: any = { 'Normalize Input': normalized, 'Resolve Quotation Turn': { intent: 'product_detail' }, 'API - Universal Products': rows, 'API - Universal Categories': fixture.categories };
    const access = (name: string) => { if (!(name in upstream)) throw new Error('Node not executed'); const values = Array.isArray(upstream[name]) ? upstream[name] : [upstream[name]]; return { first: () => ({ json: values[0] }), all: () => values.map((json: any) => ({ json })) }; };
    const grounded = new Function('$json', '$', code)({}, access)[0].json;
    const raw = new Function('$json', '$', candidate.nodes.find((n: any) => n.name === 'Build Conversation State').parameters.jsCode)(grounded, access).json;
    const dto: any = await prepareCustomerChatbotResponse(raw, normalized.sessionId, database, { message: p.name });
    assert.equal(dto.result_type, 'product_detail', p.name); assert.ok(dto.products.some((item: any) => item.id === p.id), p.name);
    for (const product of dto.products) {
      const rawHints = raw.products.find((item: any) => item.id === product.id), actual = rows.find((item: any) => item.id === product.id);
      assert.ok(rawHints && actual);
      for (const v of product.variants) { assert.ok(rawHints.variants.some((hint: any) => hint.id === v.id)); assert.equal(v.price, actual.variants.find((item: any) => item.id === v.id).effectivePrice); }
    }
    const payload: any = buildCustomerN8nPayload({ message: 'máy này', sessionId: normalized.sessionId, history: [], conversationState: dto.conversation_state });
    assert.ok(validatedStateTimestamp(payload.conversationState.updated_at));
  }
});

test('fetch diagnostics retain DNS/TLS/timeout cause identifiers and redact sensitive messages', () => {
  const error = Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('getaddrinfo ENOTFOUND private-host.invalid'), { code: 'ENOTFOUND' }) });
  assert.deepEqual(safeFetchErrorSummary(error), { name: 'TypeError', message: 'fetch failed',
    cause: { name: 'Error', code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND [details redacted]' } });
  for (const [message, code] of [['self-signed certificate in certificate chain', 'SELF_SIGNED_CERT_IN_CHAIN'],
    ['Connect Timeout Error (attempted address: private-host.invalid)', 'UND_ERR_CONNECT_TIMEOUT'],
    ['connect ECONNREFUSED 127.0.0.1:5678', 'ECONNREFUSED'],
    ['Authorization: Bearer fixture-secret; email=private@example.invalid; body=private-input', 'ERR_NETWORK']]) {
    const summary = safeFetchErrorSummary(Object.assign(new TypeError('fetch failed'), {
      cause: Object.assign(new Error(message), { code }),
    }));
    assert.equal((summary.cause as any).code, code);
    assert.equal((summary.cause as any).name, 'Error');
    assert.equal(typeof (summary.cause as any).message, 'string');
    assert.ok(!/private-|fixture-secret|127\.0\.0\.1|Authorization/.test(JSON.stringify(summary)));
  }
  assert.deepEqual(safeFetchErrorSummary(new TypeError('fetch failed')), { name: 'TypeError', message: 'fetch failed' });
});

test('fetch failure route logs safe cause metadata and keeps 502/504 contracts unchanged', async () => {
  const oldUrl = process.env.N8N_CHAT_WEBHOOK_URL, oldLog = console.error;
  const logs: any[] = [];
  process.env.N8N_CHAT_WEBHOOK_URL = 'https://workflow.example.invalid/diagnostic-test';
  console.error = (...args: any[]) => { logs.push(args); };
  const database: any = { $transaction: async (work: any) => work({
    chatConversation: { upsert: async () => ({ id: 'mock-chat', context: null }) },
    chatMessage: { findMany: async () => [], create: async () => ({}) },
  }) };
  try {
    for (const abort of [false, true]) {
      const error = abort ? Object.assign(new Error('aborted'), { name: 'AbortError' })
        : Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('getaddrinfo ENOTFOUND private-host.invalid'), { code: 'ENOTFOUND' }) });
      const router: any = createChatbotRouter({ database, fetcher: (async () => { throw error; }) as typeof fetch });
      const handler = router.stack.find((entry: any) => entry.route?.path === '/message').route.stack[0].handle;
      let status = 200, body: any;
      const res = { status(value: number) { status = value; return this; }, json(value: any) { body = value; return this; } };
      await handler({ body: { message: 'private-input', sessionId: 'diagnostic-session' } }, res);
      assert.equal(status, abort ? 504 : 502);
      assert.equal(body.response, abort ? 'Chat service timed out. Please try again later.' : 'Failed to communicate with chat service.');
      assert.equal(body.result_type, 'error');
    }
    assert.equal(logs[0][1].cause.code, 'ENOTFOUND');
    assert.equal(logs[0][1].cause.message, 'getaddrinfo ENOTFOUND [details redacted]');
    assert.ok(!/private-|workflow\.example|Bearer/.test(JSON.stringify(logs)));
  } finally {
    console.error = oldLog;
    if (oldUrl === undefined) delete process.env.N8N_CHAT_WEBHOOK_URL; else process.env.N8N_CHAT_WEBHOOK_URL = oldUrl;
  }
});

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

function quoteCode(name: string, input: any, upstream: Record<string, any>) {
  const code = readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation', `${name}.js`), 'utf8');
  const result = new Function('$json', '$', '$input', code)(input, (node: string) => ({
    first: () => ({ json: upstream[node] || {} }), all: () => [{ json: upstream[node] || {} }],
  }), { all: () => [{ json: input }] });
  return (Array.isArray(result) ? result[0] : result).json;
}

test('latency proposal preserves auth, models, catalog endpoints, and a complete graph while keeping AI fallbacks', () => {
  const baseline = JSON.parse(readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation/main-webhook.pre-fast-path.backup.json'), 'utf8'));
  const proposed = JSON.parse(readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation/latency-optimization.candidate.workflow.json'), 'utf8'));
  const nodes = new Map(proposed.nodes.map((n: any) => [n.name, n]));
  assert.equal(proposed.active, false); assert.equal(proposed.nodes.length, baseline.nodes.length + 4);
  assert.equal(nodes.size, proposed.nodes.length);
  for (const node of baseline.nodes) {
    const next: any = nodes.get(node.name);
    assert.ok(next);
    const reviewedChanges = ['Validate Router', 'Resolve Quotation Turn', 'Prepare Quote Filters', 'Build Conversation State', 'Format Product Detail'];
    if (!reviewedChanges.includes(node.name)) assert.deepEqual(next.parameters, node.parameters);
    else assert.equal(next.parameters.jsCode.replace(/\r\n/g, '\n'), readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation', {
      'Validate Router': 'validate-router', 'Resolve Quotation Turn': 'resolve-quotation-turn',
      'Prepare Quote Filters': 'prepare-quote-filters', 'Build Conversation State': 'build-conversation-state',
      'Format Product Detail': 'format-product-detail',
    }[node.name] + '.js'), 'utf8').replace(/\r\n/g, '\n'));
    if (node.type === 'n8n-nodes-base.httpRequest' || node.name === 'Webhook') assert.deepEqual(next, node);
  }
  for (const [name, types] of Object.entries(proposed.connections) as any) {
    assert.ok(nodes.has(name));
    for (const outputs of Object.values(types) as any) for (const edges of outputs) for (const edge of edges) assert.ok(nodes.has(edge.node));
  }
  assert.equal(proposed.connections['IF - Deterministic Intent'].main[1][0].node, 'Gemini - Intent Router');
  assert.equal(proposed.connections['IF - Exact Greeting'].main[1][0].node, 'Gemini - Default Response');
  assert.equal((nodes.get('Gemini - FAQ Response') as any).disabled, true);
  const faq: any = nodes.get('Edit Response FAQ');
  assert.ok(faq.parameters.assignments.assignments.find((a: any) => a.name === 'response').value.includes("$('FAQ - Static Data')"));
});

test('Render cutover changes only catalog URLs and preserves connections, auth and Gemini parameters', () => {
  const read = (name: string) => JSON.parse(readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation', name), 'utf8'));
  const before = read('main-webhook.pre-render-backend.backup.json');
  const after = read('main-webhook.workflow.json');
  assert.deepEqual(after.connections, before.connections);
  const http = after.nodes.filter((node: any) => node.type === 'n8n-nodes-base.httpRequest');
  assert.equal(http.length, 6);
  for (const node of http) {
    const original = before.nodes.find((old: any) => old.name === node.name);
    const { url: oldUrl, ...oldParameters } = original.parameters;
    const { url, ...parameters } = node.parameters;
    assert.deepEqual(parameters, oldParameters);
    assert.ok(url.includes("$('Normalize Input').first().json.backendBaseUrl"));
    assert.ok(!/localhost|host\.docker\.internal/.test(url));
  }
  for (const node of after.nodes.filter((node: any) => /Gemini/.test(node.name) || node.type === 'n8n-nodes-base.webhook')) {
    assert.deepEqual(node.parameters, before.nodes.find((old: any) => old.name === node.name).parameters);
  }
});

test('one server-controlled base URL supports Render and local development without changing request contracts', () => {
  const workflow = JSON.parse(readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation/main-webhook.workflow.json'), 'utf8'));
  const config = workflow.nodes.find((node: any) => node.name === 'Normalize Input').parameters.assignments.assignments
    .find((field: any) => field.name === 'backendBaseUrl');
  assert.equal(config.value, 'https://phone-e-commerce-website.onrender.com');
  assert.equal(config.type, 'string');
  for (const origin of [config.value, 'http://host.docker.internal:3001']) {
    for (const node of workflow.nodes.filter((node: any) => node.type === 'n8n-nodes-base.httpRequest')) {
      const evaluate = new Function('$', `return ${node.parameters.url.slice(3, -2)}`);
      const value = evaluate((name: string) => ({ first: () => ({ json: name === 'Normalize Input'
        ? { backendBaseUrl: origin } : { category: 'phone', filters: { price_max: 123456 } } }) }));
      const url = new URL(value);
      assert.equal(url.origin, origin);
      assert.ok(['/api/products', '/api/products/search', '/api/chatbot/catalog'].includes(url.pathname));
      if (url.pathname.endsWith('/search')) assert.equal(url.searchParams.get('maxPrice'), '123456');
    }
  }
});

test('deterministic routing bypasses AI only for exact greeting and already-supported warranty policy', () => {
  for (const [chatInput, intent] of [['Xin chào!', 'default'], ['hello', 'default'], ['bảo hành sản phẩm này thế nào?', 'faq']]) {
    const routed = quoteCode('deterministic-intent', {}, { 'Normalize Input': { chatInput, sessionId: 'A' } });
    assert.equal(routed.fast_intent, true);
    assert.equal(JSON.parse(routed.content.parts[0].text).intent, intent);
  }
  for (const chatInput of ['xin chào, tư vấn điện thoại giúp tôi', 'so sánh bảo hành hai hãng',
    'tôi muốn báo giá iPhone', 'có bán iphone không', 'hiệu năng máy nào tốt', 'tìm iPhone có bảo hành',
    'iPhone 17 bảo hành bao lâu']) {
    assert.equal(quoteCode('deterministic-intent', {}, { 'Normalize Input': { chatInput } }).fast_intent, false);
  }
});

test('deterministic quotation continuation requires matching live session and product; expired/other sessions defer to AI', () => {
  const pending = { session_id: 'A', expires_at: Date.now() + 60000,
    requests_json: JSON.stringify([{ product_id: 'phone', quantity: 3 }]) };
  for (const chatInput of ['256GB màu Bạc', 'mẫu số 2', 'tôi muốn tiếp tục báo giá']) {
    const normalized = { chatInput, sessionId: 'A', conversationState: { state_version: 2, selected_product_id: 'phone' } };
    const routed = quoteCode('deterministic-intent', {}, { 'Normalize Input': normalized, 'Pending Quote - Lookup': pending });
    assert.equal(routed.fast_intent, true);
    assert.equal(JSON.parse(routed.content.parts[0].text).intent, 'quotation');
    for (const invalid of [{ ...pending, session_id: 'B' }, { ...pending, expires_at: 1 },
      { ...pending, requests_json: JSON.stringify([{ product_id: 'other' }]) }]) {
      assert.equal(quoteCode('deterministic-intent', {}, { 'Normalize Input': normalized, 'Pending Quote - Lookup': invalid }).fast_intent, false);
    }
    for (const state of [{ selected_product_id: 'phone' }, { state_version: 1, selected_product_id: 'phone' },
      { state_version: 2, selected_product_id: 'phone', selected_variant_id: 'wrong' },
      { state_version: 2, selected_product_id: 'phone', pending_question: { product_id: 'other' } }]) {
      assert.equal(quoteCode('deterministic-intent', {}, { 'Normalize Input': { ...normalized, conversationState: state }, 'Pending Quote - Lookup': pending }).fast_intent, false);
    }
  }
});

test('deterministic FAQ still goes through the existing state builder without losing pending quotation', () => {
  const fixture = JSON.parse(readFileSync(path.resolve(process.cwd(), 'tests/fixtures/n8n-execution-1102.json'), 'utf8'));
  const upstream = { 'Normalize Input': fixture.normalizedInput, 'Pending Quote - Lookup': {
    session_id: fixture.normalizedInput.sessionId, expires_at: Date.now() + 60000, requests_json: JSON.stringify(fixture.pendingRequests) } };
  const fast = quoteCode('deterministic-intent', {}, upstream);
  const validated = quoteCode('validate-router', fast, upstream);
  const resolved = quoteCode('resolve-quotation-turn', validated, upstream);
  const output = quoteCode('build-conversation-state', { result_type: 'faq' }, { ...upstream, 'Resolve Quotation Turn': resolved });
  assert.equal(output.conversation_state.selected_product_id, fixture.normalizedInput.conversationState.selected_product_id);
  assert.equal(output.conversation_state.selected_variant_id, fixture.normalizedInput.conversationState.selected_variant_id);
  assert.deepEqual(output.conversation_state.last_result_set, fixture.normalizedInput.conversationState.last_result_set);
});

test('explicit product detail is not hijacked by substring color matching in pending quote', () => {
  const fixture = JSON.parse(readFileSync(path.resolve(process.cwd(), 'tests/fixtures/n8n-execution-1102.json'), 'utf8'));
  for (const model of ['Apple Watch Ultra 3', 'iPhone 16']) {
    const normalized = { ...fixture.normalizedInput, chatInput: `cho tôi xem thông tin ${model}` };
    const router = quoteCode('validate-router', { content: { parts: [{ text: JSON.stringify({ intent: 'product_detail', model, brand: 'Apple', turn_action: 'NEW_TOPIC', context_mode: 'replace' }) }] } }, {
      'Normalize Input': normalized, 'Pending Quote - Lookup': { session_id: normalized.sessionId,
        expires_at: Date.now() + 60000, requests_json: JSON.stringify(fixture.pendingRequests) },
    });
    assert.equal(router.intent, 'product_detail');
    assert.equal(router.is_followup, false);
    const resolved = quoteCode('resolve-quotation-turn', router, { 'Normalize Input': normalized });
    assert.equal(resolved.intent, 'product_detail');
  }
});

test('1157: explicit detail selects the current exact model while quotation retains its own variant and quantity', () => {
  const state = { state_version: 2, selected_product_id: 'old', selected_variant_id: 'old-v',
    last_intent: 'quotation', pending_question: { type: 'quotation', field: 'ready', product_id: 'old',
      product_name: 'iPhone 17 Pro Max', quantity: 3, options: [{ id: 'old-v' }] } };
  const pending = { session_id: 'A', expires_at: Date.now() + 60000,
    requests_json: JSON.stringify([{ product_id: 'old', model: 'iPhone 17 Pro Max', quantity: 3, available_variants: [{ id: 'old-v' }] }]) };
  const normalized = { sessionId: 'A', chatInput: 'cho tôi xem thông tin iPhone 16', conversationState: state };
  const upstream = { 'Normalize Input': normalized, 'Pending Quote - Lookup': pending };
  const validated = quoteCode('validate-router', { content: { parts: [{ text: JSON.stringify({ intent: 'product_detail', model: 'iPhone 16', brand: 'Apple' }) }] } }, upstream);
  assert.equal(validated.explicit_product_model, true);
  assert.equal(validated.selected_product_id, null);
  assert.equal(validated.requires_clarification, false);
  const routed = quoteCode('resolve-quotation-turn', validated, upstream);
  assert.equal(routed.intent, 'product_detail');
  const detail = { result_type: 'product_detail', product: { id: 'new', name: 'iPhone 16' } };
  const next = quoteCode('build-conversation-state', detail, { ...upstream,
    'Resolve Quotation Turn': routed, 'Format Product Detail': detail }).conversation_state;
  assert.equal(next.selected_product_id, 'new');
  assert.equal(next.selected_variant_id, null);
  assert.deepEqual(next.pending_question, state.pending_question);
  const resumeInput = { ...normalized, chatInput: 'tiếp tục báo giá trước đó', conversationState: next };
  const resumeUpstream = { ...upstream, 'Normalize Input': resumeInput };
  assert.equal(quoteCode('deterministic-intent', {}, resumeUpstream).fast_intent, true);
  const resume = quoteCode('resolve-quotation-turn', { pending_quote_exists: true }, resumeUpstream);
  const prepared = quoteCode('prepare-quote-filters', resume, resumeUpstream);
  assert.equal(prepared.requests[0].product_id, 'old');
  assert.equal(prepared.requests[0].variant_id, 'old-v');
  assert.equal(prepared.requests[0].quantity, 3);
  for (const chatInput of ['tôi muốn báo giá iPhone 16', 'tôi muốn báo giá iPhone 16 256GB màu Bạc']) {
    const up = { ...upstream, 'Normalize Input': { ...normalized, chatInput } };
    const v = quoteCode('validate-router', { content: { parts: [{ text: JSON.stringify({ intent: 'quotation', model: 'iPhone 16', brand: 'Apple' }) }] } }, up);
    const r = quoteCode('resolve-quotation-turn', v, up);
    const p = quoteCode('prepare-quote-filters', r, up);
    assert.equal(p.requests[0].model, 'iPhone 16');
    assert.equal(p.requests[0].product_id, undefined);
    assert.equal(p.requests[0].variant_id, undefined);
  }
});

test('detail model resolution rejects sibling suffixes and ambiguous products instead of first-result fallback', () => {
  const products = ['iPhone 16', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 16e'].map((name, index) => ({
    id: String(index), name, brand: 'Apple', status: 'active', variants: [{ id: 'v' + index, price: 100, stock: 1, attributes: {} }] }));
  const run = (model: string, catalog: any[]) => {
    const code = readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation/format-product-detail.js'), 'utf8');
    return new Function('$json', '$', '$input', code)({}, (node: string) => ({ first: () => ({ json: {
      model, brand: 'Apple', explicit_product_model: true, selected_product_id: 'stale', conversationState: {},
    } }) }), { all: () => catalog.map(json => ({ json })) })[0].json;
  };
  for (let index = 0; index < products.length; index++) assert.equal(run(products[index].name, products).product.id, String(index));
  assert.equal(run('iPhone 16', products.slice(1)).result_type, 'no_result');
  assert.equal(run('iPhone', products).result_type, 'no_result');
  assert.equal(run('iPhone 99', products).result_type, 'no_result');
  assert.equal(run('iPhone 16', [products[0], { ...products[0], id: 'duplicate' }]).result_type, 'no_result');
});

test('execution 1102 regression: pending quote must not override Gemini warranty FAQ classification', () => {
  const fixture = JSON.parse(readFileSync(path.resolve(process.cwd(), 'tests/fixtures/n8n-execution-1102.json'), 'utf8'));
  const upstream = { 'Normalize Input': fixture.normalizedInput,
    'Pending Quote - Lookup': { session_id: fixture.normalizedInput.sessionId, expires_at: Date.now() + 60000,
      requests_json: JSON.stringify(fixture.pendingRequests) } };
  const input = { content: { parts: [{ text: JSON.stringify(fixture.classification) }] } };
  const router = quoteCode('validate-router', input, upstream);
  assert.equal(router.intent, 'faq');
  assert.deepEqual(router.faq_topics, ['warranty']);
  const resolved = quoteCode('resolve-quotation-turn', router, upstream);
  const output = quoteCode('build-conversation-state', { result_type: 'faq', response: 'Source-grounded policy fixture' },
    { ...upstream, 'Resolve Quotation Turn': resolved });
  assert.equal(output.conversation_state.selected_product_id, fixture.normalizedInput.conversationState.selected_product_id);
  assert.equal(output.conversation_state.selected_variant_id, fixture.normalizedInput.conversationState.selected_variant_id);
  assert.deepEqual(output.conversation_state.last_result_set, fixture.normalizedInput.conversationState.last_result_set);
});

test('detail lookup uses canonical selected ID, never the first brand product, and honors explicit new model', () => {
  const products = ['watch', 'phone'].map(id => ({ id, name: id === 'watch' ? 'Apple Watch Ultra 3' : 'iPhone 17 Pro Max',
    brand: 'Apple', status: 'active', category: { isActive: true }, variants: [{ id: `${id}-v`, price: 1000000, stock: 1, attributes: {} }] }));
  function lookup(source: any) {
    const code = readFileSync(path.resolve(process.cwd(), 'scripts/n8n-quotation/format-product-detail.js'), 'utf8');
    return new Function('$json', '$', '$input', code)({}, () => ({ first: () => ({ json: source }) }),
      { all: () => products.map(json => ({ json })) })[0].json;
  }
  const conversationState = { selected_product_id: 'phone', active_filters: { brand: 'Apple' } };
  assert.equal(lookup({ conversationState }).product.id, 'phone');
  assert.equal(lookup({ brand: 'Apple' }).result_type, 'no_result');
  assert.equal(lookup({ conversationState: { ...conversationState, selected_product_id: 'missing' } }).result_type, 'no_result');
  assert.equal(lookup({ model: 'Apple Watch Ultra 3', conversationState }).product.id, 'watch');
});

test('ready and waiting quote context survives FAQ with quantity; resume requires a live pending cache', () => {
  const ready = quoteCode('build-conversation-state', { result_type: 'quotation', ready_to_quote: true,
    products: [{ id: 'phone', name: 'iPhone', variant_id: 'silver', quantity: 3 }] },
    { 'Normalize Input': {}, 'Resolve Quotation Turn': { intent: 'quotation' } }).conversation_state;
  assert.equal(ready.pending_question.quantity, 3);
  for (const state of [ready, { ...ready, pending_question: { ...ready.pending_question, field: 'variant' } }]) {
    const after = quoteCode('build-conversation-state', { result_type: 'faq' }, { 'Normalize Input': { conversationState: state },
      'Resolve Quotation Turn': { intent: 'faq', context_mode: 'reset' } }).conversation_state;
    assert.equal(after.selected_product_id, 'phone'); assert.equal(after.selected_variant_id, 'silver');
    assert.deepEqual(after.pending_question, state.pending_question);
  }
  const normalized = { sessionId: 'A', chatInput: 'tôi muốn tiếp tục báo giá', conversationState: ready };
  const pending = { session_id: 'A', expires_at: Date.now() + 60000,
    requests_json: JSON.stringify([{ product_id: 'phone', model: 'iPhone', quantity: 1, available_variants: [{ id: 'silver' }] }]) };
  const routed = quoteCode('resolve-quotation-turn', { pending_quote_exists: true }, { 'Normalize Input': normalized });
  assert.equal(routed.is_followup, true);
  const prepared = quoteCode('prepare-quote-filters', routed, { 'Normalize Input': normalized, 'Pending Quote - Lookup': pending });
  assert.equal(prepared.requests[0].variant_id, 'silver'); assert.equal(prepared.requests[0].quantity, 3);
  const expired = quoteCode('prepare-quote-filters', { pending_quote_exists: false }, { 'Normalize Input': normalized });
  assert.deepEqual(expired.requests, []);
});

const quoteCatalog = [{ ...responseCatalog[4], variants: [
  { id: 'silver-256', sku: 'REAL-SILVER', attributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Bạc' }, price: 600000, salePrice: null, stock: 3 },
  { id: 'navy-512', sku: 'REAL-NAVY', attributes: { 'Dung lượng': '512GB', 'Màu sắc': 'Xanh Navy' }, price: 900000, salePrice: null, stock: 5 },
  { id: 'sold-out', sku: 'REAL-SOLD', attributes: { 'Dung lượng': '256GB', 'Màu sắc': 'Đen' }, price: 600000, salePrice: null, stock: 0 },
] }];

test('HTTP webhook normalizer preserves session/state aliases and excludes authentication headers', () => {
  const state = { state_version: 2, pending_question: { type: 'quotation', field: 'variant' } };
  const normalized = quoteCode('normalize-http-chat-input', { body: {
    chatInput: '  chọn bản 256GB  ', sessionId: 'http-session', conversation_state: state,
    history: [{ role: 'user', content: 'báo giá' }], source: 'web_chat',
  }, headers: { 'X-WebPhone-Chatbot-Key': 'test-only-secret' } }, {});
  assert.equal(normalized.valid, true);
  assert.equal(normalized.chatInput, 'chọn bản 256GB');
  assert.equal(normalized.sessionId, 'http-session');
  assert.deepEqual(normalized.conversationState, state);
  assert.ok(!JSON.stringify(normalized).includes('test-only-secret'));
  assert.deepEqual(quoteCode('normalize-http-chat-input', { body: { chatInput: 'hello', sessionId: 's', conversationState: state } }, {}).conversationState, state);
});

test('HTTP webhook normalizer rejects missing or invalid message/session/state before workflow side effects', () => {
  for (const body of [null, [], {}, { chatInput: 'hello' }, { chatInput: ' ', sessionId: 's' },
    { chatInput: 'hello', sessionId: 's', conversation_state: [] }]) {
    const normalized = quoteCode('normalize-http-chat-input', { body }, {});
    assert.equal(normalized.valid, false);
    assert.equal(normalized.result_type, 'error');
    assert.equal(normalized.success, false);
  }
});

test('quotation draft preserves variant-selection status and Backend price while excluding sold-out options', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'quotation', quote_status: 'needs_variant_selection', success: false,
    request_results: [{ status: 'needs_variant_selection', product: { id: 'phone-5' }, requested: { quantity: 1 },
      available_variants: [{ id: 'navy-512', price: 1 }, { id: 'silver-256', price: 1 }, { id: 'sold-out' }] }] }, 'quote-A', responseDatabase(quoteCatalog as any));
  assert.equal(dto.result_type, 'quotation'); assert.equal(dto.quote_status, 'needs_variant_selection'); assert.equal(dto.ready_to_quote, false);
  assert.equal(dto.success, false); assert.ok(dto.response.includes('iPhone 17'));
  assert.deepEqual(dto.request_results[0].available_variants.map((v: any) => v.id), ['navy-512', 'silver-256']);
  assert.equal(dto.request_results[0].available_variants[0].price, 900000); assert.ok(!dto.response.includes('1 đ'));
  assert.equal(dto.conversation_state.pending_question.product_id, 'phone-5');
  assert.deepEqual(dto.conversation_state.pending_question.options.map((v: any) => v.id), ['navy-512', 'silver-256']);
  assert.equal('download_url' in dto, false);
});

test('ready draft is a selection only; stale variant, insufficient stock and invalid quantities cannot be ready', async () => {
  for (const [variant, quantity, expected] of [['silver-256', 1, 'ready'], ['sold-out', 1, 'insufficient_stock'],
    ['invented', 1, 'insufficient_stock'], ['silver-256', 4, 'insufficient_stock'], ['silver-256', 0, 'invalid_request']]) {
    const dto: any = await prepareCustomerChatbotResponse({ result_type: 'quotation', quote_status: 'ready', request_results: [
      { status: 'ready', resolved_product: { id: 'phone-5', variant_id: variant, quantity } },
    ] }, 'quote-A', responseDatabase(quoteCatalog as any));
    assert.equal(dto.quote_status, expected); assert.equal(dto.ready_to_quote, expected === 'ready');
    assert.equal('quote_number' in dto, false); assert.equal('download_url' in dto, false); assert.equal('totalAmount' in dto, false);
    if (expected === 'ready') assert.equal(dto.products[0].selected_variant_id, variant);
  }
});

test('new quotation request never uses stale last_result_set and catalog failures return genuine errors', async () => {
  const input = { result_type: 'quotation', quote_status: 'not_found', request_results: [{ status: 'not_found' }],
    conversation_state: { last_result_set: [{ id: 'phone-5' }] } };
  const noResult: any = await prepareCustomerChatbotResponse(input, 'quote-B', responseDatabase());
  assert.equal(noResult.quote_status, 'not_found'); assert.deepEqual(noResult.products, []);
  const failed: any = await prepareCustomerChatbotResponse({ ...input, request_results: [{ product: { id: 'phone-5' } }] }, 'quote-B',
    { product: { findMany: async () => { throw new Error('mock unavailable'); } }, campaign: { findMany: async () => [] } } as any);
  assert.equal(failed.result_type, 'error'); assert.equal(failed.ready_to_quote, false);
});

test('an out-of-stock requested configuration stays unavailable even when other configurations are in stock', async () => {
  const dto: any = await prepareCustomerChatbotResponse({ result_type: 'quotation', quote_status: 'insufficient_stock',
    request_results: [{ status: 'insufficient_stock', product: { id: 'phone-5' }, requested: { quantity: 1 } }] }, 'quote-A', responseDatabase(quoteCatalog as any));
  assert.equal(dto.quote_status, 'insufficient_stock'); assert.equal(dto.ready_to_quote, false);
  assert.ok(dto.products[0].variants.some((v: any) => v.stock > 0));
});

test('n8n quote nodes resolve storage/color and ordered variant selection without computing prices or PDF', async () => {
  const catalog = await resolveChatbotCatalogProducts(responseDatabase(quoteCatalog as any), ['phone-5']);
  const pending = { session_id: 'session-A', expires_at: Date.now() + 60000,
    requests_json: JSON.stringify([{ request_index: 1, product_id: 'phone-5', model: 'iPhone 17', quantity: 1,
      available_variants: [{ id: 'navy-512' }, { id: 'silver-256' }] }]) };
  for (const [message, variant] of [['256GB màu Bạc', 'silver-256'], ['512GB màu Xanh Navy', 'navy-512'], ['mẫu số 2', 'silver-256']]) {
    const upstream = { 'Normalize Input': { sessionId: 'session-A', chatInput: message }, 'Pending Quote - Lookup': pending };
    const prepared = quoteCode('prepare-quote-filters', { is_followup: true }, upstream);
    const formatted = quoteCode('format-quote-data', { products: catalog }, { 'Prepare Quote Filters': prepared });
    assert.equal(formatted.ready_to_quote, true, message); assert.equal(formatted.products[0].variant_id, variant);
    const draft = quoteCode('build-quotation-draft-response', formatted, {});
    assert.equal(draft.quote_status, 'ready'); assert.equal(draft.products[0].variant_id, variant);
    assert.equal('download_url' in draft, false); assert.equal('subtotal' in draft, false); assert.equal('unit_price' in draft.products[0], false);
  }
  const otherSession = quoteCode('prepare-quote-filters', { is_followup: true }, {
    'Normalize Input': { sessionId: 'session-B', chatInput: '256GB màu Bạc' }, 'Pending Quote - Lookup': pending,
  });
  assert.deepEqual(otherSession.requests, []);
});

test('n8n draft pending state is retained; generic quote asks for product and explicit product reply stays quotation', () => {
  const generic = quoteCode('build-conversation-state', { result_type: 'quotation', quote_status: 'invalid_request', products: [] }, {
    'Normalize Input': {}, 'Resolve Quotation Turn': { intent: 'quotation' },
  });
  assert.equal(generic.conversation_state.pending_question.field, 'product');
  const reply = quoteCode('resolve-quotation-turn', { intent: 'product_search', model: 'iPhone 17' }, {
    'Normalize Input': { chatInput: 'iphone 17', conversationState: generic.conversation_state },
  });
  assert.equal(reply.intent, 'quotation');
  const waiting = quoteCode('build-conversation-state', { result_type: 'quotation', quote_status: 'needs_variant_selection',
    products: [{ id: 'phone-5' }], request_results: [{ product: { id: 'phone-5', name: 'iPhone 17' }, available_variants: [{ id: 'silver-256' }] }] },
    { 'Normalize Input': {}, 'Resolve Quotation Turn': { intent: 'quotation' } });
  assert.equal(waiting.conversation_state.pending_question.product_id, 'phone-5');
});
