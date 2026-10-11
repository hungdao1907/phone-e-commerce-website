import assert from 'node:assert/strict';
import test from 'node:test';
import { requireRoles } from '../src/middleware/authorization.middleware';
import {
  canCustomerConfirmQuotation,
  canReadQuotation,
  canStaffApproveQuotation,
} from '../src/services/quotation-policy';
import { canCustomerCompleteOrder, isCustomerPrincipal } from '../src/routes/order-authorization';
import { presentCustomerOrderDetail } from '../src/services/customer-order-detail';

test('Customer detail preserves transaction values and never reprices from catalog', () => {
  const order = { customerId: 'customer-a', totalAmount: 260000, discountAmount: 10000, shippingFee: 20000,
    items: [{ quantity: 2, unitPrice: 125000, productName: 'Tên lúc mua', product: { price: 999999 } }] };
  const before = JSON.stringify(order);
  const result = presentCustomerOrderDetail(order, 'customer-a');
  assert.equal(result.subtotal, 250000);
  assert.equal(result.items[0].lineTotal, 250000);
  assert.equal(result.totalAmount, 260000);
  assert.equal(JSON.stringify(order), before);
  assert.throws(() => presentCustomerOrderDetail(order, 'customer-b'), /ownership/);
  assert.throws(() => presentCustomerOrderDetail({ ...order, totalAmount: -1 }, 'customer-a'), /stored/);
});

function responseFixture() {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: unknown) { this.body = body; return this; },
  };
  return response;
}

test('role middleware fails closed for missing identity and rejects a different role', () => {
  const middleware = requireRoles('staff');
  const unauthenticated = responseFixture();
  let nextCalls = 0;
  middleware({} as any, unauthenticated, (() => { nextCalls += 1; }) as any);
  assert.equal(unauthenticated.statusCode, 401);

  const customerResponse = responseFixture();
  middleware({ user: { id: 'customer-1', role: 'customer' } } as any, customerResponse, (() => { nextCalls += 1; }) as any);
  assert.equal(customerResponse.statusCode, 403);
  assert.equal(nextCalls, 0);
});

test('role middleware permits only the configured Staff role', () => {
  const response = responseFixture();
  let nextCalls = 0;
  requireRoles('staff')(
    { user: { id: 'staff-1', role: 'staff' } } as any,
    response,
    (() => { nextCalls += 1; }) as any,
  );
  assert.equal(nextCalls, 1);
});

test('quotation read isolation follows customer ownership, staff assignment, and admin policy', () => {
  const quote = { customerId: 'customer-a', assignedStaffId: 'staff-a' };
  assert.equal(canReadQuotation({ id: 'customer-a', role: 'customer' }, quote), true);
  assert.equal(canReadQuotation({ id: 'customer-b', role: 'customer' }, quote), false);
  assert.equal(canReadQuotation({ id: 'staff-a', role: 'staff' }, quote), true);
  assert.equal(canReadQuotation({ id: 'staff-b', role: 'staff' }, quote), false);
  assert.equal(canReadQuotation({ id: 'admin', role: 'admin' }, quote), true);
});

test('quotation confirmation and approval require the correct role, assignment, state, and validity window', () => {
  const now = new Date('2026-10-10T00:00:00Z');
  const quotation = {
    customerId: 'customer-a',
    assignedStaffId: 'staff-a',
    status: 'CUSTOMER_CONFIRMED',
    customerConfirmedAt: new Date('2026-10-09T00:00:00Z'),
    expiresAt: new Date('2026-10-11T00:00:00Z'),
  };
  assert.equal(canCustomerConfirmQuotation({ id: 'customer-a', role: 'customer' }, { ...quotation, status: 'PENDING_CUSTOMER_CONFIRMATION' }, now), true);
  assert.equal(canCustomerConfirmQuotation({ id: 'customer-b', role: 'customer' }, { ...quotation, status: 'PENDING_CUSTOMER_CONFIRMATION' }, now), false);
  assert.equal(canStaffApproveQuotation({ id: 'staff-a', role: 'staff' }, quotation, now), true);
  assert.equal(canStaffApproveQuotation({ id: 'staff-b', role: 'staff' }, quotation, now), false);
  assert.equal(canStaffApproveQuotation({ id: 'admin', role: 'admin' }, quotation, now), true);
  assert.equal(canStaffApproveQuotation({ id: 'staff-a', role: 'staff' }, { ...quotation, expiresAt: now }, now), false);
});

test('direct checkout principal and completion authorization remain customer-isolated', () => {
  assert.equal(isCustomerPrincipal({ id: 'customer-a', role: 'customer' }), true);
  assert.equal(isCustomerPrincipal({ id: 'admin', role: 'admin' }), false);
  assert.equal(canCustomerCompleteOrder({ id: 'customer-a', role: 'customer' }, 'customer-a', 'delivered', 'completed', false), true);
  assert.equal(canCustomerCompleteOrder({ id: 'customer-a', role: 'customer' }, 'customer-b', 'delivered', 'completed', false), false);
  assert.equal(canCustomerCompleteOrder({ id: 'customer-a', role: 'customer' }, 'customer-a', 'delivered', 'completed', true), false);
});
