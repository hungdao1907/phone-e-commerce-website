// Opt-in sequential live retest; stops at the first failed turn, no client retry.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const url = process.env.WEBPHONE_WEBHOOK_TEST_URL;
const target = new URL(url);
assert.ok(target.protocol === 'https:' || target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname));
const headers = chatbotWebhookHeaders(env, true);
const sessionId = `final-gemini-${randomUUID()}`;
let state = null, selected;
async function turn(label, chatInput, check, isolated = false) {
  const startedAt = new Date().toISOString(), start = performance.now();
  let status, nonJson = false, responseBytes;
  try {
    const r = await fetch(url, { method: 'POST', headers, signal: AbortSignal.timeout(85000),
      body: JSON.stringify({ chatInput, sessionId: isolated ? sessionId + '-B' : sessionId,
        conversationState: isolated ? null : state, history: [], source: 'web_chat' }) });
    status = r.status;
    const raw = await r.text(); responseBytes = Buffer.byteLength(raw);
    let b; try { b = JSON.parse(raw); } catch { nonJson = true; throw Error('Non-JSON'); }
    assert.equal(status, 200);
    assert.equal(b.sessionId, isolated ? sessionId + '-B' : sessionId);
    assert.equal(b.conversation_state?.state_version, 2);
    assert.ok(typeof b.response === 'string' && b.response.length > 0);
    assert.ok(!b.download_url && !b.quote_number);
    check(b);
    if (!isolated) state = b.conversation_state;
    console.log(JSON.stringify({ label, pass: true, status, ms: Math.round(performance.now() - start), startedAt,
      sessionId: b.sessionId, result_type: b.result_type, quote_status: b.quote_status,
      product: b.product?.name, productId: b.product?.id || state?.selected_product_id,
      variantId: state?.selected_variant_id, pendingProduct: state?.pending_question?.product_id,
      response: b.response.slice(0, 180) }));
    return true;
  } catch (e) {
    process.exitCode = 1;
    console.log(JSON.stringify({ label, pass: false, status, nonJson, responseBytes,
      ms: Math.round(performance.now() - start), startedAt, sessionId, error: e.name,
      actual: e instanceof assert.AssertionError ? e.actual : undefined,
      expected: e instanceof assert.AssertionError ? e.expected : undefined }));
    return false;
  }
}
(async () => {
  for (const [label, auth] of [['missing_auth', { 'Content-Type': 'application/json' }],
    ['invalid_auth', { ...headers, [env.N8N_CHAT_AUTH_HEADER]: 'invalid-retest-key' }]]) {
    const r = await fetch(url, { method: 'POST', headers: auth, body: '{}', signal: AbortSignal.timeout(15000) });
    assert.equal(r.status, 403); console.log(JSON.stringify({ label, status: r.status, pass: true }));
  }
  if (!await turn('greeting', 'xin chào', b => assert.equal(b.result_type, 'text'))) return;
  if (process.argv.includes('--fast-only')) {
    await turn('general FAQ', 'cửa hàng có chính sách bảo hành như thế nào?', b => assert.equal(b.result_type, 'faq'));
    return;
  }
  const cases = [
    ['search iPhone', 'có bán iPhone không?', b => { assert.equal(b.result_type, 'product_search'); assert.ok(b.products?.length); }],
    ['detail iPhone16', 'cho tôi xem thông tin iPhone 16', b => { assert.equal(b.result_type, 'product_detail'); assert.equal(b.product.name, 'iPhone 16'); }],
    ['detail iPhone17ProMax', 'cho tôi xem thông tin iPhone 17 Pro Max', b => { assert.equal(b.result_type, 'product_detail'); assert.match(b.product.name, /^iPhone 17 Pro Max$/i); }],
    ['new quote', 'tôi muốn báo giá iPhone 17 Pro Max', b => assert.equal(b.quote_status, 'needs_variant_selection')],
    ['variant', '256GB màu Bạc', b => { assert.equal(b.quote_status, 'ready'); selected = {
      product: b.conversation_state.selected_product_id, variant: b.conversation_state.selected_variant_id,
      quantity: b.conversation_state.pending_question.quantity }; assert.ok(selected.product && selected.variant); }],
    ['FAQ1102 after quotation', 'cửa hàng có chính sách bảo hành như thế nào?', b => {
      assert.equal(b.result_type, 'faq'); assert.ok(!/Apple Watch/i.test(b.response));
      assert.equal(b.conversation_state.pending_question.product_id, selected.product);
      assert.equal(b.conversation_state.selected_variant_id, selected.variant);
    }],
    ['continue quotation', 'tiếp tục báo giá trước đó', b => {
      assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
      assert.equal(b.conversation_state.selected_variant_id, selected.variant);
    }],
    ['1157 explicit detail over pending', 'cho tôi xem thông tin iPhone 16', b => {
      assert.equal(b.result_type, 'product_detail'); assert.equal(b.product.name, 'iPhone 16');
      assert.equal(b.conversation_state.pending_question.product_id, selected.product);
      assert.equal(b.conversation_state.pending_question.quantity, selected.quantity);
    }],
    ['resume old quote after detail', 'tiếp tục báo giá trước đó', b => {
      assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
      assert.equal(b.conversation_state.selected_variant_id, selected.variant);
    }],
  ];
  for (const [label, input, check] of cases) if (!await turn(label, input, check)) return;
  await turn('session isolation', '256GB màu Bạc', b => assert.notEqual(b.quote_status, 'ready'), true);
})().catch(e => { console.log(JSON.stringify({ error: e.name })); process.exitCode = 1; });
