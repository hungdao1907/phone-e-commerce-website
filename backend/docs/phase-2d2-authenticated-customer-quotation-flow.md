# Phase 2D.2 — Authenticated Customer Quotation Flow

## Source contract and activation state

- `POST /api/quotations` is implemented in `src/routes/quotation.routes.ts` but the quotation routers are intentionally not imported or mounted by `src/index.ts`.
- The create body is `{ items: [{ variantId, quantity }], shippingAddress, shippingPhone, paymentMethod, deliveryMethod?, promoCode?, note?, sourceSessionId? }`. This UI sends only `items`, address, phone, `COD`/`BANK_TRANSFER`, and `deliveryMethod: "delivery"`.
- `productId` is useful for resolving a catalog selection, but is not a quotation line identifier. The API requires `variantId`; Backend resolves the active product, authoritative price and stock. Customer identity comes from the authenticated principal, not from the request body or chatbot session.
- The chatbot catalog endpoint returns active products and Backend-computed variant price/stock. n8n suggestions remain product IDs only. No bearer token is sent to the chatbot relay.
- The Customer login handler routes a Customer to `/profile`; the handoff stores only product ID, variant ID and quantity in tab-scoped `sessionStorage`, and the profile opens the quotations tab when this draft exists.
- The quotation UI retains the selection on API/network errors. It reports 404/503 as unavailable and only opens a quotation detail after a valid Backend create response (HTTP 201 payload with a persisted quotation snapshot).

## Workflow continuity reviewed

Source and existing mock suites cover Customer ownership checks, Admin assignment, assigned-Staff access, confirmation/decline, 24-hour expiry, immutable requote versions, stale-price/stock handling, review idempotency, conversion, and one Order per quotation. Private PDF routes scope Customer by owner, Staff by assignment, and Admin/Superadmin by policy; PDF responses use `private, no-store`. Each version is a separate Quotation record, so its PDF is generated from that version's persisted snapshot. These routes remain unavailable until explicit API activation and database readiness.

Staff review/conversion replays are protected by persisted `QuotationReview.idempotencyKey` plus transactional quotation/order checks. Customer `POST /api/quotations` does not currently accept or persist a durable idempotency key. A repeated Customer create request can therefore create a second quotation; the UI's in-flight button guard is not a durable guarantee. The create handler also commits the draft before re-reading it for the response, so a post-commit read failure can return an error even though the quotation exists. Do not describe Customer quotation creation as retry-safe; before activation, decide whether to add a database-backed idempotency record/unique constraint and adjust the create response to avoid that ambiguous outcome.

This is source/mock readiness only. No PostgreSQL test database, live order, migration, API mount, or n8n workflow was used or changed. Database-level concurrency and reverse-proxy behavior remain unverified.

## Chatbot data boundary

The relay receives free-form customer input, bounded history, a guest/session identifier, and workflow state. The relay does not receive the WebPhone JWT from this UI. The Backend now narrowly redacts recognizable Bearer/JWT strings, labeled password/OTP/token values, sensitive workflow-state keys, and quotation-PDF URL paths before forwarding context. This is not general PII detection: names, email addresses, phone numbers, addresses, and secrets written in an unrecognized form can still appear in free text/history. Do not describe the boundary as PII-free.

Order tracking uses a generic request response and contact-bound OTP before issuing an order-scoped proof. The tracking OTP has a five-minute lifetime, one-minute resend cooldown, five verification attempts, request throttles, and a ten-minute proof lifetime. Challenge/proof/rate-limit stores are process-local Maps: multiple instances and restart invalidate or desynchronize this state. Registration OTP uses a five-minute expiry, one-minute resend cooldown, five attempts, a hashed challenge stored on the Customer record, and compare-and-set updates; the reviewed source does not show a separate per-IP registration rate limiter.

## Notification/outbox contract proposal (not activated)

Recommended logical events:

- `quotation.requote_issued` — include quotation/version identifiers and customer ID; request Customer reconfirmation.
- `quotation.staff_approved` and `quotation.staff_rejected` — include quotation/version, decision, and recipient identifiers.
- `order.created` — include order ID/code and customer ID, emitted only for a committed Order.

For reliable delivery, insert an outbox row in the same database transaction as the state transition; publish asynchronously after commit; mark delivery attempts and use a stable event/deduplication key. This supports at-least-once delivery with idempotent consumers, not a claim of exactly-once email. No outbox schema, migration, real email, or notification side effect is added in this phase. Existing Direct Checkout sends its order email only after transaction commit; quotation workflow currently has no durable notification outbox.

## Activation blockers

1. Review and explicitly authorize the pending Quotation/Requote/Pricing/Idempotency migrations; create/backup and verify a recoverable database backup before any activation.
2. Apply migrations only in a separately approved activation step, generate Prisma Client from the reviewed schema, then run isolated/live readiness checks chosen by the user.
3. Mount the three quotation routers with the production private-storage root, authentication, pricing provider, order converter, and assignment policy wired correctly.
4. Verify storage is outside public uploads and verify deployment proxy rules do not expose private storage.
5. Decide whether registration OTP needs an IP/account rate limiter, and whether tracking challenges need shared storage before multi-instance deployment.
6. Review the event/outbox proposal before enabling customer/staff notifications.
7. Perform the user's planned end-to-end website test after chatbot upgrade; no source mock establishes PostgreSQL concurrency or n8n MAIN contract compatibility.
