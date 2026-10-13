const input = $json;
const normalizedInput = $('Normalize Input').first().json;
const sessionId = normalizedInput.sessionId || '';
const chatInput = normalizedInput.chatInput || '';
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
const text = normalize(chatInput);
let pendingRequests = [];
try {
  const row = $('Pending Quote - Lookup').first().json;
  if (sessionId && row.session_id === sessionId && Number(row.expires_at) > Date.now()) {
    const parsed = JSON.parse(row.requests_json || '[]');
    if (Array.isArray(parsed)) pendingRequests = parsed.slice(0, 12);
  }
} catch {}
const state = normalizedInput.conversationState || {};
const pending = state.pending_question?.type === 'quotation' ? state.pending_question : null;
if (pending?.product_id && Array.isArray(pending.options)) {
  pendingRequests = pendingRequests.map(request => request.product_id === pending.product_id
    ? { ...request, available_variants: pending.options, quantity: pending.quantity || request.quantity || 1 } : request);
}
if (!pendingRequests.length && pending?.product_id) pendingRequests = [{
  request_index: 1, product_id: pending.product_id, model: pending.product_name,
  quantity: pending.quantity || 1, available_variants: pending.options || [],
}];
const ordinal = text.match(/\b(?:mau|phien ban|lua chon)\s*(?:so|thu)?\s*(\d+)\b/);
const storage = text.match(/\b(\d+(?:[.,]\d+)?)\s*(gb|tb)\b/);
const colorMatch = chatInput.match(/m[aà]u\s+(.+?)(?:[.!?]|$)/iu);
const followup = pendingRequests.length > 0 && (input.is_followup === true || ordinal || storage || colorMatch
  || /^(?:dong y|xac nhan|ok|duoc)$/.test(text));
let requests = followup ? pendingRequests.map(request => ({ ...request })) : [];
if (!followup) {
  const descriptors = Array.isArray(input.products) ? input.products : [];
  requests = descriptors.filter(p => p?.model).map((p, index) => ({
    request_index: index + 1, brand: p.brand || '', model: p.model,
    storage_gb: p.storage_gb ?? null, ram_gb: p.ram_gb ?? null, color: p.color || null,
    quantity: p.quantity_explicit === true ? p.quantity : 1,
  }));
  if (!requests.length && input.model) requests = [{ request_index: 1, brand: input.brand || '', model: input.model,
    storage_gb: null, ram_gb: null, color: null, quantity: 1 }];
  if (!requests.length && /\b(?:mau nay|san pham nay|dien thoai nay)\b/.test(text)) {
    const selected = (state.last_result_set || []).find(p => p.id === state.selected_product_id);
    if (selected) requests = [{ request_index: 1, product_id: selected.id, brand: selected.brand || '', model: selected.name, quantity: 1 }];
  }
}
let ambiguousFollowup = Boolean(followup && requests.length > 1 && (ordinal || storage || colorMatch));
if (requests.length === 1) {
  const request = requests[0];
  if (ordinal) {
    const option = request.available_variants?.[Number(ordinal[1]) - 1];
    request.variant_id = option?.variant_id || option?.id || '__invalid_variant_selection__';
  } else {
    if (storage) { request.storage_gb = Number(storage[1].replace(',', '.')) * (storage[2] === 'tb' ? 1024 : 1); delete request.variant_id; }
    if (colorMatch) { request.color = colorMatch[1].trim(); delete request.variant_id; }
    if (!storage && input.storage) request.storage_gb = Number(String(input.storage).replace(/gb/i, '')) || request.storage_gb || null;
    if (!colorMatch && input.color) request.color = input.color;
  }
  if (input.quantity_explicit === true) request.quantity = input.quantity;
}
return [{ json: { result_type: 'quotation', requests: requests.slice(0, 12),
  total_requested: requests.length, ambiguous_followup: ambiguousFollowup,
  ambiguous_products: ambiguousFollowup ? requests.map(r => r.model || 'sản phẩm') : [],
  chatInput, sessionId, source: 'web_chat' } }];
