# Gemini latency investigation — 2026-10-13

MAIN is now published at `cd22a99b-6fb0-4d16-bfcc-3d3ebd6d7714` after the owner-approved fast path and explicit-model fix. Credentials/model, database, pricing, HTTP catalog nodes, Backend URL and production timeout remain unchanged. Earlier investigation/blocked-draft findings below are historical, superseded by the final section.

## Evidence

Execution 1138: input `xin chào`, history empty, state null, no catalog fetch. Total 135.224 s. Intent Router 64.753 s, Default Response 70.096 s; all other nodes approximately 0.375 s combined. Both Gemini nodes execute serially once in stored runData, doing classification and prose generation respectively. HTTP attempt/retry counts are not exposed by runData.
Execution 1139: same greeting category, total 90.561 s; Router 44.299 s and Default 46.159 s.
Router system prompt: 12,342 characters; Default system prompt: 2,966 characters. No catalog or history bulk explains the greeting delay. The model is unchanged (`models/gemini-3.5-flash-lite`). Simplified Gemini output retains candidates but not raw usage metadata, so token counts are NOT_VERIFIED.
Router retryOnFail is enabled (maxTries 3, waitBetweenTries 1,000 ms). The captured runs do not prove whether HTTP retries occurred. No 429/RESOURCE_EXHAUSTED/rate-limit/ETIMEDOUT lines were found in the inspected Docker log window; absence of logs is not proof of no retries.

Container DNS lookup to the Google API hostname took 20 ms; TLS/HTTP GET without credentials took 130 ms (404 at the root). This rules out that single DNS/TLS probe as the source of a minute-long delay, not all upstream/network problems.

Three isolated sequential greeting probes before any workflow change:

| Path | Measured client time | Result | Execution |
| --- | --- | --- | --- |
| Local webhook | 73.604 s | HTTP 200, text, state V2 | 1140 |
| Public webhook | 40.984 s | Non-JSON response; HTTP status was not captured by the original probe | 1141 |
| Backend using localhost webhook | 34.857 s | HTTP 200, text, state V2 | 1142 |

1140: Router 37.959 s, Default 35.274 s. 1141: Router 39.069 s then Default failed after 0.840 s with `Service unavailable`. 1142: Router 13.079 s, Default 20.238 s. Public health remains 200. The isolated timings vary substantially and cannot establish a fixed tunnel overhead. Gemini node/request time dominates; the exact upstream reason for the variable delay is not exposed.
Only the local diagnostic used a longer 160 s client budget once. No production timeout was increased.

## Historical reviewed proposal

`latency-optimization.candidate.workflow.json` preserves the complete existing graph and adds four credential-free nodes:

- Deterministic Intent: exact greetings, already-supported warranty questions, and simple variant/resume turns only when the pending cache matches session/product and has not expired. Anything ambiguous or complex still uses the existing Gemini Intent Router.
- IF - Deterministic Intent: select fast-path classification or Gemini.
- IF - Exact Greeting and Static Greeting: return a factual greeting while retaining the existing state-builder path; non-greeting defaults still call Gemini.
- Skip the existing Gemini - FAQ Response node (disabled/pass-through): Edit Response FAQ already ignores Gemini output and renders canonical FAQ data. FAQ policies and multi-topic formatting are not changed.

Header Auth, model IDs, credentials, all six HTTP catalog nodes, response contract and quotation pricing remain unchanged. Existing AI product search/detail/compare/recommendation/default functionality remains available. No official Quotation/Order/PDF is created by the fast path.

SDK validation: valid graph, 66 nodes; existing SDK Gemini discriminator/expression warnings remain. Candidate credentials are omitted by MCP and require rebinding if restored elsewhere. This file is not an instruction to import over MAIN or create a parallel MAIN.

## Activation review after owner re-approval

Owner specifically re-approved the four-node fast path, related connections and redundant FAQ call bypass. Auto-review then allowed the atomic 15-operation update. Active MAIN is still the original 62-node revision; the 66-node draft is `c6156a40-1286-491a-a203-4ecc3e538d0f`.
The fast-path predicate was tightened to require state V2 and matching, unexpired session/product/variant cache. Ambiguous warranty/product-shopping requests defer to the existing router. The credential-free pre-change snapshot is `main-webhook.pre-fast-path.backup.json`; the server's original published revision is retained.
Pinned tests 1143–1158: 15/16 PASS, including execution 1102 warranty regression, pending/ready/resume, isolation, expired cache and comparison. Test 1157 FAILED: after ready iPhone 17 quotation, `Cho tôi xem thông tin iPhone 16` reaches the existing router with the correct model but still selects the old iPhone 17 product ID. A replay of the original published Validate Router code reproduces the same stale ID/clarification, proving this is not introduced by the deterministic fast path. Evidence is stored in `fast-path-pinned-results.json`.
Publication is blocked by the explicit all-tests-PASS requirement. No public post-fix performance PASS or Backend cutover is claimed. Fixing the existing router's explicit-model-versus-pending-product handling is outside the narrowly re-approved four-node scope and needs direction before activation.

Backend regression/build: 198/198 PASS. Frontend regression: 70/70 PASS. No commit/push, database changes, model/credential edits, pricing changes or deploy. Keep Backend's existing localhost URL until the failing pinned gate is resolved and the public gate passes.

## Explicit model priority approval and release

Owner approved the existing-router fix and related nodes. Before mutation, both active and draft snapshots were preserved without credentials. Six Code nodes were updated atomically through MCP: Validate Router, Format Product Detail, Resolve Quotation Turn, Prepare Quote Filters, Build Conversation State, Deterministic Intent. No additional connection changes were made; all Header Auth, HTTP catalog and Gemini parameters/credentials are unchanged.

