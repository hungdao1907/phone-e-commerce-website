import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { deleteOrderSafely } from '../src/services/order-deletion.service';
import { createOrderDeleteHandler } from '../src/routes/order-delete.handler';
import { cancelUnpaidOrder } from '../src/services/order-cancellation.service';
import { deleteCustomerSafely } from '../src/services/customer-deletion.service';
import { createOrderNotificationSafely, lockExistingOrderReference, recordBankEventWithOrderReference } from '../src/services/order-reference.service';
import { runIdempotentCheckout } from '../src/services/order-idempotency.service';
import { readFileSync } from 'node:fs';

const secret = 'order-deletion-jwt-fixture-only';
let authenticateToken: any, requireRoles: any;
before(async () => {
  process.env.JWT_SECRET = secret;
  ({ authenticateToken } = await import('../src/middleware/auth.middleware'));
  ({ requireRoles } = await import('../src/middleware/authorization.middleware'));
});
const code = 'DH12345678901';
function fixture(overrides: any = {}, failure = '') {
  let state: any = {
    order: { id: 'order-fixture', orderCode: code, customerId: 'customer-fixture', quotationId: null, status: 'cancelled', paymentStatus: 'UNPAID', paymentMethod: 'COD', note: null,
      items: [{ id: 'item-fixture', variantId: 'variant-fixture', quantity: 2 }], Payment: [], Invoice: null, ...overrides },
    customer: { id: 'customer-fixture' }, otherOrder: { id: 'other-order' }, stock: 8, banks: [], reviews: 0, disputes: 0, unknownFk: false,
    notifications: [{ id: 'notice-fixture', referenceId: 'order-fixture', referenceType: 'Order' }, { id: 'other-notice', referenceId: 'other-order', referenceType: 'Order' }],
    keys: [{ orderId: 'order-fixture', keyHash: 'retained-key', requestHash: 'retained-request' }],
    sequence: [] as string[], isolations: [] as string[], commits: 0, customerWrites: 0,
  };
  let transactions = 0;
  const db: any = { $transaction: async (work: any, options?: any) => {
    transactions++;
    if (options) assert.ok(['Serializable', 'ReadCommitted'].includes(options.isolationLevel));
    const pending = structuredClone(state);
    if (options) pending.isolations.push(options.isolationLevel);
    let locked = false;
    const tx: any = {
      $queryRaw: async (sql: TemplateStringsArray, ...values: any[]) => {
        if (sql.join('?').includes('pg_constraint')) {
          assert.ok(locked);
          return [
            ['OrderItem', 'orderId', 'Order'], ['Payment', 'orderId', 'Order'], ['Invoice', 'orderId', 'Order'],
            ['Review', 'orderId', 'Order'], ['Dispute', 'orderId', 'Order'], ['CheckoutIdempotency', 'orderId', 'Order'],
            ['Review', 'orderItemId', 'OrderItem'], ['Dispute', 'orderItemId', 'OrderItem'],
          ].map(([child_table, column, parent_table], i) => ({ child_schema: 'public', child_table: pending.unknownFk && i === 0 ? 'FutureBusinessData' : child_table, child_columns: [column], parent_table, parent_columns: ['id'] }));
        }
        assert.match(sql.join('?'), /FOR (UPDATE|KEY SHARE)/); assert.equal(values[0], 'order-fixture');
        if (sql.join('?').includes('"OrderItem"')) { assert.ok(locked); pending.sequence.push('item-lock'); return pending.order?.items || []; }
        if (sql.join('?').includes('"Payment"')) { assert.ok(locked); pending.sequence.push('payment-lock'); return pending.order?.Payment || []; }
        locked = true; pending.sequence.push('lock'); return pending.order ? [{ id: pending.order.id }] : [];
      },
      order: {
        findUnique: async () => { assert.ok(locked); return pending.order; },
        updateMany: async ({ data }: any) => { assert.ok(locked); Object.assign(pending.order, data); return { count: 1 }; },
        delete: async ({ where }: any) => { assert.ok(locked); assert.equal(where.id, 'order-fixture'); pending.sequence.push('order'); if (failure) throw Object.assign(new Error('fixture rollback'), { code: failure }); pending.order = null; },
        count: async () => pending.order ? 1 : 0,
      },
      bankTransaction: { findFirst: async ({ where }: any) => {
        assert.ok(locked);
        if (where.OR) { assert.equal(where.OR[0].orderId, 'order-fixture'); assert.equal(where.OR[1].orderCode.equals, code); assert.equal(where.OR[2].description.contains, code); }
        else assert.equal(where.orderId, 'order-fixture');
        return pending.banks[0] || null;
      } },
      review: { count: async ({ where }: any) => { if (where.OR) assert.deepEqual(where.OR[1], { orderItemId: { in: ['item-fixture'] } }); return pending.reviews; } },
      dispute: { count: async () => pending.disputes },
      invoice: { count: async () => pending.order?.Invoice ? 1 : 0 },
      quotation: { count: async () => pending.order?.quotationId ? 1 : 0 },
      quotationCreateIdempotency: { count: async () => 0 }, wishlist: { count: async () => 0 },
      notification: {
        count: async ({ where }: any) => pending.notifications.filter((n: any) => typeof where.referenceId === 'object'
          ? where.referenceId.in.includes(n.referenceId)
          : n.referenceId === where.referenceId && (where.referenceType === null ? n.referenceType === null : n.referenceType !== 'Order' && n.referenceType !== null)).length,
        deleteMany: async ({ where }: any) => {
          assert.equal(where.referenceId, 'order-fixture'); assert.equal(where.referenceType.equals, 'Order');
          pending.sequence.push('notifications');
          const before = pending.notifications.length; pending.notifications = pending.notifications.filter((n: any) => n.referenceId !== where.referenceId);
          return { count: before - pending.notifications.length };
        },
        create: async ({ data }: any) => { pending.notifications.push({ id: 'new-notice', ...data }); return data; },
      },
      checkoutIdempotency: { updateMany: async ({ where, data }: any) => {
        assert.equal(where.orderId, 'order-fixture'); assert.deepEqual(data, { orderId: null }); pending.sequence.push('keys');
        for (const key of pending.keys) if (key.orderId === where.orderId) key.orderId = null;
        return { count: pending.keys.length };
      } },
      payment: {
        deleteMany: async ({ where }: any) => { assert.equal(where.orderId, 'order-fixture'); pending.sequence.push('payments'); const count = pending.order.Payment.length; pending.order.Payment = []; return { count }; },
        updateMany: async () => { for (const p of pending.order.Payment) if (p.status === 'PENDING') p.status = 'EXPIRED'; return { count: 1 }; },
        count: async () => pending.order?.Payment.length || 0,
      },
      orderItem: { deleteMany: async ({ where }: any) => { assert.equal(where.orderId, 'order-fixture'); pending.sequence.push('items'); const count = pending.order.items.length; pending.order.items = []; return { count }; } },
      productVariant: { update: async ({ data }: any) => { pending.stock += data.stock.increment; } },
      customer: { findUnique: async () => pending.customer, delete: async () => { pending.customer = null; pending.customerWrites++; } },
    };
    const result = await work(tx); pending.commits++; state = pending; return result;
  } };
  return { db, get: () => state, transactions: () => transactions };
}
async function expectBlocked(f: ReturnType<typeof fixture>, expectedCode: string, status = 409, confirmation = code) {
  const initial = structuredClone(f.get());
  await assert.rejects(deleteOrderSafely(f.db, 'order-fixture', confirmation), (e: any) => e.status === status && e.code === expectedCode);
  assert.deepEqual(f.get(), initial);
}

