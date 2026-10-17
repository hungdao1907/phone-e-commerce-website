import { resolveChatbotCatalogProducts, type ChatbotCatalogDatabase } from './chatbot-catalog.service';

const statuses = new Set(['ready', 'needs_variant_selection', 'not_found', 'insufficient_stock', 'invalid_request']);
const record = (value: unknown): value is Record<string, any> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const safeId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
type CatalogVariant = { id: string; sku?: string; attributes: Record<string, unknown>; stock: number; price: number | null; original_price: number | null };
type DraftVariant = CatalogVariant & { variant_id: string; storage_gb: unknown; ram_gb: unknown; color: unknown };
type DraftResult = { request_index: number; requested: { quantity: number }; status: string;
  product?: { id: string; name: string; brand?: string }; available_variants?: DraftVariant[];
  resolved_product?: { id: string; product_id: string; variant_id: string; sku?: string; attributes: Record<string, unknown>; quantity: number } };

export function isQuotationDraftResponse(value: Record<string, any>): boolean {
  return value.result_type === 'quotation' && statuses.has(value.quote_status)
    && Array.isArray(value.request_results) && value.request_results.length <= 12
    && value.response_type !== 'file' && !value.download_url && !value.quote_number;
}

/** Workflow IDs are hints. Money, attributes and stock are re-read from the Backend catalog. */
export async function prepareQuotationDraftResponse(value: Record<string, any>, sessionId: string, database: ChatbotCatalogDatabase) {
  const rawResults: Record<string, any>[] = value.request_results.filter(record);
  const ids = [...new Set(rawResults.flatMap(item => {
    const id = item.product?.id || item.resolved_product?.product_id || item.resolved_product?.id;
    return safeId(id) ? [id] : [];
  }))].slice(0, 12);
  const catalog = ids.length ? await resolveChatbotCatalogProducts(database, ids) : [];
  const productsById = new Map(catalog.map(product => [product.id, product]));
  const products: Array<(typeof catalog)[number] & { selected_variant_id?: string; quotation_quantity?: number }> = [];
  const results = rawResults.map<DraftResult>((item, index) => {
    const id = item.product?.id || item.resolved_product?.product_id || item.resolved_product?.id;
    const product = productsById.get(id);
    const quantity = item.resolved_product?.quantity ?? item.requested?.quantity ?? 1;
    const base = { request_index: index + 1, requested: { quantity } };
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { ...base, status: 'invalid_request' };
    if (!product) return { ...base, status: 'not_found' };
    const productSummary = { id: product.id, name: product.name, brand: product.brand };
    const hint = item.resolved_product?.variant_id || item.variant?.variant_id || item.variant?.id;
    const requestedIds = Array.isArray(item.available_variants) ? item.available_variants.flatMap((v: any) =>
      safeId(v?.variant_id || v?.id) ? [v.variant_id || v.id] : []) : [];
    const attribute = (attributes: Record<string, unknown>, keys: string[]) => Object.entries(attributes)
      .find(([key]) => keys.includes(normalize(key)))?.[1] ?? null;
    const variants = (product.variants as CatalogVariant[]).filter(v => (!requestedIds.length || requestedIds.includes(v.id))
      && (!hint || v.id === hint)).sort((a, b) => requestedIds.length ? requestedIds.indexOf(a.id) - requestedIds.indexOf(b.id) : 0);
    const options = variants.filter(v => v.stock >= quantity && v.price !== null).map(v => ({
      id: v.id, variant_id: v.id, sku: v.sku,
      storage_gb: attribute(v.attributes, ['storage', 'dungluong', 'capacity']),
      ram_gb: attribute(v.attributes, ['ram']), color: attribute(v.attributes, ['color', 'mausac', 'mau']),
      attributes: v.attributes, price: v.price, original_price: v.original_price, stock: v.stock,
    }));
    if (!products.some(p => p.id === product.id)) products.push({ ...product,
      ...(hint && options.length === 1 ? { selected_variant_id: hint, quotation_quantity: quantity } : {}) });
    if (item.status === 'not_found') return { ...base, status: 'not_found', product: productSummary };
    if (item.status === 'insufficient_stock') return { ...base, status: 'insufficient_stock', product: productSummary, available_variants: options };
    if (!options.length) return { ...base, status: 'insufficient_stock', product: productSummary, available_variants: [] };
    if (item.status === 'ready' && hint && options.length === 1) return { ...base, status: 'ready', product: productSummary,
      resolved_product: { id: product.id, product_id: product.id, variant_id: options[0].id,
        sku: options[0].sku, attributes: options[0].attributes, quantity }, available_variants: options };
    return { ...base, status: 'needs_variant_selection', product: productSummary, available_variants: options };
  });
  const ready = results.length > 0 && results.every(r => r.status === 'ready');
  const status = ready ? 'ready' : results.some(r => r.status === 'invalid_request') || !results.length ? 'invalid_request'
    : results.some(r => r.status === 'not_found') ? 'not_found'
      : results.some(r => r.status === 'insufficient_stock') ? 'insufficient_stock' : 'needs_variant_selection';
  const pendingResult = results.find(r => r.status === 'needs_variant_selection');
  const state = record(value.conversation_state) ? { ...value.conversation_state } : { state_version: 2 } as Record<string, any>;
  state.last_result_set = products.map((p, index) => ({ id: p.id, name: p.name, brand: p.brand, position: index + 1 }));
  state.selected_product_id = products.length === 1 ? products[0].id : null;
  state.selected_variant_id = ready && products.length === 1 ? products[0].selected_variant_id || null : null;
  state.last_intent = 'quotation';
  state.pending_question = pendingResult ? { type: 'quotation', field: 'variant', product_id: pendingResult.product?.id,
    product_name: pendingResult.product?.name, quantity: pendingResult.requested.quantity,
    options: pendingResult.available_variants?.map(v => ({ id: v.id, variant_id: v.id })) }
    : ready && products.length === 1 ? { type: 'quotation', field: 'ready', product_id: products[0].id,
      product_name: products[0].name, quantity: results[0]!.requested.quantity,
      options: [{ id: products[0].selected_variant_id, variant_id: products[0].selected_variant_id }] }
      : status === 'invalid_request' ? { type: 'quotation', field: 'product', options: [] } : null;
  let response = ready
    ? 'Đã xác định sản phẩm và phiên bản bạn chọn. Hãy kiểm tra lựa chọn trên thẻ và nhấn “Yêu cầu báo giá” để tiếp tục xác nhận trong tài khoản WebPhone.'
    : status === 'invalid_request' ? 'Bạn muốn báo giá sản phẩm nào? Hãy cho biết tên hoặc dòng máy.'
      : status === 'not_found' ? 'Chưa tìm thấy sản phẩm hoặc phiên bản phù hợp. Bạn có thể thử tên hoặc phiên bản khác.'
        : status === 'insufficient_stock' ? 'Phiên bản bạn yêu cầu hiện không đủ hàng. Hãy chọn một phiên bản còn hàng trên thẻ sản phẩm.' : '';
  if (status === 'needs_variant_selection') response = results.filter(r => r.status === 'needs_variant_selection').map(r =>
    `Đã tìm thấy ${r.product?.name}. Các phiên bản đủ hàng cho số lượng bạn yêu cầu:\n` +
    (r.available_variants || []).map((v, index) => {
      const label = Object.values(v.attributes).filter(value => typeof value === 'string' || typeof value === 'number').join(' · ') || v.sku || `Tùy chọn ${index + 1}`;
      return `${index + 1}. ${label} — ${new Intl.NumberFormat('vi-VN').format(v.price!)} đ`;
    }).join('\n') + '\n\nBạn muốn chọn phiên bản nào?').join('\n\n');
  if (ready) {
    const catalogLines = results.flatMap(result => {
      const variant = result.available_variants?.find(v => v.id === result.resolved_product?.variant_id);
      const unit = variant?.price, quantity = result.requested.quantity;
      const total = typeof unit === 'number' ? unit * quantity : null;
      return typeof unit === 'number' && Number.isSafeInteger(unit) && unit >= 0 && Number.isSafeInteger(total)
        ? [`${result.product?.name}: ${quantity} chiếc × ${unit.toLocaleString('vi-VN')} đ = ${total!.toLocaleString('vi-VN')} đ (tham khảo từ catalog Backend).`]
        : [];
    });
    if (catalogLines.length) response = catalogLines.join('\n') + '\nGiá tham khảo chưa phải báo giá cuối cùng; Backend sẽ xác minh lại giá, ưu đãi và vận chuyển khi bạn gửi yêu cầu.\n' + response;
  }
  return { sessionId, result_type: 'quotation', response_type: 'text', quote_status: status,
    success: ready, ready_to_quote: ready, response, request_results: results, products,
    total: products.length, total_requested: results.length, total_resolved: results.filter(r => r.status === 'ready').length,
    catalog_verified: true, conversation_state: state };
}
