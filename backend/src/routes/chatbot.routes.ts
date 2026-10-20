import express from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ChatbotCatalogInputError, resolveChatbotCatalogProducts } from '../services/chatbot-catalog.service';
import { safeErrorSummary, safeFetchErrorSummary } from '../utils/safe-error-summary';
import { chatbotProductHints, groundChatbotProse, reconcileChatbotCatalogState, scopeChatbotFactProducts } from '../services/chatbot-response-grounding';
import { isQuotationDraftResponse, prepareQuotationDraftResponse } from '../services/chatbot-quotation-draft.service';
import { chatbotWebhookHeaders } from '../services/chatbot-webhook-auth';
import { verifiedCatalogAdvice } from '../services/chatbot-verified-advice';
import { filterGroundedCatalogProducts, groundedCatalogResponseText, GroundedContractError, MAX_GROUNDED_VND, normalizeGroundedText, parseGroundedBudget, parseGroundedConstraints, requestedGroundedBudget, validatedStateTimestamp } from '../services/chatbot-grounded-constraints';
import { abandonChatTurn, CHATBOT_UPSTREAM_TIMEOUT_MS, claimChatTurn, completeChatTurn, renewChatLeaseBeforeDispatch, signChatSession, verifyChatSession } from '../services/chatbot-conversation-lease.service';
import type { ChatClaim } from '../services/chatbot-conversation-lease.service';
import { beginChatbotTurnObservation } from '../services/chatbot-observability.service';

const CHAT_CONTEXT_MESSAGE_LIMIT = 6;
const CHAT_CONTEXT_MESSAGE_CHAR_LIMIT = 600;
const CHAT_HISTORY_TURN_LIMIT = 50;

type ChatContextMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatConversationState = Record<string, unknown>;

function isChatConversationState(value: unknown): value is ChatConversationState {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

type PublicChatbotRecord = Record<string, unknown>;

class ChatbotTurnFailure extends Error {
  constructor(readonly status: number, readonly code: string, readonly publicMessage: string) {
    super(code);
  }
}

export const CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE =
  'Hãy cho biết tên hoặc dòng sản phẩm cần báo giá để WebPhone tìm trong danh mục; bạn sẽ chọn phiên bản trước khi tiếp tục.';

const CHATBOT_UNVERIFIED_TEXT_MESSAGE =
  'Tôi chưa thể xác minh thông tin sản phẩm hoặc giá trong câu trả lời này. Hãy chọn một sản phẩm trong danh mục WebPhone để xem dữ liệu hiện tại do Backend cung cấp.';
const CHATBOT_INVALID_RESPONSE_MESSAGE = 'Chưa nhận được câu trả lời hợp lệ từ chatbot. Vui lòng thử lại.';
const PRODUCT_ADVICE_TYPES = new Set(['product_search', 'product_detail', 'product_compare', 'recommendation']);
const WORKFLOW_SECRET_KEY = /(?:jwt|bearer|token|password|passwd|credential|authorization|\botp\b|private.*pdf|pdf.*url|download.*url)/i;
const PRIVATE_QUOTATION_FILE_URL = /(?:https?:\/\/[^\s"'<>]+|\/)[^\s"'<>]*(?:\/api\/(?:staff\/|admin\/)?quotations\/[^/\s"'<>]+\/pdf|\/uploads\/quotations\/)[^\s"'<>]*/gi;

const CUSTOMER_PRODUCT_SCALAR_FIELDS = ['id'] as const;

function isPublicChatbotRecord(value: unknown): value is PublicChatbotRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isPublicChatbotScalar(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === 'string' || typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value));
}

function projectPublicScalars<T extends readonly string[]>(
  source: PublicChatbotRecord,
  fields: T
): PublicChatbotRecord {
  const projected: PublicChatbotRecord = {};

  for (const field of fields) {
    const value = source[field];
    if (isPublicChatbotScalar(value)) projected[field] = value;
  }

  return projected;
}

function redactWorkflowText(value: string): string {
  return value
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, '[JWT REDACTED]')
    .replace(/((?:password|passwd|passcode|otp|one[- ]time code|verification code|m(?:ã|a)\s*x(?:ã|a)c th(?:ự|u)c|bearer|access[_ -]?token)\s*[:=]?\s*)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(PRIVATE_QUOTATION_FILE_URL, '[PRIVATE QUOTATION PDF URL REDACTED]');
}

function redactWorkflowValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return undefined;
  if (typeof value === 'string') return redactWorkflowText(value);
  if (Array.isArray(value)) return value.slice(0, 100).map(item => redactWorkflowValue(item, depth + 1));
  if (value && typeof value === 'object') {
    const safe: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>).slice(0, 100)) {
      if (!WORKFLOW_SECRET_KEY.test(key)) safe[key] = redactWorkflowValue(nested, depth + 1);
    }
    return safe;
  }
  return value;
}

export function sanitizeChatbotWorkflowContext(history: ChatContextMessage[], state: ChatConversationState | null) {
  return {
    history: history.slice(-CHAT_CONTEXT_MESSAGE_LIMIT).map(message => ({
      role: message.role,
      content: redactWorkflowText(message.content).slice(-CHAT_CONTEXT_MESSAGE_CHAR_LIMIT),
    })),
    state: state ? projectChatbotConversationState(state) : null,
  };
}

