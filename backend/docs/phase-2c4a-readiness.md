# Phase 2C.4A readiness notes

Status note: this Phase 2C.4A record is superseded where it conflicts with `phase-2c4b-source-readiness.md`. In Phase 2C.4B, no PostgreSQL test database was created, no database was queried or changed, no migration was executed, Prisma Client was not regenerated, and Quotation API remains unmounted.

## Migration sequence and data safety

Tracked migration order in the current migration tree is:

1. `0_rebaseline_current_production`
2. `20261004123000_add_chat_conversation_context`
3. `20261009180000_quotation_foundation` (draft)
4. `20261010120000_quotation_requote_versions` (draft; depends on the Quotation enum/table)
5. `20261010130000_quotation_pricing_policy_v1` (draft; depends on the Quotation table and PromoCode)
6. `20261010140000_checkout_idempotency` (draft; depends on Customer and Order)

The `20261007130000_account_bound_quotations` directory currently contains no `migration.sql`; it is not an executable migration. Do not infer that it ran.

Quotation foundation adds nullable `Order.quotationId` and `assignedStaffId`. On a clean upgrade, existing Order rows get NULL for the new quotation link, so the unique nullable `quotationId` index does not collide. `quoteNumber`, `QuotationReview.idempotencyKey`, and `QuotationFile.storageKey` are unique on newly created tables. Requote `previousVersionId` is nullable and unique, so existing version-1 rows can coexist. Before activation, verify the actual target database migration history and check for any manually-added/backfilled columns or duplicate non-NULL values in an isolated copy; this review intentionally did not inspect a live database.

Foreign-key behavior in the drafts is mostly conservative: Customer/Quotation/Review/File/Order references use RESTRICT; assigned Staff and deleted Catalog rows use SET NULL; QuotationItem rows cascade only with their parent quotation. The pricing draft's `deliveryMethod NOT NULL DEFAULT 'delivery'` can classify pre-existing pickup quotations incorrectly if a database is allowed to contain quotations between migration steps. Apply the quotation migrations as one reviewed rollout, or add an approved data backfill before enforcing that default. Do not infer pickup from free-form addresses.

`ALTER TYPE "QuotationStatus" ADD VALUE 'CUSTOMER_REJECTED'` is a PostgreSQL enum change. PostgreSQL version, migration transaction behavior, actual `_prisma_migrations` state, constraints and data compatibility remain DB_NOT_VERIFIED. No rollback SQL is provided; recovery requires a verified backup and forward-fix plan because enum values are not safely removed by a simple reverse migration.

The schema draft has `Order.orderCode @unique`, nullable unique `Order.quotationId`, unique `QuotationReview.idempotencyKey`, unique quotation `previousVersionId`, and private `QuotationFile.storageKey @unique`. No migration here alters existing Payment/Order financial columns. The newly added checkout-idempotency table uses a unique `(customerId, keyHash)`, a unique nullable `orderId`, Customer CASCADE (only technical hashes are removed with a deleted account) and Order SET NULL. Keeping the key row after Order deletion prevents silently creating a second order with the same key; replay after that deletion returns a generic unavailable response.

## Direct Checkout idempotency

Before this phase, `/api/orders` accepted no durable idempotency key. The signed 15-minute pricing confirmation is HMAC-authenticated, expiry-bound, and tied to Customer, normalized cart/quantities, promo, delivery method, and complete current pricing snapshot. A valid token can still be replayed after commit, creating another order if inventory/business rules allow it. The token does not bind non-pricing fields such as address, phone, payment method, note, or requested delivery estimate; the idempotency fingerprint is designed to bind those persisted order inputs too.

`order-idempotency.service.ts` is now wired into `/api/orders` behind `CHECKOUT_IDEMPOTENCY_ENABLED`, which defaults off. The frontend persists/sends a key only behind `VITE_CHECKOUT_IDEMPOTENCY_ENABLED`, also disabled unless explicitly set at build time. When enabled after approved migration and Prisma Client generation, the service claims `(customerId,keyHash)` in the same Serializable transaction as stock, promo, Order, OrderItem and Payment writes. Same-key/same-payload replay returns the existing Order; changed payload returns 409. Replay suppresses post-commit email/notification dispatch. Known P2034 transaction conflicts are retried at most three times after rollback; other unique failures are not swallowed. Runtime protection is **NOT_ACTIVATED** until both application flags and database/client rollout are coordinated.

