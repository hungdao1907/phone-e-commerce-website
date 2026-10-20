import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { JWT_SECRET } from '../config/auth';

export const CHATBOT_UPSTREAM_TIMEOUT_MS = 90_000;
export const CHATBOT_LEASE_SECONDS = 180;
const HISTORY_LIMIT = 6;
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const signingKey = crypto.createHmac('sha256', JWT_SECRET).update('webphone-chat-session-v1').digest();

export type ChatLease = { conversationId: string; turnId: string; token: string; version: bigint };
export type ChatSnapshot = { history: Array<{ role: 'user' | 'assistant'; content: string }>; state: Record<string, unknown> | null };
export type ChatClaim =
  | { kind: 'claimed'; lease: ChatLease; snapshot: ChatSnapshot; requestId: string; reclaimedExpiredLease: boolean }
  | { kind: 'busy' }
  | { kind: 'conflict' }
  | { kind: 'completed'; response: Record<string, unknown>; requestId: string };

export function signChatSession(sessionId: string): string {
  const payload = Buffer.from(JSON.stringify({ v: 1, sid: sessionId, nonce: crypto.randomUUID(), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS })).toString('base64url');
  const signature = crypto.createHmac('sha256', signingKey).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyChatSession(sessionId: string, token: unknown): boolean {
  if (typeof token !== 'string' || token.length > 512) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const expected = crypto.createHmac('sha256', signingKey).update(parts[0]).digest();
  let actual: Buffer;
  try { actual = Buffer.from(parts[1], 'base64url'); } catch { return false; }
  if (actual.toString('base64url') !== parts[1] || actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    return payload.v === 1 && payload.sid === sessionId && Number.isSafeInteger(payload.exp) && payload.exp > Date.now() / 1000;
  } catch { return false; }
}

async function releaseClaim(tx: Prisma.TransactionClient, lease: ChatLease): Promise<void> {
  await tx.$executeRaw`
    UPDATE "ChatConversation" SET "leaseToken" = NULL, "leaseExpiresAt" = NULL
    WHERE "id" = ${lease.conversationId} AND "leaseToken" = ${lease.token} AND "fencingVersion" = ${lease.version}
  `;
}

export async function claimChatTurn(sessionId: string, requestId: string, content: string, database: typeof prisma = prisma): Promise<ChatClaim> {
  const requestHash = crypto.createHash('sha256').update(content).digest('hex');
  return database.$transaction(async (tx): Promise<ChatClaim> => {
    // Prisma 5 can emulate an empty-update upsert with SELECT + INSERT, racing on
    // a new session across instances. PostgreSQL resolves creation atomically;
    // the following statement sees the winning row under READ COMMITTED.
    await tx.chatConversation.createMany({ data: [{ sessionId }], skipDuplicates: true });
    const conversation = await tx.chatConversation.findUniqueOrThrow({ where: { sessionId }, select: { id: true } });
    const token = crypto.randomUUID();
    // Read context from the UPDATE after acquiring the row, never from a pre-claim snapshot.
    // clock_timestamp() also advances while a statement waits; transaction-start time does not.
    const rows = await tx.$queryRaw<Array<{ id: string; fencingVersion: bigint; context: Prisma.JsonValue; reclaimedExpiredLease: boolean }>>`
      WITH "candidate" AS (
        SELECT "id", ("leaseToken" IS NOT NULL AND "leaseExpiresAt" <= clock_timestamp()) AS "reclaimedExpiredLease"
        FROM "ChatConversation" WHERE "id" = ${conversation.id}
      )
      UPDATE "ChatConversation" AS "conversation"
      SET "leaseToken" = ${token}, "leaseExpiresAt" = clock_timestamp() + ${CHATBOT_LEASE_SECONDS} * INTERVAL '1 second',
          "fencingVersion" = "conversation"."fencingVersion" + 1, "updatedAt" = clock_timestamp()
      FROM "candidate"
      WHERE "conversation"."id" = "candidate"."id"
        AND ("conversation"."leaseToken" IS NULL OR "conversation"."leaseExpiresAt" <= clock_timestamp())
      RETURNING "conversation"."id", "conversation"."fencingVersion", "conversation"."context", "candidate"."reclaimedExpiredLease"
    `;
    if (rows.length !== 1) return { kind: 'busy' };
    const lease: ChatLease = { conversationId: conversation.id, turnId: '', token, version: rows[0].fencingVersion };

    // Re-read only AFTER claiming: another attempt may have completed while this one waited.
    const existing = await tx.chatTurn.findUnique({ where: { conversationId_requestId: { conversationId: conversation.id, requestId } } });
    if (existing && existing.requestHash !== requestHash) {
      await releaseClaim(tx, lease);
      return { kind: 'conflict' };
    }
    if (existing?.status === 'COMPLETED') {
      if (!existing.response || typeof existing.response !== 'object' || Array.isArray(existing.response)) {
        throw new Error('Completed chat turn is missing its replay response');
      }
      await releaseClaim(tx, lease);
      return { kind: 'completed', response: existing.response as Record<string, unknown>, requestId: existing.requestId };
    }
    const effectiveRequestId = requestId;

    // An expired owner cannot commit. Its unmatched user turn is excluded from future history.
    await tx.chatTurn.updateMany({ where: { conversationId: conversation.id, status: 'PENDING', NOT: { requestId: effectiveRequestId } }, data: { status: 'FAILED' } });
    // Retrying an old failed user turn must not put it before newer committed turns. Order pairs
    // by their successful fencing version, not by the original user message creation timestamp.
    const previousTurns = await tx.chatTurn.findMany({
      where: { conversationId: conversation.id, status: 'COMPLETED' },
      orderBy: { completedVersion: 'desc' }, take: Math.ceil(HISTORY_LIMIT / 2),
      select: { messages: { select: { role: true, content: true } } }
    });
    const completedHistory: ChatSnapshot['history'] = previousTurns.reverse().flatMap(turn =>
      ['user', 'assistant'].flatMap(role => turn.messages.filter(message => message.role === role)
        .map(message => ({ role: role as 'user' | 'assistant', content: message.content }))));
    const legacyHistory = completedHistory.length < HISTORY_LIMIT
      ? await tx.chatMessage.findMany({ where: { conversationId: conversation.id, turnId: null },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: HISTORY_LIMIT - completedHistory.length,
          select: { role: true, content: true } }) : [];
    const turn = existing
      ? await tx.chatTurn.update({ where: { id: existing.id }, data: { status: 'PENDING' } })
      : await tx.chatTurn.create({ data: { conversationId: conversation.id, requestId: effectiveRequestId, requestHash } });
    if (!existing) await tx.chatMessage.create({ data: { conversationId: conversation.id, turnId: turn.id, role: 'user', content } });
    const context = rows[0].context;
    return {
      kind: 'claimed',
      requestId: effectiveRequestId,
      reclaimedExpiredLease: rows[0].reclaimedExpiredLease,
      lease: { ...lease, turnId: turn.id },
      snapshot: {
        history: [...legacyHistory.reverse().filter((item): item is { role: 'user' | 'assistant'; content: string } => item.role === 'user' || item.role === 'assistant'),
          ...completedHistory].slice(-HISTORY_LIMIT),
        state: context && typeof context === 'object' && !Array.isArray(context) ? context as Record<string, unknown> : null
      }
    };
  }, { maxWait: 2000, timeout: 5000 });
}

/** Refresh the lease immediately before dispatching slow upstream work. A lease that
 * expired during local catalog preparation, or was reclaimed by another instance,
 * must never be used to start a stale n8n execution. */
export async function renewChatLeaseBeforeDispatch(lease: ChatLease, database: typeof prisma = prisma): Promise<boolean> {
  const changed = await database.$executeRaw`
    UPDATE "ChatConversation"
    SET "leaseExpiresAt" = clock_timestamp() + ${CHATBOT_LEASE_SECONDS} * INTERVAL '1 second'
    WHERE "id" = ${lease.conversationId} AND "leaseToken" = ${lease.token}
      AND "fencingVersion" = ${lease.version} AND "leaseExpiresAt" > clock_timestamp()
  `;
  return changed === 1;
}

export async function completeChatTurn(
  lease: ChatLease, content: string, state: Prisma.InputJsonObject | null,
  response: Record<string, unknown>, database: typeof prisma = prisma
): Promise<boolean> {
  return database.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      UPDATE "ChatConversation"
      SET "context" = CASE WHEN ${state ? JSON.stringify(state) : null}::jsonb IS NULL THEN "context" ELSE ${state ? JSON.stringify(state) : null}::jsonb END,
          "leaseToken" = NULL, "leaseExpiresAt" = NULL, "updatedAt" = clock_timestamp()
      WHERE "id" = ${lease.conversationId} AND "leaseToken" = ${lease.token}
        AND "fencingVersion" = ${lease.version} AND "leaseExpiresAt" > clock_timestamp()
      RETURNING "id"
    `;
    if (rows.length !== 1) return false;
    if (content.trim()) await tx.chatMessage.create({ data: { conversationId: lease.conversationId, turnId: lease.turnId, role: 'assistant', content: content.trim() } });
    const changed = await tx.$executeRaw`
      UPDATE "ChatTurn" SET "status" = 'COMPLETED', "response" = ${JSON.stringify(response)}::jsonb,
          "completedAt" = clock_timestamp(), "completedVersion" = ${lease.version}
      WHERE "id" = ${lease.turnId} AND "conversationId" = ${lease.conversationId} AND "status" = 'PENDING'
    `;
    if (changed !== 1) throw new Error('Chat turn completion invariant failed');
    return true;
  }, { maxWait: 2000, timeout: 5000 });
}

export async function abandonChatTurn(lease: ChatLease, database: typeof prisma = prisma, releaseNow = false): Promise<void> {
  await database.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      UPDATE "ChatConversation"
      SET "leaseToken" = CASE WHEN ${releaseNow} THEN NULL ELSE "leaseToken" END,
          "leaseExpiresAt" = CASE WHEN ${releaseNow} THEN NULL ELSE "leaseExpiresAt" END
      WHERE "id" = ${lease.conversationId} AND "leaseToken" = ${lease.token} AND "fencingVersion" = ${lease.version}
      RETURNING "id"
    `;
    if (rows.length === 1) await tx.chatTurn.updateMany({ where: { id: lease.turnId, status: 'PENDING' }, data: { status: 'FAILED' } });
  }, { maxWait: 2000, timeout: 5000 });
}
