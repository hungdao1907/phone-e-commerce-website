import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { permanentlyDeleteQuotation } from '../src/services/quotation-deletion.service';

function fixture(overrides: Record<string, any> = {}, failure?: string) {
  let record: any = { id: 'quote-a', assignedStaffId: 'staff-a', status: 'CUSTOMER_CONFIRMED', orders: [], nextVersion: null, files: [], ...overrides };
  let related: any = { quotationFile: ['file-1'], quotationReview: ['review-1'], quotationCreateIdempotency: ['key-1'], quotationItem: ['item-1'] };
  const business = { orders: ['unrelated-order'], payments: ['unrelated-payment'], products: ['catalog-product'], stock: 10 };
  const calls: string[] = [];
  const transaction: any = {
    $queryRaw: async (strings: TemplateStringsArray, id: string) => {
      if (strings.join('').includes('information_schema')) return failure === 'migration' ? [{ is_nullable: 'NO' }] : [{ is_nullable: 'YES' }];
      assert.ok(strings.join('').includes('FOR UPDATE')); assert.equal(id, 'quote-a'); calls.push('lock'); return [];
    },
    $executeRaw: async (strings: TemplateStringsArray, id: string) => {
      assert.ok(strings.join('').includes('SET "quotationId" = NULL')); assert.equal(id, 'quote-a');
      calls.push('tombstone'); related.quotationCreateIdempotency = ['retained-tombstone']; return 1;
    },
    quotation: { findUnique: async () => structuredClone(record), deleteMany: async ({ where }: any) => {
      assert.deepEqual(where.orders, { none: {} }); assert.deepEqual(where.nextVersion, { is: null }); calls.push('quotation');
      if (failure === 'zero') return { count: 0 }; if (failure === 'P2003') throw { code: failure };
      record = null; return { count: 1 };
    } },
  };
  for (const name of Object.keys(related)) transaction[name] = { deleteMany: async ({ where }: any) => {
    assert.deepEqual(where, { quotationId: 'quote-a' }); calls.push(name); related[name] = []; return { count: 1 };
  } };
  const database: any = { quotation: { ...transaction.quotation, findFirst: async () => structuredClone(record), findMany: async () => record ? [structuredClone(record)] : [] },
    $transaction: async (work: any, options: any) => {
      assert.equal(options.isolationLevel, 'Serializable'); const before = structuredClone({ record, related });
      try { const result = await work(transaction); if (failure === 'P2034') throw { code: failure }; calls.push('commit'); return result; }
      catch (error) { record = before.record; related = before.related; throw error; }
    } };
  return { database, calls, business, record: () => record, related: () => related };
}
test('Admin and assigned Staff delete quote-only dependencies in FK order; repeated delete returns 404', async () => {
  for (const actor of [{ id: 'admin', role: 'admin' }, { id: 'staff-a', role: 'staff' }]) {
    const f = fixture(), business = structuredClone(f.business);
    assert.deepEqual(await permanentlyDeleteQuotation(f.database, actor, 'quote-a'), { id: 'quote-a', deleted: true, pdfCleanupPending: false });
    assert.deepEqual(f.calls, ['lock', 'quotationFile', 'quotationReview', 'tombstone', 'quotationItem', 'quotation', 'commit']);
    assert.equal(f.record(), null); assert.deepEqual(f.related().quotationCreateIdempotency, ['retained-tombstone']);
    for (const name of ['quotationFile', 'quotationReview', 'quotationItem']) assert.deepEqual(f.related()[name], []);
    assert.deepEqual(f.business, business);
    await assert.rejects(permanentlyDeleteQuotation(f.database, actor, 'quote-a'), (e: any) => e.httpStatus === 404);
  }
});
test('unactivated tombstone migration blocks deletion before any child writes', async () => {
  const f = fixture({}, 'migration'), before = structuredClone(f.related());
  await assert.rejects(permanentlyDeleteQuotation(f.database, { id: 'admin', role: 'admin' }, 'quote-a'), (e: any) => e.httpStatus === 503 && e.code === 'QUOTATION_DELETE_MIGRATION_REQUIRED');
  assert.deepEqual(f.related(), before); assert.ok(f.record()); assert.deepEqual(f.calls, ['lock']);
});
test('Staff assignment and Customer role deny deletion before child writes', async () => {
  for (const actor of [{ id: 'staff-b', role: 'staff' }, { id: 'customer', role: 'customer' }]) {
    const f = fixture(); await assert.rejects(permanentlyDeleteQuotation(f.database, actor, 'quote-a'), (e: any) => e.httpStatus === 403);
    assert.ok(f.record()); assert.ok(!f.calls.includes('quotationFile'));
  }
});
test('all linked Orders, CONVERTED, nextVersion and unknown status block deletion', async () => {
  for (const overrides of [{ status: 'CONVERTED' }, { orders: [{ id: 'order-1' }] }, { nextVersion: { id: 'next-quote' } }, { status: 'UNKNOWN' }]) {
    const f = fixture(overrides); await assert.rejects(permanentlyDeleteQuotation(f.database, { id: 'admin', role: 'admin' }, 'quote-a'), (e: any) => e.httpStatus === 409);
    assert.ok(!f.calls.includes('quotationFile')); assert.ok(f.record());
  }
});
test('FK, serialization and zero-count failures rollback every child row without retries', async () => {
  for (const failure of ['zero', 'P2003', 'P2034']) {
    const f = fixture({}, failure), before = structuredClone(f.related());
    await assert.rejects(permanentlyDeleteQuotation(f.database, { id: 'admin', role: 'admin' }, 'quote-a'), (e: any) => e.httpStatus === 409);
    assert.ok(f.record()); assert.deepEqual(f.related(), before); assert.equal(f.calls.filter(call => call === 'lock').length, 1);
  }
});
test('private PDF bytes are removed only after commit; rollback keeps bytes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'webphone-permanent-delete-'));
  const storage = { privateRoot: path.join(root, 'private'), publicUploadRoots: [path.join(root, 'uploads')] };
  await fs.mkdir(storage.privateRoot); await fs.mkdir(storage.publicUploadRoots[0]);
  const filename = path.join(storage.privateRoot, 'own.pdf');
  try {
    await fs.writeFile(filename, '%PDF-test');
    const failed = fixture({ files: [{ storageKey: 'own.pdf' }] }, 'P2034');
    await assert.rejects(permanentlyDeleteQuotation(failed.database, { id: 'admin', role: 'admin' }, 'quote-a', storage));
    assert.equal(await fs.readFile(filename, 'utf8'), '%PDF-test');
    const f = fixture({ files: [{ storageKey: 'own.pdf' }] });
    assert.equal((await permanentlyDeleteQuotation(f.database, { id: 'admin', role: 'admin' }, 'quote-a', storage)).pdfCleanupPending, false);
    await assert.rejects(fs.stat(filename), (e: any) => e.code === 'ENOENT');
  } finally { await fs.rm(root, { recursive: true, force: true }); }
});
test('unsafe private filename is not deleted; cleanup warning does not pretend DB rollback', async () => {
  const f = fixture({ files: [{ storageKey: '../must-not-delete.pdf' }] });
  const result = await permanentlyDeleteQuotation(f.database, { id: 'admin', role: 'admin' }, 'quote-a', { privateRoot: 'isolated-private', publicUploadRoots: ['isolated-public'] });
  assert.equal(result.pdfCleanupPending, true); assert.equal(f.record(), null);
});
test('isolated HTTP DELETE RBAC, Admin/Staff success, list refresh and all PDF scopes return 404 after deletion', async () => {
  process.env.JWT_SECRET ||= 'isolated-deletion-test-only-not-a-real-secret';
  const { createQuotationRouters } = await import('../src/routes/quotation.routes');
  for (const scope of ['admin', 'staff']) {
    const f = fixture(), app = express();
    const routers = createQuotationRouters({ database: f.database,
      authenticate: (req: any, res, next) => { const [role, id] = (req.get('Authorization') || '').split(':'); if (!id) { res.status(401).end(); return; } req.user = { role, id }; next(); },
      getPricing: () => { throw new Error('unused'); }, getOrderConverter: () => { throw new Error('unused'); },
      privateStorage: { privateRoot: 'isolated-private', publicUploadRoots: ['isolated-public'] },
    });
    app.use('/api/quotations', routers.customer); app.use('/api/staff/quotations', routers.staff); app.use('/api/admin/quotations', routers.admin);
    const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${(server.address() as any).port}`, auth = scope === 'admin' ? 'admin:admin-a' : 'staff:staff-a';
    try {
      assert.equal((await fetch(url + '/api/quotations/quote-a', { method: 'DELETE', headers: { Authorization: 'customer:customer-a' } })).status, 403);
      assert.equal((await fetch(url + '/api/admin/quotations/quote-a', { method: 'DELETE', headers: { Authorization: 'customer:customer-a' } })).status, 403);
      assert.equal((await fetch(url + '/api/admin/quotations/quote-a', { method: 'DELETE' })).status, 401);
      assert.equal((await fetch(url + '/api/staff/quotations/quote-a', { method: 'DELETE', headers: { Authorization: 'staff:staff-b' } })).status, 403);
      assert.equal((await fetch(`${url}/api/${scope}/quotations/quote-a`, { method: 'DELETE', headers: { Authorization: auth } })).status, 200);
      assert.equal((await fetch(`${url}/api/${scope}/quotations/quote-a`, { method: 'DELETE', headers: { Authorization: auth } })).status, 404);
      assert.deepEqual((await (await fetch(url + '/api/quotations', { headers: { Authorization: 'customer:customer-a' } })).json() as any).quotations, []);
      for (const pdfScope of ['quotations', 'admin/quotations', 'staff/quotations']) {
        assert.equal((await fetch(`${url}/api/${pdfScope}/quote-a/pdf`, { headers: { Authorization: pdfScope.startsWith('admin') ? 'admin:admin' : pdfScope.startsWith('staff') ? 'staff:staff-a' : 'customer:customer-a' } })).status, 404);
      }
    } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  }
});
