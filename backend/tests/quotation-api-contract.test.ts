import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import { createQuotationOrderConverter } from '../src/services/quotation-workflow.service';
import { fingerprintQuotationCreateRequest, hashQuotationCreateIdempotencyKey } from '../src/services/quotation-create-idempotency.service';
import { isQuotationApiEnabled, mountQuotationRouters } from '../src/routes/quotation-api.mount';

let parseCreateQuotationDto: typeof import('../src/routes/quotation.routes').parseCreateQuotationDto;
let createQuotationRouters: typeof import('../src/routes/quotation.routes').createQuotationRouters;
const baseQuotationDto = { items: [{ variantId: 'variant-1', quantity: 1 }], shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD' };

test('Quotation API stays disabled by default and mounts all three scoped routers only through explicit composition', () => {
  assert.equal(isQuotationApiEnabled(undefined), false);
  assert.equal(isQuotationApiEnabled('false'), false);
  assert.equal(isQuotationApiEnabled('TRUE'), false);
  assert.equal(isQuotationApiEnabled('true'), true);

  const mounted: Array<[string, unknown]> = [];
  mountQuotationRouters({ use: (prefix: string, router: unknown) => { mounted.push([prefix, router]); return {} as any; } }, {
    customer: {} as any,
    staff: {} as any,
    admin: {} as any,
  });
  assert.deepEqual(mounted.map(([prefix]) => prefix), [
    '/api/quotations',
    '/api/staff/quotations',
    '/api/admin/quotations',
  ]);
});

before(async () => {
  process.env.JWT_SECRET ||= 'quotation-api-contract-test-only-secret';
  const routes = await import('../src/routes/quotation.routes');
  parseCreateQuotationDto = routes.parseCreateQuotationDto;
  createQuotationRouters = routes.createQuotationRouters;
});

test('Quotation create DTO accepts identifiers and quantities, normalizes text, and never accepts client prices', () => {
  const parsed = parseCreateQuotationDto({
    items: [{ variantId: ' variant-1 ', quantity: 2 }],
    shippingAddress: '  Address  ',
    shippingPhone: ' 0900000000 ',
    paymentMethod: 'COD',
    note: '  note  ',
    sourceSessionId: ' session-1 ',
  });
  assert.deepEqual(parsed, {
    items: [{ variantId: 'variant-1', quantity: 2 }],
    shippingAddress: 'Address',
    shippingPhone: '0900000000',
    paymentMethod: 'COD',
    deliveryMethod: 'delivery',
    promoCode: null,
    note: 'note',
    sourceSessionId: 'session-1',
  });

  assert.equal(parseCreateQuotationDto({
    items: [{ variantId: 'variant-1', quantity: 2, unitPrice: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD',
  }), null);
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, deliveryMethod: 'courier', promoCode: 'SAVE' }), null);
  assert.deepEqual(parseCreateQuotationDto({
    ...baseQuotationDto, shippingAddress: 'Nhận tại cửa hàng: store-1', promoCode: ' SAVE ',
  }), {
    items: [{ variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Nhận tại cửa hàng: store-1', shippingPhone: '0900000000', paymentMethod: 'COD',
    deliveryMethod: 'pickup', promoCode: 'SAVE', note: null, sourceSessionId: null,
  });
});

test('Quotation create DTO rejects client totals, identity fields, invalid quantities, and unsupported payments', () => {
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, customerId: 'customer-1' }), null);
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, totalAmount: 1 }), null);
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, items: [{ variantId: 'variant-1', quantity: 1.5 }] }), null);
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, items: [{ variantId: 'variant-1', quantity: 0 }] }), null);
  assert.equal(parseCreateQuotationDto({ ...baseQuotationDto, paymentMethod: 'CREDIT_CARD' }), null);
});

