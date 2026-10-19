import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OrderDeleteDialog, OrderDeleteActions } from './OrderDeleteDialog';
import { canPermanentlyDeleteOrder, requestPermanentOrderDeletion } from './order-delete';
import { readFileSync } from 'node:fs';

const input = { baseUrl: 'https://fixture.invalid', id: 'order-fixture', orderCode: 'DH12345678901', confirmationCode: 'DH12345678901', token: 'fixture-token', role: 'superadmin' };
const props = { orderCode: input.orderCode, value: '', busy: false, error: '', onChange() {}, onCancel() {}, onConfirm() {} };
test('only Superadmin is offered permanent deletion', () => {
  for (const role of [undefined, 'customer', 'staff', 'admin', 'superadmin']) assert.equal(canPermanentlyDeleteOrder(role), role === 'superadmin');
});
test('dialog requires exact code; mismatch/whitespace/busy keeps destructive action disabled', () => {
  for (const [value, busy, disabled] of [['', false, true], ['wrong', false, true], [input.orderCode + ' ', false, true], [input.orderCode, true, true], [input.orderCode, false, false]] as const) {
    const html = renderToStaticMarkup(React.createElement(OrderDeleteDialog, { ...props, value, busy }));
    assert.match(html, /role="dialog"/); assert.match(html, /không thể hoàn tác/); assert.ok(html.includes(input.orderCode));
    const destructive = html.match(/<button[^>]*>(?:.*?)Xóa vĩnh viễn<\/button>/s)?.[0] || html.match(/<button[^>]*>(?:.*?)Đang xóa…<\/button>/s)?.[0];
    assert.ok(destructive);
    // Last button is the permanent-delete action; the Cancel button has its own lifecycle.
    const buttons = [...html.matchAll(/<button\b([^>]*)>/g)]; assert.equal(buttons.length, 2);
    assert.equal(/\sdisabled(?:=|\s|$)/.test(buttons[1][1]), disabled);
  }
});
test('UI cancel never invokes the API or the confirmation callback', () => {
  let cancellations = 0, confirmations = 0;
  const actions = OrderDeleteActions({ ...props, onCancel() { cancellations++; }, onConfirm() { confirmations++; } });
  actions.props.children[0].props.onClick();
  actions.props.children[1].props.onClick();
  assert.equal(confirmations, 0); assert.equal(cancellations, 1);
});
test('confirmation handler only fires for matching code while idle', () => {
  let confirms = 0;
  for (const [value, busy] of [['wrong', false], [input.orderCode, true], [input.orderCode, false]] as const) {
    const actions = OrderDeleteActions({ ...props, value, busy, onConfirm() { confirms++; } });
    actions.props.children[1].props.onClick();
  }
  assert.equal(confirms, 1);
});
test('API helper refuses non-Superadmin and incorrect confirmation without any fetch', async () => {
  let calls = 0; const fetcher: any = async () => { calls++; throw new Error('must not call'); };
  for (const role of ['customer', 'staff', 'admin']) await assert.rejects(requestPermanentOrderDeletion({ ...input, role }, fetcher));
  await assert.rejects(requestPermanentOrderDeletion({ ...input, confirmationCode: 'wrong' }, fetcher));
  assert.equal(calls, 0);
});
test('approved deletion sends authenticated DELETE and exact code; no cancellation/status/stock API call', async () => {
  let calls = 0;
  const result = await requestPermanentOrderDeletion(input, (async (url, options) => {
    calls++; assert.equal(url, 'https://fixture.invalid/api/orders/order-fixture'); assert.equal(options?.method, 'DELETE');
    assert.deepEqual(JSON.parse(options?.body as string), { confirmationCode: input.orderCode });
    assert.equal((options?.headers as any).Authorization, 'Bearer fixture-token');
    return new Response(JSON.stringify({ id: input.id, deleted: true }), { status: 200 });
  }) as typeof fetch);
  assert.equal(result.deleted, true); assert.equal(calls, 1);
});
test('409 dependency explanation, expired session, malformed success and network errors remain visible', async () => {
  for (const status of [400, 403, 404, 409, 500]) {
    await assert.rejects(requestPermanentOrderDeletion(input, (async () => new Response(JSON.stringify({ message: 'Protected order history' }), { status })) as typeof fetch), /Protected order history/);
  }
  await assert.rejects(requestPermanentOrderDeletion(input, (async () => new Response('', { status: 401 })) as typeof fetch), /hết hạn/);
  await assert.rejects(requestPermanentOrderDeletion(input, (async () => new Response('{}', { status: 200 })) as typeof fetch), /chưa xác nhận/);
  await assert.rejects(requestPermanentOrderDeletion(input, (async () => { throw new Error('Offline'); }) as typeof fetch), /Offline/);
});
test('real Orders view contains a separate red final menu item, synchronous double-click guard and local list/page updates', () => {
  const source = readFileSync('src/components/admin/views/Orders.tsx', 'utf8');
  assert.match(source, /canPermanentlyDeleteOrder\(user\?\.role\)/);
  assert.match(source, /border-t border-white\/10 pt-1/); assert.match(source, /<Trash2[^>]*\/> Xóa đơn hàng/);
  assert.match(source, /deleteInFlight\.current = true/);
  assert.match(source, /if \(deleteInFlight\.current \|\|/);
  assert.match(source, /setOrders\(previous => previous\.filter\(order => order.id !== target.id\)\)/);
  assert.match(source, /if \(page > totalPages\) setPage\(totalPages\)/);
  assert.match(source, /setDeleteTarget\(null\)/);
  assert.match(source, /<OrderDeleteDialog/); assert.match(source, /confirmAction/);
});
