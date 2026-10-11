# Phase 2D.3 — Quotation Create Idempotency & n8n Readiness

Status: source prepared; Quotation API remains unmounted; schema/migration are draft-only. No database was read or modified.

## Customer Create contract

- Authenticated Customer calls `POST /api/quotations` with `Authorization: Bearer …` and an opaque `Idempotency-Key` (16–128 URL-safe characters). Customer identity comes only from the verified principal; client prices and `customerId` are rejected by the DTO.
- A new key creates one Backend-priced Quotation. The quote snapshot and `(customerId, keyHash, requestHash, quotationId)` record are written in one Serializable transaction. Only the key hash is persisted; the raw key is not logged or stored server-side.
- Same Customer + same key + normalized same payload returns the same Quotation. Same key with a different normalized request returns HTTP 409 `IDEMPOTENCY_KEY_PAYLOAD_MISMATCH`; a bounded serialization-conflict exhaustion returns 409 `IDEMPOTENCY_REQUEST_IN_PROGRESS`. A recovery read failure returns 503 `IDEMPOTENCY_RESULT_UNCERTAIN`; retry the exact payload with the same key.
- Create and replay preserve the existing `{ quotation }` response shape and HTTP 201. The initial DTO is projected from the committed transaction result; replay loads the linked quotation through the scoped key. No post-commit `quotation.findFirst` is required.
- Keys are retained while their quotation exists; expiry at 24 hours does not release the key. Both Customer and Quotation foreign keys use `RESTRICT` in the draft schema, preventing silent loss of the replay record.
- No PDF, email, notification, n8n call, or other external effect runs inside the transaction or as part of Create. Private PDF generation remains an explicit authorized backend action for a specific stored quotation snapshot.

The in-memory frontend intent holds a CSPRNG key and a canonical request signature only while the form is mounted. It synchronously blocks duplicate submit handlers, reuses a key for an unchanged retry, and rotates it when the submitted payload changes. It does not put the key, PII, JWT, or OTP in sessionStorage. A page reload loses address/phone and the in-memory key; cross-reload recovery is therefore not promised by this UI. Before submitting again after a reload/uncertain response, the Customer should check their quotation list. Durable server-side replay still works if the caller retains the same key and payload.

## n8n contract audit

- No read-only n8n MCP connector was available. MAIN workflow `5319a575-90d2-4894-9ece-355d9528b732`: **NOT_VERIFIED**. No workflow was edited, imported, activated, or published.
- The checked-in offline candidate is not safe to import as-is: it still contains Gotenberg PDF creation, an `Upload Quotation PDF` node calling `POST /api/chatbot/quotation-files`, and a `Prepare Quotation Response` branch that can claim success from an upload/download URL. Backend legacy behavior is POST **410 Gone**, filename GET **404**. The chatbot response sanitizer also converts quotation/file claims to `NOT_ACTIVATED`; these guards should remain in place until the backend contract is activated.
- Target boundary: n8n may advise, suggest catalog product IDs, and explain status returned by Backend. Only authenticated Customer UI submits selected variants/quantities to Backend. Backend validates ownership/catalog, prices, persists the quotation, creates private PDF, and owns approval/order conversion. n8n must not calculate authoritative price, create Customer identity/Quotation/Order, claim success without Backend confirmation, or return a public PDF URL.
- An adapter is still needed after separate review: n8n should hand off product suggestions to the authenticated WebPhone UI, not call the private Quotation Create API as an anonymous workflow. Do not re-enable the legacy upload endpoint.

## Security and notification findings

