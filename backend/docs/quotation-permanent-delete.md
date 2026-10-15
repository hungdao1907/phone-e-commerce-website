# Permanent Quotation deletion

A minimal nullable-quotationId migration and Prisma Client generation are now required for replay tombstones.
Approved migration: 20261011180000_quotation_hard_delete_tombstone (APPLIED on 2026-10-11).
Supabase project: enjxzjlnotedahgzddom; database/schema: postgres/public.
Verified finished_at in _prisma_migrations, local/DB checksum match, nullable column and unchanged unique/FK constraints.
Prisma Client 5.14.0 regenerated; Backend restarted on localhost:3001 with Quotation/Checkout dev flags enabled.
Health/products returned 200; Customer/Admin/Staff Quotation routes and unauthenticated DELETE returned 401.
Actual PostgreSQL service integration: isolated synthetic Customer/Quotation transaction, hard delete retaining
tombstone, old-key create/lookup/recovery 410, fresh-key create and replay PASS. Entire transaction deliberately
rolled back; follow-up reads verified zero fixture Customers, Quotations and claims remained.
This was not authenticated HTTP E2E or concurrent PostgreSQL testing; those remain NOT_VERIFIED.
Applied migrations are untouched. Authentication and route RBAC remain in force. No soft-delete fields are used.

- DELETE /api/admin/quotations/:id: Admin/Superadmin.
- DELETE /api/staff/quotations/:id: assigned Staff only.
- DELETE /api/quotations/:id: authenticated users get 403; Customer cannot delete.

Serializable transaction: lock parent FOR UPDATE; check status, all Orders and nextVersion;
verify nullable quotationId capability; delete QuotationFile metadata → QuotationReview → detach retained
QuotationCreateIdempotency claims (quotationId=NULL) → QuotationItem → Quotation.
Approval/conversion takes the identical parent lock before reading state. Conversion wins: deletion is blocked;
deletion wins: approval returns missing/conflict without reserving stock or creating an Order.
Serializable snapshot conflicts remain 409, never an automatic retry or a partial transaction.
All child deletions are scoped by quotationId. No Order/Payment/Product/Customer write is performed.
Payment has no direct Quotation FK and belongs to Order, so protecting every Order also protects its payments.
nextVersion uses RESTRICT: block instead of unlinking another quotation or deleting a version chain.
The leaf's outgoing previousVersion reference disappears with that leaf; the previous record is not changed.
FK and serialization conflicts return 409 with full rollback; missing/repeated deletion returns 404.

PDF bytes are removed only after DB commit using existing private-root/path validation.
If filesystem cleanup fails, response includes pdfCleanupPending=true and UI warns. Parent/file metadata are gone,
so all protected PDF endpoints return 404. Orphan cleanup is not a database rollback.

Create-idempotency claims survive indefinitely as customer-scoped digest-only tombstones. No quote content,
items, reviews or files survive in these claims. The existing composite unique key and FK remain unchanged.
Create/recovery/lookup with a deleted key returns 410 IDEMPOTENCY_QUOTATION_DELETED and never creates again.
A new intent must use a new key. Do not expire or garbage-collect tombstones without revisiting retry safety.
Keys discarded by the previous deletion implementation cannot be reconstructed; this protects future deletes only.

Activation requires owner approval of the draft, migration execution and Client generation/restart. Until nullable
metadata is present, DELETE returns 503 QUOTATION_DELETE_MIGRATION_REQUIRED before child writes.
Do not roll nullable back once tombstones exist and never discard claims merely to restore NOT NULL.
If an older Client encounters a concurrent detach during relation hydration, recovery may return unavailable;
it must never interpret that error as permission to create a new quote. Generate the updated Client on activation.

PostgreSQL integration acceptance (not executed): in an isolated environment using this schema and services,
coordinate two independent connections with barriers after the parent lock; exercise both arrival orders.
Assert one winning action, loser 404/409, no dangling Order FK, no lost Payment, rollback of every stock/promo
write on loser, retained null claim, old-key 410 and new-key successful create. Repeat DELETE and approval replay.
Do not use production/shared website records for this test. No safe test database was configured this turn.

Regression: 133/133 mock/isolated tests PASS and Backend build PASS after generation.
PostgreSQL approval/deletion concurrency is NOT_VERIFIED. No existing customer quotation was deleted.
