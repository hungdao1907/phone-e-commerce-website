import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';

// Deliberately self-provisioned: no TEST_DATABASE_URL or existing database is accepted.
const backend = path.resolve(__dirname, '..');
const target = '20261020120000_chat_conversation_lease';
const suffix = randomBytes(6).toString('hex');
const containerName = `webphone-phase2a-pg17-${suffix}`;
const databaseName = `wp_phase2a_${suffix}`;
const migrator = 'wp_test_migrator';
const runtimeRole = 'wp_test_runtime';
const password = randomBytes(24).toString('hex');
const runtimePassword = randomBytes(24).toString('hex');
const legacyId = randomUUID();
const legacySession = randomUUID();
const legacyMessage = randomUUID();
const state = { state_version: 2, category: 'fixture-phone', active_filters: { brand: 'Samsung', price_max: 10000000 },
  selected_product_id: 'fixture-product', selected_variant_id: 'fixture-variant', pending_quote: { quantity: 2 }, last_result_set: [] };
const evidence: Record<string, any> = { scope: 'isolated local PostgreSQL only', commandExits: [], scenarios: [], productionConnected: false,
  geminiCalls: 0, realN8nCalls: 0, containerName, databaseName, role: runtimeRole };
let containerId = '';
let temporary = '';
let admin: PrismaClient;
let first: PrismaClient;
let second: PrismaClient;
let lease: typeof import('../src/services/chatbot-conversation-lease.service');
let createRouter: typeof import('../src/routes/chatbot.routes')['createChatbotRouter'];
const servers: Server[] = [];
const clients: PrismaClient[] = [];