function boundedText(value: unknown, limit = 160): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, limit) : null;
}

/** Allowlist conversational state; never forward customer identity, prices, stock, or arbitrary nested text. */
function projectChatbotConversationState(state: ChatConversationState): ChatConversationState {
  const timestamp = validatedStateTimestamp(state.updated_at);
  if (state.updated_at !== undefined && !timestamp) return { state_version: 2, active_filters: {}, last_result_set: [], selected_product_id: null, selected_variant_id: null, pending_question: null };
  const projected: ChatConversationState = {};
  if (timestamp) projected.updated_at = timestamp;
  const category = boundedText(state.category, 40);
  if (category) projected.category = category;
  else if (state.category === null) projected.category = null;

  const sourceFilters = isPublicChatbotRecord(state.active_filters) ? state.active_filters : {};
  const filters: Record<string, unknown> = {};
  for (const key of ['brand', 'model', 'color', 'use_case', 'condition_type'] as const) {
    const value = boundedText(sourceFilters[key]);
    if (value) filters[key] = value;
  }
  for (const key of ['storage_gb', 'ram_gb', 'price_min', 'price_max'] as const) {
    const value = sourceFilters[key];
    if (Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= MAX_GROUNDED_VND) filters[key] = value;
  }
  if (sourceFilters.grounded_budget !== undefined) {
    try { filters.grounded_budget = parseGroundedBudget(sourceFilters.grounded_budget); }
    catch { return { state_version: 2, active_filters: {}, last_result_set: [], selected_product_id: null, selected_variant_id: null, pending_question: null }; }
  }
  if (isPublicChatbotRecord(state.active_filters)) projected.active_filters = filters;

  for (const key of ['preferred_brands', 'excluded_brands'] as const) {
    const values = Array.isArray(state[key])
      ? (state[key] as unknown[]).map(value => boundedText(value, 80)).filter((value): value is string => Boolean(value)).slice(0, 10)
      : [];
    if (Array.isArray(state[key])) projected[key] = values;
  }

  const lastResults = Array.isArray(state.last_result_set) ? state.last_result_set : [];
  projected.last_result_set = lastResults.slice(0, 12).flatMap((value, index) => {
    if (!isPublicChatbotRecord(value)) return [];
    const id = boundedText(value.id, 128);
    if (!id) return [];
    const item: Record<string, string | number> = { id, position: index + 1 };
    for (const key of ['name', 'brand', 'model', 'category'] as const) {
      const text = boundedText(value[key]);
      if (text) item[key] = text;
    }
    return [item];
  });

  const selectedProductId = boundedText(state.selected_product_id, 128);
  if (selectedProductId) projected.selected_product_id = selectedProductId;
  else if (state.selected_product_id === null) projected.selected_product_id = null;
  const selectedVariantId = boundedText(state.selected_variant_id, 128);
  if (selectedVariantId) projected.selected_variant_id = selectedVariantId;
  else if (state.selected_variant_id === null) projected.selected_variant_id = null;
  if (Array.isArray(state.rejected_products)) projected.rejected_products = [...new Set(state.rejected_products
    .flatMap<unknown>(value => {
      if (isPublicChatbotRecord(value)) {
        const id = boundedText(value.id, 128); return id ? [{ id, ...(boundedText(value.name) ? { name: boundedText(value.name) } : {}) }] : [];
      }
      const id = boundedText(value, 128); return id ? [id] : [];
    }))].slice(0, 12);
  for (const key of ['last_intent', 'last_turn_action'] as const) {
    const value = boundedText(state[key], 40);
    if (value) projected[key] = value;
  }
  if (typeof state.state_version === 'number' && Number.isSafeInteger(state.state_version)) {
    projected.state_version = state.state_version;
  }
  if (isPublicChatbotRecord(state.pending_question)) {
    const pending: Record<string, unknown> = {};
    for (const key of ['type', 'field'] as const) {
      const value = boundedText(state.pending_question[key], 40);
      if (value) pending[key] = value;
    }
    for (const key of ['product_id', 'product_name'] as const) {
      const value = boundedText(state.pending_question[key], 128);
      if (value) pending[key] = value;
    }
    if (Number.isSafeInteger(state.pending_question.quantity) && Number(state.pending_question.quantity) > 0) pending.quantity = state.pending_question.quantity;
    if (Array.isArray(state.pending_question.options)) pending.options = state.pending_question.options.slice(0, 64).flatMap(option => {
      if (!isPublicChatbotRecord(option)) return [];
      const id = boundedText(option.variant_id || option.id, 64);
      return id && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? [{ id, variant_id: id }] : [];
    });
    if (Object.keys(pending).length) projected.pending_question = pending;
  } else if (state.pending_question === null) projected.pending_question = null;
  return projected;
}

