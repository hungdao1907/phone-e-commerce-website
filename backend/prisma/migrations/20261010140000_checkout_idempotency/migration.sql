-- DRAFT ONLY. Do not apply until the Direct Checkout API contract and DB rollout
-- have been approved. This table is additive and intentionally contains no order
-- or payment snapshot beyond the immutable Order reference and SHA-256 hashes.
CREATE TABLE "CheckoutIdempotency" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "orderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckoutIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutIdempotency_customerId_keyHash_key"
  ON "CheckoutIdempotency"("customerId", "keyHash");
CREATE UNIQUE INDEX "CheckoutIdempotency_orderId_key"
  ON "CheckoutIdempotency"("orderId");

ALTER TABLE "CheckoutIdempotency"
  ADD CONSTRAINT "CheckoutIdempotency_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "CheckoutIdempotency_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
