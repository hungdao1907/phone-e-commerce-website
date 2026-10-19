-- Recipient snapshots are optional for existing records and legacy clients.
-- Account identity and Customer relations remain unchanged. No backfill is needed.
ALTER TABLE "Order" ADD COLUMN "recipientName" TEXT;
ALTER TABLE "Quotation" ADD COLUMN "recipientName" TEXT;
