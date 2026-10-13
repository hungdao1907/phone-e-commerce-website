const assert = require('node:assert/strict');
const crypto = require('node:crypto');

(async () => {
  const { sendChatMessage } = await import('../../../frontend/src/services/chatbot.api.ts');
  const session = `frontend-http-${crypto.randomUUID()}`;
  async function step(label, message, expected) {
    const result = await sendChatMessage(message, session);
    assert.equal(result.sessionId, session, label);
    assert.equal(result.quote_status || result.result_type, expected, label);
    assert.ok(result.response, label);
    assert.ok(!result.download_url && result.response_type !== 'file', label);
    console.log(JSON.stringify({ label, http: 200, type: result.result_type, quoteStatus: result.quote_status,
      catalogVerified: result.catalog_verified, products: result.products?.length,
      stateVersion: result.conversation_state?.state_version }));
    return result;
  }
  await step('greeting', 'xin chào', 'text');
  const waiting = await step('quotation_product', 'tôi muốn báo giá iphone 17', 'needs_variant_selection');
  assert.equal(waiting.catalog_verified, true);
  assert.ok(waiting.products[0].variants.length > 0);
  const ready = await step('variant_followup', '256GB màu Bạc', 'ready');
  assert.equal(ready.ready_to_quote, true);
  assert.equal(ready.catalog_verified, true);
  assert.ok(ready.products[0].selected_variant_id);
  assert.equal(ready.products[0].id, waiting.products[0].id);
  console.log(JSON.stringify({ result: 'PASS', session, frontendClient: true, officialQuotationCreated: false,
    note: 'Uses the real frontend API client; no browser DOM verification.' }));
})().catch(error => {
  console.error(JSON.stringify({ result: 'FAIL', error: error.name,
    actual: error instanceof assert.AssertionError ? error.actual : undefined,
    expected: error instanceof assert.AssertionError ? error.expected : undefined }));
  process.exitCode = 1;
});
