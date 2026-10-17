import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedCatalogAdvice } from '../src/services/chatbot-verified-advice';
import { prepareQuotationDraftResponse } from '../src/services/chatbot-quotation-draft.service';
import { prepareCustomerChatbotResponse } from '../src/routes/chatbot.routes';

const record = { id: 'fixture-phone', name: 'Fixture phone', brand: 'FixtureBrand', status: 'active', categoryId: 'phone',
  category: { name: 'Điện thoại', slug: 'phone', isActive: true },
  specifications: [{ key: 'RAM', value: '8GB' }, { key: 'Pin', value: 'Video 20 giờ' }, { key: 'Camera', value: '48MP' }],
  variants: [{ id: 'fixture-black', sku: 'BLACK', attributes: { 'Màu sắc': 'Đen', 'Dung lượng': '256GB' }, stock: 3, price: 2000000, salePrice: null }] };
const db = { product: { findMany: async () => [structuredClone(record)] }, campaign: { findMany: async () => [] },
  category: { findMany: async () => [{ id: 'phone', parentId: null, isActive: true }] } };
const draft = () => ({ result_type: 'quotation', quote_status: 'ready', response: 'FAKE TOTAL 1 VND', response_type: 'text', request_results: [{ status: 'ready',
  requested: { quantity: 2 }, resolved_product: { id: record.id, variant_id: 'fixture-black', quantity: 2, unit_price: 1, subtotal: 2 } }],
  conversation_state: { state_version: 2, updated_at: new Date().toISOString() } });

test('ready quote uses Backend catalog money, keeps quantity and ready pending without creating anything', async () => {
  const dto = await prepareQuotationDraftResponse(draft(), 'test-quote', db);
  assert.equal(dto.ready_to_quote, true);
  assert.equal(dto.products[0]?.quotation_quantity, 2);
  assert.equal(dto.conversation_state.pending_question.type, 'quotation');
  assert.equal(dto.conversation_state.pending_question.quantity, 2);
  assert.match(dto.response, /2 chiếc × 2\.000\.000 đ = 4\.000\.000 đ/);
  assert.doesNotMatch(dto.response, /FAKE TOTAL/);
  assert.equal('quote_number' in dto, false);
});
test('catalog stock change prevents ready response, never displays a successful total', async () => {
  const dto = await prepareQuotationDraftResponse(draft(), 'stock', { ...db,
    product: { findMany: async () => [{ ...record, variants: [{ ...record.variants[0]!, stock: 1 }] }] } });
  assert.equal(dto.ready_to_quote, false);
  assert.equal(dto.quote_status, 'insufficient_stock');
  assert.doesNotMatch(dto.response, /4\.000\.000/);
});
test('invalid quantity is rejected instead of a ready draft', async () => {
  for (const quantity of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const input = draft(); input.request_results[0]!.resolved_product.quantity = quantity;
    const dto = await prepareQuotationDraftResponse(input, 'quantity', db);
    assert.equal(dto.ready_to_quote, false);
    assert.equal(dto.quote_status, 'invalid_request');
  }
});
test('Backend re-generates useful specs from verified records, not workflow prose or stock hints', async () => {
  const input = { result_type: 'product_detail', response: 'BAD RESPONSE 999GB RAM', products: [{ id: record.id, variants: [{ id: 'fixture-black', price: 1, stock: 999 }] }],
    grounding: { constraints: { brands: ['FixtureBrand'], categoryIds: ['phone'], modelIds: [record.id], modelTokens: [], attrTerms: [], inStock: true, outOfStock: false, budget: null, clarification: false } } };
  const dto = await prepareCustomerChatbotResponse(input, 'specs', db as any, { message: 'Máy này RAM bao nhiêu, pin bao nhiêu mAh?' });
  assert.match(String(dto.response), /RAM: 8GB/);
  assert.match(String(dto.response), /chưa cung cấp.*mAh/);
  assert.doesNotMatch(String(dto.response), /BAD RESPONSE|999GB/);
});
test('formatting cannot invent 5G, camera quality or benchmark and handles missing facts', () => {
  const products = [{ ...record, price: 2000000, original_price: 2000000, stock: 3, availability: 'in_stock', variants: record.variants.map(v => ({ ...v, original_price: v.price })) }];
  assert.match(verifiedCatalogAdvice('Máy này có hỗ trợ 5G không?', products)!, /chưa có thông tin xác nhận/);
  assert.match(verifiedCatalogAdvice('Camera máy này chụp ban đêm có tốt không?', products)!, /Chưa có đánh giá/);
  assert.match(verifiedCatalogAdvice('Máy nào chơi Liên Quân hoặc PUBG mượt hơn?', products)!, /Chưa có benchmark/);
  assert.equal(verifiedCatalogAdvice('Máy này RAM bao nhiêu?', []), null);
  assert.equal(verifiedCatalogAdvice('Xin chào', products), null);
});