function command(label: string, executable: string, args: string[], options: any = {}): string {
  try {
    const output = execFileSync(executable, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options });
    evidence.commandExits.push({ command: label, exitCode: 0 });
    return String(output).trim();
  } catch (error: any) {
    evidence.commandExits.push({ command: label, exitCode: error.status ?? 1 });
    const detail = String(error.stderr || error.message).replace(/postgres(?:ql)?:\/\/[^\s"']+/g, '[connection redacted]')
      .replaceAll(password, '[redacted]').replaceAll(runtimePassword, '[redacted]');
    throw new Error(`${label}: exit ${error.status ?? 1}: ${detail}`);
  }
}
function sql(query: string): string {
  assert(containerId && containerName.startsWith('webphone-phase2a-pg17-'));
  return command('isolated psql', 'docker', ['exec', '-i', containerId, 'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', migrator, '-d', databaseName], { input: query });
}
function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>(r => { resolve = r; });
  return { promise, resolve };
}
async function claimed(session: string = randomUUID(), requestId: string = randomUUID(), content = 'fixture user', db = first) {
  const result = await lease.claimChatTurn(session, requestId, content, db);
  assert.equal(result.kind, 'claimed');
  if (result.kind !== 'claimed') throw new Error('Expected a claimed lease');
  return { ...result, session };
}
async function expire(conversationId: string) {
  await admin.$executeRaw`UPDATE "ChatConversation" SET "leaseExpiresAt" = clock_timestamp() - INTERVAL '1 second' WHERE id = ${conversationId}`;
}
async function listen(db: PrismaClient, fetcher: typeof fetch) {
  const express = (await import('express')).default;
  const app = express();
  app.use(express.json());
  app.use('/api/chatbot', createRouter({ database: db, fetcher }));
  const server = await new Promise<Server>(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/chatbot`;
}
function post(base: string, endpoint: string, body: unknown, signal?: AbortSignal) {
  assert(base.startsWith('http://127.0.0.1:'));
  return fetch(`${base}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
}
function scenario(name: string, fn: () => Promise<void>, timeout = 20000) {
  test(name, { timeout }, async () => {
    const start = performance.now();
    try { await fn(); evidence.scenarios.push({ name, status: 'PASSED', durationMs: Math.round(performance.now() - start) }); }
    catch (error) { evidence.scenarios.push({ name, status: 'FAILED', durationMs: Math.round(performance.now() - start) }); throw error; }
  });
}

before(async () => {
  temporary = mkdtempSync(path.join(os.tmpdir(), 'webphone-phase2a-pg-'));
  containerId = command('docker run isolated PostgreSQL 17', 'docker', ['run', '-d', '--name', containerName,
    '--label', 'webphone.task=phase2a-postgres-integration', '--env', `POSTGRES_USER=${migrator}`,
    '--env', `POSTGRES_DB=${databaseName}`, '--env', 'POSTGRES_PASSWORD', '-p', '127.0.0.1::5432',
    '--tmpfs', '/var/lib/postgresql/data:rw', 'postgres:17-alpine'], { env: { ...process.env, POSTGRES_PASSWORD: password } });
  assert(/^[a-f0-9]{64}$/.test(containerId));
  const inspected = JSON.parse(command('docker inspect created resource', 'docker', ['inspect', containerId]))[0];
  assert.equal(inspected.Name, `/${containerName}`);
  assert.equal(inspected.Config.Labels['webphone.task'], 'phase2a-postgres-integration');
  const binding = inspected.NetworkSettings.Ports['5432/tcp'][0];
  assert.equal(binding.HostIp, '127.0.0.1');
  const port = Number(binding.HostPort);
  assert(port > 0 && port !== 5432 && port !== 3001 && port !== 5678);
  for (let i = 0; ; i++) {
    try { execFileSync('docker', ['exec', containerId, 'pg_isready', '-U', migrator, '-d', databaseName], { stdio: 'pipe' }); break; }
    catch { if (i >= 100) throw new Error('Isolated PostgreSQL did not become ready'); await new Promise(r => setTimeout(r, 200)); }
  }
  const identity = sql('SELECT current_database(), current_user, version();');
  assert(identity.startsWith(`${databaseName}|${migrator}|PostgreSQL 17.`));
  evidence.identity = identity;
  evidence.port = port;
  evidence.isolationVerified = true;
  const url = `postgresql://${migrator}:${password}@127.0.0.1:${port}/${databaseName}?schema=public`;
  const runtimeUrl = `postgresql://${runtimeRole}:${runtimePassword}@127.0.0.1:${port}/${databaseName}?schema=public`;
  assert(!url.includes('supabase') && !url.includes('enjxzjlnotedahgzddom'));
  for (const key of Object.keys(process.env)) if (/^(DATABASE_URL|DIRECT_URL|PRISMA_RUNTIME_URL|N8N_|GEMINI_|SMTP_|BREVO_)/.test(key)) delete process.env[key];
  Object.assign(process.env, { DATABASE_URL: url, DIRECT_URL: url, PRISMA_RUNTIME_URL: url,
    JWT_SECRET: 'phase2a-integration-only-signing-fixture', N8N_CHAT_WEBHOOK_URL: 'http://127.0.0.1:9/mock-only' });
  const prismaCli = path.join(backend, 'node_modules/prisma/build/index.js');
  const schema = path.join(temporary, 'schema.prisma');
  copyFileSync(path.join(backend, 'prisma/schema.prisma'), schema);
  const migrations = path.join(temporary, 'migrations');
  mkdirSync(migrations);
  copyFileSync(path.join(backend, 'prisma/migrations/migration_lock.toml'), path.join(migrations, 'migration_lock.toml'));
  const names = readdirSync(path.join(backend, 'prisma/migrations'), { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort();
  assert.equal(names.at(-1), target);
  for (const name of names.filter(x => x !== target)) {
    mkdirSync(path.join(migrations, name));
    const source = path.join(backend, 'prisma/migrations', name, 'migration.sql');
    const destination = path.join(migrations, name, 'migration.sql');
    const bytes = readFileSync(source);
    if (name === '0_rebaseline_current_production' && bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
      // The untouched historical file fails Prisma's SQL executor at byte zero (P3018/42601).
      // Normalize only this isolated test copy; execute all SQL, never resolve it as applied.
      writeFileSync(destination, bytes.subarray(3));
      evidence.baselineEncodingNormalization = { file: name, scope: 'TEMP test copy only', sourceSha256: createHash('sha256').update(bytes).digest('hex'),
        testCopySha256: createHash('sha256').update(bytes.subarray(3)).digest('hex'), removedBytes: 'UTF-8 BOM EF BB BF', sqlContentUnchanged: true };
    } else copyFileSync(source, destination);
  }
  // Simulate Supabase's broad defaults to prove the migration's REVOKEs are effective.
  sql(`CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE ${runtimeRole} LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
    GRANT CONNECT ON DATABASE "${databaseName}" TO ${runtimeRole}; GRANT USAGE ON SCHEMA public TO ${runtimeRole};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${migrator} IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;`);
  command('prisma validate', process.execPath, [prismaCli, 'validate', '--schema', schema], { cwd: temporary, env: process.env });
  command('prisma generate', process.execPath, [prismaCli, 'generate', '--schema', path.join(backend, 'prisma/schema.prisma')], { cwd: temporary, env: process.env });
  command('prisma migrate deploy preceding history', process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schema], { cwd: temporary, env: process.env });
  const Prisma = (await import('@prisma/client')).PrismaClient;
  admin = new Prisma({ datasources: { db: { url } } }); clients.push(admin);
  assert.deepEqual(await admin.$queryRaw`SELECT current_database() AS db, current_user AS role`, [{ db: databaseName, role: migrator }]);
  await admin.$executeRaw`INSERT INTO "ChatConversation" (id, "sessionId", context, "createdAt", "updatedAt") VALUES (${legacyId}, ${legacySession}, ${JSON.stringify(state)}::jsonb, '2026-01-01'::timestamp, '2026-01-02'::timestamp)`;
  await admin.$executeRaw`INSERT INTO "ChatMessage" (id,"conversationId",role,content,"createdAt") VALUES (${legacyMessage}, ${legacyId}, 'user', 'legacy fixture only', '2026-01-02'::timestamp)`;
  const legacyQuery = () => admin.$queryRaw`SELECT c.id, c."sessionId", c.context, c."createdAt", c."updatedAt", m.id AS "messageId", m.role, m.content, m."createdAt" AS "messageCreatedAt" FROM "ChatConversation" c JOIN "ChatMessage" m ON m."conversationId"=c.id WHERE c.id=${legacyId}`;
  evidence.legacyBefore = await legacyQuery();
  mkdirSync(path.join(migrations, target));
  const migrationFile = path.join(backend, 'prisma/migrations', target, 'migration.sql');
  copyFileSync(migrationFile, path.join(migrations, target, 'migration.sql'));
  evidence.migrationSha256 = createHash('sha256').update(readFileSync(migrationFile)).digest('hex');
  command('prisma migrate deploy Phase 2A', process.execPath, [prismaCli, 'migrate', 'deploy', '--schema', schema], { cwd: temporary, env: process.env });
  evidence.legacyAfter = await legacyQuery();
  evidence.migrations = await admin.$queryRaw`SELECT migration_name, checksum, applied_steps_count, finished_at IS NOT NULL AS finished, rolled_back_at IS NOT NULL AS rolled_back FROM "_prisma_migrations" ORDER BY migration_name`;
  first = new Prisma({ datasources: { db: { url: runtimeUrl } } }); clients.push(first);
  second = new Prisma({ datasources: { db: { url: runtimeUrl } } }); clients.push(second);
  sql(`GRANT SELECT, INSERT, UPDATE ON "ChatConversation", "ChatMessage" TO ${runtimeRole};`);
  let denied = false;
  try { await first.chatTurn.findMany(); } catch { denied = true; }
  evidence.runtimeDeniedBeforeExplicitGrant = denied;
  sql(`GRANT SELECT, INSERT, UPDATE ON "ChatTurn" TO ${runtimeRole};`);
  sql(`GRANT SELECT ON "Product", "ProductVariant", "Category", "Campaign" TO ${runtimeRole};`);
  lease = await import('../src/services/chatbot-conversation-lease.service');
  createRouter = (await import('../src/routes/chatbot.routes')).createChatbotRouter;
}, { timeout: 120000 });

after(async () => {
  for (const server of servers) await new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); });
  const defaultModule = clients.length ? await import('../src/config/prisma').catch(() => null) : null;
  await Promise.allSettled([...clients.map(c => c.$disconnect()), ...(defaultModule ? [defaultModule.default.$disconnect()] : [])]);
  evidence.total = evidence.scenarios.length;
  evidence.passed = evidence.scenarios.filter((x: any) => x.status === 'PASSED').length;
  evidence.failed = evidence.scenarios.filter((x: any) => x.status === 'FAILED').length;
  if (containerId) {
    const resource = JSON.parse(command('verify owned test container before cleanup', 'docker', ['inspect', containerId]))[0];
    assert.equal(resource.Name, `/${containerName}`);
    assert.equal(resource.Config.Labels['webphone.task'], 'phase2a-postgres-integration');
    command('remove task-created test container', 'docker', ['rm', '-f', containerId]);
    evidence.testContainerRemoved = true;
  }
  const reportDir = path.join(backend, 'backups', 'phase2a-postgres-integration');
  mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `${suffix}.json`);
  writeFileSync(reportFile, JSON.stringify(evidence, null, 2));
  console.log(`Integration evidence: ${path.relative(backend, reportFile)}`);
  if (temporary) {
    assert(path.dirname(temporary) === path.resolve(os.tmpdir()) && path.basename(temporary).startsWith('webphone-phase2a-pg-'));
    try { rmSync(temporary, { recursive: true, maxRetries: 3, retryDelay: 100 }); }
    catch (error: any) { if (!['EBUSY', 'EPERM'].includes(error.code)) throw error; console.log('Windows retained the task TEMP migration copy because it is locked; production data is not present there.'); }
  }
});

