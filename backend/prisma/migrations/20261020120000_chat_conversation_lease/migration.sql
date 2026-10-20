-- Draft only. Do not apply to production until PostgreSQL integration tests pass.
-- Prisma Migrate on PostgreSQL does not wrap migrations in a transaction by default.
-- Keep this additive DDL atomic so a failure cannot leave a partially-created schema.
BEGIN;

ALTER TABLE "ChatConversation"
  ADD COLUMN "leaseToken" TEXT,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3),
  ADD COLUMN "fencingVersion" BIGINT NOT NULL DEFAULT 0;

CREATE TABLE "ChatTurn" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "response" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "completedVersion" BIGINT,
  CONSTRAINT "ChatTurn_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChatMessage" ADD COLUMN "turnId" TEXT;
CREATE UNIQUE INDEX "ChatTurn_conversationId_requestId_key" ON "ChatTurn"("conversationId", "requestId");
CREATE INDEX "ChatTurn_conversationId_status_completedVersion_idx" ON "ChatTurn"("conversationId", "status", "completedVersion");
CREATE INDEX "ChatMessage_turnId_idx" ON "ChatMessage"("turnId");
ALTER TABLE "ChatTurn" ADD CONSTRAINT "ChatTurn_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_turnId_fkey"
  FOREIGN KEY ("turnId") REFERENCES "ChatTurn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase projects can have broad default privileges in public. The turn ledger is server-only.
REVOKE ALL ON TABLE "ChatTurn" FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "ChatTurn" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "ChatTurn" FROM authenticated;
  END IF;
END $$;

COMMIT;