test('Quotation router exposes the documented Customer, Staff, and Admin subroutes without mounting them', () => {
  const routers = createQuotationRouters({
    database: {},
    getPricing: () => ({
      resolveVariantPrice: () => ({ unitPrice: 100, originalUnitPrice: 100, saleUnitPrice: null }),
      calculateTotals: subtotal => ({ discountAmount: 0, shippingFee: 0, totalAmount: subtotal }),
      generateQuoteNumber: () => 'QT-TEST',
    }),
    getOrderConverter: () => createQuotationOrderConverter(),
    getExpiry: now => new Date(now.getTime() + 86400000),
    privateStorage: { privateRoot: 'C:/webphone-private-quotes', publicUploadRoots: ['C:/webphone-public-uploads'] },
    authenticate: (_request: any, _response: any, next: () => void) => next(),
  });
  const routes = (router: any) => router.stack
    .filter((layer: any) => layer.route)
    .flatMap((layer: any) => Object.keys(layer.route.methods).map(method => `${method.toUpperCase()} ${layer.route.path}`));

  assert.ok(routes(routers.customer).includes('POST /'));
  assert.ok(routes(routers.customer).includes('POST /:id/confirm'));
  assert.ok(routes(routers.customer).includes('POST /:id/decline'));
  assert.ok(routes(routers.customer).includes('GET /:id/pdf'));
  assert.ok(routes(routers.staff).includes('GET /'));
  assert.ok(routes(routers.staff).includes('POST /:id/approve'));
  assert.ok(routes(routers.staff).includes('POST /:id/reject'));
  assert.ok(routes(routers.admin).includes('POST /:id/assign'));
});

function quotationRouteFixture(options: { databasePatch?: Record<string, unknown>; consumeCreateRateLimit?: (input: any) => any } = {}) {
  const quotation: any = {
    id: 'quote-1', customerId: 'customer-a', assignedStaffId: 'staff-a',
    quoteNumber: 'QT-1', status: 'PENDING_CUSTOMER_CONFIRMATION', subtotal: 100,
    discountAmount: 0, shippingFee: 0, totalAmount: 100, expiresAt: new Date('2026-10-11T00:00:00Z'), items: [],
  };
  const staff = { id: 'staff-b', username: 'staff-b', role: 'staff' };
  const database: any = {
    quotation: {
      findFirst: async ({ where }: any) => quotation.id === where.id
        && (!where.customerId || where.customerId === quotation.customerId)
        && (!where.assignedStaffId || where.assignedStaffId === quotation.assignedStaffId) ? { ...quotation } : null,
      findMany: async ({ where }: any) => (!where.customerId || where.customerId === quotation.customerId)
        && (!where.assignedStaffId || where.assignedStaffId === quotation.assignedStaffId) ? [{ ...quotation }] : [],
      findUnique: async ({ where }: any) => quotation.id === where.id ? {
        ...quotation,
        assignedStaff: quotation.assignedStaffId === staff.id ? staff : null,
      } : null,
      updateMany: async ({ where, data }: any) => {
        if (quotation.id !== where.id || !where.status.in.includes(quotation.status)) return { count: 0 };
        Object.assign(quotation, data);
        return { count: 1 };
      },
    },
    user: { findUnique: async ({ where }: any) => where.id === staff.id ? staff : null },
    quotationCreateIdempotency: { findUnique: async () => null },
    ...options.databasePatch,
  };
  const routers = createQuotationRouters({
    database,
    getPricing: () => ({
      resolveVariantPrice: () => ({ unitPrice: 100, originalUnitPrice: 100, saleUnitPrice: null }),
      calculateTotals: subtotal => ({ discountAmount: 0, shippingFee: 0, totalAmount: subtotal }),
      generateQuoteNumber: () => 'QT-TEST',
    }),
    getOrderConverter: () => createQuotationOrderConverter(),
    getExpiry: now => new Date(now.getTime() + 86400000),
    privateStorage: { privateRoot: 'C:/webphone-private-quotes', publicUploadRoots: ['C:/webphone-public-uploads'] },
    authenticate: (request: any, _response: any, next: () => void) => { request.user = request.testPrincipal; next(); },
    consumeCreateRateLimit: options.consumeCreateRateLimit,
  });
  return { routers, quotation };
}

