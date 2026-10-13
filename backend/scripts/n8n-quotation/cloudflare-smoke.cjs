const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const headers = chatbotWebhookHeaders(env, true);
const webhook = process.env.WEBPHONE_WEBHOOK_TEST_URL;
if (!webhook || new URL(webhook).protocol !== 'https:') throw Error('An HTTPS test endpoint is required');
const sessionId = process.env.WEBPHONE_TEST_SESSION_ID || `cloudflare-check-${crypto.randomUUID()}`;
let state = process.env.WEBPHONE_TEST_STATE ? JSON.parse(process.env.WEBPHONE_TEST_STATE) : null;
const remaining = process.argv.includes('--remaining');
let passed = 0;

async function call(chatInput, auth, requestSession = sessionId, requestState = state) {
  const response = await fetch(webhook, { method: 'POST', headers: auth,
    body: JSON.stringify({ chatInput, sessionId: requestSession, source: 'web_chat', conversationState: requestState, history: [] }),
    signal: AbortSignal.timeout(85000) });
  let body;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
}

(async () => {
  for (const [label, auth] of [['missing_auth', { 'Content-Type': 'application/json' }],
    ['invalid_auth', { ...headers, [env.N8N_CHAT_AUTH_HEADER]: 'intentionally-invalid-test' }]].slice(remaining ? 2 : 0)) {
    const response = await call('xin chào', auth);
    console.log(JSON.stringify({ label, status: response.status }));
    assert.equal(response.status, 403, label); passed++;
  }
  for (const [message, expected] of [['xin chào', 'text'], ['có bán iphone không', 'product_search'],
    ['cho tôi xem mẫu thứ 5', null], ['bản 256GB có màu gì?', null],
    ['tôi muốn báo giá iPhone 17 Pro Max', 'needs_variant_selection'], ['256GB màu Bạc', 'ready'],
    ['cửa hàng có chính sách bảo hành như thế nào?', 'faq'], ['tôi muốn báo giá nonexistent xyz999', 'not_found']].slice(remaining ? 7 : 0)) {
    const { status, body } = await call(message, headers);
    console.log(JSON.stringify({ message, status, type: body?.result_type, quoteStatus: body?.quote_status,
      ready: body?.ready_to_quote, stateV2: body?.conversation_state?.state_version === 2,
      sessionMatches: body?.sessionId === sessionId, products: body?.products?.length }));
    assert.equal(status, 200, message);
    if (expected) assert.equal(body.quote_status || body.result_type, expected, message);
    assert.equal(body.sessionId, sessionId);
    assert.equal(body.conversation_state.state_version, 2);
    assert.ok(body.response && !body.download_url && !body.quote_number && body.response_type !== 'file');
    assert.ok(!body.response.includes('Chatbot không phát hành báo giá hoặc PDF'));
    const ids = [...new Set((body.products || []).map(product => product.id || product.product_id).filter(Boolean))];
    if (ids.length) {
      const response = await fetch('http://localhost:3001/api/chatbot/catalog', { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productIds: ids }), signal: AbortSignal.timeout(15000) });
      assert.equal(response.status, 200);
      const catalog = (await response.json()).products;
      for (const id of ids) assert.ok(catalog.some(product => product.id === id), 'Real Backend product ID');
      for (const result of body.request_results || []) {
        const id = result.product?.id || result.resolved_product?.product_id || result.resolved_product?.id;
        const product = catalog.find(item => item.id === id);
        for (const variant of result.available_variants || []) {
          const actual = product?.variants.find(item => item.id === (variant.variant_id || variant.id));
          assert.ok(actual, 'Real Backend variant ID');
          assert.equal(variant.price, actual.price, 'Backend unit price');
          assert.equal(variant.stock, actual.stock, 'Backend stock');
        }
        if (result.resolved_product?.variant_id) {
          const actual = product?.variants.find(item => item.id === result.resolved_product.variant_id);
          assert.ok(actual && actual.stock >= result.resolved_product.quantity, 'Selected variant has stock');
        }
      }
      console.log(JSON.stringify({ catalogVerified: true, productCount: ids.length }));
    }
    state = body.conversation_state;
    passed++;
  }
  const isolated = await call('256GB màu Bạc', headers, `${sessionId}-isolated`, null);
  assert.equal(isolated.status, 200);
  assert.equal(isolated.body.sessionId, `${sessionId}-isolated`);
  assert.notEqual(isolated.body.quote_status, 'ready');
  assert.equal(isolated.body.conversation_state.state_version, 2);
  console.log(JSON.stringify({ message: 'session isolation', status: isolated.status, ready: isolated.body.ready_to_quote || false }));
  passed++;
  console.log(JSON.stringify({ result: 'PASS', passed, sessionId, officialQuotationCreated: false }));
})().catch(error => {
  console.error(JSON.stringify({ result: 'FAIL', passed, error: error.name,
    actual: error instanceof assert.AssertionError ? error.actual : undefined,
    expected: error instanceof assert.AssertionError ? error.expected : undefined }));
  process.exitCode = 1;
});