- Customer Create authorization uses the authenticated Customer principal and the idempotency lookup is scoped by that principal. Raw keys are hashed; normalized payload fingerprints are SHA-256 digests and are never logged. A same raw key under another Customer creates an independent scoped claim and cannot reveal the first Customer's quotation.
- The chatbot forwards message/history/conversation state to n8n without JWT or authenticated Customer ID. Secret-field and token/OTP-pattern redaction exists but is not comprehensive PII scrubbing; free-text phone, email, or address may still be present. The browser sends only message and session ID. Avoid placing OTP or sensitive contact/payment data in chat; do not represent the current regex as full PII protection.
- Order tracking uses 6-digit OTP, 5-minute challenge, 1-minute resend cooldown, 5 verification attempts, request limits of 10 per IP/fingerprint per 10 minutes, verification limit of 12 per challenge/IP per 10 minutes, and a 10-minute proof. The rate-limit/challenge stores are process memory, so restart/multi-instance consistency is not established. Registration OTP has a persisted hashed challenge and resend cooldown; no separate per-IP throttle was found in the reviewed route.
- No Customer Quotation Create-specific rate limiter was found. Add a shared edge/API limit (per account and IP) before mounting the route; do not rely on process-local maps for multi-instance enforcement.
- Recommended future transactional outbox: create outbox rows in the same transaction as state changes, with immutable event ID and unique `(eventType, aggregateId, aggregateVersion)` or equivalent dedupe key. Consumers should be at-least-once and idempotent; delivery is not exactly-once. Events: `quotation.created`, `quotation.customer_confirmation_required`, `quotation.needs_requote`, `quotation.staff_approved`, `quotation.staff_rejected`, `order.created`. Outbox/worker/email are **NOT_ACTIVATED** and no real email was sent.

## Database and activation blockers

1. The repository contains an empty `20261007130000_account_bound_quotations` migration directory with no `migration.sql`. It was not filled or removed. `migration_lock.toml` exists and says PostgreSQL. Applied migration history is **NOT_VERIFIED** because no database inspection is allowed.
2. Quotation migrations in this worktree are draft/untracked and have not been reconciled against production history. The new `20261010150000_quotation_create_idempotency` SQL is additive and depends on the Quotation foundation. Do not execute the chain until the missing directory/history and all draft ordering are reviewed.
3. The V1 delivery migration defaults existing Quotation rows to `delivery`; no database was inspected and no pickup backfill is present. Confirm any historical pickup representation and prepare a reviewed backfill before activation rather than silently classifying old data.
4. Prisma schema now includes `QuotationCreateIdempotency`; migration and generated Prisma Client are not activated. `prisma generate` was intentionally not run. Validate schema only; regenerate the Client only after the migration sequence is approved and applied in the intended environment.
5. Direct Checkout idempotency remains gated by `CHECKOUT_IDEMPOTENCY_ENABLED === 'true'`; the draft table is not active. Do not enable the flag until the Checkout migration is applied and verified.
6. Quotation routers are still not imported/mounted by `backend/src/index.ts`. Do not mount until migration, generated client, rate limiting, ownership/assignment, private storage/proxy, and end-to-end checks are ready.
7. Reverse-proxy/static hosting access to private quotation storage is **NOT_VERIFIED**. Legacy n8n route remains closed (410/404); n8n MAIN compatibility is **NOT_VERIFIED**.
8. Notification outbox/worker is absent and not activated.

## Safe activation / manual E2E sequence for a later approved phase

1. Review and reconcile the complete Prisma migration history with the DBA; back up the database and verify restore before applying any draft. Resolve the empty migration directory without rewriting applied history.
2. Review delivery/pickup legacy data and any required backfill; review foreign-key retention, the Quotation idempotency table, Checkout idempotency table, and rollback plan.
3. In an approved maintenance window, apply only the reviewed migration sequence, verify `_prisma_migrations`, then run Prisma Client generation/build against the intended schema. This Phase did not do these steps.
4. Keep Quotation API unmounted and Checkout flag off until DB constraints, application schema, rate limits, reverse-proxy private paths, and backups are verified. Then activate behind explicit deployment approval.
5. On the website, test authenticated Customer A creation; inspect that response contains a Backend snapshot; replay same key/payload and confirm same quotation ID; replay same key with changed payload and confirm 409; submit simultaneous same-key requests and verify one quotation; simulate timeout and retry same key; use Customer B to verify no cross-customer disclosure.
6. Verify unauthorized/list/detail/PDF access boundaries, Customer confirmation/decline, NEEDS_REQUOTE and reconfirmation, Staff assignment/approval, Order conversion, and that an order retains its transaction snapshot. Verify no direct Checkout or Quotation writes originate from n8n.
7. Test n8n only against an offline candidate and a non-production API contract. Remove the legacy upload/public URL success path and require Backend-confirmed state before any customer-facing “created” message. Review MAIN separately; do not import/publish implicitly.
8. Confirm notification delivery with idempotent outbox consumers (if implemented), and test duplicate event delivery. Do not claim exactly-once.
