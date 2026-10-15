-- DRAFT ONLY. Do not apply until the existing incomplete migration history,
-- schema rollout order, and Quotation API activation are reviewed and approved.
-- Claims deliberately have no TTL: an existing quotation must remain addressable
-- by the same Customer/key for as long as that quotation is retained.
CREATE TABLE "QuotationCreateIdempotency" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuotationCreateIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuotationCreateIdempotency_customerId_keyHash_key"
  ON "QuotationCreateIdempotency"("customerId", "keyHash");
CREATE UNIQUE INDEX "QuotationCreateIdempotency_quotationId_key"
  ON "QuotationCreateIdempotency"("quotationId");
CREATE INDEX "QuotationCreateIdempotency_customerId_createdAt_idx"
  ON "QuotationCreateIdempotency"("customerId", "createdAt");

ALTER TABLE "QuotationCreateIdempotency"
  ADD CONSTRAINT "QuotationCreateIdempotency_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "QuotationCreateIdempotency_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