async function invokeQuotationRoute(router: any, method: string, path: string, principal: any, body?: unknown, idempotencyKey?: string) {
  const layer = router.stack.find((entry: any) => entry.route?.path === path && entry.route.methods[method.toLowerCase()]);
  assert.ok(layer, `Expected ${method} ${path} route`);
  const request: any = {
    user: principal, testPrincipal: principal, params: { id: 'quote-1' }, body,
    query: {}, headers: idempotencyKey ? { 'idempotency-key': idempotencyKey } : {},
    ip: '192.0.2.55', socket: { remoteAddress: '192.0.2.55' },
    get: (name: string) => name.toLowerCase() === 'idempotency-key' ? idempotencyKey : undefined,
  };
  const response: any = {
    statusCode: 200, body: undefined, headersSent: false, responseHeaders: {},
    status(code: number) { this.statusCode = code; return this; },
    json(value: unknown) { this.body = value; this.headersSent = true; return this; },
    setHeader(name: string, value: string) { this.responseHeaders[name.toLowerCase()] = value; return this; }, end() { this.headersSent = true; return this; },
  };
  for (const entry of layer.route.stack) {
    let passed = false;
    await new Promise<void>((resolve, reject) => {
      try {
        const result = entry.handle(request, response, (error?: unknown) => {
          if (error) reject(error);
          else { passed = true; resolve(); }
        });
        Promise.resolve(result).then(() => resolve(), reject);
      } catch (error) { reject(error); }
    });
    if (!passed) break;
  }
  return response;
}

test('Quotation detail routes enforce Customer ownership and Staff assignment; Admin alone can assign', async () => {
  const { routers, quotation } = quotationRouteFixture();
  const owner = await invokeQuotationRoute(routers.customer, 'get', '/:id', { id: 'customer-a', role: 'customer' });
  const otherCustomer = await invokeQuotationRoute(routers.customer, 'get', '/:id', { id: 'customer-b', role: 'customer' });
  assert.equal(owner.statusCode, 200);
  assert.equal(otherCustomer.statusCode, 404);

  const assignedStaff = await invokeQuotationRoute(routers.staff, 'get', '/:id', { id: 'staff-a', role: 'staff' });
  const unassignedStaff = await invokeQuotationRoute(routers.staff, 'get', '/:id', { id: 'staff-b', role: 'staff' });
  assert.equal(assignedStaff.statusCode, 200);
  assert.equal(unassignedStaff.statusCode, 404);

  const forbiddenStaffAssignment = await invokeQuotationRoute(routers.admin, 'post', '/:id/assign', { id: 'staff-a', role: 'staff' }, { staffId: 'staff-b' });
  assert.equal(forbiddenStaffAssignment.statusCode, 403);
  const adminAssignment = await invokeQuotationRoute(routers.admin, 'post', '/:id/assign', { id: 'admin-1', role: 'admin' }, { staffId: 'staff-b' });
  assert.equal(adminAssignment.statusCode, 200);
  assert.equal(quotation.assignedStaffId, 'staff-b');
});

test('Customer Quotation Create requires Idempotency-Key before any database transaction', async () => {
  const { routers } = quotationRouteFixture();
  const response = await invokeQuotationRoute(
    routers.customer,
    'post',
    '/',
    { id: 'customer-a', role: 'customer' },
    baseQuotationDto,
  );
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.code, 'IDEMPOTENCY_KEY_REQUIRED');
});

test('Quotation recovery requires an authenticated Customer role', async () => {
  const { routers } = quotationRouteFixture();
  const anonymous = await invokeQuotationRoute(routers.customer, 'post', '/recovery', null, undefined, 'recovery-key-0000001');
  const staff = await invokeQuotationRoute(routers.customer, 'post', '/recovery', { id: 'staff-a', role: 'staff' }, undefined, 'recovery-key-0000001');
  assert.equal(anonymous.statusCode, 401);
  assert.equal(staff.statusCode, 403);
});

test('Customer Quotation Create rate limit returns 429 and Retry-After before transaction', async () => {
  let called = 0;
  const { routers } = quotationRouteFixture({
    consumeCreateRateLimit: () => { called += 1; return { allowed: false, retryAfterSeconds: 47 }; },
  });
  const response = await invokeQuotationRoute(
    routers.customer, 'post', '/', { id: 'customer-a', role: 'customer' }, baseQuotationDto, 'rate-limit-key-0000001',
  );
  assert.equal(called, 1);
  assert.equal(response.statusCode, 429);
  assert.equal(response.responseHeaders['retry-after'], '47');
  assert.equal(response.body.code, 'QUOTATION_CREATE_RATE_LIMITED');
  assert.equal(JSON.stringify(response.body).includes('customer-a'), false);
});

