require('../../dist/src/env.js');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const webhook = 'http://localhost:5678/webhook/webphone-chatbot';
const headers = chatbotWebhookHeaders(process.env, true);
const prefix = `http-cutover-${crypto.randomUUID()}`;
let passed = 0;

async function call(body, customHeaders = headers, raw = false) {
  const response = await fetch(webhook, { method: 'POST', headers: customHeaders,
    body: raw ? body : JSON.stringify(body), signal: AbortSignal.timeout(85000) });
  let result;
  try { result = await response.json(); } catch { result = null; }
  return { status: response.status, result };
}

async function turn(label, chatInput, sessionId, state, expected) {
  const { status, result } = await call({ chatInput, sessionId, source: 'web_chat', conversation_state: state || null, history: [] });
  assert.equal(status, 200, label);
  assert.ok(result && typeof result === 'object' && !Array.isArray(result), label);
  assert.equal(result.sessionId, sessionId, label);
  assert.ok(result.response && result.conversation_state?.state_version === 2, label);
  assert.ok(!result.download_url && !result.file_name && result.response_type !== 'file', label);
  if (expected) assert.equal(result.quote_status || result.result_type, expected, label);
  console.log(JSON.stringify({ label, status, type: result.result_type, quoteStatus: result.quote_status,
    ready: result.ready_to_quote, variants: result.request_results?.[0]?.available_variants?.length,
    products: result.products?.length, stateResults: result.conversation_state?.last_result_set?.length,
    stateV2: true, sessionMatches: true, noLegacyPdf: true }));
  passed++;
  return result;
}

(async () => {
  const payload = { chatInput: 'xin chào', sessionId: `${prefix}-auth` };
  for (const [label, auth] of [['missing_header', { 'Content-Type': 'application/json' }],
    ['invalid_header', { ...headers, [process.env.N8N_CHAT_AUTH_HEADER]: 'intentionally-invalid-test-value' }]]) {
    const result = await call(payload, auth);
    assert.ok([401, 403].includes(result.status), label);
    console.log(JSON.stringify({ label, status: result.status })); passed++;
  }
  for (const [label, body, raw] of [['malformed_json', '{', true], ['invalid_body', { sessionId: prefix }, false]]) {
    const result = await call(body, headers, raw);
    assert.ok(raw ? [400, 422].includes(result.status) : result.status === 400, label);
    console.log(JSON.stringify({ label, status: result.status })); passed++;
  }
  await turn('greeting', 'xin chào', `${prefix}-greet`, null, 'text');
  const search = await turn('product_search', 'có bán iphone không', `${prefix}-search`, null, 'product_search');
  const detail = await turn('detail_followup', 'cho tôi xem mẫu thứ 5', `${prefix}-search`, search.conversation_state);
  if (search.conversation_state.last_result_set?.length >= 5) {
    assert.equal(detail.conversation_state.selected_product_id, search.conversation_state.last_result_set[4].id);
  }
  const generic = await turn('quote_generic', 'tôi muốn báo giá', `${prefix}-A`, null, 'invalid_request');
  const waiting = await turn('quote_product', 'iphone 17', `${prefix}-A`, generic.conversation_state, 'needs_variant_selection');
  assert.equal(waiting.ready_to_quote, false);
  const state = waiting.conversation_state;
  const ready = await turn('quote_ready', '256GB màu Bạc', `${prefix}-A`, state, 'ready');
  assert.equal(ready.ready_to_quote, true);
  await turn('ordinal_variant', 'mẫu số 3', `${prefix}-A`, state, 'ready');
  await turn('512_navy', '512GB màu Xanh Navy', `${prefix}-A`, state, 'ready');
  await turn('out_of_stock', '1TB màu Xanh Navy', `${prefix}-A`, state, 'insufficient_stock');
  await turn('not_found', 'tôi muốn báo giá nonexistent xyz999', `${prefix}-B`, null, 'not_found');
  const isolated = await turn('session_isolation', '256GB màu Bạc', `${prefix}-C`, null);
  assert.notEqual(isolated.quote_status, 'ready');
  await turn('faq', 'cửa hàng có chính sách bảo hành như thế nào?', `${prefix}-faq`, null);
  console.log(JSON.stringify({ result: 'PASS', passed, sessionPrefix: prefix, officialQuotationCreated: false }));
})().catch(error => {
  console.error(JSON.stringify({ result: 'FAIL', passed, error: error.name, assertion: error.operator,
    actual: error instanceof assert.AssertionError ? error.actual : undefined,
    expected: error instanceof assert.AssertionError ? error.expected : undefined }));
  process.exitCode = 1;
});
