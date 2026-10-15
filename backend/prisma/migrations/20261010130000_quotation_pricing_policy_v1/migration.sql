-- DRAFT ONLY. Depends on 20261009180000_quotation_foundation being reviewed/applied.
-- Do not execute before the user approves database activation.
ALTER TABLE "Quotation"
  ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT 'delivery',
  ADD COLUMN "promoCodeId" TEXT;

CREATE INDEX "Quotation_promoCodeId_idx" ON "Quotation"("promoCodeId");

ALTER TABLE "Quotation"
  ADD CONSTRAINT "Quotation_promoCodeId_fkey"
  FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