/** Unwrap only recognized n8n envelopes; multiple results are not multiple assistant turns. */
export function normalizeChatbotWorkflowResponse(value: unknown, depth = 0): PublicChatbotRecord | null {
  if (depth > 6) return null;
  if (typeof value === 'string') {
    if (value.length > 50000) return null;
    try { return normalizeChatbotWorkflowResponse(JSON.parse(value), depth + 1); } catch { return null; }
  }
  if (Array.isArray(value)) return value.length === 1 ? normalizeChatbotWorkflowResponse(value[0], depth + 1) : null;
  if (!isPublicChatbotRecord(value)) return null;
  if (typeof value.response === 'string' || typeof value.message === 'string'
    || value.response_type === 'file' || typeof value.download_url === 'string') return value;
  for (const key of ['output', 'data', 'body']) {
    if (!(key in value)) continue;
    const inner = normalizeChatbotWorkflowResponse(value[key], depth + 1);
    if (inner) return { ...inner, result_type: inner.result_type ?? value.result_type,
      conversation_state: inner.conversation_state ?? value.conversation_state };
  }
  return typeof value.result_type === 'string' ? value : null;
}

/** Text is conversational, not authoritative catalog data. Metadata alone cannot declare it safe. */
export function requiresChatbotCatalogGrounding(text: string): boolean {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  return /\b(?:price|prices|sale\s*price|stock|in\s*stock|out\s*of\s*stock|inventory|variant|variants|sku|ton\s*kho|het\s*hang|con\s*hang|gia\s*(?:ban|hien\s*tai|chi|tu|la)|giam\s*gia|phien\s*ban|dung\s*luong|mien\s*phi\s*(?:ship|van\s*chuyen))\b/.test(normalized)
    || /(?:\d[\d.,\s]*\s*(?:vnd|vnđ|đ|dong|trieu|tr|nghin|ngan|usd|gb|tb|%)(?!\p{L})|[$€£₫]\s*\d)/iu.test(text)
    || /\b(?:gia|con|chi\s*con|hien\s*co)\s*(?:la\s*)?\d/.test(normalized)
    || /\b(?:iphone|ipad|macbook|galaxy|pixel|redmi|poco)\s*[\w-]*\d/.test(normalized)
    || /\b(?:bao\s*gia|quotation|order|don\s*hang|pdf)\b.{0,60}\b(?:da\s*(?:tao|duyet|phat\s*hanh)|created|approved|ready|download|tai\s*(?:ve|xuong))\b/.test(normalized);
}

/** Customer DTO includes only safe conversational state and catalog IDs, never AI prices/PDF claims. */
export function sanitizeCustomerChatbotResponse(value: unknown, sessionId: string): unknown {
  const normalized = normalizeChatbotWorkflowResponse(value);
  if (!normalized) return { sessionId, result_type: 'error', response: CHATBOT_INVALID_RESPONSE_MESSAGE };
  const publicResponse = sanitizeNormalizedCustomerChatbotResponse(normalized, sessionId) as PublicChatbotRecord;
  if (isChatConversationState(normalized.conversation_state)) {
    publicResponse.conversation_state = projectChatbotConversationState(normalized.conversation_state);
  }
  return publicResponse;
}

function sanitizeNormalizedCustomerChatbotResponse(value: PublicChatbotRecord, sessionId: string): unknown {

  const resultType = typeof value.result_type === 'string' ? value.result_type.trim().toLowerCase() : '';
  const claimsQuotation = resultType === 'quotation'
    || value.response_type === 'file'
    || typeof value.download_url === 'string';
  if (claimsQuotation) {
    const suggestedProducts = Array.isArray(value.products) ? value.products : [];
    const productIds = suggestedProducts
      .filter(isPublicChatbotRecord)
      .map(product => projectPublicScalars(product, CUSTOMER_PRODUCT_SCALAR_FIELDS))
      .filter(product => typeof product.id === 'string' && product.id.length > 0)
      .slice(0, 12);
    if (productIds.length > 0) {
      return {
        sessionId,
        result_type: 'product_search',
        response: CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
        products: productIds,
      };
    }
    return {
      sessionId,
      result_type: 'text',
      response_type: 'text',
      response: CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
    };
  }

  const publicResponse: PublicChatbotRecord = { sessionId };

  if (resultType && !['text', 'faq', 'no_result', 'error', 'clarification', ...PRODUCT_ADVICE_TYPES].includes(resultType)) {
    return { sessionId, result_type: 'error', response: CHATBOT_INVALID_RESPONSE_MESSAGE };
  }

  if (PRODUCT_ADVICE_TYPES.has(resultType) || (Array.isArray(value.products) && value.products.length > 0) || isPublicChatbotRecord(value.product)) {
    const suggestedProducts = [
      ...(Array.isArray(value.products) ? value.products : []),
      ...(isPublicChatbotRecord(value.product) ? [value.product] : []),
    ];
    const productIds = suggestedProducts
      .filter(isPublicChatbotRecord)
      .map(product => projectPublicScalars(product, CUSTOMER_PRODUCT_SCALAR_FIELDS))
      .filter(product => typeof product.id === 'string' && product.id.length > 0)
      .slice(0, 12);

    return {
      sessionId,
      result_type: ['no_result', ...PRODUCT_ADVICE_TYPES].includes(resultType) ? resultType : 'product_search',
      response: groundChatbotProse(typeof value.response === 'string' ? redactWorkflowText(value.response) : '', [], suggestedProducts, resultType)
        || 'Chưa có thông tin catalog được xác minh cho yêu cầu này.',
      products: productIds,
      total: productIds.length,
    };
  }

  const text = typeof value.response === 'string' ? value.response : typeof value.message === 'string' ? value.message : '';
  if (!text.trim()) return { sessionId, result_type: 'error', response: CHATBOT_INVALID_RESPONSE_MESSAGE };
  const structuredClaims = ['price', 'salePrice', 'sale_price', 'stock', 'variantId', 'variant_id', 'totalAmount', 'quote_number', 'quote_status']
    .some(key => value[key] !== undefined && value[key] !== null);
  if (requiresChatbotCatalogGrounding(text) || structuredClaims) {
    return {
      sessionId,
      result_type: 'text',
      response: CHATBOT_UNVERIFIED_TEXT_MESSAGE,
    };
  }

  return { ...publicResponse, result_type: ['text', 'faq', 'no_result', 'error', 'clarification'].includes(resultType) ? resultType : 'text',
    response: redactWorkflowText(text.trim()).slice(0, 12000) };
}

