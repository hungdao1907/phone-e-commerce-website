# Chatbot Phase 2A — Option A local source review

Status: LOCAL IMPLEMENTATION, NOT RUNTIME VERIFIED. No tests, build, typecheck,
Prisma generate, migration, application startup, or live requests were run for
this completion pass, as requested by the owner. No deployment or Git writes.

## Source behavior

- `POST /api/chatbot/session` issues a new random session ID and a signed guest
  capability before any user message is posted. It performs no database or n8n
  calls. It never signs an arbitrary old session ID. A valid existing capability
  can be renewed for that same session. The HMAC key is derived with a separate
  purpose from the existing application JWT secret; all instances need the same
  secret. Tokens are not forwarded to n8n, stored in the turn ledger, or logged.
- The message route validates ownership before database reads. Missing proof
  returns `409 CHAT_SESSION_UPGRADE_REQUIRED`; invalid/expired proof returns
  `403 CHAT_SESSION_INVALID`. Neither path creates a turn, resets server state,
  or invokes n8n. This is guest capability ownership, not customer JWT/RBAC.
- A short PostgreSQL transaction claims a conversation with a conditional
  `UPDATE`, advances its BIGINT fence, and returns the current context from that
  same statement. Expiry comparisons use `clock_timestamp()`. Context and the
  idempotency record are not taken from a stale pre-claim read.
- Busy claims return `409 CHAT_SESSION_BUSY` and `Retry-After: 5`, without adding
  a user turn or calling n8n. Separate conversation rows are independent.
- A unique `(conversationId, requestId)` record binds the request to a content
  hash. A completed retry replays its stored public DTO without catalog queries
  or n8n. Reusing the key for another message returns a conflict. A failed retry
  reuses its existing user message rather than inserting a second one.
  A replay is the original backend-verified snapshot, not a fresh price/stock
  lookup. Actual quotation/order creation continues to verify current data through
  the existing backend flow. Replay age/retention needs explicit validation before
  release; the same old key must not be used to request a fresh recommendation.
- The response, assistant message, context update, turn completion, and lease
  release commit in one transaction, conditional on the current token, fence,
  and unexpired lease. Persistence failures do not return success. A stale owner
  cannot release a successor's lease or overwrite its state.
- Completed history is ordered by successful fencing version, with the user
  before the assistant inside each turn. Retrying an old failed turn therefore
  does not reorder the logical conversation by its original timestamp. Existing
  messages with `turnId = NULL` remain intact and can fill the bounded history.
- Conversation State V2 schema, sanitization, catalog verification, brand,
  category, budget, product IDs, quotation handling on successful replies, and
  quotation draft storage are unchanged. A different request ID or a busy reply
  does not clear context. Failed/unfinished turns are retained, but are excluded
  from the bounded context sent to n8n.

## Deadlines and ambiguous upstream completion

The upstream deadline is 90 seconds, covering context preparation, HTTP headers,
the complete response body, and response preparation. The lease is 180 seconds.
No transaction or row lock is held during HTTP or catalog rehydration. Short
transactions use a 2-second acquisition wait and a 5-second execution timeout.

Before dispatch, a failure can release its own lease immediately. After dispatch,
an abort, network failure, or uncertain upstream error leaves the lease until
expiry. A fully received response permits immediate conditional release if local
preparation fails. Cleanup failure is logged with bounded error identifiers and
expiry remains the recovery mechanism. No automatic n8n retry is performed.

**Unresolved guarantee:** aborting fetch does not prove n8n stopped executing.
A crashed backend or an upstream execution lasting longer than the 180-second
lease can still overlap a later upstream execution. PostgreSQL fencing prevents
the old backend response from committing to the database; it cannot fence n8n's
own memory/cache writes. Absolute remote at-most-one execution would require
verified upstream execution deadlines/cancellation or participation in fencing.
That part is not claimed as solved, and MAIN has not been changed.

## Client persistence and retry

The widget stores the session ID/token as one JSON pair, with compatibility keys
retained. The pending message, UUID, session binding, and dispatch uncertainty
are persisted before the user POST. An input draft is stored separately, so the
customer can type the next message while waiting. Refresh restores the valid
pair and the pending key; it does not resend automatically.

409 and transport failures remove the optimistic sent bubble, preserve the
pending text and the separately typed input, and offer an explicit retry. They
do not invoke the previous transport-error quotation fallback. Retry uses the
same UUID. Invalid credentials or a key conflict require explicit session reset;
reset retains pending text and starts a new turn only by that user action.
Late responses from a previous widget/session cannot replace a reset session.