scenario('Migration history executes, preserves legacy State V2, timestamps and nullable turnId', async () => {
  assert.equal(evidence.migrations.length, 10);
  assert(evidence.migrations.every((x: any) => x.finished && !x.rolled_back));
  assert.equal(evidence.migrations.find((x: any) => x.migration_name === target).checksum, evidence.migrationSha256);
  assert.deepEqual(evidence.legacyAfter, evidence.legacyBefore);
  const old = await first.chatMessage.findUniqueOrThrow({ where: { id: legacyMessage } });
  assert.equal(old.turnId, null);
  const c = await first.chatConversation.findUniqueOrThrow({ where: { id: legacyId } });
  assert.equal(c.fencingVersion, 0n); assert.equal(c.leaseToken, null); assert.equal(c.leaseExpiresAt, null);
});

scenario('New columns, unique indexes and foreign keys are enforced by PostgreSQL', async () => {
  const columns: any[] = await admin.$queryRaw`SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('ChatConversation','ChatMessage','ChatTurn')`;
  const col = (table: string, name: string) => columns.find(x => x.table_name === table && x.column_name === name);
  assert.equal(col('ChatConversation', 'fencingVersion').data_type, 'bigint');
  assert.equal(col('ChatMessage', 'turnId').is_nullable, 'YES');
  const indexes: any[] = await admin.$queryRaw`SELECT indexname,indexdef FROM pg_indexes WHERE schemaname='public' AND tablename IN ('ChatTurn','ChatMessage')`;
  for (const name of ['ChatTurn_pkey','ChatTurn_conversationId_requestId_key','ChatTurn_conversationId_status_completedVersion_idx','ChatMessage_turnId_idx']) assert(indexes.some(x => x.indexname === name));
  const fks: any[] = await admin.$queryRaw`SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname IN ('ChatTurn_conversationId_fkey','ChatMessage_turnId_fkey')`;
  assert.equal(fks.length, 2); assert(fks.every(x => x.definition.includes('ON UPDATE CASCADE ON DELETE CASCADE')));
  await assert.rejects(first.chatTurn.create({ data: { conversationId: randomUUID(), requestId: randomUUID(), requestHash: 'fixture' } }), (e: any) => e.code === 'P2003');
  const a = await claimed();
  await assert.rejects(first.chatTurn.create({ data: { conversationId: a.lease.conversationId, requestId: a.requestId, requestHash: 'fixture' } }), (e: any) => e.code === 'P2002');
  await assert.rejects(first.chatMessage.create({ data: { conversationId: a.lease.conversationId, turnId: randomUUID(), role: 'assistant', content: 'fixture' } }), (e: any) => e.code === 'P2003');
  await lease.abandonChatTurn(a.lease, first, true);
  evidence.schema = { columns, indexes, foreignKeys: fks };
});