test('cancelled unpaid order: controlled child delete, idempotency retained, Customer/other Order/stock untouched', async () => {
  const f = fixture(); const r = await deleteOrderSafely(f.db, 'order-fixture', code);
  assert.equal(r.deleted, true); assert.equal(r.removed.items, 1); assert.equal(f.get().order, null);
  assert.deepEqual(f.get().sequence, ['lock', 'item-lock', 'payment-lock', 'notifications', 'keys', 'payments', 'items', 'order']);
  assert.equal(f.get().isolations[0], 'ReadCommitted');
  assert.equal(f.get().stock, 8); assert.equal(f.get().customerWrites, 0); assert.equal(f.get().customer.id, 'customer-fixture');
  assert.equal(f.get().otherOrder.id, 'other-order'); assert.equal(f.get().notifications[0].id, 'other-notice');
  assert.deepEqual(f.get().keys, [{ orderId: null, keyHash: 'retained-key', requestHash: 'retained-request' }]);
});
test('unsettled Payment rows are explicitly removed', async () => {
  const f = fixture({ Payment: [{ status: 'EXPIRED', paidAt: null, transactionCode: null }] });
  assert.equal((await deleteOrderSafely(f.db, 'order-fixture', code)).removed.payments, 1);
});
test('missing Order and repeated delete return 404 instead of 500', async () => {
  const f = fixture(); await deleteOrderSafely(f.db, 'order-fixture', code);
  await expectBlocked(f, 'ORDER_NOT_FOUND', 404);
});
test('exact confirmation required server-side; wrong/missing confirmation cannot delete', async () => {
  await expectBlocked(fixture(), 'ORDER_DELETE_CONFIRMATION_MISMATCH', 400, ' ' + code);
  await expectBlocked(fixture(), 'ORDER_DELETE_CONFIRMATION_REQUIRED', 400, '');
});
for (const status of ['pending', 'confirmed', 'shipping', 'completed', 'returned']) test(`${status} order requires cancellation first`, () => expectBlocked(fixture({ status }), 'ORDER_MUST_BE_CANCELLED'));
for (const paymentStatus of ['PAID', 'REFUNDED', 'unknown']) test(`preserves paymentStatus=${paymentStatus}`, () => expectBlocked(fixture({ paymentStatus }), 'ORDER_HAS_SETTLEMENT'));
for (const p of [{ status: 'PAID' }, { status: 'REFUNDED' }, { status: 'PENDING', transactionCode: 'bank-reference' }, { status: 'EXPIRED', paidAt: new Date() }]) {
  test(`preserves financial Payment evidence: ${Object.keys(p).join(',')}/${p.status}`, () => expectBlocked(fixture({ Payment: [p] }), 'ORDER_HAS_SETTLEMENT'));
}
test('Invoice is preserved with a clear 409', () => expectBlocked(fixture({ Invoice: { id: 'invoice-fixture' } }), 'ORDER_HAS_INVOICE'));
test('Quotation link/status cannot be erased through Order deletion', () => expectBlocked(fixture({ quotationId: 'quote-fixture' }), 'ORDER_HAS_QUOTATION'));
for (const field of ['reviews', 'disputes']) test(`${field} are protected by direct Order and OrderItem reference checks`, async () => {
  const f = fixture(); f.get()[field] = 1; await expectBlocked(f, 'ORDER_HAS_CUSTOMER_HISTORY');
});
for (const bank of [{ orderId: 'order-fixture' }, { orderCode: code }, { description: `SEVQR ${code}` }]) test(`bank evidence ${Object.keys(bank)[0]} is never deleted`, async () => {
  const f = fixture(); f.get().banks.push(bank); await expectBlocked(f, 'ORDER_HAS_BANK_TRANSACTION');
});
test('unknown inbound foreign key fails closed before writes', async () => { const f = fixture(); f.get().unknownFk = true; await expectBlocked(f, 'ORDER_UNSUPPORTED_DEPENDENCY'); });
for (const referenceType of ['Payment', null]) test(`ambiguous notification ${referenceType} is not silently destroyed`, async () => {
  const f = fixture(); f.get().notifications[0].referenceType = referenceType; await expectBlocked(f, 'ORDER_AMBIGUOUS_NOTIFICATION');
});
test('notification referencing an OrderItem or a Payment ID blocks cleanup rather than becoming orphaned', async () => {
  for (const referenceId of ['item-fixture', 'payment-fixture', code]) {
    const f = fixture({ Payment: [{ id: 'payment-fixture', status: 'EXPIRED', paidAt: null, transactionCode: null }] });
    f.get().notifications.push({ id: 'indirect-notice', referenceId, referenceType: 'Payment' });
    await expectBlocked(f, 'ORDER_AMBIGUOUS_NOTIFICATION');
  }
});
for (const failure of ['P2003', 'P2034', 'P2025', 'P2028']) test(`${failure} rolls back every child/tombstone write (mock transaction)`, () => expectBlocked(fixture({}, failure), 'ORDER_DELETE_CONFLICT'));
test('cancel → delete does not restore stock twice', async () => {
  const f = fixture({ status: 'pending' });
  await cancelUnpaidOrder(f.db, { id: 'root', role: 'superadmin' }, 'order-fixture', { reason: 'fixture cleanup' });
  assert.equal(f.get().stock, 10);
  await cancelUnpaidOrder(f.db, { id: 'root', role: 'superadmin' }, 'order-fixture', { reason: 'retry' });
  await deleteOrderSafely(f.db, 'order-fixture', code); assert.equal(f.get().stock, 10);
});
test('Customer deletion works after Order removal when no remaining history exists', async () => {
  const f = fixture(); await deleteOrderSafely(f.db, 'order-fixture', code);
  await deleteCustomerSafely(f.db, 'customer-fixture'); assert.equal(f.get().customer, null);
});
test('late Order notification cannot recreate a dangling reference', async () => {
  const f = fixture(); await deleteOrderSafely(f.db, 'order-fixture', code);
  assert.equal(await createOrderNotificationSafely(f.db, 'order-fixture', { type: 'ORDER' }), null);
  assert.equal(f.get().notifications.length, 1);
});
test('non-FK notification writer holds an Order reference lock through its transaction', async () => {
  const f = fixture(); await createOrderNotificationSafely(f.db, 'order-fixture', { type: 'ORDER' });
  assert.equal(f.get().notifications.at(-1).referenceId, 'order-fixture');
  assert.equal(await lockExistingOrderReference({ $queryRaw: async () => [] }, 'absent'), false);
});
test('old checkout key returns 410 after hard delete; a new key can still create an order', async () => {
  const payload: any = { items: [{ variantId: 'v1', quantity: 1 }], deliveryMethod: 'delivery', shippingAddress: 'fixture', shippingPhone: 'fixture' };
  const { fingerprintDirectCheckoutRequest } = await import('../src/services/order-idempotency.service');
  const requestHash = fingerprintDirectCheckoutRequest('c1', payload);
  let creates = 0;
  const db: any = {
    $transaction: async (work: any) => work({ checkoutIdempotency: {
      create: async ({ data }: any) => { if (data.keyHash === oldHash) throw { code: 'P2002', meta: { modelName: 'CheckoutIdempotency', target: ['customerId', 'keyHash'] } }; return { id: 'new-claim' }; },
      update: async () => {},
    } }),
    checkoutIdempotency: { findUnique: async () => ({ orderId: null, requestHash }) },
  };
  const { hashCheckoutIdempotencyKey } = await import('../src/services/order-idempotency.service');
  const oldKey = 'old-checkout-key-1234567890'; const oldHash = hashCheckoutIdempotencyKey(oldKey);
  const create = async () => { creates++; return { id: 'new-order', customerId: 'c1' }; };
  await assert.rejects(runIdempotentCheckout(db, 'c1', oldKey, payload, create), (e: any) => e.status === 410);
  assert.equal(creates, 0);
  assert.equal((await runIdempotentCheckout(db, 'c1', 'new-checkout-key-1234567890', payload, create)).order.id, 'new-order'); assert.equal(creates, 1);
});
for (const exists of [false, true]) test(`bank event is preserved without dangling Order ID; orderExists=${exists}`, async () => {
  let locked = false;
  const tx: any = {
    $queryRaw: async (sql: TemplateStringsArray, id: string) => { assert.match(sql.join('?'), /FOR KEY SHARE/); assert.equal(id, 'order-fixture'); locked = true; return exists ? [{ id }] : []; },
    bankTransaction: { create: async ({ data }: any) => { assert.ok(locked); return data; } },
  };
  const r = await recordBankEventWithOrderReference(tx, 'order-fixture', { transactionId: 'bank-fixture', amount: 123, status: 'MANUAL_REVIEW', orderCode: code });
  assert.equal(r.orderExists, exists); assert.equal(r.event.orderId, exists ? 'order-fixture' : null);
  assert.equal(r.event.status, exists ? 'MANUAL_REVIEW' : 'UNMATCHED');
  assert.equal(r.event.amount, 123); assert.equal(r.event.orderCode, code);
});

for (const role of [null, 'customer', 'staff', 'admin', 'superadmin']) test(`DELETE HTTP JWT/RBAC: ${role || 'anonymous'}`, async t => {
  const f = fixture(); const app = express(); app.use(express.json());
  app.delete('/api/orders/:id', authenticateToken, requireRoles('superadmin'), createOrderDeleteHandler(f.db));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => { server.close(() => resolve()); server.closeAllConnections(); }));
  const token = role ? jwt.sign({ id: 'principal-fixture', role }, secret) : null;
  const response = await fetch(`http://127.0.0.1:${(server.address() as any).port}/api/orders/order-fixture`, {
    method: 'DELETE', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ confirmationCode: code }),
  });
  assert.equal(response.status, role === 'superadmin' ? 200 : role ? 403 : 401);
  assert.equal(f.transactions(), role === 'superadmin' ? 1 : 0);
});
test('actual Orders route mounts delete behind the exact superadmin middleware', () => {
  const source = readFileSync('src/routes/order.routes.ts', 'utf8');
  assert.match(source, /router\.delete\('\/:id', authenticateToken, requireRoles\('superadmin'\), createOrderDeleteHandler\(prisma\)\)/);
});
