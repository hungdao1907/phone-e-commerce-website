-- Owner-approved hard-delete replay protection. Keep existing keys and foreign keys.
-- Generate Prisma Client from updated schema before enabling updated deletion flow.
-- Keep the existing unique(customerId,keyHash) and RESTRICT FK unchanged.
BEGIN;
ALTER TABLE "public"."QuotationCreateIdempotency" ALTER COLUMN "quotationId" DROP NOT NULL;
COMMIT;
-- Rollback is NOT safe after tombstones exist: never delete keys to restore NOT NULL.
