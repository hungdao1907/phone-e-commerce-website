# Authenticated WebPhone chatbot webhook

Verified MAIN workflow: `5319a575-90d2-4894-9ece-355d9528b732`.
Published revision: `e8c2e287-f27a-455a-9a37-d11956169bac` (66 nodes, Render catalog cutover; fast path and explicit product context preserved).

Entry: POST `/webhook/webphone-chatbot`, Header Auth credential `WebPhone Chatbot Webhook`, response mode `responseNode`.
The header name and value are configured only in the server environment as `N8N_CHAT_AUTH_HEADER` and `N8N_CHAT_AUTH_VALUE`.
Set `N8N_CHAT_WEBHOOK_URL` to the reachable production webhook. Never put the secret in frontend configuration or Git.

Flow: Webhook -> Normalize HTTP Chat Input -> HTTP Chat Input Valid -> Normalize Input -> existing catalog/FAQ/quotation logic -> Build Conversation State -> Respond Chat JSON.
Invalid input uses Respond Invalid Chat Request (400). Malformed JSON is rejected by n8n (400/422).
`result_type=error` uses 502; pending variant selection is a normal 200 response, even with `success=false`.

The JS files preserve the reviewed quotation/FAQ node implementations. `main-webhook.workflow.json` preserves the verified 66-node active graph (revision `cd22a99b-6fb0-4d16-bfcc-3d3ebd6d7714`) as an inactive, credential-free snapshot. Neither publishes anything automatically. `main-webhook.pre-fast-path.backup.json` retains the original 62-node graph; `main-webhook.pre-model-priority.backup.json` retains the approved draft before the model-priority fix. Backups omit credentials and must not be blindly imported over MAIN.
The MCP export omits credentials. Before restoring elsewhere, manually bind the Webhook to the existing Header Auth credential `WebPhone Chatbot Webhook`, bind the seven Gemini nodes to an authorized existing Gemini credential, and verify the Pending Quote Data Table bindings. Do not import over the active MAIN without explicit approval. No credential value or pinned execution data is included.
The HTTP normalizer accepts both `conversationState` and `conversation_state`, preserves session identity and bounded history, and excludes request headers from downstream input.
Only Backend owns final pricing, official Quotation/Order creation, and authenticated PDF access. No legacy PDF upload/conversion nodes are used.

## Render catalog cutover

All six catalog HTTP nodes use the server-controlled `Normalize Input.backendBaseUrl` assignment, currently `https://phone-e-commerce-website.onrender.com`. To switch local development, change only this assignment to `http://host.docker.internal:3001`, validate and publish with owner authorization. Never derive this origin from the webhook request.

See `backend/docs/deployment/n8n-render-backend-cutover.md` for measured evidence and limitations. The current inactive snapshot matches the published Render graph; earlier revision references below are historical results. The pre-render active and draft backups omit credentials and retain the existing Header Auth/Gemini credential bindings only on the live server.

Run `node scripts/n8n-quotation/production-render-smoke.cjs` from `backend` for opt-in Vercel bundle/Render chat relay checks. It stops on the first failure and never retries upstream. Latest greeting/FAQ passed with state V2; pending quotation returned Render 504, so the remaining relay turns were NOT_RUN. This is not full production E2E acceptance.

## Manual live checks

Run from `backend` after `npm run build`, with the local services and server-only Header Auth environment configured:

```powershell
node scripts/n8n-quotation/http-webhook-check.cjs
node --import tsx scripts/n8n-quotation/frontend-client-roundtrip.cjs
```

These are opt-in live checks, not npm mock tests. The first calls n8n and can write its pending-selection cache.
The second uses the real frontend API client and can create identifiable chat-history records through Backend.
Neither creates official Quotations, Orders, or Payments. The catalog-specific checks depend on current catalog variants and stock.
Previous measured results: 16 HTTP checks and 3 frontend-client roundtrip turns passed. Browser DOM verification was not performed.

## FAQ/context regression (2026-10-13)

Execution 1102 classified warranty correctly in Gemini but Validate Router changed it to product_detail. The detail formatter lost the selected product ID and chose the first Apple catalog product (Apple Watch). The fixed scripts retain FAQ intent and quotation context, use the canonical selected ID for implicit detail questions, and never select the first brand product without a model/ID.
Explicit product-detail turns are not treated as quotation attribute replies. Ready drafts retain product/variant/quantity, allowing a valid pending session to resume after FAQ.

Run the opt-in public suite from `backend` with `WEBPHONE_WEBHOOK_TEST_URL` set in the current process to the owner's reachable HTTPS webhook:

```powershell
node scripts/n8n-quotation/faq-context-smoke.cjs
```

Measured: 14/14 conversation turns passed (executions 1124–1137), plus missing/wrong Header Auth returned 403. This includes 13 requested cases and an extra warranty turn while awaiting variant selection. No official Quotation, Order, Payment or PDF was created. Auth values are read locally and never printed. The catalog-specific fixtures depend on real current products/variants/stock.
Backend regression: 194/194; frontend working-tree regression: 70/70. The uncommitted dropdown UI tests account for two frontend cases and are intentionally excluded from the FAQ release. These are mock/isolated tests, not PostgreSQL E2E.

## Fast-path release and bounded final retest

Current Backend regression/build: 200/200 PASS; Frontend working-tree regression: 70/70 PASS, lint/build PASS. The 16 original and 7 additional pinned cases passed before publish. Source/snapshot backups omit credentials. Unrelated frontend dropdown/payment changes are not part of this release.

Run `node scripts/n8n-quotation/final-gemini-retest.cjs` with `WEBPHONE_WEBHOOK_TEST_URL` set temporarily to the local or approved public endpoint. It sends turns sequentially, performs no client retry, and stops at the first failure. `--fast-only` checks greeting/FAQ and Header Auth without invoking Gemini. Live tests are opt-in and separate from npm mock tests.

Final public retest execution 1205 failed with Service unavailable at Gemini - Product Response; transport returned HTTP 200 with an empty body after 82.915 s. Further Gemini-dependent turns were not run. Greeting/FAQ and Header Auth passed on both local and public endpoints. Backend retains its localhost webhook URL: Cloudflare cutover is not verified or activated. See deployment/gemini-latency-findings.md for measured evidence and remaining gates.
