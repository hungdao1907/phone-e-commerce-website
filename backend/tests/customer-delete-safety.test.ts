import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { requireRoles } from '../src/middleware/authorization.middleware';
import { createCustomerDeleteHandler } from '../src/routes/customer-delete.handler';

type Counts = {
  orders?: number;
  payments?: number;
  invoices?: number;
  quotations?: number;
  disputes?: number;
  reviews?: number;
  wishlists?: number;
};

function fixture(counts: Counts = {}, deleteError?: unknown) {
  const state = { customerExists: true, committed: false, transactionCalls: 0, deleteCalls: 0, isolationLevel: '' };
  const database = {
    $transaction: async (callback: (tx: any) => Promise<unknown>, options: { isolationLevel: string }) => {
      state.transactionCalls += 1;
      state.isolationLevel = options.isolationLevel;
      let nextCustomerExists = state.customerExists;
      const tx = {
        customer: {
          findUnique: async () => nextCustomerExists ? { id: 'customer-1' } : null,
          delete: async () => {
            state.deleteCalls += 1;
            if (deleteError) throw deleteError;
            nextCustomerExists = false;
          },
        },
        order: { count: async () => counts.orders ?? 0 },
        payment: { count: async () => counts.payments ?? 0 },
        invoice: { count: async () => counts.invoices ?? 0 },
        quotation: { count: async () => counts.quotations ?? 0 },
        dispute: { count: async () => counts.disputes ?? 0 },
        review: { count: async () => counts.reviews ?? 0 },
        wishlist: { count: async () => counts.wishlists ?? 0 },
      };
      const result = await callback(tx);
      state.customerExists = nextCustomerExists;
      state.committed = true;
      return result;
    },
  } as unknown as PrismaClient;
  return { database, state };
}

function responseFixture() {
  const response: any = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  return response;
}

async function invokeAuthorizedDelete(role: string, database: PrismaClient) {
  const request: any = { params: { id: 'customer-1' }, user: { id: 'staff-1', role } };
  const response = responseFixture();
  let authorized = false;
  requireRoles('staff', 'admin', 'superadmin')(request, response, () => { authorized = true; });
  if (authorized) await createCustomerDeleteHandler(database)(request, response, () => undefined);
  return { request, response, authorized };
}

test('Customer with protected history is rejected and transaction rolls back without deleting related rows', async () => {
  const { database, state } = fixture({ orders: 1, invoices: 1, reviews: 2 });
  const { response } = await invokeAuthorizedDelete('staff', database);
  assert.equal(response.statusCode, 409);
  assert.match(response.body.message, /dữ liệu liên quan cần được bảo toàn/i);
  assert.equal(state.customerExists, true);
  assert.equal(state.committed, false);
  assert.equal(state.deleteCalls, 0);
  assert.equal(state.isolationLevel, 'Serializable');
});

test('Customer with no dependent data is deleted in one serializable transaction', async () => {
  const { database, state } = fixture();
  const { response } = await invokeAuthorizedDelete('staff', database);
  assert.equal(response.statusCode, 200);
  assert.equal(state.transactionCalls, 1);
  assert.equal(state.customerExists, false);
  assert.equal(state.committed, true);
});

test('Foreign-key violation rolls back and returns 409 instead of leaving a partial deletion', async () => {
  const { database, state } = fixture({}, { code: 'P2003' });
  const { response } = await invokeAuthorizedDelete('admin', database);
  assert.equal(response.statusCode, 409);
  assert.equal(state.customerExists, true);
  assert.equal(state.committed, false);
});

test('Customer role cannot invoke Staff customer deletion; no database transaction starts', async () => {
  const { database, state } = fixture();
  const { response, authorized } = await invokeAuthorizedDelete('customer', database);
  assert.equal(authorized, false);
  assert.equal(response.statusCode, 403);
  assert.equal(state.transactionCalls, 0);
});