Storage-denied/quota fallback is in memory only. Persistence across refresh
cannot be guaranteed when the browser refuses storage. No cache is used as the
backend concurrency protection.

## Compatibility boundaries

| Combination | Prepared source behavior | Limit |
| --- | --- | --- |
| New frontend + new backend, valid token | No bootstrap on refresh/subsequent turns; explicit UUID and persisted session | Runtime not tested |
| New frontend + old backend | One `/session` capability probe returns 404/405; reuse the existing old ID and send the previous message shape plus ignored new fields | Old backend has no Phase 2A safety/idempotency guarantee; do not claim otherwise |
| Backend upgraded while a frontend is in old-backend fallback | Upgrade rejection does not create a turn; next explicit retry can bootstrap securely when the previous attempt is known rejected | An uncertain legacy attempt is held for an explicit new-conversation decision |
| Token-aware client without requestId | Internal key derives from the incoming token and exact message; successful replies rotate the signed token | Caller must retain the original token when retrying and save the new token for intentional subsequent turns; reusing the old token with identical content replays the old result |
| Old frontend with bare sessionId + new backend | Upgrade required; old database rows remain untouched | Cannot securely recover the old guest owner or provide seamless continuation from that ID alone; frontend reload/secure new session is required |
| Valid token expired/lost or signing key rotated | Explicit invalid-session error; no automatic reset | Old data remains; secure automatic recovery is unavailable without additional ownership evidence |

The bootstrap is one additional HTTP request per new secure conversation, not
per user turn, and performs zero database/n8n operations. It is needed so losing
the first message response does not also lose the ownership proof required for
an idempotent retry. No new checkout, payment, OTP, or quotation API is introduced.

## Migration draft and future release prerequisites

Draft: `prisma/migrations/20261020120000_chat_conversation_lease/migration.sql`.
It adds nullable lease fields and a default-zero fence to ChatConversation, adds
nullable ChatMessage.turnId, and creates the ChatTurn ledger with the unique
request key, completedVersion, indexes, and foreign keys. It contains no UPDATE,
DELETE, or destructive alteration of existing conversation data. New ledger
access is revoked from PUBLIC and, where present, anon/authenticated. Existing
database security settings and grants on other tables are not modified here.

Before deployment, in a separately approved validation phase:

1. Review this still-unapplied migration and the schema together. Validate it on
   isolated PostgreSQL, including existing conversations and migration history.
2. Generate Prisma Client from the changed schema; then typecheck, build, and
   adapt the old route mocks to the lease/turn contract before running tests.
   The old backend mock suites currently do not model the new tables/raw SQL.
3. Exercise parallel instances, same-session contention, out-of-order/stale
   responses, retry after lost response, timeout/crash, body timeout, storage
   failure, multi-turn context, and frontend draft/refresh behavior. No mock-only
   result establishes PostgreSQL concurrency correctness.
4. Prefer frontend-first rollout to support the old backend while preparing the
   schema/backend rollout. Older already-open tabs without ownership proof must
   reload. All backend writers must use the lease protocol before claiming the
   multi-instance property; mixed old/new backend writers are not protected.
5. Apply the reviewed additive migration and deploy the generated backend only
   after separate owner approval. New backend code requires the new schema; it
   deliberately does not bypass the lease when the schema/storage is unavailable.
6. Define retention for failed turns and cached responses later; this phase adds
   no cleanup job and deletes no chat history.

## Review disposition

Source implementation has been completed for review. Static diff whitespace
inspection only; no runtime PASS, security PASS, or production-safe claim.
Original bare-ID session recovery and absolute upstream execution exclusivity
remain the explicit boundaries above. Full runtime validation remains deferred.

Phase 2B has not started. Production database, n8n, Render, and Vercel unchanged.

Phase 2A files (including changes already present before this completion pass):

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20261020120000_chat_conversation_lease/migration.sql`
- `backend/src/services/chatbot-conversation-lease.service.ts`
- `backend/src/routes/chatbot.routes.ts`
- `frontend/src/components/chatbot/ChatWidget.tsx`
- `frontend/src/components/chatbot/chat-session.ts`
- `frontend/src/services/chatbot.api.ts`
- `frontend/src/services/chatbot.api.test.ts` (the earlier requestId assertion only;
  no test was run or new test suite claimed)
- This source review report.
