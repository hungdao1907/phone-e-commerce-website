import assert from 'node:assert/strict';
import test from 'node:test';
import { permanentlyDeleteQuotation } from '../src/services/quotation-deletion.service';
import {
  approveAndConvertQuotation,
  confirmQuotation,
  createQuotationDraft,
  createQuotationOrderConverter,
  declineQuotation,
  QuotationWorkflowError,
  rejectQuotation,
} from '../src/services/quotation-workflow.service';

type MockState = { quotation: any; revisions: any[]; variants: any[]; reviews: any[]; orders: any[] };
const clone = <T>(value: T): T => structuredClone(value);

function matches(actual: any, where: any): boolean {
  return Object.entries(where || {}).every(([key, expected]: [string, any]) => {
    if (key === 'product') return actual.product?.status === expected?.is?.status;
    const value = actual[key];
    if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
      if ('in' in expected) return expected.in.includes(value);
      if ('gt' in expected) return value instanceof Date && value > expected.gt;
      if ('lte' in expected) return value instanceof Date && value <= expected.lte;
      if ('gte' in expected) return typeof value === 'number' && value >= expected.gte;
      if ('not' in expected) return value !== expected.not;
    }
    return value === expected;
  });
}

function databaseFixture(initial: Partial<MockState> = {}) {
  let state: MockState = {
    quotation: null,
    revisions: [],
    variants: [{
      id: 'variant-1', sku: 'SKU-1', price: 10000, salePrice: null, stock: 5,
      attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
    }],
    reviews: [],
    orders: [],
    ...clone(initial),
  };
  let stockUpdateCalls = 0;
  let transactionCalls = 0;

  const database: any = {
    $transaction: async (work: (tx: any) => Promise<any>) => {
      transactionCalls += 1;
      const working = clone(state);
      const tx = {
        $queryRaw: async (strings: TemplateStringsArray, id: string) => {
          if (strings.join('').includes('information_schema')) return [{ is_nullable: 'YES' }];
          assert.ok(strings.join('').includes('FOR UPDATE'));
          assert.ok(id);
          return [];
        },
        $executeRaw: async () => 0,
        quotationFile: { deleteMany: async () => ({ count: 0 }) },
        quotationItem: { deleteMany: async () => ({ count: 0 }) },
        quotation: {
          findUnique: async ({ where, include }: any) => {
            const found = where.id
              ? [working.quotation, ...working.revisions].find(quotation => quotation?.id === where.id)
              : where.previousVersionId
                ? [working.quotation, ...working.revisions].find(quotation => quotation?.previousVersionId === where.previousVersionId)
                : null;
            if (!found) return null;
            return clone(include?.orders ? { ...found, orders: working.orders.filter(o => o.quotationId === found.id), files: [], nextVersion: null } : found);
          },
          deleteMany: async () => { working.quotation = null; return { count: 1 }; },
          create: async ({ data }: any) => {
            const created = {
              id: data.previousVersionId ? `quotation-${working.revisions.length + 2}` : 'quotation-1',
              ...data,
              items: (data.items?.create || []).map((item: any, i: number) => ({ id: `item-${i + 1}`, ...item })),
            };
            if (data.previousVersionId) working.revisions.push(created);
            else working.quotation = created;
            return clone(created);
          },
          updateMany: async ({ where, data }: any) => {
            const target = [working.quotation, ...working.revisions].find(quotation => quotation && matches(quotation, where));
            if (!target) return { count: 0 };
            Object.assign(target, data);
            return { count: 1 };
          },
        },
        quotationReview: {
          deleteMany: async () => { working.reviews = []; return { count: 0 }; },
          findUnique: async ({ where }: any) => clone(working.reviews.find(review => review.idempotencyKey === where.idempotencyKey) || null),
          create: async ({ data }: any) => {
            const review = { id: `review-${working.reviews.length + 1}`, ...data };
            working.reviews.push(review);
            return clone(review);
          },
        },
        productVariant: {
          findMany: async ({ where }: any) => clone(working.variants.filter(variant => where.id.in.includes(variant.id))),
          updateMany: async ({ where, data }: any) => {
            stockUpdateCalls += 1;
            const variant = working.variants.find(candidate => candidate.id === where.id);
            if (!variant || !matches(variant, where) || variant.stock < where.stock.gte) return { count: 0 };
            variant.stock -= data.stock.decrement;
            return { count: 1 };
          },
        },
        order: {
          findUnique: async ({ where }: any) => clone(working.orders.find(order => where.quotationId
            ? order.quotationId === where.quotationId
            : order.id === where.id) || null),
          create: async ({ data }: any) => {
            const order = {
              id: `order-${working.orders.length + 1}`,
              ...data,
              items: data.items?.create || [],
            };
            working.orders.push(order);
            return clone(order);
          },
        },
      };
      const result = await work(tx);
      state = working;
      return result;
    },
    order: { findUnique: async ({ where }: any) => clone(state.orders.find(order => where.quotationId ? order.quotationId === where.quotationId : order.id === where.id) || null) },
    quotation: { findUnique: async ({ where }: any) => {
      const found = where.id
        ? [state.quotation, ...state.revisions].find(quotation => quotation?.id === where.id)
        : where.previousVersionId
          ? [state.quotation, ...state.revisions].find(quotation => quotation?.previousVersionId === where.previousVersionId)
          : null;
      return clone(found || null);
    } },
    quotationReview: { findUnique: async ({ where }: any) => clone(state.reviews.find(review => review.idempotencyKey === where.idempotencyKey) || null) },
  };

  return { database, get state() { return state; }, get stockUpdateCalls() { return stockUpdateCalls; }, get transactionCalls() { return transactionCalls; } };
}

