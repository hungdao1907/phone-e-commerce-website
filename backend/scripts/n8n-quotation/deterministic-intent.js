const normalized = $('Normalize Input').first().json;
const text = String(normalized.chatInput || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd').toLowerCase().trim();
let classification = null;
const base = { intent: 'default', brand: '', model: '', storage: '', ram: '', color: '', price_max: null,
  condition: '', use_case: '', faq_topic: '', faq_topics: [], products: [], quantity: 1,
  turn_action: 'CONTINUE', context_mode: 'continue', requires_clarification: false };
if (/^(?:xin chao|chao(?: ban|shop|webphone)?|hello|hi|alo)[.!?]*$/.test(text)) {
  classification = base;
} else if (/\b(?:bao hanh|warranty)\b/.test(text)
  && /\b(?:chinh sach|bao hanh chung|bao hanh (?:san pham|may) nay|the nao|bao lau|warranty policy)\b/.test(text)
  && !/\b(?:bao gia|so sanh|tim|mua|ban|goi y|tu van)\b|\d/.test(text)) {
  classification = { ...base, intent: 'faq', faq_topic: 'warranty', faq_topics: ['warranty'] };
} else {
  let requests = [];
  let valid = false;
  try {
    const row = $('Pending Quote - Lookup').first().json;
    requests = JSON.parse(row.requests_json || '[]');
    valid = row.session_id === normalized.sessionId && Number(row.expires_at) > Date.now()
      && Array.isArray(requests) && requests.length > 0;
  } catch {}
  const state = normalized.conversationState || {};
  const pending = state.pending_question?.type === 'quotation' ? state.pending_question : null;
  const selectedId = pending?.product_id || state.selected_product_id;
  const selectedVariant = pending?.field === 'ready' && pending.options?.length === 1
    ? pending.options[0].variant_id || pending.options[0].id : state.selected_variant_id;
  const validState = state.state_version === 2 && !Array.isArray(state)
    && typeof selectedId === 'string' && selectedId.length > 0;
  const request = Array.isArray(requests) ? requests.find(request => request.product_id === selectedId) : null;
  const sameProduct = validState && request
    && (!state.pending_question?.product_id || state.pending_question.product_id === selectedId);
  const sameVariant = !selectedVariant || (Array.isArray(request?.available_variants)
    && request.available_variants.some(variant => (variant.id || variant.variant_id) === selectedVariant));
  const attributesOnly = /^(?:\d+(?:[.,]\d+)?\s*(?:gb|tb)(?:\s+mau\s+[\p{L}\s]+)?|mau\s+[\p{L}\s]+|(?:mau|phien ban)\s+(?:so|thu)\s*\d+)[.!?]*$/u.test(text);
  const resume = /^(?:toi muon\s+)?tiep tuc bao gia(?:\s+truoc do)?[.!?]*$/.test(text);
  if (valid && sameProduct && sameVariant && (attributesOnly || resume)) classification = { ...base, intent: 'quotation' };
}
return [{ json: classification
  ? { fast_intent: true, content: { parts: [{ text: JSON.stringify(classification) }] } }
  : { fast_intent: false } }];
