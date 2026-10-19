import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import jwt from 'jsonwebtoken';
import { CheckoutRecipientError, resolveCheckoutRecipient } from '../src/services/checkout-recipient.service';
import { fingerprintDirectCheckoutRequest } from '../src/services/order-idempotency.service';
import { calculateCheckoutPricing, createCheckoutPricingConfirmation } from '../src/services/checkout-pricing.service';
import { issueTrackingProof } from '../src/services/order-tracking-security';

// Exercise actual Express handlers against transactional mocks. No real DB or mail transport.
const secret = 'checkout-recipient-test-signing-key-only';
let router: any, prisma: any, mailer: any;
before(async () => {
  process.env.JWT_SECRET = secret;
  process.env.CHECKOUT_IDEMPOTENCY_ENABLED = 'true';
  process.env.PRISMA_RUNTIME_URL = 'postgresql://localhost:5432/test';
  ({ default: router } = await import('../src/routes/order.routes'));
  ({ default: prisma } = await import('../src/config/prisma'));
  ({ mailer } = await import('../src/services/mailer'));
});
const customer = { id: 'customer-a', fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567', verified: true };
const payload = { items: [{ variantId: 'variant-test', quantity: 1 }], deliveryMethod: 'delivery' as const,
  paymentMethod: 'COD', shippingAddress: 'Địa chỉ giao hàng test', shippingPhone: '0987654321', recipientName: 'Trần Văn B' };

function fixture(t: any, overrides = {}) {
  let state: any = { customer: { ...customer, ...overrides }, orders: [], claims: [], payments: [], stock: 5, notices: [] };
  const mails: any[] = [];
  const variant = { id: 'variant-test', price: 10_000_000, salePrice: null, stock: 5, attributes: { storage: '256GB' },
    product: { id: 'product-test', name: 'Điện thoại fixture', status: 'active' } };
  const txFor = (pending: any): any => ({
    customer: { findUnique: async ({ where }: any) => where.id === pending.customer?.id ? structuredClone(pending.customer) : null },
    productVariant: {
      findMany: async () => [variant],
      updateMany: async ({ where, data }: any) => {
        if (pending.stock < where.stock.gte) return { count: 0 };
        pending.stock -= data.stock.decrement; return { count: 1 };
      },
    },
    campaign: { findMany: async () => [] }, rewardMilestone: { findMany: async () => [] }, promoCode: { findUnique: async () => null },
    order: {
      create: async ({ data }: any) => {
        const row = { ...data, id: `order-${pending.orders.length + 1}`, customer: structuredClone(pending.customer),
          items: data.items.create, Payment: [] };
        pending.orders.push(row); return row;
      },
      findUnique: async ({ where }: any) => {
        const row = pending.orders.find((order: any) => order.id === where.id);
        return row ? { ...row, Payment: pending.payments.filter((payment: any) => payment.orderId === row.id) } : null;
      },
    },
    payment: { create: async ({ data }: any) => { pending.payments.push(data); return data; } },
    checkoutIdempotency: {
      create: async ({ data }: any) => {
        if (pending.claims.some((claim: any) => claim.customerId === data.customerId && claim.keyHash === data.keyHash)) {
          throw Object.assign(new Error('fixture duplicate'), { code: 'P2002', meta: { modelName: 'CheckoutIdempotency', target: ['customerId', 'keyHash'] } });
        }
        const row = { ...data, id: `claim-${pending.claims.length + 1}`, orderId: null }; pending.claims.push(row); return row;
      },
      update: async ({ where, data }: any) => Object.assign(pending.claims.find((claim: any) => claim.id === where.id), data),
    },
    $queryRaw: async (_sql: any, orderId: string) => pending.orders.some((row: any) => row.id === orderId) ? [{ id: orderId }] : [],
    notification: { create: async ({ data }: any) => { pending.notices.push(data); return data; } },
  });
  const restores: Array<() => void> = [];
  const replace = (object: any, field: string, value: any) => {
    const old = object[field]; object[field] = value; restores.push(() => { object[field] = old; });
  };
  replace(prisma, '$transaction', async (work: any) => {
    const pending = structuredClone(state);
    const result = await work(txFor(pending)); state = pending; return result;
  });
  replace(prisma.checkoutIdempotency, 'findUnique', async ({ where }: any) => state.claims.find((claim: any) =>
    claim.customerId === where.customerId_keyHash.customerId && claim.keyHash === where.customerId_keyHash.keyHash) || null);
  replace(prisma.order, 'findUnique', async ({ where }: any) => state.orders.find((row: any) => row.id === where.id) || null);
  replace(mailer, 'sendMail', async (mail: any) => { mails.push(mail); return { accepted: [mail.to] }; });
  t.after(() => restores.reverse().forEach(restore => restore()));
  return { get: () => state, mails, db: txFor(state) };
}

async function invoke(method: string, path: string, body: any, key = 'recipient-key-00000001', role: string | null = 'customer', query: any = {}) {
  const layer = router.stack.find((entry: any) => entry.route?.path === path && entry.route.methods[method]);
  assert.ok(layer);
  const token = role ? jwt.sign({ id: customer.id, role }, secret, { expiresIn: '1h' }) : null;
  const authorization = path === '/track/details' ? query.token : token;
  const request = { body, query, headers: authorization ? { authorization: `Bearer ${authorization}` } : {}, get: () => key };
  const response: any = { statusCode: 200, body: undefined,
    status(code: number) { this.statusCode = code; return this; }, json(value: any) { this.body = value; return this; } };
  for (const entry of layer.route.stack) {
    let next = false;
    await entry.handle(request, response, () => { next = true; });
    if (!next) break;
  }
  // All external side effects are mocked, flush post-commit promises before checking/restoring.
  await new Promise<void>(resolve => setImmediate(resolve));
  return response;
}
async function confirmation(db: any) {
  const request = { items: payload.items, deliveryMethod: payload.deliveryMethod, promoCode: null };
  return createCheckoutPricingConfirmation(customer.id, request, await calculateCheckoutPricing(db, request), secret);
}

for (const method of ['COD', 'BANK_TRANSFER']) test(`${method}: Order snapshots recipient, leaves Customer intact and retries exactly once`, async t => {
  const f = fixture(t); const initialCustomer = structuredClone(f.get().customer);
  const body = { ...payload, paymentMethod: method, pricingConfirmation: await confirmation(f.db) };
  const first = await invoke('post', '/', body);
  assert.equal(first.statusCode, 201);
  assert.equal(first.body.order.customerId, customer.id);
  assert.equal(first.body.order.recipientName, 'Trần Văn B');
  assert.equal(first.body.order.shippingPhone, '0987654321');
  assert.equal(first.body.order.shippingAddress, payload.shippingAddress);
  assert.equal(first.body.order.status, method === 'COD' ? 'confirmed' : 'pending_payment');
  assert.deepEqual(f.get().customer, initialCustomer);
  assert.equal(f.get().payments.length, method === 'BANK_TRANSFER' ? 1 : 0);
  assert.equal(f.mails.length, 1); assert.equal(f.mails[0].to, customer.email);
  assert.match(f.mails[0].html, /Trần Văn B/); assert.match(f.mails[0].html, /Nguyễn Văn A/);
  const retry = await invoke('post', '/', { ...body, pricingConfirmation: 'expired-on-retry' });
  assert.equal(retry.statusCode, 200); assert.equal(retry.body.replayed, true);
  assert.equal(retry.body.order.id, first.body.order.id);
  assert.equal(f.get().orders.length, 1); assert.equal(f.get().stock, 4); assert.equal(f.mails.length, 1);
  const changed = await invoke('post', '/', { ...body, recipientName: 'Người nhận khác' });
  assert.equal(changed.statusCode, 409); assert.equal(changed.body.code, 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH');
  assert.equal(f.get().orders.length, 1); assert.deepEqual(f.get().customer, initialCustomer);
});

test('legacy checkout without recipientName snapshots authenticated account name', async t => {
  const f = fixture(t); const { recipientName: _name, ...legacy } = payload;
  const response = await invoke('post', '/', { ...legacy, pricingConfirmation: await confirmation(f.db) });
  assert.equal(response.statusCode, 201); assert.equal(response.body.order.recipientName, customer.fullName);
  const retry = await invoke('post', '/', { ...legacy, pricingConfirmation: 'expired' });
  assert.equal(retry.statusCode, 200); assert.equal(f.get().orders.length, 1);
});

test('JWT ownership and identity override protection run before any order/Customer write', async t => {
  const f = fixture(t);
  assert.equal((await invoke('post', '/', payload, undefined, null)).statusCode, 401);
  for (const role of ['staff', 'admin', 'superadmin']) assert.equal((await invoke('post', '/', payload, undefined, role)).statusCode, 403);
  assert.equal((await invoke('post', '/', { ...payload, customerId: 'customer-b' })).statusCode, 403);
  for (const [field, value] of [['email', 'forged@example.com'], ['customerEmail', 'forged@example.com'], ['fullName', 'Forged identity'], ['phone', '0987654321'], ['customer', { email: 'forged@example.com' }]]) {
    const response = await invoke('post', '/', { ...payload, [field]: value });
    assert.equal(response.statusCode, 400); assert.equal(response.body.code, 'CUSTOMER_IDENTITY_READ_ONLY');
  }
  assert.equal(f.get().orders.length, 0); assert.equal(f.get().claims.length, 0); assert.deepEqual(f.get().customer, customer);
});

test('invalid recipient or account profile rolls back checkout without reserving stock', async t => {
  const f = fixture(t); const proof = await confirmation(f.db);
  for (const name of ['', '   ', null, 42, 'x'.repeat(201)]) {
    const response = await invoke('post', '/', { ...payload, recipientName: name, pricingConfirmation: proof });
    assert.equal(response.statusCode, 400);
  }
  f.get().customer.email = 'invalid';
  assert.equal((await invoke('post', '/', { ...payload, pricingConfirmation: proof })).body.code, 'CUSTOMER_EMAIL_INVALID');
  f.get().customer.email = customer.email; f.get().customer.verified = false;
  assert.equal((await invoke('post', '/', { ...payload, pricingConfirmation: proof })).statusCode, 403);
  assert.equal(f.get().orders.length, 0); assert.equal(f.get().claims.length, 0); assert.equal(f.get().stock, 5); assert.equal(f.mails.length, 0);
});

test('missing Customer and blank fallback name are rejected by trusted-profile resolver', async () => {
  await assert.rejects(resolveCheckoutRecipient({ customer: { findUnique: async () => null } }, customer.id, 'Name'),
    (error: any) => error instanceof CheckoutRecipientError && error.status === 403);
  await assert.rejects(resolveCheckoutRecipient({ customer: { findUnique: async () => ({ ...customer, fullName: '' }) } }, customer.id, undefined),
    (error: any) => error.code === 'INVALID_RECIPIENT_NAME');
});

test('new recipient names affect fingerprints; omission still produces the historical hash', () => {
  const { recipientName: _name, ...legacy } = payload;
  const named = fingerprintDirectCheckoutRequest(customer.id, payload);
  assert.equal(named, fingerprintDirectCheckoutRequest(customer.id, { ...payload, recipientName: '  Trần Văn B  ' }));
  assert.notEqual(named, fingerprintDirectCheckoutRequest(customer.id, { ...payload, recipientName: 'Recipient C' }));
  assert.notEqual(named, fingerprintDirectCheckoutRequest(customer.id, legacy));
  assert.equal(fingerprintDirectCheckoutRequest(customer.id, legacy),
    '39e687f739a783fc75c70a65658637d955887646cf6024cd33c7afbabc105243');
});

test('OTP-protected tracking uses recipient snapshot and falls back for legacy orders', async t => {
  const f = fixture(t);
  f.get().orders.push({ ...payload, id: 'tracking-fixture', orderCode: 'DH12345678901', customer, items: [] });
  const proof = issueTrackingProof('tracking-fixture');
  const response = await invoke('get', '/track/details', undefined, undefined, null, { token: proof.token });
  assert.equal(response.statusCode, 200); assert.equal(response.body.order.recipientName, payload.recipientName);
  assert.equal(response.body.order.shippingPhone, payload.shippingPhone);
  delete f.get().orders[0].recipientName;
  const legacy = await invoke('get', '/track/details', undefined, undefined, null, { token: proof.token });
  assert.equal(legacy.statusCode, 200); assert.equal(legacy.body.order.recipientName, customer.fullName);
  assert.equal(f.mails.length, 0);
});
