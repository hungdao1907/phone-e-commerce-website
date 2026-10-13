const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const headers = chatbotWebhookHeaders(env, true);
const url = process.env.WEBPHONE_WEBHOOK_TEST_URL;
assert.equal(new URL(url).protocol, 'https:');
const session = `faq-regression-${randomUUID()}`;
let state = null, selected = null, passed = 0;
async function turn(label, message, check, alternateSession) {
  const response = await fetch(url, { method: 'POST', headers,
    body: JSON.stringify({ chatInput: message, sessionId: alternateSession || session,
      source: 'web_chat', history: [], conversationState: alternateSession ? null : state }),
    signal: AbortSignal.timeout(85000) });
  const body = await response.json();
  assert.equal(response.status, 200, label);
  assert.equal(body.sessionId, alternateSession || session, label);
  assert.equal(body.conversation_state?.state_version, 2, label);
  assert.ok(body.response && !body.download_url && !body.quote_number, label);
  check(body);
  if (!alternateSession) state = body.conversation_state;
  passed++;
  console.log(JSON.stringify({ label, status: response.status, type: body.result_type,
    quoteStatus: body.quote_status, selectedProduct: body.conversation_state.selected_product_id,
    selectedVariant: body.conversation_state.selected_variant_id, passed }));
}
function faq(body) {
  assert.equal(body.result_type, 'faq');
  assert.equal(body.faq_topic, 'warranty');
  assert.ok(!/Apple Watch/i.test(body.response));
  assert.equal(body.conversation_state.selected_product_id, selected.product);
  assert.equal(body.conversation_state.selected_variant_id, selected.variant);
  assert.equal(body.conversation_state.pending_question?.quantity, selected.quantity);
}
(async () => {
  for (const [label, auth] of [['missing_auth', { 'Content-Type': 'application/json' }],
    ['invalid_auth', { ...headers, [env.N8N_CHAT_AUTH_HEADER]: 'invalid-regression-key' }]]) {
    const r = await fetch(url, { method: 'POST', headers: auth, body: '{}', signal: AbortSignal.timeout(15000) });
    assert.equal(r.status, 403); console.log(JSON.stringify({ label, status: r.status }));
  }
  await turn('1 greeting', 'xin chào', b => assert.equal(b.result_type, 'text'));
  await turn('2 search', 'có bán iphone không', b => { assert.equal(b.result_type, 'product_search'); assert.ok(b.products.length); });
  await turn('3 quotation product', 'tôi muốn báo giá iPhone 17 Pro Max', b => assert.equal(b.quote_status, 'needs_variant_selection'));
  await turn('4 variant', '256GB màu Bạc', b => {
    assert.equal(b.quote_status, 'ready');
    selected = { product: b.conversation_state.selected_product_id,
      variant: b.conversation_state.selected_variant_id, quantity: b.conversation_state.pending_question.quantity };
    assert.ok(selected.product && selected.variant);
  });
  await turn('5 device warranty', 'bảo hành của máy này như thế nào?', faq);
  await turn('6 execution 1102 general warranty', 'cửa hàng có chính sách bảo hành như thế nào?', faq);
  await turn('7 resume quotation', 'tôi muốn tiếp tục báo giá', b => {
    assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
    assert.equal(b.conversation_state.selected_variant_id, selected.variant);
    assert.equal(b.conversation_state.pending_question.quantity, selected.quantity);
  });
  await turn('8 explicit Apple Watch', 'cho tôi xem thông tin Apple Watch Ultra 3', b => {
    assert.equal(b.result_type, 'product_detail'); assert.match(JSON.stringify(b.product || b.products), /Apple Watch Ultra 3/i);
  });
  await turn('9 topic change', 'cho tôi xem thông tin iPhone 16', b => {
    assert.equal(b.result_type, 'product_detail'); assert.match(JSON.stringify(b.product || b.products), /iPhone 16/i);
    assert.ok(!/Apple Watch/.test(JSON.stringify(b.product || b.products)));
  });
  await turn('10 session isolation', '256GB màu Bạc', b => {
    assert.notEqual(b.quote_status, 'ready'); assert.notEqual(b.conversation_state.selected_product_id, selected.product);
  }, `${session}-B`);
  await turn('11 unknown product', 'tôi muốn báo giá nonexistent xyz999', b => assert.equal(b.quote_status, 'not_found'));
  await turn('12 needs variant selection', 'tôi muốn báo giá iPhone 17 Pro Max', b => assert.equal(b.quote_status, 'needs_variant_selection'));
  const pending = state.pending_question;
  await turn('extra FAQ while awaiting variant', 'chính sách bảo hành chung của cửa hàng?', b => {
    assert.equal(b.result_type, 'faq'); assert.deepEqual(b.conversation_state.pending_question, pending);
  });
  await turn('13 ready after FAQ', '256GB màu Bạc', b => assert.equal(b.quote_status, 'ready'));
  console.log(JSON.stringify({ result: 'PASS', passed, session, officialQuotationCreated: false }));
})().catch(error => {
  console.error(JSON.stringify({ result: 'FAIL', passed, error: error.name,
    actual: error instanceof assert.AssertionError ? error.actual : undefined,
    expected: error instanceof assert.AssertionError ? error.expected : undefined }));
  process.exitCode = 1;
});
