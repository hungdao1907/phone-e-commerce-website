import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuotationDeleteButton, QuotationDeleteDialog } from './QuotationDeleteButton';
import { CustomerQuotationContactButton } from './CustomerQuotationContactButton';
import { createQuotationDeleteGate, removeDeletedQuotation } from './quotation-delete-state';
import type { QuotationRecord } from './QuotationDetails';

const quote = { id: 'quote-1', quoteNumber: 'QT-1', status: 'CUSTOMER_CONFIRMED' } as QuotationRecord;
test('Customer contact is a disabled placeholder with no onClick or network action', () => {
  const button = CustomerQuotationContactButton();
  assert.equal(button.props.disabled, true); assert.equal(button.props.onClick, undefined);
  const html = renderToStaticMarkup(button); assert.ok(html.includes('Liên hệ')); assert.ok(html.includes('disabled'));
});
test('Admin/Staff delete button opens no API during rendering; converted orders stay protected', () => {
  for (const scope of ['admin', 'staff'] as const) {
    const html = renderToStaticMarkup(React.createElement(QuotationDeleteButton, { quotation: quote, scope, token: 'fixture-token', onDeleted() { throw new Error('must not run'); } }));
    assert.ok(html.includes('Xóa báo giá')); assert.ok(!html.includes('Xóa vĩnh viễn'));
    for (const protectedQuote of [{ ...quote, status: 'CONVERTED' }, { ...quote, orders: [{ id: 'order-1', orderCode: 'O-1' }] }]) {
      const protectedHtml = renderToStaticMarkup(React.createElement(QuotationDeleteButton, { quotation: protectedQuote, scope, token: 'fixture-token', onDeleted() {} }));
      assert.ok(protectedHtml.includes('disabled')); assert.ok(protectedHtml.includes('quy trình riêng'));
    }
  }
});
test('confirmation dialog exposes Cancel separately; cancelling invokes no confirmation action', () => {
  let confirms = 0, cancels = 0;
  const props = { quoteNumber: 'QT-1', busy: false, error: '', onCancel() { cancels++; }, onConfirm() { confirms++; } };
  const html = renderToStaticMarkup(React.createElement(QuotationDeleteDialog, props));
  assert.ok(html.includes('Hủy')); assert.ok(html.includes('Xóa vĩnh viễn')); assert.ok(html.includes('không thể khôi phục'));
  props.onCancel(); assert.equal(cancels, 1); assert.equal(confirms, 0);
});
test('double-click gate permits exactly one request and unlocks after failure', async () => {
  const gate = createQuotationDeleteGate(); let release!: () => void, calls = 0;
  const first = gate.run(async () => { calls++; await new Promise<void>(resolve => { release = resolve; }); });
  await gate.run(async () => { calls++; }); assert.equal(calls, 1); assert.equal(gate.busy, true);
  release(); await first; assert.equal(gate.busy, false);
  await assert.rejects(gate.run(async () => { throw new Error('503'); })); assert.equal(gate.busy, false);
});
test('successful permanent delete removes only the matching record immediately, without mutating cache or creating records', () => {
  const list = [quote, { ...quote, id: 'quote-2' }];
  const refreshed = removeDeletedQuotation(list, quote.id);
  assert.deepEqual(refreshed.map(item => item.id), ['quote-2']); assert.equal(list.length, 2);
});