scenario('Migration DDL failure rolls back every preceding change in its explicit transaction', async () => {
  sql(`CREATE SCHEMA atomic_probe; CREATE TABLE atomic_probe."ChatConversation" (id text PRIMARY KEY, context jsonb); CREATE TABLE atomic_probe."ChatMessage" (id text PRIMARY KEY); CREATE TABLE atomic_probe.collision (id text); CREATE INDEX "ChatMessage_turnId_idx" ON atomic_probe.collision(id); INSERT INTO atomic_probe."ChatConversation" VALUES ('legacy','{"state_version":2}');`);
  const ddl = readFileSync(path.join(backend, 'prisma/migrations', target, 'migration.sql'), 'utf8');
  assert.throws(() => sql(`SET search_path=atomic_probe;\n${ddl}`), /already exists/);
  const result = sql(`SELECT to_regclass('atomic_probe."ChatTurn"') IS NULL, NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='atomic_probe' AND column_name IN ('leaseToken','leaseExpiresAt','fencingVersion','turnId')), (SELECT context->>'state_version' FROM atomic_probe."ChatConversation" WHERE id='legacy');`);
  assert.equal(result, 't|t|2');
});

scenario('REVOKEs and explicit least-privilege grants work with a non-superuser runtime', async () => {
  assert.equal(evidence.runtimeDeniedBeforeExplicitGrant, true);
  const roles: any[] = await first.$queryRaw`SELECT current_user AS role, rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user`;
  assert.deepEqual(roles, [{ role: runtimeRole, rolsuper: false, rolbypassrls: false, rolcreatedb: false, rolcreaterole: false }]);
  const acl: any[] = await admin.$queryRaw`SELECT r.role, has_table_privilege(r.role,'"ChatTurn"','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS any_access FROM (VALUES ('anon'),('authenticated')) r(role)`;
  assert(acl.every(x => !x.any_access));
  assert.equal(sql(`SELECT has_table_privilege('${runtimeRole}','"ChatTurn"','DELETE'), has_table_privilege('${runtimeRole}','"ChatTurn"','TRUNCATE');`), 'f|f');
  const a = await claimed();
  assert.equal(await lease.completeChatTurn(a.lease, 'fixture answer', state, { response: 'fixture answer' }, second), true);
  evidence.runtimeRole = roles[0]; evidence.turnAcl = acl;
});

