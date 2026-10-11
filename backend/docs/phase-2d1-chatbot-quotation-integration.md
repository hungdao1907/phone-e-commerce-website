# Phase 2D.1 — Chatbot quotation integration contract

## Scope and activation status

- `POST /api/chatbot/message` remains an anonymous conversation relay. It accepts only `message` and `sessionId`; neither the Frontend nor Backend appends a JWT, authenticated Customer ID, or profile contact to the n8n request. User-entered text, bounded chat history and chatbot context are relayed, so a guest could still type PII into a message; no PII redaction is implemented.
- `POST /api/chatbot/catalog` is a public, read-only Backend adapter. It accepts at most 12 product IDs and returns only matching active products, with current effective variant price resolved by Shared Pricing V1. IDs are suggestions, not trusted product data.
- Quotation routers are source-prepared but are not imported or mounted in `backend/src/index.ts`. Quotation creation, confirmation, staff approval, and private PDF download therefore remain NOT_ACTIVATED.
- No migration, database connection test, quotation write, n8n MAIN change, webhook activation, or deployment was performed for this phase.

## Trust boundaries

| Data/action | Authority |
| --- | --- |
| Guest conversation/session UUID | Browser; opaque and not an identity credential |
| Product recommendation IDs from n8n | Untrusted suggestions only |
| Product status, catalog fields, campaign/sale effective display price | Backend product/campaign database and Shared Pricing V1 |
| Customer identity and ownership | Verified Backend JWT; never n8n or chat text |
| Quotation totals/snapshot/expiry (24 hours) | Backend Shared Pricing/Quotation service |
| Customer confirmation, staff assignment and approval | Authenticated Quotation API state machine |
| PDF bytes and access | Private Backend PDF service with owner/assignment checks |
| Order identity and conversion | Backend transaction, Order Code Generator and quotation uniqueness constraints |

The catalog card shows a “from” price: the lowest currently effective variant price returned by Backend. It is only a catalog display value; Quotation creation must reprice from variant IDs and quantities and must not accept it as a transaction price.

## Customer flow/API contract

1. Guest can ask for product advice. The chatbot message relay receives `{ message, sessionId }`; an arbitrary session ID never grants account or quotation access. Treat free-form message/history as untrusted and potentially containing user-entered PII.
2. n8n may return product IDs. For search, detail, comparison and recommendation intents, the Backend sanitizer replaces model prose and discards product names, descriptions, images, stock and prices. It also replaces unverified free-form `text` replies. The Frontend resolves those IDs with `POST /api/chatbot/catalog`; inactive/missing products are omitted. The card price is not sourced from Gemini/n8n.
3. For a quotation, the user must authenticate in the WebPhone Customer UI. The eventual customer request is made directly from that UI to `POST /api/quotations` with the bearer token and identifiers/quantities plus delivery/contact/payment/promo input. The Backend derives `customerId` from JWT and recalculates pricing. Client prices, totals and identity fields are rejected by the existing DTO.
4. Customer list/detail/confirm/decline/PDF calls use `/api/quotations` and the bearer token. The Backend scopes every request to the authenticated `customerId`; a chat message or session UUID cannot confirm a quote.
5. A stale price/total before conversion follows the implemented `NEEDS_REQUOTE` workflow: no Order is created; a new Backend-issued version must be shown and confirmed by the Customer before Staff can approve. Once Order conversion commits, its transaction snapshot is retained.

The source UI has Customer quotation viewing, confirmation, decline and private PDF controls, but it does not yet provide a chatbot-to-quotation creation form that collects the authenticated Customer's delivery details. The `/profile` link in chat is guidance only, not a successful quote or a create operation. API activation remains blocked until migration/schema readiness is explicitly approved and the authenticated creation UX is completed.

## Staff, PDF and order lookup contracts