/** All displayed facts come from the same Backend catalog snapshot; n8n supplies intent/prose/ordered ID hints only. */
export async function prepareCustomerChatbotResponse(value: unknown, sessionId: string, database: typeof prisma, requestContext?: {
  message: string;
  priorState?: ChatConversationState | null;
  onCatalogRehydrationAttempt?: () => void;
}): Promise<PublicChatbotRecord> {
  const record = normalizeChatbotWorkflowResponse(value);
  if (record && isQuotationDraftResponse(record)) {
    try {
      const draft = await prepareQuotationDraftResponse(record, sessionId, database, requestContext?.onCatalogRehydrationAttempt);
      draft.conversation_state = projectChatbotConversationState(draft.conversation_state);
      return draft;
    } catch (error) {
      console.warn('[Chatbot Route] Quotation draft catalog unavailable.', safeErrorSummary(error));
      return { sessionId, result_type: 'error', quote_status: 'error', ready_to_quote: false,
        response: 'Danh mục Backend tạm thời không khả dụng. Vui lòng thử lại; yêu cầu báo giá chưa được gửi.', products: [] };
    }
  }
  const base = sanitizeCustomerChatbotResponse(value, sessionId) as PublicChatbotRecord;
  if (!record || base.result_type === 'error' || String(record.result_type).trim().toLowerCase() === 'quotation' || record.response_type === 'file' || typeof record.download_url === 'string') return base;
  const kind = typeof record.result_type === 'string' ? record.result_type.trim().toLowerCase() : 'text';
  const hintedIds = chatbotProductHints(record);
  const hasCatalog = PRODUCT_ADVICE_TYPES.has(kind) || hintedIds.length > 0;
  const rawState = isChatConversationState(record.conversation_state) ? record.conversation_state : {};
  const projectedState = projectChatbotConversationState(rawState);
  const stateIds = [...(Array.isArray(projectedState.last_result_set) ? projectedState.last_result_set : [])
    .flatMap((p: any) => typeof p?.id === 'string' ? [p.id] : []), projectedState.selected_product_id]
    .filter((id): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id));
  const lookupIds = [...new Set([...hintedIds, ...stateIds])].slice(0, 12);
  let verified: Awaited<ReturnType<typeof resolveChatbotCatalogProducts>> = [];
  let available = true;
  if (lookupIds.length) {
    requestContext?.onCatalogRehydrationAttempt?.();
    try { verified = await resolveChatbotCatalogProducts(database, lookupIds); }
    catch (error) { available = false; console.warn('[Chatbot Route] Response grounding unavailable.', safeErrorSummary(error)); }
  }
  const byId = new Map(verified.map(p => [p.id, p]));
  let products = hintedIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const rawProducts = [...(Array.isArray(record.products) ? record.products : []), ...(isPublicChatbotRecord(record.product) ? [record.product] : [])];
  let constraints: ReturnType<typeof parseGroundedConstraints> = null;
  if (PRODUCT_ADVICE_TYPES.has(kind) || kind === 'no_result') {
    try {
      constraints = parseGroundedConstraints(record);
      if (constraints) {
        const requestedBudget = requestContext ? requestedGroundedBudget(requestContext.message) : null;
        if (requestedBudget === 'clarification') return { sessionId, result_type: 'clarification', response: 'Bạn muốn giới hạn giá từ bao nhiêu đến bao nhiêu?', products: [], total: 0, requires_clarification: true };
        if (requestedBudget) constraints.budget = requestedBudget;
        else if (requestContext?.priorState && validatedStateTimestamp(requestContext.priorState.updated_at)
          && /\b(?:may nay|san pham nay|tiep tuc|mau thu|mau so|re hon|dat hon)\b/.test(normalizeGroundedText(requestContext.message))) {
          const priorFilters = requestContext.priorState.active_filters;
          if (isPublicChatbotRecord(priorFilters) && priorFilters.grounded_budget) constraints.budget = parseGroundedBudget(priorFilters.grounded_budget);
        }
        let assignments: Array<{ id: string; categoryId: string | null }> = [], categories: Array<{ id: string; parentId: string | null; isActive: boolean }> = [];
        if (constraints.categoryIds.length && products.length) {
          [assignments, categories] = await Promise.all([
            database.product.findMany({ where: { id: { in: products.map(p => p.id) }, status: 'active' }, select: { id: true, categoryId: true } }),
            database.category.findMany({ select: { id: true, parentId: true, isActive: true } }),
          ]);
        }
        products = filterGroundedCatalogProducts(products, rawProducts, constraints, { assignments, categories });
      }
    } catch (error) {
      if (!(error instanceof GroundedContractError)) console.warn('[Chatbot Route] Constraint verification unavailable.', safeErrorSummary(error));
      return { sessionId, result_type: 'error', response: 'Không xác minh được điều kiện tìm kiếm. Vui lòng thử lại.', products: [], total: 0, catalog_verified: false };
    }
  }
  const rawText = typeof record.response === 'string' ? record.response : typeof record.message === 'string' ? record.message : '';
  const countedText = hasCatalog ? rawText.replace(/\b(\d+)\s+(sản phẩm|mẫu|products|models)\b/giu,
    (match, count, noun) => Number(count) === record.total ? `${products.length} ${noun}` : match) : rawText;
  const factProducts = scopeChatbotFactProducts(products, rawProducts, projectedState.selected_variant_id);
  let response = groundChatbotProse(redactWorkflowText(countedText), factProducts, rawProducts, kind);
  if (constraints) response = verifiedCatalogAdvice(requestContext?.message || '', products) || groundedCatalogResponseText(products);
  if (!response) response = products.length ? 'Bạn có thể xem dữ liệu hiện tại trên các thẻ sản phẩm dưới đây.' : String(base.response);
  if (hasCatalog && (!available || products.length !== hintedIds.length || !hintedIds.length)) {
    response += '\n\n' + (available ? 'Một số gợi ý không còn xác minh được trong danh mục hiện tại. Bạn có thể thử tên sản phẩm khác.' : 'Danh mục Backend tạm thời không khả dụng. Vui lòng thử lại để xem giá và tồn kho hiện tại.');
  }
  const dto: PublicChatbotRecord = { ...base, response, result_type: PRODUCT_ADVICE_TYPES.has(kind) ? kind : base.result_type };
  if (hasCatalog) {
    dto.products = products; dto.total = products.length; dto.catalog_verified = available && hintedIds.length > 0;
    if (kind === 'product_detail') dto.product = products[0] || null;
    if (kind === 'product_compare') { dto.total_found = products.length; dto.ready_to_compare = products.length >= 2 && record.ready_to_compare !== false; }
    if (kind === 'recommendation') dto.total_candidates = products.length;
  }
  for (const key of ['faq_found', 'faq_topic', 'requires_clarification', 'clarification_field', 'total_requested'] as const) {
    const field = record[key];
    if (isPublicChatbotScalar(field) && (typeof field !== 'string' || field.length <= 160)) dto[key] = field;
  }
  if (Array.isArray(record.faq_topics)) dto.faq_topics = record.faq_topics.filter(v => typeof v === 'string' && v.length <= 80).slice(0, 12);
  if (isPublicChatbotRecord(record.filters)) dto.filters = projectChatbotConversationState({ active_filters: record.filters }).active_filters || {};
  if (Array.isArray(record.missing_products)) dto.missing_products = record.missing_products.flatMap(v => {
    const name = typeof v === 'string' ? boundedText(v) : isPublicChatbotRecord(v) ? boundedText(v.name || v.model) : null;
    return name ? [name] : [];
  }).slice(0, 12);
  if (!hasCatalog && kind === 'no_result') dto.total = 0;
  if (!hasCatalog && kind === 'faq' && Number.isSafeInteger(record.total) && Number(record.total) >= 0) dto.total = record.total;
  if (constraints || isChatConversationState(record.conversation_state)) {
    const replaceResults = Boolean(constraints) || ['product_search', 'recommendation'].includes(kind) && hintedIds.length > 0;
    if (constraints) {
      const filters = isPublicChatbotRecord(projectedState.active_filters) ? projectedState.active_filters : {};
      projectedState.active_filters = { ...filters, grounded_budget: constraints.budget };
    }
    dto.conversation_state = constraints && available || available && lookupIds.length
      ? reconcileChatbotCatalogState(projectedState, replaceResults ? products : verified, replaceResults)
      : projectedState;
    if (constraints || rawState.updated_at !== undefined) {
      (dto.conversation_state as ChatConversationState).updated_at = new Date().toISOString();
      (dto.conversation_state as ChatConversationState).state_version = 2;
    }
  }
  return dto;
}