scenario('A/B: simultaneous claims from two Prisma Clients yield one owner and no rejected User turn', async () => {
  const session = randomUUID();
  await admin.chatConversation.create({ data: { sessionId: session } });
  const results = await Promise.all([lease.claimChatTurn(session, randomUUID(), 'first', first), lease.claimChatTurn(session, randomUUID(), 'second', second)]);
  assert.deepEqual(results.map(x => x.kind).sort(), ['busy', 'claimed']);
  const winner = results.find(x => x.kind === 'claimed'); assert(winner?.kind === 'claimed');
  assert.equal(await first.chatTurn.count({ where: { conversationId: winner.lease.conversationId } }), 1);
  assert.equal(await first.chatMessage.count({ where: { conversationId: winner.lease.conversationId, role: 'user' } }), 1);
  await lease.abandonChatTurn(winner.lease, first, true);
});

scenario('Two simultaneous first turns can create the same new conversation safely', async () => {
  const session = randomUUID();
  const results = await Promise.all([lease.claimChatTurn(session, randomUUID(), 'a', first), lease.claimChatTurn(session, randomUUID(), 'b', second)]);
  assert.deepEqual(results.map(x => x.kind).sort(), ['busy', 'claimed']);
  const winner = results.find(x => x.kind === 'claimed'); assert(winner?.kind === 'claimed');
  await lease.abandonChatTurn(winner.lease, first, true);
});

scenario('Different conversations and identical request IDs remain independent', async () => {
  const request = randomUUID();
  const [a, b] = await Promise.all([claimed(randomUUID(), request, 'a', first), claimed(randomUUID(), request, 'b', second)]);
  assert.notEqual(a.lease.conversationId, b.lease.conversationId);
  assert.equal(await lease.completeChatTurn(a.lease, 'a', state, { response: 'a' }, first), true);
  assert.equal(await lease.completeChatTurn(b.lease, 'b', state, { response: 'b' }, second), true);
});

scenario('C/D: expired lease reclaims, and stale completion/cleanup cannot alter the new owner or State V2', async () => {
  const a = await claimed(); await expire(a.lease.conversationId);
  const b = await claimed(a.session, randomUUID(), 'new owner', second);
  assert(b.lease.version > a.lease.version); assert.equal(b.reclaimedExpiredLease, true);
  assert.equal(await lease.completeChatTurn(a.lease, 'stale answer', { state_version: 2, stale: true }, { response: 'stale' }, first), false);
  await lease.abandonChatTurn(a.lease, first, true);
  assert.equal((await first.chatConversation.findUniqueOrThrow({ where: { id: b.lease.conversationId } })).leaseToken, b.lease.token);
  assert.equal(await lease.completeChatTurn(b.lease, 'valid answer', state, { response: 'valid answer' }, second), true);
  assert.equal(await first.chatMessage.count({ where: { turnId: a.lease.turnId, role: 'assistant' } }), 0);
  const next = await claimed(a.session);
  assert.deepEqual(next.snapshot.state, state);
  assert(!next.snapshot.history.some(x => x.content === 'stale answer' || x.content === 'fixture user'));
  assert(next.snapshot.history.some(x => x.content === 'valid answer'));
  await lease.abandonChatTurn(next.lease, second, true);
});