Proposed API contract for activation: require an `Idempotency-Key` header, generate a fresh CSPRNG key per intentional checkout, and reuse it only for transport retries of that same payload. The helper accepts 16–128 URL-safe characters and scopes the hash to the authenticated Customer. There is no expiry/cleanup today: the draft keeps only hashes and an Order reference until the Customer is deleted. Confirm this retention period before activation. Replay returns the same Order identity/current representation, not a frozen byte-for-byte historical HTTP response; exact response archival would duplicate personal data and needs a separate retention decision.

Notification delivery is not transactionally exactly-once today. The future route integration must enqueue an outbox record in the same transaction with unique `(orderId,eventType)` if durable delivery and deduplication across process crashes are required. A simple post-commit `if (!replayed)` guard prevents duplicate notifications on request replay but can lose a notification if the process exits after commit and before send.

No in-memory lock is used. MOCK tests do not prove PostgreSQL unique-index blocking, SSI behavior, deadlock/serialization retry behavior, or rollback semantics under real concurrency. Direct Checkout idempotency is SOURCE_READY_NOT_ACTIVATED; deployment requires migration-history reconciliation, approved migration application, generated Prisma Client, coordinated frontend/backend flags, and user-run website verification.

## Pricing V1 edge cases

Backend catalog pricing compares eligible salePrice and each active target-matched Campaign by resulting unit price; the largest saving wins and only a deterministic specificity/id tie-break is used. Campaign does not stack with salePrice. Invalid active campaign discount data now fails closed. Storefront `effectivePrice` and `activeCampaign` metadata share the same resolver (the product-level campaign label is based on the first variant; each variant's `effectivePrice` remains authoritative). Promo and voucher Reward use best-of; `usageLimit = 0` is unlimited; reward free-shipping competes against cart discount by actual VND savings. Pickup is zero-cost; delivery is 50,000 VND and becomes free when the effective catalog subtotal reaches 25,000,000 VND. Integer VND and flooring are used for percentages.

Direct Checkout and Quotation conversion now share a conditional Promo usage reservation helper. Finite limits use an atomic `usedCount < usageLimit` update predicate; zero-limit promos remain unlimited while still incrementing usage statistics. PostgreSQL concurrent behavior remains NOT_VERIFIED.

## Quotation activation preflight

- Authentication and role/assignment checks are present in source. Customer reads are owner-scoped; Staff approval checks assignment; Admin policy is explicit in the shared authorization helpers.
- Approval rechecks snapshot prices/totals and stock in a Serializable transaction; stale quotations move to NEEDS_REQUOTE and create a version linked by unique `previousVersionId`. Customer confirmation applies to the version ID; prior versions are not revived.
- Conversion uses `Order.quotationId` unique, review idempotency key, transaction rollback, and existing Order lookup after a race. External payment network calls are not made in the conversion transaction; bank-transfer data is locally constructed.
- Private PDF keys are per file and stored outside public uploads by source design. Version-specific file references exist, but actual storage/proxy exposure is NOT_VERIFIED without deployment configuration.
- 24-hour expiry is generated by the V1 backend policy. API router remains prepared but unmounted; no migration is executed and Prisma Client is not regenerated.
- Legacy n8n PDF compatibility must be confirmed from the deployed workflow/export and endpoint logs. This repository review cannot establish whether MAIN currently calls an old 404/410 route; n8n MAIN was not opened or changed.

## Manual website verification

Per the user's updated decision, no separate PostgreSQL test database will be created. After Chatbot completion and explicit database/application activation approval, use `phase-2c4b-manual-e2e-checklist.md` to verify quotation authorization, NEEDS_REQUOTE, private PDF access, direct-checkout pricing, same-key timeout replay, and no duplicate stock/promo/payment effects on the approved website environment. MOCK_PASS is not PostgreSQL concurrency proof.
