# Phase 2D.4 — n8n Contract & Quotation API Hardening

Status: source/mock-ready only. Quotation REST routers remain unmounted; no migration, database write, n8n import, activation, publish, or email was performed.

## Offline n8n candidate

The offline export previously had `active: true` and connected the `quotation` intent to product lookup, n8n price/stock interpretation, HTML/PDF generation, Gotenberg, and `POST /api/chatbot/quotation-files`. It also stored `chatbot_pending_quotations` by chat session and returned a public `download_url` as a successful quotation.

The candidate now has `active: false`. The old pending-quotation, price/stock quotation, HTML/PDF, Gotenberg, upload, public URL, and false-success nodes have been removed. Normal product search, product detail, comparison, recommendation, FAQ, default response, and conversation-state branches remain connected. Legacy `quotation` classifier output is normalized to catalog search for one product, comparison for multiple products, or clarification if no product is identified. It cannot reach a quotation result/PDF branch.

The Backend's chatbot response sanitizer exposes product IDs only. The Customer UI then resolves IDs through the Backend catalog. Quotation creation remains an authenticated WebPhone UI action; the Backend validates active product/variant and recomputes the snapshot. The candidate has not been imported or activated. n8n MAIN workflow `5319a575-90d2-4894-9ece-355d9528b732` is `MAIN_NOT_VERIFIED`: no read-only n8n connector was available.

## Customer Quotation API contract (source only)

Create contract:

- `POST /api/quotations`, Customer Bearer session, required opaque `Idempotency-Key`.
- Body contains selected `variantId`, positive integer `quantity`, delivery/contact/payment form fields; no Customer ID, product price, discount, shipping amount, or total is accepted.
- First successful call returns `201 { quotation }`. Same Customer/key/payload returns the same saved Quotation; the key is durable and scoped by Customer. Reusing a key with changed payload is a `409`.
- Before charging the in-memory rate limit, source now checks the durable claim. An exact committed replay bypasses the limiter; no uncommitted/unknown result is silently treated as success.

Recovery contract:

- `POST /api/quotations/recovery`, Customer Bearer session, same `Idempotency-Key`, no body.
- `200 { quotation, recovered: true }` only when the key resolves under the authenticated Customer ID.
- `404 { code: IDEMPOTENCY_RESULT_NOT_FOUND, status: NOT_FOUND_AT_CHECK }` means no committed row was visible at that database read. It is not proof that an original in-flight transaction cannot still commit. Client must keep the same key, recheck, and must not silently create a new request/key.
- Other Customers receive the same not-found result; no Customer ID or key hash is returned. Missing/invalid keys fail closed.
- Source/mock-ready only; these routers are not imported or mounted from `backend/src/index.ts`.

## Create rate guard

The process-local rolling window defaults to 10 distinct keys per authenticated Customer and 30 distinct keys per IP per 10 minutes. Repeated same-key attempts do not consume another slot; durable committed replays are resolved before the limiter. Limit responses are generic `429` with integer `Retry-After`; Customer identity is not in the body. Request bodies cannot alter identity or limits.

This is not a distributed/global limit: each Node process has independent memory, and restart clears it. `req.ip` currently resolves to the direct peer because Express `trust proxy` is not enabled. Behind a reverse proxy, users may share the proxy IP bucket. Before deployment, configure only the known proxy hops/networks (never blindly trust arbitrary `X-Forwarded-For`) and review the thresholds for shared NATs.

## Refresh and account lifecycle

When the feature is enabled, the browser writes only `{ key, createdAt }` under a versioned `sessionStorage` key before sending create. It does not persist payload, JWT, OTP, phone, address, price, or Customer ID. After refresh, it calls recovery only; it never auto-replays POST with an unknown payload. A found result is shown; unresolved/not-found remains locked to new creates while the Customer can recheck. Same-page retry may reuse the same key only while its in-memory request fingerprint still matches. Logout/account change removes the marker.

The frontend flag `VITE_QUOTATION_API_ENABLED` defaults to off. Enable it only after database and backend API activation are approved. A sessionStorage marker is tab-session scoped; closing the browser can remove it, so the Customer's authenticated Quotation list remains the secondary way to find a committed result.

## Chatbot privacy boundary

Backend-to-n8n payload includes the current message, opaque guest `sessionId`/`conversationId`, a maximum of six recent messages capped at 600 characters each, and an allowlisted conversation-state projection (catalog IDs/names/brands/model, explicit filters, and selected intent state). It excludes JWT, Customer ID, arbitrary nested state, price/stock from historical result objects, and private PDF URLs. The 2000-character current user message is retained for consultation; obvious credential/private-URL patterns are redacted, but regex redaction does not identify all PII. A Customer can still type an email, phone, address, or other personal detail into free text and that text may reach n8n/Gemini. This residual free-text risk is not claimed to be fully redacted; avoid sending unnecessary personal details and do not log payloads.

Product data/variant availability and monetary display are resolved by Backend catalog code, not trusted from Gemini. Final chatbot advice responses are reduced to product IDs. Existing n8n MAIN behavior and proxy/production routing remain unverified.

