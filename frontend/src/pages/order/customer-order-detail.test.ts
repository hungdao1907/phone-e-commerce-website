import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { fetchCustomerOrderDetail, orderStatusLabel } from './customer-order-detail';

const order = { id: 'order-1', customerId: 'customer-1', items: [], subtotal: 100000, discountAmount: 10000, shippingFee: 20000, totalAmount: 110000 };
test('detail requests the exact ID with authentication, not the order list or code', async () => {
  let calls = 0;
  const result = await fetchCustomerOrderDetail(order.id, 'test-token', order.customerId, {
    baseUrl: 'http://backend.test/', fetcher: (async (url, options) => {
      calls++; assert.equal(url, 'http://backend.test/api/orders/order-1');
      assert.equal((options?.headers as any).Authorization, 'Bearer test-token');
      assert.equal(options?.cache, 'no-store');
      return Response.json(order);
    }) as typeof fetch,
  });
  assert.deepEqual(result, order); assert.equal(calls, 1);
});
test('another customer or mismatched order ID is rejected without fake fallback', async () => {
  for (const result of [{ ...order, customerId: 'another-customer' }, { ...order, id: 'another-order' }]) {
    await assert.rejects(fetchCustomerOrderDetail(order.id, 'token', order.customerId, {
      baseUrl: '', fetcher: (async () => Response.json(result)) as typeof fetch,
    }), (error: any) => error.status === 403);
  }
});
test('401, 403 and missing order stay errors; missing credentials never fetch', async () => {
  for (const status of [401, 403, 404, 500]) {
    await assert.rejects(fetchCustomerOrderDetail(order.id, 'token', order.customerId, {
      baseUrl: '', fetcher: (async () => new Response(null, { status })) as typeof fetch,
    }), (error: any) => error.status === status);
  }
  await assert.rejects(fetchCustomerOrderDetail(order.id, '', order.customerId, {
    baseUrl: '', fetcher: (async () => { throw new Error('must not fetch'); }) as typeof fetch,
  }), (error: any) => error.status === 401);
});
test('incomplete monetary response is not replaced by client pricing', async () => {
  await assert.rejects(fetchCustomerOrderDetail(order.id, 'token', order.customerId, {
    baseUrl: '', fetcher: (async () => Response.json({ ...order, subtotal: undefined })) as typeof fetch,
  }), (error: any) => error.status === 502);
  assert.equal(orderStatusLabel('pending'), 'Chờ xác nhận');
});
test('Customer detail is an SPA Link and direct URL stays under the Customer guard', () => {
  const list = fs.readFileSync('src/components/profile/OrdersTab.tsx', 'utf8');
  const app = fs.readFileSync('src/App.tsx', 'utf8');
  assert.match(list, /<Link\s+to=\{`\/profile\/orders\/\$\{encodeURIComponent\(order.id\)\}`\}/);
  assert.match(app, /allowedRoles=\{\['customer'\]\} unauthorizedTo="\/login"/);
  assert.match(app, /path="\/profile\/orders\/:orderId"/);
  const page = fs.readFileSync('src/pages/order/OrderDetailPage.tsx', 'utf8');
  for (const field of ['order.subtotal', 'order.discountAmount', 'order.shippingFee', 'order.totalAmount', 'item.lineTotal', 'order.paymentStatus']) assert.ok(page.includes(field));
  assert.ok(!page.includes('mockOrder'));
});

test('Customer direct detail route renders stored values through ProtectedRoute on both mounts', async () => {
  // Isolated storage fixtures: never use a real browser session or credentials.
  const token = `mock.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.mock`;
  const user = { id: order.customerId, username: 'fixture', role: 'customer' };
  const storage = { getItem: (key: string) => key === 'token' ? token : key === 'user' ? JSON.stringify(user) : null,
    setItem: () => {}, removeItem: () => {} };
  Object.assign(globalThis, { localStorage: storage, sessionStorage: storage, React });
  const { useAuthStore } = await import('../../store/authStore');
  const { ProtectedRoute } = await import('../../components/auth/ProtectedRoute');
  const { CustomerOrderDetailView } = await import('./OrderDetailPage');
  const detail = { ...order, orderCode: 'ORDER-SNAPSHOT-TEST', createdAt: '2026-10-11T00:00:00Z', status: 'CONFIRMED',
    paymentMethod: 'COD', paymentStatus: 'UNPAID', shippingAddress: 'Địa chỉ snapshot', shippingPhone: '0900000000',
    items: [{ id: 'item-1', productName: 'Tên sản phẩm lúc mua', variantInfo: '256GB · Xanh', quantity: 1, unitPrice: 100000, lineTotal: 100000 }] };
  useAuthStore.setState({ token: 'mock-session', user: { id: order.customerId, username: 'fixture', role: 'customer' } });
  for (let mount = 0; mount < 2; mount++) {
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/profile/orders/order-1'] },
      React.createElement(Routes, null,
        React.createElement(Route, { element: React.createElement(ProtectedRoute, { allowedRoles: ['customer'], unauthorizedTo: '/login' }) },
          React.createElement(Route, { path: '/profile/orders/:orderId', element: React.createElement(CustomerOrderDetailView, { order: detail }) })))));
    assert.ok(html.includes('ORDER-SNAPSHOT-TEST'));
    assert.ok(html.includes('data-order-id="order-1"'));
    assert.ok(html.includes('256GB · Xanh'));
    assert.ok(html.includes('110.000'));
    assert.ok(html.includes('Chưa thanh toán'));
    assert.ok(!html.includes('Dashboard'));
  }
  useAuthStore.setState({ token: null, user: null });
});