scenario('E: lease extension requires a live matching token and fencing version', async () => {
  const a = await claimed();
  await admin.$executeRaw`UPDATE "ChatConversation" SET "leaseExpiresAt"=clock_timestamp()+INTERVAL '5 seconds' WHERE id=${a.lease.conversationId}`;
  assert.equal(await lease.renewChatLeaseBeforeDispatch({ ...a.lease, token: randomUUID() }, second), false);
  assert.equal(await lease.renewChatLeaseBeforeDispatch({ ...a.lease, version: a.lease.version + 1n }, second), false);
  assert.equal(await lease.renewChatLeaseBeforeDispatch(a.lease, first), true);
  const current = await first.chatConversation.findUniqueOrThrow({ where: { id: a.lease.conversationId } });
  assert(current.leaseExpiresAt!.getTime() > Date.now() + 150000);
  await expire(a.lease.conversationId);
  assert.equal(await lease.renewChatLeaseBeforeDispatch(a.lease, first), false);
  assert.equal(await lease.completeChatTurn(a.lease, 'expired', state, { response: 'expired' }, first), false);
});

scenario('F/G: retries, replay and conflicting payloads never duplicate User/Assistant messages', async () => {
  const a = await claimed();
  assert.equal((await lease.claimChatTurn(a.session, a.requestId, 'fixture user', second)).kind, 'busy');
  await lease.abandonChatTurn(a.lease, first, true);
  const retry = await claimed(a.session, a.requestId, 'fixture user', second);
  assert.equal(retry.lease.turnId, a.lease.turnId);
  assert.equal(await lease.completeChatTurn(retry.lease, 'one answer', state, { response: 'one answer' }, second), true);
  const replay = await lease.claimChatTurn(a.session, a.requestId, 'fixture user', first);
  assert.equal(replay.kind, 'completed'); if (replay.kind === 'completed') assert.equal(replay.response.response, 'one answer');
  assert.equal((await lease.claimChatTurn(a.session, a.requestId, 'different content', first)).kind, 'conflict');
  assert.equal(await first.chatTurn.count({ where: { conversationId: a.lease.conversationId } }), 1);
  assert.equal(await first.chatMessage.count({ where: { turnId: a.lease.turnId } }), 2);
});

scenario('H: Assistant insert failure rolls back context, lease release and turn completion', async () => {
  const a = await claimed();
  sql(`CREATE FUNCTION public.reject_test_assistant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.role='assistant' THEN RAISE EXCEPTION 'fixture assistant insertion failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_test_assistant BEFORE INSERT ON "ChatMessage" FOR EACH ROW EXECUTE FUNCTION public.reject_test_assistant();`);
  try { await assert.rejects(lease.completeChatTurn(a.lease, 'rollback answer', state, { response: 'rollback answer' }, first)); }
  finally { sql('DROP TRIGGER reject_test_assistant ON "ChatMessage"; DROP FUNCTION public.reject_test_assistant();'); }
  const c = await first.chatConversation.findUniqueOrThrow({ where: { id: a.lease.conversationId } });
  assert.equal(c.context, null); assert.equal(c.leaseToken, a.lease.token);
  assert.equal((await first.chatTurn.findUniqueOrThrow({ where: { id: a.lease.turnId } })).status, 'PENDING');
  assert.equal(await first.chatMessage.count({ where: { turnId: a.lease.turnId, role: 'assistant' } }), 0);
  assert.equal(await lease.completeChatTurn(a.lease, 'recovered answer', state, { response: 'recovered answer' }, second), true);
});

scenario('H: failure after Assistant insertion also rolls back the entire transaction', async () => {
  const a = await claimed();
  await admin.chatTurn.update({ where: { id: a.lease.turnId }, data: { status: 'FAILED' } });
  await assert.rejects(lease.completeChatTurn(a.lease, 'rollback answer', state, { response: 'rollback answer' }, first), /invariant/);
  const c = await first.chatConversation.findUniqueOrThrow({ where: { id: a.lease.conversationId } });
  assert.equal(c.context, null); assert.equal(c.leaseToken, a.lease.token);
  assert.equal(await first.chatMessage.count({ where: { turnId: a.lease.turnId, role: 'assistant' } }), 0);
  await lease.abandonChatTurn(a.lease, first, true);
});

