import assert from 'node:assert/strict';
import test from 'node:test';
import { cancelUnpaidOrder } from '../src/services/order-cancellation.service';
import { markPendingOrderPaid } from '../src/services/payment-order-transition';
import { getBannerDisplayPricing } from '../src/services/campaign-banner-pricing';
import { parseSpecificationJSON } from '../src/services/import.service';
import { isPublicImageAddress, downloadAndProcessImage } from '../src/utils/image-downloader';
import { mailer } from '../src/services/mailer';
import { hashCustomerRegistrationOtp, matchesCustomerRegistrationOtp } from '../src/services/customer-registration-otp';

function fixture(overrides: any = {}, failStock = false) {
  let state: any = { order: { id: 'o1', customerId: 'c1', assignedStaffId: 's1', status: 'pending', paymentStatus: 'UNPAID',
    Payment: [{ status: 'PENDING' }], items: [{ variantId: 'v1', quantity: 1 }, { variantId: 'v1', quantity: 2 }], ...overrides },
    stock: 0, increments: 0, transfer: null };
  const db = { $transaction: async (work: any, options: any) => {
    assert.equal(options.isolationLevel, 'Serializable');
    const pending = structuredClone(state);
    let locked = false;
    const tx = {
      $queryRaw: async (sql: TemplateStringsArray, id: string) => { assert.match(sql.join('?'), /FOR UPDATE/); assert.equal(id, 'o1'); locked = true; },
      order: { findUnique: async () => { assert.ok(locked); return pending.order; }, updateMany: async ({ data }: any) => { Object.assign(pending.order, data); return { count: 1 }; } },
      bankTransaction: { findFirst: async () => pending.transfer },
      productVariant: { update: async ({ data }: any) => { if (failStock) throw Object.assign(new Error('serialization conflict'), { code: 'P2034' }); pending.stock += data.stock.increment; pending.increments++; } },
      payment: { updateMany: async () => { pending.order.Payment[0].status = 'EXPIRED'; } },
    };
    const result = await work(tx); state = pending; return result;
  } };
  return { db, get: () => state };
}

for (const role of ['customer', 'staff', 'admin', 'superadmin']) test(`${role}: authorized unpaid cancellation restores each variant once; replay does not restore twice`, async () => {
  const f = fixture();
  const id = role === 'customer' ? 'c1' : role === 'staff' ? 's1' : 'a1';
  const result = await cancelUnpaidOrder(f.db, { role, id }, 'o1', { reason: 'test' });
  assert.equal(result.replayed, false); assert.equal(f.get().stock, 3); assert.equal(f.get().increments, 1);
  assert.equal(f.get().order.Payment[0].status, 'EXPIRED');
  assert.equal((await cancelUnpaidOrder(f.db, { role, id }, 'o1', { reason: 'retry' })).replayed, true);
  assert.equal(f.get().stock, 3); assert.equal(f.get().increments, 1);
});

for (const role of ['customer', 'staff']) test(`${role}: another owner's/assignee's order cannot be cancelled`, async () => {
  const f = fixture();
  await assert.rejects(cancelUnpaidOrder(f.db, { role, id: 'other' }, 'o1', { reason: 'test' }), (e: any) => e.httpStatus === 404);
  assert.equal(f.get().stock, 0); assert.equal(f.get().order.status, 'pending');
});

test('unauthenticated cancellation and missing reason fail before opening a transaction', async () => {
  await assert.rejects(cancelUnpaidOrder({}, {}, 'o1', { reason: 'test' }), (e: any) => e.httpStatus === 403);
  await assert.rejects(cancelUnpaidOrder({}, { id: 'c1', role: 'customer' }, 'o1', {}), (e: any) => e.httpStatus === 400);
});

for (const change of [{ paymentStatus: 'PAID' }, { Payment: [{ status: 'PAID' }] }, { status: 'shipping' }, { status: 'delivered' }, { status: 'completed' }]) {
  test(`paid/shipped order remains intact: ${JSON.stringify(change)}`, async () => {
    const f = fixture(change);
    await assert.rejects(cancelUnpaidOrder(f.db, { id: 'c1', role: 'customer' }, 'o1', { reason: 'test' }), (e: any) => e.httpStatus === 409);
    assert.equal(f.get().stock, 0); assert.equal(f.get().order.status, change.status || 'pending');
  });
}

test('stock failure rolls back cancellation and Payment expiration (mock transaction)', async () => {
  const f = fixture({}, true);
  await assert.rejects(cancelUnpaidOrder(f.db, { id: 'c1', role: 'customer' }, 'o1', { reason: 'test' }), (e: any) => e.httpStatus === 409);
  assert.equal(f.get().stock, 0); assert.equal(f.get().order.status, 'pending'); assert.equal(f.get().order.Payment[0].status, 'PENDING');
});

