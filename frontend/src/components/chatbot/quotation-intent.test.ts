import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { dedupeChatbotProducts } from './catalog-products';
import { parseQuotationIntent, resolveQuotationIntent } from './quotation-intent';
import type { ChatbotProduct } from './types';

const storage = new Map<string, string>();
const storageStub = {
  getItem: (key: string) => storage.get(key) || null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
};
Object.defineProperty(globalThis, 'localStorage', { value: storageStub, configurable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: storageStub, configurable: true });
const { ProductCarousel } = await import('./ProductCarousel');

const product: ChatbotProduct = {
  id: 'iphone-17', name: 'iPhone 17', brand: 'Apple', image_url: '',
  variants: [{
    id: '754fd5c2-ad27-4c59-906b-0027d909a8ba',
    sku: 'IPHO-256GB-XANHNAVY',
    attributes: { 'Màu sắc': 'Xanh Navy', 'Dung lượng': '256GB' }, stock: 4,
    price: 25000000, original_price: 26000000, availability: 'in_stock',
  }],
};

test('A: natural quotation intent searches Backend by extracted name when n8n has no product IDs', async () => {
  let searched = '';
  const result = await resolveQuotationIntent('Tôi muốn báo giá iPhone 17', { result_type: 'product_search', products: [] }, [], {
    byName: async name => { searched = name; return [product]; },
  });
  assert.equal(searched, 'iphone 17');
  assert.deepEqual(result?.products.map(item => item.id), ['iphone-17']);
  assert.match(result?.text || '', /phiên bản/);
});

test('A: storage and polite wording are excluded from the product-name search', () => {
  assert.equal(parseQuotationIntent('Báo giá iPhone 17 Pro Max 256GB').productQuery, 'iphone 17 pro max');
  assert.equal(parseQuotationIntent('Cho tôi xin báo giá iPhone 17').productQuery, 'iphone 17');
  assert.equal(parseQuotationIntent('Tôi muốn mua điện thoại này, có báo giá không?').productQuery, null);
  assert.equal(parseQuotationIntent('Cho tôi báo giá iPhone 17').productQuery, 'iphone 17');
  assert.equal(parseQuotationIntent('bao gia iphone 17').productQuery, 'iphone 17');
});

test('B: matched backend product renders the existing card with real variant, price and stock', () => {
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(ProductCarousel, { products: [product] }),
  ));
  assert.match(markup, /iPhone 17/);
  assert.match(markup, /256GB/);
  assert.match(markup, /25\.000\.000/);
  assert.match(markup, /Còn 4 sản phẩm/);
  assert.match(markup, /Yêu cầu báo giá/);
  assert.match(markup, /Dung lượng: 256GB · Màu sắc: Xanh Navy/);
  assert.doesNotMatch(markup.replace(/<[^>]*>/g, ''), /754fd5c2-ad27-4c59-906b-0027d909a8ba/);
});

test('Product Card uses SKU rather than UUID when attributes are absent', () => {
  const noAttributes: ChatbotProduct = {
    id: 'fallback-product', name: 'Fallback product', variants: [{
      id: '754fd5c2-ad27-4c59-906b-0027d909a8ba', sku: 'SKU-REAL-VARIANT', attributes: {},
      stock: 2, price: 1000, original_price: 1000, availability: 'in_stock',
    }],
  };
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(ProductCarousel, { products: [noAttributes] }),
  ));
  const visibleText = markup.replace(/<[^>]*>/g, '');
  assert.match(visibleText, /SKU: SKU-REAL-VARIANT/);
  assert.doesNotMatch(visibleText, /754fd5c2-ad27-4c59-906b-0027d909a8ba/);
});

test('C: no catalog match gives a useful not-found response without creating a quotation', async () => {
  let quotationCreateCalls = 0;
  const result = await resolveQuotationIntent('Tôi muốn báo giá iPhone 17', {}, [], {
    byName: async () => [],
  });
  assert.match(result?.text || '', /Chưa tìm thấy sản phẩm phù hợp/);
  assert.equal(result?.products.length, 0);
  assert.equal(quotationCreateCalls, 0);
});

test('D: valid n8n product IDs are Backend-rehydrated first without redundant name search', async () => {
  let idCalls = 0;
  let nameCalls = 0;
  const result = await resolveQuotationIntent('Báo giá iPhone 17', { products: [{ id: 'iphone-17' }] }, [], {
    byIds: async ids => { idCalls++; assert.deepEqual(ids, ['iphone-17']); return [product]; },
    byName: async () => { nameCalls++; return []; },
  });
  assert.equal(result?.products[0].id, 'iphone-17');
  assert.equal(idCalls, 1);
  assert.equal(nameCalls, 0);
});

test('E: catalog failures are returned as retryable assistant errors, not thrown', async () => {
  const result = await resolveQuotationIntent('Báo giá iPhone 17', {}, [], {
    byName: async () => { throw new Error('offline'); },
  });
  assert.equal(result?.isError, true);
  assert.match(result?.text || '', /thử lại/);
});

test('E: a quotation name still falls back to Backend catalog search when chatbot relay is unavailable', async () => {
  let searched = '';
  const result = await resolveQuotationIntent('Tôi muốn báo giá iPhone 17', {}, [], {
    byName: async name => { searched = name; return [product]; },
  });
  assert.equal(searched, 'iphone 17');
  assert.equal(result?.products[0].id, 'iphone-17');
});

test('F: resolving a guest quotation request only displays cards; it never creates a quotation', async () => {
  let quotationCreateCalls = 0;
  const result = await resolveQuotationIntent('Báo giá iPhone 17', {}, [], { byName: async () => [product] });
  assert.equal(result?.products.length, 1);
  assert.equal(quotationCreateCalls, 0);
});

test('G: duplicate and invalid product IDs are removed before card rendering', () => {
  const unique = dedupeChatbotProducts([product, { ...product }, { ...product, id: '' }]);
  assert.equal(unique.length, 1);
  const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(ProductCarousel, { products: [product, { ...product }] }),
  ));
  assert.equal((markup.match(/Yêu cầu báo giá/g) || []).length, 1);
  assert.match(markup, /phù hợp \(1\)/);
});

test('H: FAQ questions about quotation policy are not classified as product quotation intent', () => {
  assert.equal(parseQuotationIntent('Chính sách báo giá có hiệu lực bao lâu?').isQuotationIntent, false);
  assert.equal(parseQuotationIntent('Báo giá iPhone 17 có hiệu lực bao lâu?').isQuotationIntent, false);
  assert.equal(parseQuotationIntent('Tôi muốn báo giá iPhone 17').isQuotationIntent, true);
  assert.equal(parseQuotationIntent('Cho tôi xin báo giá sản phẩm này').productQuery, null);
});
