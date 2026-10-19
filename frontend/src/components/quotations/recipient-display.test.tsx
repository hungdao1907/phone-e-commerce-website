import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QuotationDetails, type QuotationRecord } from './QuotationDetails';

Object.assign(globalThis, { React });
const customer = { fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567' };
const quotation: QuotationRecord = {
  id: 'quote-test', quoteNumber: 'QT-TEST', status: 'APPROVED', subtotal: 100000,
  discountAmount: 0, shippingFee: 0, totalAmount: 100000, expiresAt: '2026-11-01T00:00:00Z',
  customer, shippingPhone: '0987654321', shippingAddress: 'Địa chỉ giao hàng test', items: [],
};

test('quotation displays account identity separately from recipient, with safe legacy fallback', () => {
  for (const recipientName of ['Trần Văn B', undefined, null, ' ', '<img src=x>']) {
    const html = renderToStaticMarkup(React.createElement(QuotationDetails, { quotation: { ...quotation, recipientName }, showCustomer: true }));
    for (const value of Object.values(customer)) assert.ok(html.includes(value));
    assert.ok(html.includes('Người nhận:</span> ' + (recipientName?.trim() ? recipientName.replace('<', '&lt;').replace('>', '&gt;') : customer.fullName)));
    assert.ok(html.includes('SĐT giao hàng:</span> 0987654321'));
    assert.ok(!html.includes('<img src=x>'));
  }
});

test('customer order detail renders recipient and shipping phone, including legacy records', async () => {
  Object.assign(globalThis, { localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
  const { CustomerOrderDetailView } = await import('../../pages/order/OrderDetailPage');
  for (const recipientName of ['Trần Văn B', undefined, null, ' ']) {
    const order = { ...quotation, id: 'order-test', customerId: 'customer-test', orderCode: 'ORDER-TEST', createdAt: '2026-10-19T00:00:00Z',
      recipientName, paymentMethod: 'COD', paymentStatus: 'UNPAID', shippingPhone: quotation.shippingPhone!, shippingAddress: quotation.shippingAddress!, items: [] };
    const html = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(CustomerOrderDetailView, { order })));
    assert.ok(html.includes(recipientName?.trim() || customer.fullName));
    assert.ok(html.includes(order.shippingPhone));
    assert.ok(!html.includes(customer.phone), 'account phone must not replace shipping phone');
  }
});
