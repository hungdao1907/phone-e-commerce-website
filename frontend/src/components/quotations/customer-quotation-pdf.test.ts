import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PaymentMethodDropdown } from './PaymentMethodDropdown';
import { customerQuotationStatus } from './customer-quotation-status';
import { downloadApprovedCustomerQuotation, getQuotationPdfBlob } from './quotation-api';
import type { QuotationRecord } from './QuotationDetails';
import { subscribeToPersistedQuotationUpdates, publishQuotationCreated, publishQuotationUpdated, publishQuotationDraftChanged } from './quotation-events';

const quote: QuotationRecord = { id: 'quote-owned', quoteNumber: 'QT-REAL-SNAPSHOT-MOCK', version: 2, status: 'APPROVED',
  subtotal: 40500000, discountAmount: 2025000, shippingFee: 0, totalAmount: 38475000,
  expiresAt: '2099-01-01T00:00:00Z', items: [] };

test('payment dropdown displays the current COD or bank-transfer value without submitting the form', () => {
  for (const [value, label] of [['COD', 'Thanh toán khi nhận hàng'], ['BANK_TRANSFER', 'Chuyển khoản ngân hàng']] as const) {
    let changes = 0;
    const html = renderToStaticMarkup(React.createElement(PaymentMethodDropdown, { value, onChange: () => { changes++; } }));
    assert.ok(html.includes(label));
    assert.ok(html.includes('role="combobox"'));
    assert.ok(html.includes('type="button"'));
    assert.ok(html.includes('aria-expanded="false"'));
    assert.equal(changes, 0);
  }
});

test('payment dropdown is disabled while the quotation request is being submitted', () => {
  const html = renderToStaticMarkup(React.createElement(PaymentMethodDropdown, { value: 'COD', onChange: () => {}, disabled: true }));
  assert.ok(html.includes('disabled=""'));
  assert.ok(!html.includes('role="listbox"'));
});

test('only approved valid or converted historical quotations get the approved PDF message', () => {
  assert.equal(customerQuotationStatus(quote).downloadable, true);
  assert.equal(customerQuotationStatus({ ...quote, status: 'CONVERTED', expiresAt: '2000-01-01' }).downloadable, true);
  for (const status of ['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED', 'NEEDS_REQUOTE', 'REJECTED', 'CUSTOMER_REJECTED', 'EXPIRED', 'UNKNOWN']) {
    const presentation = customerQuotationStatus({ ...quote, status });
    assert.equal(presentation.downloadable, false, status);
    assert.ok(!presentation.message.includes('đã được duyệt'), status);
  }
  assert.equal(customerQuotationStatus({ ...quote, expiresAt: '2000-01-01' }).downloadable, false);
});

async function withMocks(run: (calls: Array<{ url: string; init?: RequestInit }>, downloads: string[]) => Promise<void>,
  respond: (url: string, init?: RequestInit) => Response = (url, init) => url.endsWith('/pdf')
    ? init?.method === 'POST' ? Response.json({ file: { id: 'private-file' } }, { status: 201 })
      : new Response('%PDF-1.4 Backend snapshot fixture', { headers: { 'Content-Type': 'application/pdf' } })
    : Response.json({ quotation: quote })) {
  const original = { fetch: globalThis.fetch, document: globalThis.document, window: globalThis.window,
    create: URL.createObjectURL, revoke: URL.revokeObjectURL };
  const calls: Array<{ url: string; init?: RequestInit }> = [], downloads: string[] = [];
  globalThis.fetch = (async (url, init) => { calls.push({ url: String(url), init }); return respond(String(url), init); }) as typeof fetch;
  Object.assign(globalThis, { document: { body: { appendChild() {} }, createElement: () => {
    const anchor = { href: '', download: '', rel: '', click() { downloads.push(anchor.download); }, remove() {} }; return anchor;
  } }, window: { setTimeout: (fn: () => void) => { fn(); } } });
  URL.createObjectURL = () => 'blob:isolated-private-pdf'; URL.revokeObjectURL = () => {};
  try { await run(calls, downloads); }
  finally { Object.assign(globalThis, { fetch: original.fetch, document: original.document, window: original.window }); URL.createObjectURL = original.create; URL.revokeObjectURL = original.revoke; }
}

test('owned approved PDF revalidates exact version and generates the current Backend design; no Order/Quotation create', async () => {
  await withMocks(async (calls, downloads) => {
    await downloadApprovedCustomerQuotation(quote, 'customer-session');
    assert.equal(calls.length, 3);
    assert.ok(calls[0].url.endsWith('/api/quotations/quote-owned'));
    assert.ok(calls[1].url.endsWith('/api/quotations/quote-owned/pdf'));
    assert.equal(calls[1].init?.method, 'POST');
    assert.equal(calls[2].init?.method, undefined);
    for (const call of calls) {
      assert.equal(new Headers(call.init?.headers).get('Authorization'), 'Bearer customer-session');
      assert.ok(!call.url.includes('customer-session'));
      assert.ok(!call.url.includes('/orders'));
      assert.ok(!call.url.endsWith('/api/quotations'));
    }
    assert.deepEqual(downloads, ['quotation-quote-owned.pdf']);
    assert.equal(quote.totalAmount, 38475000);
  });
});

