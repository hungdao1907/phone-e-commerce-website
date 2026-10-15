-- DRAFT ONLY: do not apply until the quotation API, private storage, and rollout
-- plan have been reviewed. All existing Order rows retain NULL quotationId and
-- assignedStaffId; NULL is not a classification of legacy order origin.

CREATE TYPE "QuotationStatus" AS ENUM (
  'PENDING_CUSTOMER_CONFIRMATION',
  'CUSTOMER_CONFIRMED',
  'APPROVED',
  'NEEDS_REQUOTE',
  'REJECTED',
  'EXPIRED',
  'CONVERTED'
);

CREATE TYPE "QuotationReviewDecision" AS ENUM (
  'APPROVED',
  'REJECTED',
  'NEEDS_REQUOTE'
);

CREATE TABLE "Quotation" (
  "id" TEXT NOT NULL,
  "quoteNumber" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "assignedStaffId" TEXT,
  "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING_CUSTOMER_CONFIRMATION',
  "currency" TEXT NOT NULL DEFAULT 'VND',
  "subtotal" INTEGER NOT NULL,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "shippingFee" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
  "shippingAddress" TEXT NOT NULL,
  "shippingPhone" TEXT NOT NULL,
  "note" TEXT,
  "sourceSessionId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "customerConfirmedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "convertedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationItem" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "productId" TEXT,
  "variantId" TEXT,
  "productName" TEXT NOT NULL,
  "variantSku" TEXT,
  "variantAttributes" JSONB NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "originalUnitPrice" INTEGER,
  "saleUnitPrice" INTEGER,
  "lineTotal" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationReview" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "reviewerUserId" TEXT NOT NULL,
  "decision" "QuotationReviewDecision" NOT NULL,
  "note" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuotationReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuotationFile" (
  "id" TEXT NOT NULL,
  "quotationId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuotationFile_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
  ADD COLUMN "quotationId" TEXT,
  ADD COLUMN "assignedStaffId" TEXT;

CREATE UNIQUE INDEX "Quotation_quoteNumber_key" ON "Quotation"("quoteNumber");
CREATE UNIQUE INDEX "QuotationReview_idempotencyKey_key" ON "QuotationReview"("idempotencyKey");
CREATE UNIQUE INDEX "QuotationFile_storageKey_key" ON "QuotationFile"("storageKey");
CREATE UNIQUE INDEX "Order_quotationId_key" ON "Order"("quotationId");

CREATE INDEX "Quotation_customerId_status_createdAt_idx" ON "Quotation"("customerId", "status", "createdAt");
CREATE INDEX "Quotation_assignedStaffId_status_createdAt_idx" ON "Quotation"("assignedStaffId", "status", "createdAt");
CREATE INDEX "Quotation_status_expiresAt_idx" ON "Quotation"("status", "expiresAt");
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");
CREATE INDEX "QuotationItem_variantId_idx" ON "QuotationItem"("variantId");
CREATE INDEX "QuotationReview_quotationId_createdAt_idx" ON "QuotationReview"("quotationId", "createdAt");
CREATE INDEX "QuotationReview_reviewerUserId_createdAt_idx" ON "QuotationReview"("reviewerUserId", "createdAt");
CREATE INDEX "QuotationFile_quotationId_createdAt_idx" ON "QuotationFile"("quotationId", "createdAt");

ALTER TABLE "Quotation"
  ADD CONSTRAINT "Quotation_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Quotation_assignedStaffId_fkey"
    FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuotationItem"
  ADD CONSTRAINT "QuotationItem_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "QuotationItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "QuotationItem_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuotationReview"
  ADD CONSTRAINT "QuotationReview_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "QuotationReview_reviewerUserId_fkey"
    FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuotationFile"
  ADD CONSTRAINT "QuotationFile_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_quotationId_fkey"
    FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Order_assignedStaffId_fkey"
    FOREIGN KEY ("assignedStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
