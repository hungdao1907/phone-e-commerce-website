-- DRAFT ONLY: owner approval required before applying. Do not edit applied migrations.
-- Generate Prisma Client from updated schema before enabling the updated deletion flow.
-- Keep the existing unique(customerId,keyHash) and RESTRICT FK unchanged.
BEGIN;
ALTER TABLE "public"."QuotationCreateIdempotency" ALTER COLUMN "quotationId" DROP NOT NULL;
COMMIT;
-- Rollback is NOT safe after tombstones exist: never delete keys to restore NOT NULL.