/** No authenticated identity or bearer token is ever sent to the chatbot workflow. */
export function buildCustomerN8nPayload(input: {
  message: string;
  sessionId: string;
  history: ChatContextMessage[];
  conversationState: ChatConversationState | null;
  verifiedCatalog?: Awaited<ReturnType<typeof resolveChatbotCatalogProducts>>;
}) {
  const sanitizedContext = sanitizeChatbotWorkflowContext(input.history, input.conversationState);
  if (sanitizedContext.state && input.verifiedCatalog) sanitizedContext.state = reconcileChatbotCatalogState(sanitizedContext.state, input.verifiedCatalog, false);
  return {
    chatInput: redactWorkflowText(input.message),
    sessionId: input.sessionId,
    conversationId: input.sessionId,
    history: sanitizedContext.history,
    conversationState: sanitizedContext.state,
    source: 'web_chat',
  };
}

function toPrismaConversationState(value: unknown): Prisma.InputJsonObject | null {
  return isChatConversationState(value)
    ? JSON.parse(JSON.stringify(value)) as Prisma.InputJsonObject
    : null;
}

/** Dependency injection permits real HTTP route tests without touching production storage/workflows. */
export function createChatbotRouter(dependencies: { database?: typeof prisma; fetcher?: typeof fetch } = {}) {
const router = express.Router();
const database = dependencies.database || prisma;

router.post('/catalog', async (req, res) => {
  try {
    const products = await resolveChatbotCatalogProducts(database, req.body?.productIds);
    res.setHeader('Cache-Control', 'no-store');
    return res.json({ products });
  } catch (error) {
    if (error instanceof ChatbotCatalogInputError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('[Chatbot Route] Backend catalog lookup failed.', safeErrorSummary(error));
    return res.status(503).json({ message: 'Current product catalog is unavailable.' });
  }
});

// Bootstrap before sending the first user turn. Losing this response cannot duplicate a turn:
// no conversation, message, or n8n execution is created here. A bare old ID is never signed.
router.post('/session', async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const suppliedId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
  if (req.body?.sessionToken !== undefined) {
    if (!suppliedId || suppliedId.length > 100 || !verifyChatSession(suppliedId, req.body.sessionToken)) {
      return res.status(403).json({ code: 'CHAT_SESSION_INVALID', result_type: 'error', response: 'Phiên chat không còn hợp lệ. Hãy bắt đầu cuộc trò chuyện mới.' });
    }
    try {
      const conversation = await database.chatConversation.findUnique({ where: { sessionId: suppliedId }, select: { id: true } });
      const turns = conversation ? await database.chatTurn.findMany({
        where: { conversationId: conversation.id, status: 'COMPLETED', completedVersion: { not: null } },
        orderBy: { completedVersion: 'desc' },
        take: CHAT_HISTORY_TURN_LIMIT + 1,
        select: {
          requestId: true,
          messages: { orderBy: { createdAt: 'asc' }, select: { role: true, content: true, createdAt: true } },
        },
      }) : [];
      const pendingTurn = conversation ? await database.chatTurn.findFirst({
        where: { conversationId: conversation.id, status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { requestId: true, messages: { where: { role: 'user' }, take: 1, select: { content: true } } },
      }) : null;
      const historyTruncated = turns.length > CHAT_HISTORY_TURN_LIMIT;
      const history = turns.slice(0, CHAT_HISTORY_TURN_LIMIT).reverse().flatMap(turn =>
        turn.messages
          .filter(message => message.role === 'user' || message.role === 'assistant')
          .map(message => ({ requestId: turn.requestId, role: message.role, content: message.content, createdAt: message.createdAt.toISOString() })));
      const pending = pendingTurn?.messages[0] ? { requestId: pendingTurn.requestId, text: pendingTurn.messages[0].content } : null;
      return res.json({ sessionId: suppliedId, sessionToken: signChatSession(suppliedId), history, historyTruncated, pendingTurn: pending });
    } catch (error) {
      console.error('[Chatbot Route] Conversation history restore failed.', safeErrorSummary(error));
      return res.status(503).json({ code: 'CHAT_STORAGE_UNAVAILABLE', result_type: 'error', response: 'Không thể tải lịch sử chat lúc này.' });
    }
  }
  const sessionId = crypto.randomUUID();
  return res.json({ sessionId, sessionToken: signChatSession(sessionId), previousSessionPreserved: Boolean(suppliedId) });
});

router.post('/message', async (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  const trimmedMessage = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!trimmedMessage || trimmedMessage.length > 2000) {
    return res.status(400).json({ result_type: 'error', response_type: 'text', success: false,
      response: trimmedMessage ? 'Tin nhắn không được vượt quá 2000 ký tự.' : 'Nội dung tin nhắn không được để trống.' });
  }
  const observation = beginChatbotTurnObservation();
  let observationOutcome: Parameters<typeof observation.finish>[0] = 'unknown_error';
  const finishObservation = (outcome: Parameters<typeof observation.finish>[0]) => {
    observationOutcome = outcome;
    observation.finish(outcome);
  };
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
  const sessionToken = req.body?.sessionToken;
  if (!sessionToken) {
    finishObservation('request_rejected');
    return res.status(409).json({ code: 'CHAT_SESSION_UPGRADE_REQUIRED', result_type: 'error', response_type: 'text', success: false,
      response: 'Vui lòng tải lại trang để cập nhật phiên chat. Lịch sử cũ vẫn được giữ nguyên.' });
  }
  if (!sessionId || sessionId.length > 100 || !verifyChatSession(sessionId, sessionToken)) {
    finishObservation('request_rejected');
    return res.status(403).json({ code: 'CHAT_SESSION_INVALID', result_type: 'error', response_type: 'text', success: false,
      response: 'Phiên chat không còn hợp lệ. Hãy bắt đầu cuộc trò chuyện mới.' });
  }
  const suppliedRequestId = req.body?.requestId;
  if (suppliedRequestId !== undefined && suppliedRequestId !== null &&
      (typeof suppliedRequestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedRequestId))) {
    finishObservation('request_rejected');
    return res.status(400).json({ code: 'CHAT_REQUEST_ID_INVALID', result_type: 'error', response: 'requestId phải là UUID hợp lệ.' });
  }
  // Token-aware clients without requestId get a stable internal key. Successful replies rotate
  // the signed token: retries reuse the old token/key, intentional next turns use the new token.
  const requestId = typeof suppliedRequestId === 'string' ? suppliedRequestId.toLowerCase()
    : `compat-${crypto.createHash('sha256').update(sessionToken).update('\0').update(trimmedMessage).digest('hex')}`;
  const fail = (status: number, code: string, response: string, outcome: Parameters<typeof observation.finish>[0] = 'request_rejected') => {
    finishObservation(outcome);
    return res.status(status).json({ code, result_type: 'error', response_type: 'text', success: false, response, sessionId, requestId });
  };

  const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;
  let n8nHeaders: Record<string, string>;
  try {
    if (!n8nUrl) throw new Error('Webhook URL missing');
    const endpoint = new URL(n8nUrl);
    n8nHeaders = chatbotWebhookHeaders(process.env, endpoint.pathname.endsWith('/webphone-chatbot'));
  } catch {
    return fail(503, 'CHAT_SERVICE_UNAVAILABLE', 'Chat service is temporarily unavailable', 'request_rejected');
  }

  let claim: ChatClaim;
  try {
    claim = await claimChatTurn(sessionId, requestId, trimmedMessage, database);
  } catch (error) {
    console.error('[Chatbot Route] Conversation claim failed.', safeErrorSummary(error));
    return fail(503, 'CHAT_STORAGE_UNAVAILABLE', 'Không thể lưu lượt chat lúc này. Vui lòng thử lại.', 'storage_error');
  }
  if (claim.kind === 'busy') {
    res.setHeader('Retry-After', '5');
    return fail(409, 'CHAT_SESSION_BUSY', 'Chatbot đang xử lý tin nhắn trước. Vui lòng thử lại sau.', 'busy');
  }
  if (claim.kind === 'conflict') return fail(409, 'CHAT_REQUEST_ID_CONFLICT', 'Mã lượt chat đã được dùng cho nội dung khác.', 'request_rejected');
  if (claim.kind === 'completed') {
    finishObservation('replay');
    return res.json({ ...claim.response, sessionId, requestId: claim.requestId, sessionToken: signChatSession(sessionId) });
  }

  const { lease, snapshot } = claim;
  if (claim.reclaimedExpiredLease) observation.markReclaimedExpiredLease();
  const controller = new AbortController();
  let abortReason: 'deadline' | 'client_disconnected' | undefined;
  let upstreamOutcomeKnown = false;
  const abortUpstream = (reason: 'deadline' | 'client_disconnected') => {
    if (controller.signal.aborted) return;
    abortReason = reason;
    controller.abort();
  };
  const onDisconnect = () => {
    // Once the entire n8n body was received, persist the guarded result even if this client
    // disappeared. A retry of the same requestId can then replay it without another n8n call.
    if (!upstreamOutcomeKnown && !res.writableEnded) abortUpstream('client_disconnected');
  };
  res.once('close', onDisconnect);
  if (req.aborted || res.destroyed) abortUpstream('client_disconnected');
  // This deadline intentionally starts at n8n dispatch, rather than charging bounded local
  // catalog preparation against the upstream's full response budget.
  let deadlineAt: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let completed = false;
  let releaseNow = true;
  const clearN8nDeadline = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = undefined;
  };
  const checkN8nDeadline = () => {
    if (abortReason === 'client_disconnected') throw new ChatbotTurnFailure(499, 'CHAT_CLIENT_DISCONNECTED', 'Client disconnected.');
    if (abortReason === 'deadline' || (deadlineAt !== undefined && performance.now() >= deadlineAt)) {
      abortUpstream('deadline');
      throw new ChatbotTurnFailure(504, 'CHAT_REQUEST_TIMEOUT', 'Chat service timed out. Please try again later.');
    }
  };
  try {
    const previousIds = chatbotProductHints({ products: snapshot.state?.last_result_set });
    let verifiedContext: Awaited<ReturnType<typeof resolveChatbotCatalogProducts>> | undefined;
    if (previousIds.length) {
      observation.markCatalogRehydrationAttempt();
      try { verifiedContext = await resolveChatbotCatalogProducts(database, previousIds); }
      catch { /* Preserve existing identity hints without forwarding unverified prices. */ }
    }
    const n8nPayload = buildCustomerN8nPayload({ message: trimmedMessage, sessionId,
      history: snapshot.history, conversationState: snapshot.state, verifiedCatalog: verifiedContext });
    checkN8nDeadline();
    if (!await renewChatLeaseBeforeDispatch(lease, database)) {
      throw new ChatbotTurnFailure(409, 'CHAT_SESSION_STALE', 'Lượt chat đã hết hạn. Vui lòng gửi lại tin nhắn.');
    }
    // Abort only cancels our HTTP client. Keep the lease until expiry when upstream completion
    // is unknown, instead of immediately allowing another request into the same n8n session.
    // The conditional renewal above gives this dispatch a full lease window after local work.
    releaseNow = false;
    deadlineAt = performance.now() + CHATBOT_UPSTREAM_TIMEOUT_MS;
    timeoutId = setTimeout(() => abortUpstream('deadline'), CHATBOT_UPSTREAM_TIMEOUT_MS);
    let n8nResponse: Response;
    try {
      observation.markN8nDispatch();
      n8nResponse = await (dependencies.fetcher || fetch)(n8nUrl, {
        method: 'POST', headers: n8nHeaders, body: JSON.stringify(n8nPayload), signal: controller.signal
      });
    } catch (error) {
      checkN8nDeadline();
      console.error('[Chatbot Route] Network error calling n8n:', safeFetchErrorSummary(error));
      throw new ChatbotTurnFailure(502, 'CHAT_UPSTREAM_UNAVAILABLE', 'Failed to communicate with chat service.');
    }
    if (!n8nResponse.ok) {
      console.error('[Chatbot Route] n8n returned status', n8nResponse.status);
      await n8nResponse.body?.cancel();
      throw new ChatbotTurnFailure(502, 'CHAT_UPSTREAM_ERROR', 'Chat service encountered an error.');
    }
    const contentType = n8nResponse.headers.get('content-type') || '';
    let publicResponse: PublicChatbotRecord;
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream') || contentType.includes('application/vnd.')) {
      const reader = n8nResponse.body?.getReader();
      if (reader) {
        try { while (!(await reader.read()).done) checkN8nDeadline(); }
        finally { reader.releaseLock(); }
      }
      upstreamOutcomeKnown = true;
      clearN8nDeadline();
      observation.markN8nResponseComplete();
      releaseNow = true;
      publicResponse = { result_type: 'quotation', response_type: 'text', success: false,
        quote_status: 'NOT_ACTIVATED', response: CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE };
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else {
      const responseText = await n8nResponse.text(); // Deadline remains active through the body.
      checkN8nDeadline();
      upstreamOutcomeKnown = true;
      clearN8nDeadline();
      observation.markN8nResponseComplete();
      releaseNow = true;
      let responseData: unknown;
      try { responseData = JSON.parse(responseText); }
      catch {
        throw new ChatbotTurnFailure(502, 'CHAT_UPSTREAM_INVALID_RESPONSE', 'Received invalid data from chat service.');
      }
      publicResponse = await prepareCustomerChatbotResponse(responseData, sessionId, database,
        { message: trimmedMessage, priorState: n8nPayload.conversationState,
          onCatalogRehydrationAttempt: () => observation.markCatalogRehydrationAttempt() });
    }
    const assistantContent = typeof publicResponse.response === 'string' ? publicResponse.response
      : typeof publicResponse.message === 'string' ? publicResponse.message : '';
    const replayResponse = { ...publicResponse, sessionId, requestId: claim.requestId };
    completed = await completeChatTurn(lease, assistantContent, toPrismaConversationState(publicResponse.conversation_state), replayResponse, database);
    if (!completed) return fail(409, 'CHAT_SESSION_STALE', 'Lượt chat đã hết hạn. Vui lòng thử lại.', 'stale_completion');
    finishObservation('success');
    return res.json({ ...replayResponse, sessionToken: signChatSession(sessionId) });
  } catch (error) {
    if (abortReason === 'client_disconnected' || res.destroyed || req.aborted) {
      finishObservation('client_disconnected');
      return;
    }
    if (abortReason === 'deadline' || (deadlineAt !== undefined && performance.now() >= deadlineAt)) return fail(504, 'CHAT_REQUEST_TIMEOUT', 'Chat service timed out. Please try again later.', 'timeout');
    if (error instanceof ChatbotTurnFailure) {
      const outcome = error.code === 'CHAT_UPSTREAM_INVALID_RESPONSE' ? 'upstream_invalid_response'
        : error.code === 'CHAT_UPSTREAM_ERROR' ? 'upstream_http_error'
        : error.code === 'CHAT_UPSTREAM_UNAVAILABLE' ? 'upstream_network_error'
        : error.code === 'CHAT_SESSION_STALE' ? 'stale_completion'
        : 'unknown_error';
      return fail(error.status, error.code, error.publicMessage, outcome);
    }
    if (!releaseNow) {
      console.error('[Chatbot Route] Upstream response could not be read.', safeFetchErrorSummary(error));
      return fail(502, 'CHAT_UPSTREAM_UNAVAILABLE', 'Failed to communicate with chat service.', 'upstream_network_error');
    }
    console.error('[Chatbot Route] Turn could not be committed.', safeErrorSummary(error));
    return fail(503, 'CHAT_STORAGE_UNAVAILABLE', 'Không thể hoàn tất lượt chat lúc này. Vui lòng thử lại.', 'storage_error');
  } finally {
    clearN8nDeadline();
    res.off('close', onDisconnect);
    if (!completed) {
      if (!releaseNow) observation.markLeaseRetainedForExpiryRecovery();
      try { await abandonChatTurn(lease, database, releaseNow); }
      catch (error) { console.error('[Chatbot Route] Lease cleanup failed; expiry will recover it.', safeErrorSummary(error)); }
    }
    observation.finish(observationOutcome);
  }
});

// Block the legacy n8n upload and unauthenticated filename-based download endpoints.
router.use('/quotation-files', (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'POST' && req.path === '/') {
    return res.status(410).json({
      result_type: 'error',
      response_type: 'text',
      success: false,
      response: 'Legacy quotation PDF upload is disabled. Create the PDF from a backend Quotation snapshot.',
    });
  }
  return res.status(404).json({ message: 'Quotation PDF not found.' });
});

// Legacy file handlers were removed; the guard above returns 410/404 without touching storage.

return router;
}

export default createChatbotRouter();
