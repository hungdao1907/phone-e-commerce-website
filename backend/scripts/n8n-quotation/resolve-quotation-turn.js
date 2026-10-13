const input = $json;
const normalized = $('Normalize Input').first().json;
const text = String(normalized.chatInput || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
const pending = normalized.conversationState?.pending_question;
const pendingQuote = pending?.type === 'quotation';
const resumeQuote = /\btiep tuc bao gia\b/.test(text) && input.pending_quote_exists === true && Boolean(normalized.conversationState?.selected_product_id);
const isWarranty = /\b(?:bao hanh|warranty)\b/.test(text);
if (isWarranty && !/\b(?:so sanh|bao gia)\b/.test(text)) {
  return [{json:{...input,intent:'faq',faq_topic:'warranty',faq_topics:['warranty'],turn_action:'CONTINUE',context_mode:'continue',
    requires_clarification:false,conversationState:normalized.conversationState || input.conversationState}}];
}
const isAttribute = /\b\d+\s*(?:gb|tb)\b|\bmau\s+\S|\b(?:mau|phien ban)\s*(?:so|thu)?\s*\d+\b/.test(text);
const isProductReply = pendingQuote && pending.field === 'product' && Boolean(input.model || input.products?.length);
const isOtherQuestion = /\b(?:bao hanh|chinh sach|camera|pin|man hinh|so sanh)\b/.test(text);
if (input.turn_action !== 'CANCEL' && !isOtherQuestion &&
  (resumeQuote || /\bbao gia\b/.test(text) || (pendingQuote && (isAttribute || isProductReply)) || (input.pending_quote_exists && isAttribute))) {
  return [{ json: { ...input, intent: 'quotation', is_followup: resumeQuote || (pendingQuote || input.pending_quote_exists) && isAttribute,
    requires_clarification: false, clarification_field: null } }];
}
return [{ json: input }];
