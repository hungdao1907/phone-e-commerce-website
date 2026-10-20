# Chatbot Phase 2B — Local Resource Protection

Date: 2026-10-20. Scope: local source only. No test, typecheck, build, Prisma generate,
migration, database connection, n8n, Gemini, production request, commit, push, or deploy was run.

## Implemented

- `POST /api/chatbot/message` keeps a single 90-second deadline from immediately before the
  n8n dispatch until its complete response body is read. The timer is cleared only after the
  full body is known, not merely after response headers. Network, HTTP upstream, malformed
  response, timeout, storage, stale-completion, busy and client-disconnect paths are tracked
  separately without logging chat text, session data, URLs, headers, or secrets.
- A client disconnect aborts the local HTTP fetch only while the upstream outcome is unknown.
  It never claims that n8n stopped. The lease is retained until database expiry for an unknown
  dispatched request, so a new same-conversation request cannot immediately overlap it.
- Once the full n8n response has been received, a disconnect no longer cancels the guarded
  assistant/state commit. The original `requestId` can replay the committed response later.
- Added process-local, no-DB-write metrics in `chatbot-observability.service.ts`: in-flight
  accepted turns, outcome counts, n8n wait and total-turn duration aggregates, catalog
  rehydration attempts, stale completions, reclaimed expired leases, and leases retained for
  expiry recovery. Logging is opt-in only with `CHATBOT_OBSERVABILITY_LOG=true` and emits only
  bounded timing/outcome fields. It is **not** a global metric system or concurrency limiter.
- Lease claims now mark whether this instance reclaimed an expired lease, using the same atomic
  PostgreSQL claim statement. No new table or migration is required for Phase 2B.
- The separate authenticated Admin Chat n8n call now also retains its 90-second deadline while
  consuming the response body and safely aborts the local request on client disconnect. It has
  no conversation lease or State V2 persistence; this does not alter its request payload.

## Backpressure

No concurrency cap, queue, retry, circuit breaker, or cross-instance limiter was introduced.
Without throughput/error/instance metrics, choosing a hard cap would be arbitrary and an
in-memory counter cannot protect all Render instances. A later approved design should use a
shared admission-control store or PostgreSQL-backed bounded permit with explicit 429/503 policy,
capacity measurements, and a separate protected metrics exporter.

## Phase 2A compatibility

The Phase 2A lease/fencing claim, requestId replay, session token, State V2 guarded commit,
`CHAT_SESSION_BUSY`, quotation draft and catalog rehydration flow are retained. The 90-second
n8n deadline is shorter than the 180-second lease, leaving recovery time after a known timeout.
The code still cannot prove that a locally aborted n8n HTTP call terminates a remote workflow;
the database fence protects Backend state, while absolute at-most-one remote execution would
require participating cancellation/fencing in n8n and is not implemented here.

## Verification required later

- Generate Prisma Client after the Phase 2A migration in an approved test environment.
- Typecheck/build and update route mocks for `ChatTurn`, the claim raw SQL, response bodies and
  abort behavior.
- Test header/body timeout, client disconnect before dispatch/during body/after full body,
  same-session busy and lease-expiry recovery across more than one Backend instance.
- Validate metric lifecycle and log volume under a controlled load; never infer global totals
  from these per-instance counters.