scenario('I: real Express rejects another session token without revealing history or dispatching', async () => {
  const a = await claimed(); await lease.completeChatTurn(a.lease, 'private fixture answer', state, { response: 'answer' }, first);
  let calls = 0;
  const base = await listen(first, (async () => { calls++; throw new Error('No transport allowed'); }) as typeof fetch);
  for (const token of ['invalid', lease.signChatSession(randomUUID())]) {
    const response = await post(base, 'session', { sessionId: a.session, sessionToken: token });
    assert.equal(response.status, 403); assert(!JSON.stringify(await response.json()).includes('private fixture'));
    const message = await post(base, 'message', { sessionId: a.session, sessionToken: token, message: 'fixture', requestId: randomUUID() });
    assert.equal(message.status, 403);
  }
  const own = await post(base, 'session', { sessionId: a.session, sessionToken: lease.signChatSession(a.session) });
  assert.equal(own.status, 200); assert((await own.json()).history.some((x: any) => x.content === 'private fixture answer'));
  assert.equal(calls, 0);
});

scenario('J: legacy turnId NULL messages remain available to the next legitimate claim', async () => {
  const a = await claimed(legacySession);
  assert(a.snapshot.history.some(x => x.content === 'legacy fixture only'));
  assert.deepEqual(a.snapshot.state, state);
  assert.equal((await first.chatMessage.findUniqueOrThrow({ where: { id: legacyMessage } })).turnId, null);
  await lease.abandonChatTurn(a.lease, first, true);
});

scenario('K: losing the lease during actual catalog preparation prevents upstream dispatch', async () => {
  const session = randomUUID();
  await admin.chatConversation.create({ data: { sessionId: session, context: { ...state, last_result_set: [{ id: randomUUID() }] } } });
  let replacement: Awaited<ReturnType<typeof claimed>> | undefined;
  const hookFinished = deferred();
  let calls = 0;
  const hooked = first.$extends({ query: { product: { async findMany({ args, query }) {
    if (!replacement) {
      const c = await admin.chatConversation.findUniqueOrThrow({ where: { sessionId: session } });
      await expire(c.id); replacement = await claimed(session, randomUUID(), 'replacement turn', second); hookFinished.resolve();
    }
    return query(args);
  } } } });
  const base = await listen(hooked as unknown as PrismaClient, (async () => { calls++; throw new Error('Stale dispatch'); }) as typeof fetch);
  const response = await post(base, 'message', { sessionId: session, sessionToken: lease.signChatSession(session), requestId: randomUUID(), message: 'fixture continuation' });
  await hookFinished.promise;
  assert.equal(response.status, 409); assert.equal((await response.json()).code, 'CHAT_SESSION_STALE');
  assert(replacement); assert.equal(calls, 0);
  assert.equal((await first.chatConversation.findUniqueOrThrow({ where: { sessionId: session } })).leaseToken, replacement.lease.token);
  await lease.abandonChatTurn(replacement.lease, second, true);
});

scenario('HTTP multi-tab: 409 busy writes nothing; replay and next turn work across two Backend instances', async () => {
  const started = deferred(); const release = deferred(); let calls = 0;
  const transport = (async () => {
    calls++; started.resolve(); await release.promise;
    return Response.json({ result_type: 'text', response: 'fixture greeting', conversation_state: state });
  }) as typeof fetch;
  const [baseA, baseB] = await Promise.all([listen(first, transport), listen(second, transport)]);
  const session = randomUUID(), requestId = randomUUID(), sessionToken = lease.signChatSession(session);
  const body = { sessionId: session, sessionToken, requestId, message: 'fixture greeting' };
  const pending = post(baseA, 'message', body);
  await started.promise;
  try {
    const busy = await post(baseB, 'message', { ...body, requestId: randomUUID(), message: 'blocked user' });
    assert.equal(busy.status, 409); assert.equal((await busy.json()).code, 'CHAT_SESSION_BUSY'); assert.equal(calls, 1);
    assert.equal(await first.chatMessage.count({ where: { content: 'blocked user' } }), 0);
  } finally { release.resolve(); }
  const response = await pending; assert.equal(response.status, 200);
  const reply = await response.json(); assert(reply.response); assert(lease.verifyChatSession(session, reply.sessionToken));
  const replay = await post(baseB, 'message', body); assert.equal(replay.status, 200); assert.equal(calls, 1);
  const next = await post(baseB, 'message', { ...body, requestId: randomUUID(), message: 'next accepted', sessionToken: reply.sessionToken });
  assert.equal(next.status, 200); assert.equal(calls, 2);
});