const pricing = {
  resolveVariantPrice: (variant: any) => ({ unitPrice: variant.price, originalUnitPrice: variant.price, saleUnitPrice: variant.salePrice ?? null }),
  calculateTotals: (subtotal: number) => ({ discountAmount: 0, shippingFee: 0, totalAmount: subtotal }),
  generateQuoteNumber: () => 'QT-BACKEND-1',
};
const quoteExpiry = (at: Date) => new Date(at.getTime() + 24 * 60 * 60 * 1000);
const now = new Date('2026-10-10T00:00:00Z');

test('MOCK: concurrent delete/convert in either lock order preserves parent, Order and stock consistency', async () => {
  for (const first of ['delete', 'convert']) {
    const fixture = databaseFixture({ quotation: quoteState() });
    const original = fixture.database.$transaction;
    let tail = Promise.resolve();
    // Model a database lock queue, not PostgreSQL MVCC or serialization detection.
    fixture.database.$transaction = async (work: any, options: any) => {
      let release!: () => void;
      const predecessor = tail; tail = new Promise<void>(resolve => { release = resolve; });
      await predecessor;
      try { return await original(async (tx: any) => {
        let locked = false;
        const lock = tx.$queryRaw, read = tx.quotation.findUnique;
        tx.$queryRaw = async (...args: any[]) => { if (args[0].join('').includes('FOR UPDATE')) locked = true; return lock(...args); };
        tx.quotation.findUnique = async (args: any) => { assert.equal(locked, true, 'parent must be locked before its first read'); return read(args); };
        return work(tx);
      }, options); } finally { release(); }
    };
    const actions = {
      delete: () => permanentlyDeleteQuotation(fixture.database, { id: 'admin', role: 'admin' }, 'quotation-1'),
      convert: () => approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'concurrent-approval-key', pricing, createQuotationOrderConverter({ generateOrderCode: () => 'DH-CONCURRENT' }), now),
    };
    const second = first === 'delete' ? 'convert' : 'delete';
    const result = await Promise.allSettled([actions[first as keyof typeof actions](), actions[second]()]);
    assert.equal(result[0].status, 'fulfilled'); assert.equal(result[1].status, 'rejected');
    const error = (result[1] as PromiseRejectedResult).reason;
    assert.equal(error.httpStatus, first === 'delete' ? 404 : 409);
    assert.equal(fixture.state.orders.length, first === 'delete' ? 0 : 1);
    assert.equal(fixture.state.variants[0].stock, first === 'delete' ? 5 : 3);
    assert.equal(fixture.state.quotation === null, first === 'delete');
  }
});