test('other Customer is refused by protected Backend; no PDF generation or download follows', async () => {
  await withMocks(async (calls, downloads) => {
    await assert.rejects(downloadApprovedCustomerQuotation(quote, 'other-customer'), (error: any) => error.status === 404);
    assert.equal(calls.length, 1); assert.deepEqual(downloads, []);
  }, () => Response.json({ message: 'Quotation not found.' }, { status: 404 }));
});

test('unauthenticated and expired session do not save a PDF', async () => {
  await withMocks(async (calls, downloads) => {
    await assert.rejects(downloadApprovedCustomerQuotation(quote, ''), (error: any) => error.status === 401);
    assert.equal(calls.length, 0);
    await assert.rejects(downloadApprovedCustomerQuotation(quote, 'expired'), (error: any) => error.status === 401);
    assert.equal(calls.length, 1); assert.deepEqual(downloads, []);
  }, () => Response.json({ message: 'Session expired.' }, { status: 401 }));
});

test('changed version, pending status and session switch are blocked before PDF generation', async () => {
  for (const changed of [{ ...quote, version: 3 }, { ...quote, status: 'CUSTOMER_CONFIRMED' }, { ...quote, id: 'other-quote' }]) {
    await withMocks(async (calls, downloads) => {
      await assert.rejects(downloadApprovedCustomerQuotation(quote, 'session'), (error: any) => error.status === 409);
      assert.equal(calls.length, 1); assert.deepEqual(downloads, []);
    }, () => Response.json({ quotation: changed }));
  }
  await withMocks(async (calls, downloads) => {
    await assert.rejects(downloadApprovedCustomerQuotation(quote, 'session', () => false), (error: any) => error.status === 401);
    assert.equal(calls.length, 1); assert.deepEqual(downloads, []);
  });
});

test('invalid PDF response is rejected rather than downloading JSON or public URLs', async () => {
  await withMocks(async () => {
    await assert.rejects(getQuotationPdfBlob('/api/quotations/quote-owned/pdf', 'session'), /không phải PDF/);
  }, () => Response.json({ fake: 'not a PDF' }));
});

test('Profile and Chatbot subscribers refresh on persisted changes only, and unsubscribe on close', () => {
  const previousWindow = globalThis.window;
  Object.assign(globalThis, { window: new EventTarget() });
  let profile = 0, chatbot = 0;
  const unsubscribeProfile = subscribeToPersistedQuotationUpdates(() => { profile++; });
  const unsubscribeChatbot = subscribeToPersistedQuotationUpdates(() => { chatbot++; });
  try {
    publishQuotationDraftChanged('chatbot');
    assert.equal(profile, 0); assert.equal(chatbot, 0);
    publishQuotationCreated(quote.id); publishQuotationUpdated(quote.id);
    assert.equal(profile, 2); assert.equal(chatbot, 2);
    unsubscribeChatbot(); publishQuotationUpdated(quote.id);
    assert.equal(profile, 3); assert.equal(chatbot, 2);
    unsubscribeProfile(); publishQuotationCreated(quote.id); assert.equal(profile, 3);
  } finally { unsubscribeProfile(); unsubscribeChatbot(); Object.assign(globalThis, { window: previousWindow }); }
});

test('session changed during PDF download prevents the blob save', async () => {
  await withMocks(async (calls, downloads) => {
    await assert.rejects(downloadApprovedCustomerQuotation(quote, 'session', () => calls.length < 3), (error: any) => error.status === 401);
    assert.equal(calls.length, 3); assert.deepEqual(downloads, []);
  });
});

test('Chatbot renders real snapshot version and total with PDF only for eligible statuses', async () => {
  Object.assign(globalThis, { React, localStorage: { getItem: () => null, removeItem() {} }, sessionStorage: { removeItem() {} } });
  const { ChatQuotationCard } = await import('../chatbot/CustomerQuotationPanel');
  const approved = renderToStaticMarkup(React.createElement(ChatQuotationCard, { quotation: quote, onDownload() {} }));
  assert.ok(approved.includes('Tải PDF báo giá')); assert.ok(approved.includes('38.475.000'));
  assert.ok(approved.includes('QT-REAL-SNAPSHOT-MOCK')); assert.ok(approved.includes('v2'));
  const pending = renderToStaticMarkup(React.createElement(ChatQuotationCard, { quotation: { ...quote, status: 'CUSTOMER_CONFIRMED' }, onDownload() {} }));
  assert.ok(!pending.includes('Tải PDF báo giá')); assert.ok(!pending.includes('đã được duyệt'));
});