test('incoming transfer requiring review blocks stock restoration', async () => {
  const f = fixture(); f.get().transfer = { id: 'transfer' };
  await assert.rejects(cancelUnpaidOrder(f.db, { id: 'c1', role: 'customer' }, 'o1', { reason: 'test' }), (e: any) => e.httpStatus === 409);
  assert.equal(f.get().stock, 0);
});

test('payment transition cannot reopen cancelled or already paid Orders', async () => {
  for (const count of [0, 1]) {
    const tx = { order: { updateMany: async (args: any) => {
      assert.equal(args.where.id, 'o1'); assert.ok(!args.where.status.in.includes('cancelled'));
      assert.ok(!args.where.status.in.includes('shipping')); assert.deepEqual(args.where.paymentStatus.notIn, ['PAID','REFUNDED']);
      assert.equal(args.where.paymentMethod, 'BANK_TRANSFER'); return { count };
    } } };
    assert.equal(await markPendingOrderPaid(tx, 'o1'), count === 1);
  }
});

const now = new Date('2026-10-12T00:00:00Z');
const product = { id: 'p1', categoryId: 'cat', variants: [{ id: 'v1', price: 100000, salePrice: 80000 }] };
const campaign = { id: 'cp1', isActive: true, startDate: '2026-10-01', endDate: '2026-10-30', appliesTo: 'all', discountType: 'percentage', discountValue: 10 };
test('banner uses best sale/campaign offer rather than stacking discounts', () => {
  assert.equal(getBannerDisplayPricing(product, null, [campaign], now)?.salePrice, 80000);
  assert.equal(getBannerDisplayPricing(product, 'v1', [{ ...campaign, discountValue: 30 }], now)?.salePrice, 70000);
});
test('banner chooses an actual cheapest variant and rejects invalid variant IDs', () => {
  assert.equal(getBannerDisplayPricing({ ...product, variants: [...product.variants, { id: 'v2', price: 60000 }] }, null, [], now)?.variantId, 'v2');
  assert.equal(getBannerDisplayPricing(product, 'missing', [], now), null);
});
test('inactive campaign cannot change banner price', () => {
  assert.equal(getBannerDisplayPricing(product, null, [{ ...campaign, isActive: false, discountValue: 90 }], now)?.salePrice, 80000);
});

test('import keeps valid grouped specifications and rejects malformed JSON/shape', () => {
  const specs = [{ title: 'Storage', items: [{ label: 'RAM', value: '8GB' }] }];
  assert.deepEqual(parseSpecificationJSON(JSON.stringify(specs), 'Fixture').specs, specs);
  for (const bad of ['{', '{}', '[{"items":[]}]', '[{"title":"Storage","items":{}}]']) assert.ok(parseSpecificationJSON(bad, 'Fixture').error);
});

test('image import rejects private and mapped addresses without downloading', async () => {
  for (const address of ['127.0.0.1','10.1.1.1','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fe80::1']) assert.equal(isPublicImageAddress(address), false);
  assert.equal(isPublicImageAddress('8.8.8.8'), true);
  await assert.rejects(downloadAndProcessImage('http://127.0.0.1/private'), /Unsafe URL/);
  await assert.rejects(downloadAndProcessImage('file:///private'), /Unsafe URL/);
});

test('Brevo integration uses mock HTTPS transport; failure is not swallowed', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.BREVO_API_KEY, previousSender = process.env.BREVO_SENDER_EMAIL;
  process.env.BREVO_API_KEY = 'mock-key'; process.env.BREVO_SENDER_EMAIL = 'fixture@example.invalid';
  try {
    globalThis.fetch = (async (url: any, options: any) => {
      assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
      assert.equal(JSON.parse(options.body).to[0].email, 'recipient@example.invalid');
      return Response.json({ messageId: 'mock-only' });
    }) as typeof fetch;
    assert.deepEqual(await mailer.sendMail({ to: 'recipient@example.invalid', subject: 'fixture', html: '<p>fixture</p>' }), { messageId: 'mock-only' });
    globalThis.fetch = (async () => new Response('mock failure', { status: 503 })) as typeof fetch;
    await assert.rejects(mailer.sendMail({ to: 'recipient@example.invalid', subject: 'fixture', html: 'fixture' }), /503/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previousKey;
    if (previousSender === undefined) delete process.env.BREVO_SENDER_EMAIL; else process.env.BREVO_SENDER_EMAIL = previousSender;
  }
});

test('registration OTP cannot be reused as a password-reset OTP', () => {
  const stored = hashCustomerRegistrationOtp('123456', 'fixture-secret:password-reset');
  assert.equal(matchesCustomerRegistrationOtp(stored, '123456', 'fixture-secret'), false);
  assert.equal(matchesCustomerRegistrationOtp(stored, '123456', 'fixture-secret:password-reset'), true);
});