## Notification integration contract

The source envelope builder is inert; it does not write an outbox, send mail, or create in-app notifications. Proposed event mapping:

| Event | Owner | Recipient | Template | Dedupe key |
|---|---|---|---|---|
| `quotation.created` | Quotation ID/version | Customer owner | `quotation-created` | `quotation:{id}:created:v{version}` |
| `quotation.customer_confirmation_required` | Quotation ID/version | Customer owner | `quotation-confirmation-required` | `quotation:{id}:confirmation-required:v{version}` |
| `quotation.needs_requote` | Quotation ID/version | Customer owner | `quotation-needs-requote` | `quotation:{id}:needs-requote:v{version}` |
| `quotation.staff_assigned` | Quotation ID/version | Assigned Staff | `quotation-assigned-to-staff` | `quotation:{id}:staff-assigned:{staffId}:v{version}` |
| `quotation.staff_approved` | Quotation + persisted review ID | Customer owner | `quotation-approved` | `quotation:{id}:review:{reviewId}` |
| `quotation.staff_rejected` | Quotation + persisted review ID | Customer owner | `quotation-rejected` | `quotation:{id}:review:{reviewId}` |
| `order.created` | Order ID | Customer owner | `order-created` | `order:{id}:created` |

Each envelope also has a random `eventId`, `schemaVersion`, and `occurredAt`. The unique dedupe key must be enforced by persistent storage. Existing Nodemailer functions and `Notification` model exist, but the model has no recipient/owner or dedupe-key columns and current email functions are not an outbox. Additive outbox/recipient schema and a worker are not implemented. If introduced, use a transactional outbox written in the same DB transaction as the state change, then an at-least-once worker with unique dedupe; do not promise exactly-once external delivery.

## Migration and activation review

Observed source state:

- `20261007130000_account_bound_quotations/` exists but has no `migration.sql`. It was not synthesized or edited because the applied migration history was not verified.
- SQL files exist for `20261009180000_quotation_foundation`, `20261010120000_quotation_requote_versions`, `20261010130000_quotation_pricing_policy_v1`, `20261010140000_checkout_idempotency`, and `20261010150000_quotation_create_idempotency`. These are draft/unapplied per repository comments; their presence does not prove database state.
- No database migration status/history was queried. Prisma schema validation is offline and passed; database history, existing rows, pickup/delivery data, and backup/restore are `NOT_VERIFIED`.
- `Quotation` routers are absent from `backend/src/index.ts`. Checkout idempotency remains behind its existing flag; it was not enabled.
- Private PDF source stores files outside public upload roots, but reverse proxy/web-server exposure is `NOT_VERIFIED`.
- Prisma Client was not regenerated as part of this phase; no migration or engine overwrite was attempted.

Activation order and stop gates:

1. Inventory the actual deployed `_prisma_migrations` history read-only and reconcile it with every directory, especially the empty account-bound directory. STOP if an applied migration cannot be reconstructed from reviewed source.
2. Review the complete SQL dependency order and compare it to the live schema. Approve/fix missing migration SQL only after confirming it was never applied; never rewrite an applied migration.
3. Verify a consistent backup and a tested restore path. STOP without a recoverable backup.
4. Review quotation version/idempotency constraints, foreign keys, Customer/Staff authorization, and any required pickup/delivery backfill. Confirm no historical Order/Quotation values are silently reclassified.
5. Approve a maintenance window and apply only the reviewed migration chain with the chosen production-safe migration command. Do not use `db push`, reset, or dev migration against the live database.
6. Generate Prisma Client with the repository-pinned Prisma version after schema activation; if Windows reports engine `EPERM`, stop and resolve the lock safely without overwriting a running engine.
7. Verify private storage permissions and audit every reverse-proxy/static route so `uploads/quotations` and private storage cannot be served directly. STOP until verified.
8. Mount Customer/Staff/Admin quotation routers behind the existing authorization composition and confirm middleware order; keep feature flags off until a reviewed smoke test.
9. Enable the frontend `VITE_QUOTATION_API_ENABLED` only after API/schema readiness. Keep Checkout Idempotency disabled unless separately approved.
10. Review an n8n MAIN read-only export and endpoint compatibility. Only a separate explicit approval may import/activate/publish the offline candidate.
11. Decide whether to add outbox schema/worker and persistent notification dedupe before enabling quotation emails.
12. After the chatbot upgrade is complete, manually test create/replay/recovery, Customer isolation, price change → `NEEDS_REQUOTE`, Customer reconfirmation, Staff assignment/approval, private PDF and reverse-proxy paths. No real Order is needed for preflight; any live E2E must be explicitly scoped and monitored by the user.

## Validation boundaries

Backend and frontend automated tests use mocks/isolated memory. They do not prove PostgreSQL concurrency, multi-process rate limits, n8n runtime compatibility, reverse-proxy privacy, live SMTP delivery, or full website E2E behavior. Quotation API activation is blocked pending migration-history resolution and the explicit activation review.