- Staff reads and reviews only quotations with `assignedStaffId` equal to the authenticated Staff ID. Approve/reject requires an `Idempotency-Key`; approval rechecks price and state in the Backend transaction. Admin assignment remains on the separate Admin API.
- Customer PDF access is scoped by `customerId`; Staff access by `assignedStaffId`; Admin/Superadmin access follows the existing authorization policy. PDF responses are private/no-store and generated from the persisted Backend snapshot/version. No public `download_url` is part of the chatbot contract.
- Public order lookup is a separate flow at `/api/orders/track/request-otp`, `/api/orders/track/verify-otp`, and `/api/orders/track/details`. Lookup requires order code plus matching contact, sends OTP only to the order Customer email, returns a generic request message, and issues a short-lived order-scoped proof after OTP verification. Gemini/n8n must not look up orders or relay order details. OTP/challenge/proof/rate-limit stores are process-local maps today; multi-instance/restart durability and distributed rate limits are NOT_VERIFIED and should be addressed before horizontally scaled activation.

## Offline n8n candidate review (not imported or modified)

The offline candidate `WebPhone - seven fixes OFFLINE candidate (review before import).json` contains product API reads, but its general `GET /api/products` path can include inactive products. It also has a quote path that prepares quote totals/HTML, calls Gotenberg, and POSTs a PDF to the retired public `/api/chatbot/quotation-files` endpoint. It must not be imported as-is. The retired upload returns 410 and filename download returns 404. The Backend now rejects any chatbot file response and strips `download_url`, quote number, total and success claims.

Before a future workflow import, remove/disable the quote calculation, HTML/PDF and legacy upload nodes. Keep n8n limited to intent/ranking and FAQ; use Backend catalog data for advice, and let authenticated Frontend/API calls create/requote/confirm a formal quotation. Use IDs only between the suggestion and catalog adapter. Do not pass Customer JWT or PII into Gemini/n8n.

The live n8n MAIN workflow ID `5319a575-90d2-4894-9ece-355d9528b732` was not accessible through an available n8n MCP connector in this session: MAIN status is **NOT_VERIFIED**. No live workflow was read or changed.

## Notification recommendation

Quotation/order conversion should record an outbox event inside the same database transaction as the state transition, with a stable event ID, aggregate/version, event type, recipient reference, payload snapshot, created/delivered timestamps, attempt count and delivery error. A worker sends email/notification after commit and marks delivery; unique event identity and consumer deduplication make retries safe. Do not send a success email before commit and do not promise exactly-once delivery. This phase adds no outbox schema or migration; email/notification delivery for quotation conversion is not activated or verified.

## Manual end-to-end checklist (after chatbot and activation approvals)

1. Confirm a DB backup/restore point and have the approved migration plan reviewed; run no migration until the owner authorizes it.
2. Verify unauthenticated guest chat works. With test-only non-PII text, inspect browser Network and n8n execution data to confirm there is no JWT/profile-derived Customer ID/contact; remember user-entered text/history is forwarded and must be treated as potentially sensitive.
3. Ask for an active and an inactive product. Confirm only active catalog products are shown and card prices match the Backend product page at the same time. Change a price/campaign between requests and verify the next response updates; do not use chat text as price evidence.
4. Try a quote as guest. It must not claim creation or offer a PDF. After the authenticated creation UI/API is approved and activated, create a quote and verify Backend totals, 24-hour expiry, Customer ownership, private PDF and no public URL.
5. Change a variant price/campaign/shipping outcome before Staff approval. Verify no Order is created, old snapshot is preserved, a new version is issued, and the Customer must confirm that version before Staff can approve.
6. Re-submit the same Customer confirmation and Staff approval. Verify idempotent responses, one quotation-linked Order, one Payment and one stock/promo reservation. Concurrent PostgreSQL verification remains necessary; mocks do not prove database concurrency.
7. Try Customer A against Customer B's quote/PDF and unassigned Staff against the same quote/PDF; expect denial. Verify assigned Staff and authorized Admin according to policy.
8. Confirm one notification per committed transition with retry/dedup behavior before enabling any outbox worker. Do not use a real order for this checklist unless the owner explicitly schedules live E2E.
9. Test order lookup with wrong code/contact, correct code/contact, OTP expiry, replay and repeated requests. Confirm generic responses, no data before proof, and only the requested order is visible after OTP.

## Validation status

Mock tests cover: n8n identity boundary, quote/file fail-closed sanitization, product-ID-only handoff, Backend active-catalog filtering and pricing, and OTP proof replay. They do not prove live n8n behavior, PostgreSQL concurrency, reverse proxy rules, email delivery, or visual PDF rendering.