test('durable same-key replay returns its Customer-owned Quotation without consuming rate limit', async () => {
  const key = 'same-key-route-replay-0001';
  const input = { ...baseQuotationDto, deliveryMethod: 'delivery' as const };
  const normalized = {
    items: [{ variantId: 'variant-1', quantity: 1 }],
    shippingAddress: 'Address', shippingPhone: '0900000000', paymentMethod: 'COD' as const,
    deliveryMethod: 'delivery' as const, promoCode: null, note: null, sourceSessionId: null,
  };
  const saved = {
    id: 'quote-replayed', customerId: 'customer-a', quoteNumber: 'QT-REPLAY', status: 'PENDING_CUSTOMER_CONFIRMATION',
    currency: 'VND', subtotal: 100, discountAmount: 0, shippingFee: 0, totalAmount: 100,
    paymentMethod: 'COD', deliveryMethod: 'delivery', promoCodeId: null, shippingAddress: 'Address', shippingPhone: '0900000000',
    note: null, expiresAt: new Date('2026-10-11T00:00:00Z'), customerConfirmedAt: null, customerRejectedAt: null,
    approvedAt: null, convertedAt: null, createdAt: new Date('2026-10-10T00:00:00Z'), updatedAt: new Date('2026-10-10T00:00:00Z'),
    items: [], files: [], previousVersion: null, nextVersion: null,
  };
  let rateLimitCalls = 0;
  const { routers } = quotationRouteFixture({
    databasePatch: {
      quotationCreateIdempotency: {
        findUnique: async ({ where }: any) => where.customerId_keyHash.customerId === 'customer-a'
          && where.customerId_keyHash.keyHash === hashQuotationCreateIdempotencyKey(key)
          ? { requestHash: fingerprintQuotationCreateRequest('customer-a', normalized), quotation: saved }
          : null,
      },
    },
    consumeCreateRateLimit: () => { rateLimitCalls += 1; return { allowed: false, retryAfterSeconds: 1 }; },
  });
  const response = await invokeQuotationRoute(routers.customer, 'post', '/', { id: 'customer-a', role: 'customer' }, input, key);
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.quotation.id, 'quote-replayed');
  assert.equal(rateLimitCalls, 0);
});

test('Quotation recovery returns a committed result only in the authenticated Customer scope', async () => {
  const key = 'recovery-key-cross-owner-1';
  const saved = {
    id: 'quote-recovery', customerId: 'customer-a', quoteNumber: 'QT-RECOVERY', status: 'CUSTOMER_CONFIRMED',
    currency: 'VND', subtotal: 250, discountAmount: 0, shippingFee: 0, totalAmount: 250,
    paymentMethod: 'COD', deliveryMethod: 'delivery', promoCodeId: null, shippingAddress: 'private address', shippingPhone: '0900000000',
    note: null, expiresAt: new Date('2026-10-11T00:00:00Z'), customerConfirmedAt: null, customerRejectedAt: null,
    approvedAt: null, convertedAt: null, createdAt: new Date('2026-10-10T00:00:00Z'), updatedAt: new Date('2026-10-10T00:00:00Z'),
    items: [], files: [], previousVersion: null, nextVersion: null,
  };
  const { routers } = quotationRouteFixture({
    databasePatch: {
      quotationCreateIdempotency: {
        findUnique: async ({ where }: any) => where.customerId_keyHash.customerId === 'customer-a'
          && where.customerId_keyHash.keyHash === hashQuotationCreateIdempotencyKey(key)
          ? { quotation: saved }
          : null,
      },
    },
  });
  const owner = await invokeQuotationRoute(routers.customer, 'post', '/recovery', { id: 'customer-a', role: 'customer' }, undefined, key);
  const other = await invokeQuotationRoute(routers.customer, 'post', '/recovery', { id: 'customer-b', role: 'customer' }, undefined, key);
  assert.equal(owner.statusCode, 200);
  assert.equal(owner.body.quotation.id, 'quote-recovery');
  assert.equal(other.statusCode, 404);
  assert.equal(other.body.code, 'IDEMPOTENCY_RESULT_NOT_FOUND');
  assert.equal(JSON.stringify(other.body).includes('customer-a'), false);
});
