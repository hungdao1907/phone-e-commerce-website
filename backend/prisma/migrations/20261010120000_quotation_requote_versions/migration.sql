-- DRAFT ONLY. Do not apply until quotation versioning, API rollout, and
-- database activation are explicitly approved. The existing quotation draft
-- migration is also unexecuted in this repository state.

ALTER TYPE "QuotationStatus" ADD VALUE 'CUSTOMER_REJECTED' BEFORE 'EXPIRED';

ALTER TABLE "Quotation"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "previousVersionId" TEXT,
  ADD COLUMN "requoteReason" TEXT,
  ADD COLUMN "customerRejectedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Quotation_previousVersionId_key"
  ON "Quotation"("previousVersionId");

ALTER TABLE "Quotation"
  ADD CONSTRAINT "Quotation_previousVersionId_fkey"
  FOREIGN KEY ("previousVersionId") REFERENCES "Quotation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
