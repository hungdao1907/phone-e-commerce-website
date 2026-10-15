const data = $json;
const results = Array.isArray(data.request_results) ? data.request_results : [];
const products = (Array.isArray(data.products) ? data.products : []).map(p => ({
  request_index: p.request_index, id: p.product_id || p.id, product_id: p.product_id || p.id,
  variant_id: p.variant_id, name:p.model, sku: p.sku, storage_gb: p.storage_gb, ram_gb: p.ram_gb,
  color: p.color, quantity: p.quantity
}));
const ready = data.ready_to_quote === true && products.length > 0
  && products.every(p => typeof p.id === 'string' && typeof p.variant_id === 'string'
    && Number.isSafeInteger(p.quantity) && p.quantity > 0);
return [{ json: {
  result_type: 'quotation', response_type: 'text', quote_status: ready ? 'ready' : 'invalid_request',
  success: ready, ready_to_quote: ready,
  response: ready
    ? 'Đã xác định sản phẩm và phiên bản bạn chọn. Hãy kiểm tra lựa chọn và xác nhận yêu cầu trong tài khoản WebPhone; cửa hàng sẽ xử lý báo giá sau khi bạn xác nhận.'
    : 'Chưa xác định đủ sản phẩm và phiên bản. Vui lòng chọn lại phiên bản cần báo giá.',
  products, request_results: results.map(r => ({
    request_index: r.request_index, status: r.status, requested: r.requested,
    resolved_product: products.find(p => p.request_index === r.request_index)
  })),
  total_requested: data.total_requested, total_resolved: products.length,
  sessionId: data.sessionId || '', source: data.source || 'web_chat'
} }];
