// Opt-in real HTTP tests. No official Quotation/Order/PDF is created.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const url = process.env.WEBPHONE_WEBHOOK_TEST_URL;
const target = new URL(url);
assert.ok(target.protocol === 'https:' || (target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)));
const headers = chatbotWebhookHeaders(env, true);
const sessionId = `model-priority-live-${randomUUID()}`;
let state = null, selected = null;
async function turn(label, chatInput, check) {
  const started = performance.now();
  try {
    const response = await fetch(url, { method: 'POST', headers,
      body: JSON.stringify({ chatInput, sessionId, source: 'web_chat', history: [], conversationState: state }),
      signal: AbortSignal.timeout(85000) });
    const raw = await response.text();
    let body;
    try { body = JSON.parse(raw); } catch { throw Object.assign(new Error('Non-JSON response'), { status: response.status }); }
    assert.equal(response.status, 200);
    assert.equal(body.sessionId, sessionId);
    assert.equal(body.conversation_state?.state_version, 2);
    assert.ok(!body.download_url && !body.quote_number);
    check(body);
    state = body.conversation_state;
    console.log(JSON.stringify({ label, pass: true, status: response.status, ms: Math.round(performance.now() - started),
      type: body.result_type, quoteStatus: body.quote_status, product: body.product?.id || state.selected_product_id,
      variant: state.selected_variant_id, pendingProduct: state.pending_question?.product_id, sessionId }));
    return true;
  } catch (error) {
    process.exitCode = 1;
    console.log(JSON.stringify({ label, pass: false, status: error.status, error: error.name,
      actual: error instanceof assert.AssertionError ? error.actual : undefined,
      expected: error instanceof assert.AssertionError ? error.expected : undefined,
      ms: Math.round(performance.now() - started), sessionId }));
    return false;
  }
}
(async () => {
  for (const [label, auth] of [['missing_auth', { 'Content-Type': 'application/json' }],
    ['invalid_auth', { ...headers, [env.N8N_CHAT_AUTH_HEADER]: 'invalid-regression-key' }]]) {
    const r = await fetch(url, { method: 'POST', headers: auth, body: '{}', signal: AbortSignal.timeout(15000) });
    console.log(JSON.stringify({ label, pass: r.status === 403, status: r.status }));
  }
  await turn('greeting', 'xin chào', b => assert.equal(b.result_type, 'text'));
  await turn('general FAQ', 'cửa hàng có chính sách bảo hành như thế nào?', b => {
    assert.equal(b.result_type, 'faq'); assert.equal(b.faq_topic, 'warranty');
    assert.ok(!/Apple Watch/i.test(b.response));
  });
  const quote = await turn('new quotation pending', 'tôi muốn báo giá iPhone 17 Pro Max', b => assert.equal(b.quote_status, 'needs_variant_selection'));
  if (!quote) return;
  const ready = await turn('variant ready', '256GB màu Bạc', b => {
    assert.equal(b.quote_status, 'ready');
    selected = { product: b.conversation_state.selected_product_id, variant: b.conversation_state.selected_variant_id,
      quantity: b.conversation_state.pending_question.quantity };
    assert.ok(selected.product && selected.variant);
  });
  if (!ready) return;
  await turn('FAQ 1102 while ready', 'cửa hàng có chính sách bảo hành như thế nào?', b => {
    assert.equal(b.result_type, 'faq'); assert.ok(!/Apple Watch/i.test(b.response));
    assert.equal(b.conversation_state.pending_question.product_id, selected.product);
  });
  await turn('quotation continuation', 'tiếp tục báo giá trước đó', b => {
    assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
    assert.equal(b.conversation_state.selected_variant_id, selected.variant);
  });
  const detail = await turn('1157 explicit iPhone 16 detail', 'cho tôi xem thông tin iPhone 16', b => {
    assert.equal(b.result_type, 'product_detail'); assert.equal(b.product.name, 'iPhone 16');
    assert.equal(b.conversation_state.pending_question.product_id, selected.product);
    assert.equal(b.conversation_state.pending_question.quantity, selected.quantity);
  });
  if (!detail) return;
  await turn('resume old quote after new detail', 'tiếp tục báo giá trước đó', b => {
    assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
    assert.equal(b.conversation_state.selected_variant_id, selected.variant);
  });
  await turn('explicit new quote iPhone 16', 'tôi muốn báo giá iPhone 16', b => {
    assert.equal(b.quote_status, 'needs_variant_selection'); assert.equal(b.conversation_state.pending_question.product_name, 'iPhone 16');
    assert.notEqual(b.conversation_state.pending_question.product_id, selected.product);
    assert.equal(b.conversation_state.selected_variant_id, null);
  });
})().catch(e => { console.log(JSON.stringify({ error: e.name })); process.exitCode = 1; });
