// Opt-in production HTTP smoke. Writes only normal chat history/pending cache.
// Never creates official Quotations, Orders, Payments or PDFs; no automatic retry.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const backend = 'https://phone-e-commerce-website.onrender.com';
const frontend = 'https://webphone-beta.vercel.app';
const webhook = 'https://pays-lcd-refined-authority.trycloudflare.com/webhook/webphone-chatbot';
const sessionId = `production-smoke-${randomUUID()}`;
let selected;
async function turn(label, message, check) {
  const started = performance.now();
  try {
    const r = await fetch(`${backend}/api/chatbot/message`, { method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: frontend },
      body: JSON.stringify({ message, sessionId }), signal: AbortSignal.timeout(95000) });
    const raw = await r.text();
    let b;
    try { b = JSON.parse(raw); } catch { throw Object.assign(new Error('EMPTY_OR_NON_JSON_BODY'), { status: r.status }); }
    assert.equal(r.status, 200); assert.ok(b.response?.trim()); assert.notEqual(b.result_type, 'error');
    assert.equal(b.sessionId, sessionId); assert.equal(b.conversation_state?.state_version, 2);
    assert.ok(!b.quote_number && !b.download_url);
    check(b);
    console.log(JSON.stringify({ label, pass: true, status: r.status, latencyMs: Math.round(performance.now() - started),
      type: b.result_type, quoteStatus: b.quote_status, response: b.response,
      state: b.conversation_state, products: b.products?.map(p => ({ id: p.id, name: p.name, selectedVariant: p.selected_variant_id })), sessionId }));
    return true;
  } catch (e) {
    console.log(JSON.stringify({ label, pass: false, status: e.status, error: e.name,
      actual: e instanceof assert.AssertionError ? e.actual : undefined,
      expected: e instanceof assert.AssertionError ? e.expected : undefined,
      latencyMs: Math.round(performance.now() - started), sessionId }));
    process.exitCode = 1; return false;
  }
}
(async () => {
  const page = await fetch(frontend, { signal: AbortSignal.timeout(45000) });
  const html = await page.text();
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  let renderInBundle = false;
  for (const src of scripts) {
    const js = await (await fetch(new URL(src, frontend), { signal: AbortSignal.timeout(45000) })).text();
    renderInBundle ||= js.includes(backend);
  }
  const health = await fetch(`${backend}/health`, { signal: AbortSignal.timeout(45000) });
  const catalog = await fetch(`${backend}/api/products`, { signal: AbortSignal.timeout(45000) });
  const products = await catalog.json();
  console.log(JSON.stringify({ label: 'website_catalog', pageStatus: page.status, renderInBundle, healthStatus: health.status,
    productsStatus: catalog.status, productsCount: Array.isArray(products) ? products.length : products.data?.length }));
  assert.equal(page.status, 200); assert.ok(renderInBundle); assert.equal(health.status, 200); assert.equal(catalog.status, 200);
  assert.ok(env.N8N_CHAT_AUTH_HEADER && env.N8N_CHAT_AUTH_VALUE);
  for (const [label, headers] of [['missing_auth', { 'Content-Type': 'application/json' }],
    ['wrong_auth', { 'Content-Type': 'application/json', [env.N8N_CHAT_AUTH_HEADER]: 'invalid-smoke-key' }]]) {
    const r = await fetch(webhook, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(20000) });
    console.log(JSON.stringify({ label, status: r.status, pass: r.status === 403 })); assert.equal(r.status, 403);
  }
  if (!await turn('greeting', 'xin chào', b => assert.equal(b.result_type, 'text'))) return;
  if (!await turn('general_faq', 'cửa hàng có chính sách bảo hành như thế nào?', b => assert.equal(b.result_type, 'faq'))) return;
  if (!await turn('pending_quotation', 'tôi muốn báo giá iPhone 17 Pro Max', b => assert.equal(b.quote_status, 'needs_variant_selection'))) return;
  if (!await turn('variant', '256GB màu Bạc', b => {
    assert.equal(b.quote_status, 'ready'); assert.equal(b.catalog_verified, true);
    selected = { product: b.conversation_state.selected_product_id, variant: b.conversation_state.selected_variant_id };
    assert.ok(selected.product && selected.variant);
  })) return;
  if (!await turn('faq_after_quote', 'bảo hành sản phẩm này thế nào?', b => {
    assert.equal(b.result_type, 'faq'); assert.ok(!/Apple Watch/i.test(b.response));
    assert.equal(b.conversation_state.pending_question.product_id, selected.product);
  })) return;
  if (!await turn('continue_quote', 'tiếp tục báo giá trước đó', b => {
    assert.equal(b.quote_status, 'ready'); assert.equal(b.conversation_state.selected_product_id, selected.product);
    assert.equal(b.conversation_state.selected_variant_id, selected.variant);
  })) return;
  if (!await turn('product_search', 'có bán iPhone không?', b => {
    assert.equal(b.result_type, 'product_search'); assert.ok(b.products?.length);
  })) return;
  await turn('product_detail', 'cho tôi xem thông tin iPhone 16', b => {
    assert.equal(b.result_type, 'product_detail'); assert.equal(b.product?.name, 'iPhone 16');
  });
})().catch(e => { console.log(JSON.stringify({ fatal: e.name })); process.exitCode = 1; });