function quoteState(overrides: Record<string, unknown> = {}) {
  return {
    id: 'quotation-1', quoteNumber: 'QT-1', version: 1, customerId: 'customer-1', assignedStaffId: 'staff-1',
    status: 'CUSTOMER_CONFIRMED', currency: 'VND', subtotal: 20000, discountAmount: 0, shippingFee: 0,
    totalAmount: 20000, paymentMethod: 'COD', shippingAddress: 'Address', shippingPhone: '0900000000',
    note: null, expiresAt: new Date('2026-10-11T00:00:00Z'), customerConfirmedAt: new Date('2026-10-09T00:00:00Z'),
    customerRejectedAt: null, requoteReason: null, previousVersionId: null,
    items: [
      { id: 'item-1', variantId: 'variant-1', productName: 'Phone', variantAttributes: {}, quantity: 1, unitPrice: 10000, originalUnitPrice: 10000, saleUnitPrice: null, lineTotal: 10000 },
      { id: 'item-2', variantId: 'variant-1', productName: 'Phone', variantAttributes: {}, quantity: 1, unitPrice: 10000, originalUnitPrice: 10000, saleUnitPrice: null, lineTotal: 10000 },
    ],
    ...overrides,
  };
}

test('Draft uses backend catalog prices and rejects duplicate lines whose combined quantity exceeds stock', async () => {
  const fixture = databaseFixture();
  const created = await createQuotationDraft(fixture.database, { id: 'customer-1', role: 'customer' }, {
    items: [{ variantId: 'variant-1', quantity: 1 }, { variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD', expiresAt: new Date('2026-10-11T00:00:00Z'),
  }, pricing, now);
  assert.equal(created.items[0].unitPrice, 10000);
  assert.equal(created.subtotal, 20000);
  assert.equal(fixture.state.quotation.customerId, 'customer-1');

  const shortStock = databaseFixture({ variants: [{ ...fixture.state.variants[0], stock: 1 }] });
  await assert.rejects(createQuotationDraft(shortStock.database, { id: 'customer-1', role: 'customer' }, {
    items: [{ variantId: 'variant-1', quantity: 1 }, { variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD', expiresAt: new Date('2026-10-11T00:00:00Z'),
  }, pricing, now), (error: any) => error instanceof QuotationWorkflowError && error.code === 'OUT_OF_STOCK');
  assert.equal(shortStock.state.quotation, null);
});

test('Customer confirmation is owner-only and atomically advances Draft to confirmed', async () => {
  const fixture = databaseFixture({ quotation: quoteState({ status: 'PENDING_CUSTOMER_CONFIRMATION', customerConfirmedAt: null }) });
  await assert.rejects(confirmQuotation(fixture.database, { id: 'customer-2', role: 'customer' }, 'quotation-1', now),
    (error: any) => error instanceof QuotationWorkflowError && error.code === 'QUOTATION_FORBIDDEN');
  const confirmed = await confirmQuotation(fixture.database, { id: 'customer-1', role: 'customer' }, 'quotation-1', now);
  const replay = await confirmQuotation(fixture.database, { id: 'customer-1', role: 'customer' }, 'quotation-1', now);
  assert.equal(confirmed.status, 'CUSTOMER_CONFIRMED');
  assert.equal(replay.status, 'CUSTOMER_CONFIRMED');
  assert.equal(confirmed.customerConfirmedAt.getTime(), now.getTime());
  assert.equal(fixture.state.orders.length, 0, 'Customer confirmation must not create an Order.');
});

test('Customer confirmation recovers the committed state after a serialization replay', async () => {
  const fixture = databaseFixture({ quotation: quoteState() });
  const serializationConflict = Object.assign(new Error('serialization conflict'), { code: 'P2034' });
  const replayDatabase = { ...fixture.database, $transaction: async () => { throw serializationConflict; } };
  const replay = await confirmQuotation(replayDatabase, { id: 'customer-1', role: 'customer' }, 'quotation-1', now);
  assert.equal(replay.status, 'CUSTOMER_CONFIRMED');
  assert.equal(fixture.state.orders.length, 0);
});

test('Customer can decline a live quote; replay remains declined and cannot create an Order', async () => {
  const fixture = databaseFixture({ quotation: quoteState({ status: 'PENDING_CUSTOMER_CONFIRMATION', customerConfirmedAt: null }) });
  await assert.rejects(declineQuotation(fixture.database, { id: 'customer-2', role: 'customer' }, 'quotation-1', now),
    (error: any) => error instanceof QuotationWorkflowError && error.code === 'QUOTATION_FORBIDDEN');
  const first = await declineQuotation(fixture.database, { id: 'customer-1', role: 'customer' }, 'quotation-1', now);
  const replay = await declineQuotation(fixture.database, { id: 'customer-1', role: 'customer' }, 'quotation-1', now);
  assert.equal(first.status, 'CUSTOMER_REJECTED');
  assert.equal(replay.status, 'CUSTOMER_REJECTED');
  assert.equal(fixture.state.orders.length, 0);
});

test('assigned Staff can reject once and same idempotency-key replay is harmless', async () => {
  const fixture = databaseFixture({ quotation: quoteState() });
  await assert.rejects(rejectQuotation(fixture.database, { id: 'staff-2', role: 'staff' }, 'quotation-1', 'reject-key-0001', null, now),
    (error: any) => error instanceof QuotationWorkflowError && error.code === 'QUOTATION_APPROVAL_FORBIDDEN');
  const first = await rejectQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'reject-key-0001', 'Not eligible', now);
  const replay = await rejectQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'reject-key-0001', 'Not eligible', now);
  assert.equal(first.outcome, 'rejected');
  assert.equal(replay.outcome, 'already_rejected');
  assert.equal(fixture.state.quotation.status, 'REJECTED');
  assert.equal(fixture.state.reviews.length, 1);
  assert.equal(fixture.state.orders.length, 0, 'Rejecting a Quotation must not create an Order.');
});

test('Staff approval converts one quotation, reserves duplicate variant quantity once, and replay creates no second Order', async () => {
  const fixture = databaseFixture({ quotation: quoteState(), variants: [{
    id: 'variant-1', sku: 'SKU-1', price: 10000, salePrice: null, stock: 5,
    attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
  }] });
  const converter = createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000001' });
  const first = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-key-0001', pricing, converter, now);
  assert.equal(first.outcome, 'converted');
  assert.equal(fixture.state.quotation.status, 'CONVERTED');
  assert.equal(fixture.state.variants[0].stock, 3);
  assert.equal(fixture.stockUpdateCalls, 1);
  assert.equal(fixture.state.orders.length, 1);
  assert.equal(fixture.state.orders[0].quotationId, 'quotation-1');

  fixture.state.variants[0].price = 9000;
  const replay = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-key-0002', pricing, converter, now);
  assert.equal(replay.outcome, 'already_converted');
  assert.equal(fixture.state.orders[0].totalAmount, 20000, 'A created Order keeps its transaction snapshot after catalog price changes.');
  assert.equal(fixture.state.variants[0].stock, 3);
  assert.equal(fixture.stockUpdateCalls, 1);
  assert.equal(fixture.state.orders.length, 1);
});

test('Price increase issues a new immutable quote version and blocks the old version from approval', async () => {
  const fixture = databaseFixture({ quotation: quoteState(), variants: [{
    id: 'variant-1', sku: 'SKU-1', price: 12000, salePrice: null, stock: 5,
    attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
  }] });
  const revisedPricing = { ...pricing, generateQuoteNumber: () => 'QT-REVISED-UP' };
  const converter = createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000004' });
  const result = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-price-up-01', revisedPricing, converter, now, {}, quoteExpiry);

  assert.equal(result.outcome, 'needs_requote');
  assert.equal(fixture.state.quotation.status, 'NEEDS_REQUOTE');
  assert.equal(fixture.state.quotation.requoteReason, 'price_changed');
  assert.equal(fixture.state.quotation.items[0].unitPrice, 10000, 'The customer-confirmed old snapshot is retained.');
  assert.equal(fixture.state.revisions.length, 1);
  const revised = fixture.state.revisions[0];
  assert.equal(revised.version, 2);
  assert.equal(revised.previousVersionId, 'quotation-1');
  assert.equal(revised.status, 'PENDING_CUSTOMER_CONFIRMATION');
  assert.equal(revised.items[0].unitPrice, 12000);
  assert.equal(revised.totalAmount, 24000);
  assert.equal(fixture.state.orders.length, 0);

  const oldReplay = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-price-up-01', revisedPricing, converter, now, {}, quoteExpiry);
  assert.equal(oldReplay.outcome, 'needs_requote');
  assert.equal(fixture.state.revisions.length, 1, 'A second approval cannot create another child revision.');
  await assert.rejects(approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-price-up-03', revisedPricing, converter, now, {}, quoteExpiry),
    (error: any) => error instanceof QuotationWorkflowError && error.httpStatus === 409);
  assert.equal(fixture.state.orders.length, 0);
});

test('Price decrease creates a separate backend-priced version which Customer must reconfirm before Staff approval', async () => {
  const fixture = databaseFixture({ quotation: quoteState(), variants: [{
    id: 'variant-1', sku: 'SKU-1', price: 8000, salePrice: null, stock: 5,
    attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
  }] });
  const revisedPricing = { ...pricing, generateQuoteNumber: () => 'QT-REVISED-DOWN' };
  const converter = createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000005' });
  const requote = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-price-down-01', revisedPricing, converter, now, {}, quoteExpiry);
  assert.equal(requote.outcome, 'needs_requote');
  const revised = fixture.state.revisions[0];
  assert.equal(revised.totalAmount, 16000);

  await assert.rejects(approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, revised.id, 'approve-before-new-confirm', revisedPricing, converter, now, {}, quoteExpiry),
    (error: any) => error instanceof QuotationWorkflowError && error.httpStatus === 409);
  const confirmed = await confirmQuotation(fixture.database, { id: 'customer-1', role: 'customer' }, revised.id, now);
  assert.equal(confirmed.status, 'CUSTOMER_CONFIRMED');
  const converted = await approveAndConvertQuotation(fixture.database, { id: 'staff-1', role: 'staff' }, revised.id, 'approve-new-confirmed', revisedPricing, converter, now, {}, quoteExpiry);
  assert.equal(converted.outcome, 'converted');
  assert.equal(fixture.state.orders.length, 1);
  assert.equal(fixture.state.orders[0].totalAmount, 16000);
});

test('Changed discount and shipping totals issue a replacement even when unit prices stay the same', async () => {
  const fixture = databaseFixture({ quotation: quoteState() });
  const changedTotalsPricing = {
    ...pricing,
    generateQuoteNumber: () => 'QT-REVISED-TOTALS',
    calculateTotals: (subtotal: number) => ({ discountAmount: 1000, shippingFee: 500, totalAmount: subtotal - 500 }),
  };
  const result = await approveAndConvertQuotation(
    fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-totals-changed', changedTotalsPricing,
    createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000006' }), now, {}, quoteExpiry,
  );
  assert.equal(result.outcome, 'needs_requote');
  assert.equal(fixture.state.quotation.requoteReason, 'totals_changed');
  assert.equal(fixture.state.revisions[0].discountAmount, 1000);
  assert.equal(fixture.state.revisions[0].shippingFee, 500);
  assert.equal(fixture.state.revisions[0].totalAmount, 19500);
  assert.equal(fixture.state.orders.length, 0);
});

test('Promo eligibility changes before conversion require a new Customer-confirmed quote version', async () => {
  const fixture = databaseFixture({ quotation: quoteState({ discountAmount: 1000, totalAmount: 19000, promoCodeId: 'promo-1' }) });
  const noLongerEligible = {
    ...pricing,
    calculateTotals: (subtotal: number) => ({ discountAmount: 0, shippingFee: 0, totalAmount: subtotal }),
    getAppliedPromoCodeId: () => null,
  };
  const result = await approveAndConvertQuotation(
    fixture.database,
    { id: 'staff-1', role: 'staff' },
    'quotation-1',
    'promo-no-longer-eligible',
    noLongerEligible,
    createQuotationOrderConverter(),
    now,
    {},
    quoteExpiry,
  );
  assert.equal(result.outcome, 'needs_requote');
  assert.equal(fixture.state.quotation.status, 'NEEDS_REQUOTE');
  assert.equal(fixture.state.quotation.totalAmount, 19000, 'accepted old snapshot is preserved');
  assert.equal(fixture.state.revisions[0].totalAmount, 20000);
  assert.equal(fixture.state.revisions[0].promoCodeId, null);
  assert.equal(fixture.state.orders.length, 0);
});

test('Failed replacement snapshot creation rolls back the old status and requote audit', async () => {
  const fixture = databaseFixture({ quotation: quoteState(), variants: [{
    id: 'variant-1', sku: 'SKU-1', price: 12000, salePrice: null, stock: 5,
    attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
  }] });
  const invalidGenerator = { ...pricing, generateQuoteNumber: () => '' };
  await assert.rejects(approveAndConvertQuotation(
    fixture.database, { id: 'staff-1', role: 'staff' }, 'quotation-1', 'approve-requote-rollback', invalidGenerator,
    createQuotationOrderConverter(), now, {}, quoteExpiry,
  ), (error: any) => error instanceof QuotationWorkflowError && error.code === 'INVALID_QUOTE_NUMBER');
  assert.equal(fixture.state.quotation.status, 'CUSTOMER_CONFIRMED');
  assert.equal(fixture.state.quotation.requoteReason, null);
  assert.equal(fixture.state.revisions.length, 0);
  assert.equal(fixture.state.reviews.length, 0);
  assert.equal(fixture.state.orders.length, 0);
});

test('approval cannot convert or decrement stock when a confirmed snapshot is no longer fulfillable', async () => {
  const fixture = databaseFixture({ quotation: quoteState(), variants: [{
    id: 'variant-1', sku: 'SKU-1', price: 10000, salePrice: null, stock: 1,
    attributes: { color: 'black' }, productId: 'product-1', product: { id: 'product-1', name: 'Phone', status: 'active' },
  }] });
  const result = await approveAndConvertQuotation(
    fixture.database,
    { id: 'staff-1', role: 'staff' },
    'quotation-1',
    'approve-key-0003',
    pricing,
    createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000002' }),
    now,
  );
  assert.deepEqual(result, { outcome: 'needs_requote', reason: 'out_of_stock' });
  assert.equal(fixture.state.quotation.status, 'NEEDS_REQUOTE');
  assert.equal(fixture.state.variants[0].stock, 1);
  assert.equal(fixture.state.orders.length, 0);
});

test('Staff cannot approve before Customer confirmation', async () => {
  const fixture = databaseFixture({ quotation: quoteState({
    status: 'PENDING_CUSTOMER_CONFIRMATION',
    customerConfirmedAt: null,
  }) });
  await assert.rejects(
    approveAndConvertQuotation(
      fixture.database,
      { id: 'staff-1', role: 'staff' },
      'quotation-1',
      'approve-before-confirm-1',
      pricing,
      createQuotationOrderConverter({ generateOrderCode: () => 'DH00000000003' }),
      now,
    ),
    (error: any) => error instanceof QuotationWorkflowError && error.httpStatus === 409,
  );
  assert.equal(fixture.state.quotation.status, 'PENDING_CUSTOMER_CONFIRMATION');
  assert.equal(fixture.state.variants[0].stock, 5);
  assert.equal(fixture.state.orders.length, 0);
});
