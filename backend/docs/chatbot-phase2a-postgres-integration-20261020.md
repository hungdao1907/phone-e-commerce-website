# Phase 2A PostgreSQL integration verification — 2026-10-20

## Result and scope

**PHASE 2A — POSTGRESQL INTEGRATION PASS** for the unchanged Phase 2A migration and the locally corrected lease implementation against an equivalent historical schema on isolated PostgreSQL. Final run: **19 passed, 0 failed, 0 skipped**, exit code **0**, approximately 97 seconds.

This is not approval to deploy. An untouched cold replay of the repository's historical baseline still fails because of its UTF-8 BOM. Historical migration source was preserved; only the TEMP test copy had its leading three BOM bytes removed. Every historical SQL statement was then actually executed by Prisma Migrate in order. No migration was marked applied to bypass execution. The raw Phase 2A migration was copied without any transformation, and its recorded Prisma checksum equals the source checksum.

No Supabase connection, production SQL, real n8n/Gemini request, commit, push, or deployment occurred. Existing frontend/backend changes and n8n artifacts were preserved.

## Test database and isolation

- Database: `wp_phase2a_5d27acd1161e`.
- PostgreSQL: **17.11**, `postgres:17-alpine`, Docker Linux, x86_64.
- Endpoint: loopback `127.0.0.1:55269`; Docker verified HostIp `127.0.0.1`.
- Container: `webphone-phase2a-pg17-5d27acd1161e`, generated for this task, labeled `webphone.task=phase2a-postgres-integration`.
- Storage: task-local tmpfs, no existing volume used.
- Migrator: task-created `wp_test_migrator`; runtime: task-created `wp_test_runtime`.
- Runtime role: NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE.
- Database/container identity was checked before writing SQL. All three Prisma URL variables were replaced with generated loopback test URLs before loading application modules. The suite does not accept an external test URL.
- Two distinct Prisma Clients/pools and two local Express app instances exercised database contention. They run in one test process; no process-local mutex was used as the protection being tested.
- Cleanup: task container removed after disconnecting clients and saving evidence. Existing `n8n` and `webphone-pdf-service` containers remained running and unchanged.

## Migration execution and integrity

All ten migration folders were executed, starting with the baseline, then context, quotation/idempotency/pricing history, recipient snapshots, and finally `20261020120000_chat_conversation_lease`.

Phase 2A raw SHA-256:

`499202071f9e40bd78057d92c53e3da7c210de93e487e4428c51ee2426d87ef2`

Verified finished Prisma migration records, nullable `ChatMessage.turnId`, BIGINT fencing version, lease columns, ChatTurn primary/unique keys, indexes and both foreign keys. Actual invalid FK/duplicate key inserts were rejected. Legacy conversation/message IDs, content, timestamps and State V2 JSON were identical before/after the migration. A deliberate late DDL failure in a task-created schema proved that BEGIN/COMMIT rolls back earlier additions without changing legacy data.

Historical baseline encoding finding:

- Source `0_rebaseline_current_production/migration.sql`: leading `EF BB BF` BOM.
- Original byte replay failed `P3018`, SQLSTATE `42601`, at byte zero.
- Original source SHA-256, unchanged: `8643dfa2f62157db2e2806c7f9f7ebe22b12f7050040c133c40af0abb7f3dd5f`.
- TEMP copy after removing only the BOM: `7c3322b1377e96229a72cb28a7ed55a1a7d1ddc83f176254c4dec0272d37be9a`.
- No source baseline edit, database checksum rewrite, or `migrate resolve` was performed. Production historical checksums were not queried in this task.
- A pristine cold deploy of the untouched history remains a separate portability issue; do not describe it as passing.

## Required scenarios

| Test | Evidence | Result |
| --- | --- | --- |
| Migration/legacy | Ten migrations executed; legacy JSON, messages and timestamps unchanged | PASS |
| Schema constraints | Native foreign key/unique failures; index/column definitions inspected | PASS |
| Atomic DDL rollback | Deliberate late index collision undid every preceding DDL change | PASS |
| Privileges | Explicit runtime grants work; anon/authenticated lack all ChatTurn privileges | PASS |
| A/B | Two Prisma Clients race for one existing conversation: exactly one owner and one User turn | PASS |
| New-session race | Two simultaneous first messages create one conversation without unique failure | PASS after source fix |
| Independent conversations / G | Same requestId in different conversations claims independently | PASS |
| C/D | Expiry permits reclaim; old completion/cleanup cannot alter replacement lease or State V2 | PASS |
| E | Only live matching token/version can extend immediately before dispatch | PASS |
| F | Busy retry, failed-turn retry, completed replay and payload conflict produce no duplicates | PASS |
| H, insert failure | Assistant insertion error rolls back context, lease release and completion | PASS |
| H, final invariant failure | Error after Assistant insert rolls back that insert and State V2 | PASS |
| I | Real local HTTP rejects invalid/cross-session tokens, exposes no history, makes zero upstream calls | PASS |
| J | Legacy turnId NULL messages survive and enter legitimate history snapshots | PASS |
| K | Replacement lease acquired during actual catalog query preparation prevents stale dispatch | PASS |
| Multi-tab HTTP | Two Express instances return 409 busy without rejected User writes; replay/next turn succeed | PASS |
| Crash | Retained lease recovers after expiry; crashed worker cannot overwrite/release new owner | PASS |
| Disconnect | Abort of local client propagates to mocked transport; accepted User remains, lease retained | PASS |
| L / body deadline | Actual 90-second body read timeout returns 504, preserves User and fences late completion | PASS |