Validate Router no longer supplies a pending quotation ID when a current-turn product model is explicit. Detail resolution uses exact/unique token-boundary catalog matching and rejects Pro/Max/16e sibling confusion. Viewing a new product changes the displayed detail reference but retains the old quotation product/variant/quantity in pending_question. Resume reads that quotation context; explicit new quotation cannot reuse an old variant.

Original pinned tests: 16/16 PASS (1160–1175); seven additional pinned cases: 7/7 PASS (1176–1182), including detail then old-quote resume, explicit new quote, missing Pro/Pro Max, unknown product, recommendation and sold-out variant. Gemini/catalog/datatable writes were mocked; n8n Code/Set/IF executed. This is not live HTTP evidence. Full Backend regression/build: 200/200 PASS. Frontend: 70/70 PASS, lint/build PASS. SDK graph validation is valid (66 nodes), with the same pre-existing Gemini discriminator/static-expression warnings.

MCP auto-review allowed the six-node update and publish. Active revision verified: cd22a99b-6fb0-4d16-bfcc-3d3ebd6d7714. Public and local missing/invalid Header Auth still return 403. Initial greeting measurements: local 1.765 s, public 0.709 s; independent probes: local 0.161 s, public 0.884 s. General warranty FAQ: local 0.811 s, public 0.458 s. These fast turns execute without Gemini.

Real full HTTP search regression is PARTIAL, not PASS: public execution 1186 failed at Gemini - Product Response with Service unavailable after the intent router completed; local search exceeded the 85 s client budget. Backend remains on localhost webhook; /health is 200. No Backend cutover/restart is justified until the complete public gate passes. No credential/model change or blind upstream retries were attempted.

Independent local real HTTP quotation reached needs_variant_selection (79.017 s), selected silver 256GB (0.880 s), preserved ready quotation through FAQ 1102 (0.586 s) and resumed the original product/variant (2.075 s). The independent public new-quote request did not return JSON despite HTTP 200 (71.990 s); execution 1192 confirms Service unavailable at Gemini - Intent Router.

Local detail execution 1196 confirms the actual fix: Validate Router model = iPhone 16, selected_product_id = null; Format Product Detail resolves the real iPhone 16. Final response nevertheless failed at Gemini - Product Detail Response (Service unavailable); no full HTTP detail PASS is claimed. Both failures are in unchanged Gemini nodes, not model resolution/fast-path.

Real execution 1195's ready state/cache was reused across the same local/public endpoint with Header Auth (not pinned): FAQ preserved the exact product/variant and continuation returned ready. Local FAQ 0.433 s, continuation 1.142 s; public FAQ 1.547 s, continuation 1.122 s, all HTTP 200 with V2. The context fixture contains only a generated test session and public catalog identifiers, not credentials/PII. No official quotation/order/PDF was created.

Final HTTP gate remains PARTIAL because the Gemini-dependent search/new-quotation/detail requests did not all complete successfully. Keep the published optimized revision (no semantic regression identified), keep the existing Backend localhost URL, and do not claim end-to-end cutover PASS. Re-run the failed Gemini-dependent HTTP regression when upstream is available; credentials/model remain untouched.

Final greeting probe: local 0.384 s, public 0.618 s, Backend relay 1.157 s, all HTTP 200/text/V2 with matching isolated test sessions. Backend /health 200. Backend still uses http://localhost:5678/webhook/webphone-chatbot; no .env edit or Backend restart was performed because the full public gate remains unmet. Final active revision was re-read through MCP and still matches the published 66-node draft. git diff --check PASS (only Git's existing LF/CRLF notices). Unrelated frontend UI changes were preserved; no Git commit/push, database/model/credential change or deploy.

## Final Gemini retest and Git sync — 2026-10-13

The owner authorized committing this reviewed source even if upstream Gemini remains unavailable. MAIN revision is unchanged at cd22a99b-6fb0-4d16-bfcc-3d3ebd6d7714; no workflow edit/publish was attempted.

Sequential public retest: greeting 200/text/V2 (0.303 s), missing/wrong Header Auth 403. First Gemini-dependent turn, `có bán iPhone không?`, returned HTTP 200 with an empty body after 82.915 s. Execution 1205 shows Intent Router completed in 79.212 s, then Gemini - Product Response failed in 1.095 s with Service unavailable. Execution retryOf/retrySuccessId are null; actual internal HTTP attempt count is NOT_VERIFIED. No observed HTTP 429/rate-limit evidence and no confirmed upstream HTTP status code were exposed by this capture. No additional Gemini requests or retries were sent after that error.

Independent non-Gemini fast-only checks after the failure: local greeting 0.338 s and FAQ 0.480 s; public greeting 1.193 s and FAQ 0.443 s. All returned HTTP 200, valid JSON, matching session and V2; missing/wrong auth 403 on both. Product detail/new-quote/variant/quotation-resume/session-isolation cases in this final retest are NOT_RUN after the first failure; earlier pinned and measured live results remain historical evidence, not a new full live PASS.

Backend Cloudflare cutover is HOLD; .env and process remain unchanged. Source validation: Backend 200/200 mock/isolated tests + TypeScript build PASS; Frontend 70/70 working-tree tests PASS, lint/build checked separately. Git sync scope excludes unrelated UI/payment/dropdown changes, environment files, credentials, uploads/PDF/build artifacts, obsolete live-readonly-check.cjs and the ephemeral model-priority-live-context.fixture.json. No database changes or Render/Vercel deploy.
