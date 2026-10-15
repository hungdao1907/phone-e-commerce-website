import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesProductNameSearch } from '../src/services/product-name-search';

test('product name search matches all model tokens, independent of accents and punctuation', () => {
  const product = { name: 'Apple iPhone 17 Pro Max', brand: 'Apple', variants: [{ sku: 'IPH17PM-256' }] };
  assert.equal(matchesProductNameSearch(product, 'iPhone 17 Pro Max'), true);
  assert.equal(matchesProductNameSearch(product, 'iphone 17'), true);
  assert.equal(matchesProductNameSearch(product, 'Galaxy 17'), false);
});

test('product name search rejects an empty query instead of returning the whole catalog', () => {
  assert.equal(matchesProductNameSearch({ name: 'iPhone 17' }, '   '), false);
});
