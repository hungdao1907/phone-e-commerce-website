import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mailer, MailOptions } from '../src/services/mailer';
import { sendOrderReceivedEmail, sendOrderConfirmedEmail, sendPaymentSuccessEmail } from '../src/services/email.service';
import { buildQuotationPdfRows, renderQuotationPdf, QuotationPdfSnapshot } from '../src/services/quotation-pdf.service';

const customer = { fullName: 'Nguyễn Văn A', email: 'nguyenvana@example.com', phone: '0901234567' };
const order = {
  id: 'order-test', orderCode: 'TEST-ONLY', customer, createdAt: '2026-10-19T00:00:00Z',
  recipientName: 'Trần Văn B', shippingPhone: '0987654321', shippingAddress: 'Địa chỉ giao hàng test',
  paymentMethod: 'COD', paymentStatus: 'UNPAID', totalAmount: 100000, items: [],
  email: 'forged@example.com', recipientEmail: 'recipient@example.com',
};

test('all order notifications use only account email, greet account owner and render escaped shipping snapshots', async () => {
  const originalSend = mailer.sendMail;
  const sent: MailOptions[] = [];
  mailer.sendMail = async options => { sent.push(options); };
  try {
    for (const send of [sendOrderReceivedEmail, sendOrderConfirmedEmail, sendPaymentSuccessEmail]) {
      for (const recipientName of ['Trần Văn B', undefined, null, ' ', '<img src=x onerror="alert(1)"> & \'B\'']) {
        const input = { ...order, recipientName };
        const original = JSON.stringify(input);
        await send(input);
        const message = sent.at(-1)!;
        assert.equal(message.to, customer.email);
        assert.ok(message.html.includes(`Xin chào <strong>${customer.fullName}</strong>`));
        const expected = recipientName?.trim()
          ? recipientName.startsWith('<') ? '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;B&#39;' : recipientName
          : customer.fullName;
        assert.ok(message.html.includes(`<strong>Người nhận:</strong> ${expected}`));
        assert.ok(message.html.includes(order.shippingPhone));
        assert.ok(message.html.includes(order.shippingAddress));
        assert.ok(!message.html.includes('<img src=x'));
        assert.equal(JSON.stringify(input), original);
      }
      const count = sent.length;
      await send({ ...order, customer: { ...customer, email: null } });
      assert.equal(sent.length, count, 'never fall back to a request or recipient email');
      await send({ ...order, customer: { ...customer, fullName: '<b>Owner</b>' }, shippingPhone: '<i>phone</i>', shippingAddress: '<script>address</script>' });
      const html = sent.at(-1)!.html;
      assert.ok(html.includes('&lt;b&gt;Owner&lt;/b&gt;'));
      assert.ok(html.includes('&lt;i&gt;phone&lt;/i&gt;'));
      assert.ok(html.includes('&lt;script&gt;address&lt;/script&gt;'));
    }
  } finally {
    mailer.sendMail = originalSend;
  }
});

const snapshot: QuotationPdfSnapshot = {
  id: 'quote-test', quoteNumber: 'QT-TEST', version: 1, status: 'APPROVED', currency: 'VND',
  subtotal: 100000, discountAmount: 0, shippingFee: 0, totalAmount: 100000,
  recipientName: order.recipientName, shippingPhone: order.shippingPhone, shippingAddress: order.shippingAddress,
  note: null, createdAt: order.createdAt, expiresAt: '2026-11-01T00:00:00Z', customer,
  items: [{ productName: 'Điện thoại test', variantSku: null, variantAttributes: null, quantity: 1, unitPrice: 100000, lineTotal: 100000 }],
};

test('PDF rows and actual rendering retain distinct account and shipping fields for new and legacy records', async () => {
  const PDFDocument = require('pdfkit');
  const originalText = PDFDocument.prototype.text;
  let rendered = '';
  PDFDocument.prototype.text = function (value: string, ...args: any[]) {
    rendered += value;
    return originalText.call(this, value, ...args);
  };
  try {
    for (const recipientName of ['Trần Văn B', undefined, null, ' ']) {
      const input = { ...snapshot, recipientName };
      const original = JSON.stringify(input);
      const rows = buildQuotationPdfRows(input).map(row => row.text);
      const expected = recipientName?.trim() || customer.fullName;
      for (const value of [`Khách hàng: ${customer.fullName}`, `Email: ${customer.email}`, `SĐT tài khoản: ${customer.phone}`, `Người nhận: ${expected}`, `SĐT giao hàng: ${order.shippingPhone}`, `Địa chỉ giao hàng: ${order.shippingAddress}`]) {
        assert.ok(rows.includes(value), value);
      }
      rendered = '';
      const bytes = await renderQuotationPdf(input);
      assert.equal(bytes.subarray(0, 8).toString(), '%PDF-1.4');
      for (const value of [customer.fullName, customer.email, customer.phone, `Người nhận: ${expected}`, `SĐT giao hàng: ${order.shippingPhone}`, order.shippingAddress]) {
        assert.ok(rendered.includes(value), value);
      }
      assert.equal(JSON.stringify(input), original);
    }
  } finally {
    PDFDocument.prototype.text = originalText;
  }
});
