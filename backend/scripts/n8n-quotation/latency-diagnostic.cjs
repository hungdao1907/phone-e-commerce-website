const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');
const env = require('dotenv').parse(fs.readFileSync('.env'));
const { chatbotWebhookHeaders } = require('../../dist/src/services/chatbot-webhook-auth.js');
const publicUrl = process.env.WEBPHONE_WEBHOOK_TEST_URL;
if (!publicUrl || new URL(publicUrl).protocol !== 'https:') throw Error('Provide an HTTPS public webhook URL');
// One extended LOCAL diagnostic only; public/client budgets are not increased.
const tests = [
  ['local', 'http://localhost:5678/webhook/webphone-chatbot', 160000, true],
  ['public', publicUrl, 85000, true],
  ['backend', 'http://localhost:3001/api/chatbot/message', 95000, false],
];
(async () => {
  for (const [label, url, budget, webhook] of tests) {
    const sessionId = `latency-${label}-${randomUUID()}`;
    const start = performance.now();
    console.log(JSON.stringify({ label, phase: 'start', sessionId }));
    try {
      const r = await fetch(url, { method: 'POST',
        headers: webhook ? chatbotWebhookHeaders(env, true) : { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhook ? { chatInput: 'xin chào', sessionId, source: 'web_chat', history: [] } : { message: 'xin chào', sessionId }),
        signal: AbortSignal.timeout(budget) });
      let body;
      try { body = await r.json(); } catch {
        console.log(JSON.stringify({ label, ms: Math.round(performance.now() - start), status: r.status, nonJson: true }));
        continue;
      }
      console.log(JSON.stringify({ label, ms: Math.round(performance.now() - start), status: r.status,
        type: body.result_type, stateVersion: body.conversation_state?.state_version, sessionMatches: body.sessionId === sessionId }));
    } catch (e) {
      console.log(JSON.stringify({ label, ms: Math.round(performance.now() - start), error: e.name }));
    }
  }
})().catch(e => { console.log(JSON.stringify({ error: e.name })); process.exitCode = 1; });