scenario('Crash simulation: retained lease expires and old workers cannot commit or release a replacement', async () => {
  const a = await claimed();
  await lease.abandonChatTurn(a.lease, first, false);
  assert.equal((await lease.claimChatTurn(a.session, randomUUID(), 'blocked before expiry', second)).kind, 'busy');
  await expire(a.lease.conversationId);
  const b = await claimed(a.session, randomUUID(), 'recovery', second);
  assert.equal(await lease.completeChatTurn(a.lease, 'crashed late result', state, { response: 'late' }, first), false);
  await lease.abandonChatTurn(a.lease, first, true);
  assert.equal((await second.chatConversation.findUniqueOrThrow({ where: { id: b.lease.conversationId } })).leaseToken, b.lease.token);
  await lease.completeChatTurn(b.lease, 'recovered', state, { response: 'recovered' }, second);
});

scenario('Client disconnect aborts mocked transport, retains accepted User turn, and fences stale completion', async () => {
  const started = deferred(); const aborted = deferred(); let calls = 0;
  const base = await listen(first, (async (_url: any, options: any) => {
    calls++; started.resolve();
    return await new Promise<Response>((_resolve, reject) => options.signal.addEventListener('abort', () => { aborted.resolve(); reject(new DOMException('fixture disconnect', 'AbortError')); }, { once: true }));
  }) as typeof fetch);
  const session = randomUUID(), requestId = randomUUID(), controller = new AbortController();
  const pending = post(base, 'message', { sessionId: session, sessionToken: lease.signChatSession(session), requestId, message: 'disconnect fixture' }, controller.signal).catch(() => null);
  await started.promise; controller.abort(); await pending; await aborted.promise;
  let turn: any;
  for (let i = 0; i < 100; i++) {
    turn = await first.chatTurn.findFirst({ where: { requestId } });
    if (turn?.status === 'FAILED') break;
    await new Promise(r => setTimeout(r, 20));
  }
  assert.equal(turn.status, 'FAILED'); assert.equal(calls, 1);
  assert.equal(await first.chatMessage.count({ where: { turnId: turn.id, role: 'user' } }), 1);
  assert.equal(await first.chatMessage.count({ where: { turnId: turn.id, role: 'assistant' } }), 0);
  assert((await first.chatConversation.findUniqueOrThrow({ where: { id: turn.conversationId } })).leaseToken);
});

scenario('L: real 90-second body deadline returns 504 and retains the lease until recovery', async () => {
  let calls = 0; let cancelled = false;
  const base = await listen(first, (async (_url: any, options: any) => {
    calls++;
    const stream = new ReadableStream({ start(controller) {
      options.signal.addEventListener('abort', () => { cancelled = true; controller.error(new DOMException('fixture deadline', 'AbortError')); }, { once: true });
      controller.enqueue(new TextEncoder().encode('{"response":'));
    } });
    return new Response(stream, { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch);
  const session = randomUUID(), requestId = randomUUID();
  const response = await post(base, 'message', { sessionId: session, sessionToken: lease.signChatSession(session), requestId, message: 'timeout fixture' });
  assert.equal(response.status, 504); assert.equal((await response.json()).code, 'CHAT_REQUEST_TIMEOUT'); assert(cancelled); assert.equal(calls, 1);
  const c = await first.chatConversation.findUniqueOrThrow({ where: { sessionId: session } });
  assert(c.leaseToken); assert.equal(c.context, null);
  // The HTTP error may arrive before the handler's async finally finishes its DB cleanup.
  let t = await first.chatTurn.findUniqueOrThrow({ where: { conversationId_requestId: { conversationId: c.id, requestId } } });
  for (let i = 0; t.status === 'PENDING' && i < 100; i++) {
    await new Promise(r => setTimeout(r, 20));
    t = await first.chatTurn.findUniqueOrThrow({ where: { id: t.id } });
  }
  assert.equal(t.status, 'FAILED'); assert.equal(await first.chatMessage.count({ where: { turnId: t.id } }), 1);
  await expire(c.id);
  const replacement = await claimed(session, randomUUID(), 'after timeout', second);
  assert.equal(await lease.completeChatTurn({ conversationId: c.id, turnId: t.id, token: c.leaseToken!, version: c.fencingVersion }, 'late response', state, { response: 'late' }, first), false);
  await lease.abandonChatTurn(replacement.lease, second, true);
}, 110000);
