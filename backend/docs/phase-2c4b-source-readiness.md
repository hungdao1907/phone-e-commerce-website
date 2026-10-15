# Phase 2C.4B — source and activation readiness

Status: source-only review and mock tests. No PostgreSQL test database was created, no live database was queried or changed, no migration was executed, and Prisma Client was not regenerated.

## Migration tree review

The current source tree contains these migration directories, in order:

1. `0_rebaseline_current_production/migration.sql`
2. `20261004123000_add_chat_conversation_context/migration.sql`
3. `20261007130000_account_bound_quotations/` — **no `migration.sql`**
4. `20261009180000_quotation_foundation/migration.sql`
5. `20261010120000_quotation_requote_versions/migration.sql`
6. `20261010130000_quotation_pricing_policy_v1/migration.sql`
7. `20261010140000_checkout_idempotency/migration.sql`

The quotation, requote, pricing and checkout-idempotency SQL files are drafts and depend on the current schema/history. The empty `20261007130000_account_bound_quotations` directory was preserved as found. It was not populated, renamed, deleted or inferred to have been applied. The applied `_prisma_migrations` history, database drift and purpose of that placeholder are **NOT_VERIFIED**. Do not deploy this migration tree until an owner reconciles the placeholder against the real migration history and target schema. Do not edit SQL that may already have been applied; use an approved forward migration if a correction is needed.

`backend/prisma/migrations/migration_lock.toml` is also absent from the inspected source tree. Confirm the expected provider/lock-file state using the repository's approved Prisma workflow before activation. The `0_rebaseline_current_production` migration must not be assumed safe for a fresh or already-managed database merely because it is first in the directory list.

The current draft relationships are additive/conservative in intent: existing Orders retain nullable quotation links; `Order.quotationId`, quotation numbers/review keys/file keys, previous-version links, and checkout `(customerId,keyHash)` have unique constraints. The checkout record's `orderId` is nullable/unique, uses `SET NULL` on Order deletion, and Customer deletion cascades only the technical idempotency metadata. The pricing migration defaults `deliveryMethod` to `delivery`; if Quotation rows can exist between migration steps, this may misclassify pickup. Resolve that with a reviewed backfill/rollout rather than guessing from addresses.

## Direct Checkout idempotency source

`POST /api/orders` now has a source integration around the existing Serializable transaction. It remains **NOT_ACTIVATED** by default: the backend requires `CHECKOUT_IDEMPOTENCY_ENABLED=true` to use the new table, while the frontend requires `VITE_CHECKOUT_IDEMPOTENCY_ENABLED=true` at build time to persist/send keys. Both flags must be coordinated only after the migration is approved and applied and Prisma Client is regenerated. With the backend flag off, a request carrying a key fails closed with `503 IDEMPOTENCY_NOT_ACTIVATED`; a request without the header continues the existing checkout contract. If the backend flag is on, a missing/invalid key is rejected.

The key is CSPRNG-generated in the browser, scoped to the authenticated Customer on the server, validated as 16–128 URL-safe characters, and stored server-side only as SHA-256. The browser stores only the key, a SHA-256 intent fingerprint, and the stable estimated-delivery timestamp in session storage; it does not store address, phone or note. Same-payload retries reuse the key and timestamp; a changed checkout intent rotates the key. A successful response clears the matching pending key.

The backend claims `(customerId,keyHash)` first in the same Serializable transaction as current-price verification, stock reservation, Order, OrderItem, Payment, promo usage and the final `orderId` link. A unique-key collision is handled only after the losing transaction has rolled back. Same payload returns the existing Customer-owned Order with HTTP 200 and `code: ORDER_REPLAYED`; changed payload returns 409. New Order returns HTTP 201 and `code: ORDER_CREATED`. Replay suppresses post-commit email/notification dispatch. Only the known Prisma `P2034` Serializable conflict is retried, up to three complete transactions; Order-code collision retains its separate bounded retry. Other unique failures are not swallowed.

The signed pricing confirmation is intentionally excluded from the idempotency payload fingerprint, so expiry/refresh of the confirmation does not change the identity of the checkout intent. On a first execution, price confirmation is still verified inside the transaction; a rejected/expired confirmation rolls back the claim and all writes. An already-committed checkout can therefore replay without attempting to recreate stock, promo usage, Order or Payment.

This is not yet a guarantee in any running environment. There is no retention/expiry job for idempotency rows; approve retention before activation. The response reuses the current Order representation rather than storing a byte-for-byte response snapshot. PostgreSQL unique-index/SSI behavior and real concurrent requests remain **DB_CONCURRENCY_NOT_VERIFIED**. Do not describe mock tests as proof of race-free database operation.

## Quotation composition, access and notification review

- `backend/src/index.ts` does not import or mount the prepared Quotation routers. Keep them unmounted until the database rollout and activation review are approved.
- The router factory is composed as separate Customer, Staff and Admin routers. Customer reads/PDF operations scope by authenticated `customerId`; Staff list/detail/PDF/approval require the assigned staff ID; Admin assignment requires an Admin/Superadmin role and a target user whose role is `staff`.
- PDF paths use private storage, authorization-scoped DB lookup, root/path containment, size and SHA-256 verification, and `private, no-store`. Express public `/uploads` blocks quotation path segments, including repeated URL decoding. Reverse-proxy/static-host behavior is **NOT_VERIFIED**; the repository has no backend proxy configuration. `frontend/vercel.json` is not evidence of backend upload routing.
- Legacy chatbot quotation-file routes return 410 for the disabled upload path and 404 for filename downloads. Deployed n8n MAIN usage is **NOT_VERIFIED**; do not reopen a public PDF endpoint or edit/publish MAIN. If MAIN depends on the legacy routes, design an authenticated adapter before activation.
- Quotation workflow source has no durable notification outbox. Direct Order email and notification remain after commit; the idempotent replay guard avoids duplicate sends for request replay, but a process crash after commit and before dispatch can lose a notification. Recommend a future transactional outbox with a unique `(aggregateId,eventType)` and idempotent worker delivery before promising exactly-once notifications.

## Activation checklist for a later, explicitly approved phase

1. Confirm the target environment and obtain a backup whose restore has been verified; do not rely on a backup file merely existing.
2. Read the target `_prisma_migrations` history and inspect actual schema/index/FK state. Reconcile the empty migration directory, absent lock file, rebaseline intent and any drift before generating or deploying SQL.
3. Review all draft SQL against the target provider/version and a schema diff. Decide the delivery-method backfill and idempotency retention policy. Prepare a rollback/forward-fix plan; the enum addition is not a simple reversible change.
4. Have the database owner explicitly approve the migration set. Apply only through the approved deployment process—never `db push`, reset, or an unreviewed `migrate dev` against the application database.
5. Regenerate Prisma Client from the reviewed schema in the build/release environment, build backend and frontend, then deploy the coordinated backend/frontend feature flags disabled.
6. Verify migration status, constraints, and application health without creating business records. Enable the backend idempotency flag and frontend build flag together only after the DB/client rollout is confirmed.
7. Follow `phase-2c4b-manual-e2e-checklist.md` on the user's approved website environment after the Chatbot work is complete. No separate PostgreSQL test database is part of this plan.

## Verification boundary

The automated suites in this phase use mocks only. They verify source control flow, canonical payload/key behavior, rollback assumptions represented by the mock, response contract logic, and that replay can be distinguished for side-effect suppression. They do **not** verify PostgreSQL locks, transaction isolation, physical migrations, reverse proxy behavior, deployed n8n dependencies, or production notification delivery.