Expiry tests deliberately set lease timestamps in this task's database using PostgreSQL's clock. The body deadline used the real 90-second timer. The n8n transport was injected/fake for all HTTP scenarios; no workflow execution was made.

State V2 tests preserve brand, category, budget, selected product/variant IDs and pending quotation JSON, with history ordered by successful fencing versions. These are synthetic test identities and fixtures, not a new product-grounding or quotation workflow live test.

## Confirmed source bug and correction

Prisma 5.14's empty-update `chatConversation.upsert` can issue a lookup followed by an INSERT rather than a database-native atomic upsert. Two Clients starting a new session reproduced `P2002` on `sessionId`.

`claimChatTurn` now uses `createMany({ skipDuplicates: true })` to perform `INSERT ... ON CONFLICT DO NOTHING`, followed by `findUniqueOrThrow` in the existing short transaction. The atomic lease UPDATE/fencing checks and all later completion behavior remain unchanged. Competing first messages now yield one claim and one busy result.

Two failures in the first complete test run were fixture synchronization issues, not production source defects: catalog SELECT grants were incomplete for the restricted runtime, and a timeout response reached the HTTP client before async finally finished cleanup. Tests now grant only required catalog SELECTs and explicitly await bounded cleanup. Assertions on status and final data were retained.

## Local privilege result

Broad default grants to test roles `anon` and `authenticated` were established before running the migrations. Phase 2A removed their ChatTurn privileges, including inherited PUBLIC access. The restricted runtime was denied ChatTurn before explicit grants, then succeeded with SELECT/INSERT/UPDATE on ChatConversation, ChatMessage and ChatTurn plus SELECT on the catalog tables needed by route tests. It has no DELETE or TRUNCATE privilege on ChatTurn.

This demonstrates why a distinct production runtime role may need explicit grants. It does **not** identify or verify the real Prisma role on Render.

## Commands and exit codes

Reproduce from `backend` with Docker Engine access:

```powershell
node --import tsx --test --test-concurrency=1 tests/chatbot-postgres.integration.test.ts
```

The suite creates and removes its own database/container; it does not use backend .env database targets. Prisma commands run with explicit task-only URLs and a TEMP schema/migration tree.

| Command/check | Final exit code | Notes |
| --- | ---: | --- |
| Integration suite | 0 | 19/19; 97.09 seconds |
| Prisma validate | 0 | TEMP schema, task URL |
| Prisma generate | 0 | Actual local schema/client, task environment |
| Prisma migrate deploy: prior history | 0 | BOM-only normalization of TEMP baseline |
| Prisma migrate deploy: Phase 2A | 0 | Exact source bytes/checksum |
| PostgreSQL fault injection via psql | 3 | Expected error; rollback assertions passed |
| Backend `tsc --noEmit` | 0 | Source after race correction |
| Backend `npm run build` | 0 | Source after race correction |
| Integration test TypeScript check (ES2022, esnext/bundler resolution) | 0 | Standalone check |
| `git diff --check` | 0 | Existing LF/CRLF warning is informational |
| Docker owned-resource cleanup | 0 | Existing resources preserved |

Earlier attempts: exact raw baseline run exited 1 with P3018 before any scenario; the next run exited 1 with 16/19 while reproducing the source race and two fixture synchronization issues. A standalone test-typecheck command initially exited 1 because TypeScript 7 removed node10 module resolution; the corrected bundler-resolution command exited 0. These failures were not hidden or marked as migration successes.

Machine-readable final evidence (ignored by Git): `backend/backups/phase2a-postgres-integration/5d27acd1161e.json`. Earlier attempts: `6ee38f6da335.json`, `a90858b40c72.json`. These are synthetic QA evidence files, not production backups. Credentials and connection strings are absent from the evidence.

## Files changed by this task

1. `backend/src/services/chatbot-conversation-lease.service.ts` — atomic creation correction; file was already untracked local Phase 2A source before this task.
2. `backend/tests/chatbot-postgres.integration.test.ts` — self-isolating migration, concurrency, security and local HTTP suite.
3. `backend/docs/chatbot-phase2a-postgres-integration-20261020.md` — this report.
4. Ignored QA evidence JSONs under `backend/backups/phase2a-postgres-integration/` and ignored generated Prisma/build output.

No migration source, schema, frontend source, environment file or unrelated local artifact was edited by this task.

## Remaining deployment gates

- Verify a viable production database backup/restore path. None was created or inspected here.
- Verify the actual Prisma runtime identity/grants in Render; local role tests are not a substitute.
- Prepare a coordinated frontend/backend cutover for sessionToken/requestId and existing old browser tabs; also avoid old/new backend workers processing one conversation under different lease protocols.
- Resolve historical baseline encoding/checksum provenance separately before claiming a pristine cold migration replay is reproducible. Do not rewrite an applied baseline or production checksum casually.
- A finite backend lease fences database writes but does not prove that a real n8n execution stops after HTTP abort. An orphan execution might outlive lease expiry. No real workflow cancellation or execution-duration guarantee was tested.
- Tests used PostgreSQL 17.11, not Supabase's exact patch version/extensions/settings. No production-scale load or full frontend/backend regression suite was run in this task.

Production migration/deployment remains NOT STARTED. Further production actions require the deployment gates to be met and their existing authorization conditions respected.
