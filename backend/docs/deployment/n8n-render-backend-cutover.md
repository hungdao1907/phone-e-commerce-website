# n8n Render catalog cutover — measured 2026-10-13

MAIN: `5319a575-90d2-4894-9ece-355d9528b732`.
Active before: `ade2fb3d-c6b2-452e-8c2e-25f3e8669d1a`.
Published and verified after: `e8c2e287-f27a-455a-9a37-d11956169bac`.

Six HTTP URL parameters now use `Normalize Input.backendBaseUrl`, a fixed server-controlled string set to `https://phone-e-commerce-website.onrender.com`. Methods, bodies, auth, credentials, connections, model and quotation logic are unchanged. Concurrent draft condition-version/identifier metadata was preserved. There are still 66 nodes. Local development can switch this one assignment to `http://host.docker.internal:3001` with validation and authorized publish.

## Evidence

- Actual Render requests: health 200; products 200 (61); product detail 200 (9 variants); product search 200 (14); POST catalog lookup 200. Same catalog endpoints worked from inside the running n8n Docker container. Unauthenticated quotations returned 401.
- Graph validation passed; 23 pinned regression executions 1210–1232 passed, plus invalid-body case 1233. Pinned HTTP/AI/cache I/O is mocked, not live E2E.
- Production Cloudflare: missing/wrong Header Auth 403; greeting 200/449ms; general FAQ 200/497ms; new quotation draft 200/40086ms; variant ready 200/1122ms; FAQ preserving ready context 200/1895ms; continuation 200/1053ms.
- Executions 1238 and 1240 executed Render product/catalog HTTP nodes. Draft selected actual iPhone 17 Pro Max and silver 256GB variant `21390289-fdbe-4b04-bfba-366c6e3050d1`. No official Quotation, Order, Payment or PDF was created.
- Product detail execution 1241 resolved iPhone 16, but unchanged Gemini detail node failed with Service unavailable. HTTP transport returned 200 without usable JSON after 55889ms. Further dependent turns were NOT_RUN; no upstream retry or model/credential changes.
- Vercel page returned 200; compiled frontend references Render. Render CORS preflight with Vercel Origin returned 204. A real Render POST `/api/chatbot/message` greeting returned 200 and state V2 through the public relay. Browser DOM and full product relay E2E are NOT_VERIFIED.

## Production Render relay retest

Opt-in command from `backend`: `node scripts/n8n-quotation/production-render-smoke.cjs`. Reads Header Auth locally, never prints it, sends sequential requests, stops at the first failed chat turn, and performs no retry.

Measured session `production-smoke-d0814606-980e-449d-b7d3-ba28a2cdc3eb`: Vercel page 200 and bundle Render origin verified; Render health/products 200 (61 products); missing/wrong public webhook auth 403. Render greeting 200/1185ms (execution 1242), warranty FAQ 200/848ms (1243), both nonempty JSON/state V2. Execution 1242 confirms the same session reached MAIN and Normalize Input uses Render base URL.

Pending quotation request returned Render HTTP 504 after 90115ms. Execution 1244 subsequently succeeded after 131165ms, returning nonempty quotation data, `needs_variant_selection` and state V2 for the correct iPhone 17 Pro Max; both Render product/catalog nodes ran. This confirms a late upstream completion exceeding the Backend timeout, not a successful customer response. No current Gemini Service unavailable error was observed in this execution; exact per-node delay attribution remains unverified. No further requests were sent. Variant, FAQ-after-quote, continuation, search and detail in this new relay suite are NOT_RUN, not PASS. Prior direct webhook checks above remain separate measured evidence. Production browser automation is NOT_RUN (no available browser surfaces).

Backend build/regression 202/202 PASS; frontend tests 70/70 PASS. No application production code, environment, workflow or database schema changed in this retest.

## Preservation and remaining gates

Backups: `main-webhook.pre-render-backend.backup.json` and `main-webhook.pre-render-draft.backup.json`; inactive snapshots omit credentials. For authorized rollback use the retained pre-render published revision, not a blind credential-free import.

Local Backend environment was not changed. No commit/push, deploy, database migration or official quotation transaction was performed. Ordinary chat tests can write identifiable chat history/pending-selection cache.

The six catalog nodes no longer require local Backend. n8n Docker and the temporary Cloudflare tunnel still require the local host. Gemini availability blocks full detail/comparison live acceptance. Existing unrestricted CORS, durable public webhook hosting and persistent PDF/image storage remain separate production gates; they were not modified here.
