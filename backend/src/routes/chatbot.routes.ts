import express from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ChatbotCatalogInputError, resolveChatbotCatalogProducts } from '../services/chatbot-catalog.service';
import { safeErrorSummary, safeFetchErrorSummary } from '../utils/safe-error-summary';
import { chatbotProductHints, groundChatbotProse, reconcileChatbotCatalogState, scopeChatbotFactProducts } from '../services/chatbot-response-grounding';
import { isQuotationDraftResponse, prepareQuotationDraftResponse } from '../services/chatbot-quotation-draft.service';
import { chatbotWebhookHeaders } from '../services/chatbot-webhook-auth';

const CHAT_CONTEXT_MESSAGE_LIMIT = 6;
const CHAT_CONTEXT_MESSAGE_CHAR_LIMIT = 600;

type ChatContextMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatConversationState = Record<string, unknown>;

type ChatContextSnapshot = {
  history: ChatContextMessage[];
  state: ChatConversationState | null;
};

function isChatConversationState(value: unknown): value is ChatConversationState {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

type PublicChatbotRecord = Record<string, unknown>;

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
  const projected: ChatConversationState = {};
  const category = boundedText(state.category, 40);
  if (category) projected.category = category;
  else if (state.category === null) projected.category = null;

  const sourceFilters = isPublicChatbotRecord(state.active_filters) ? state.active_filters : {};
  const filters: Record<string, unknown> = {};
  for (const key of ['brand', 'model', 'color', 'use_case', 'condition_type'] as const) {
    const value = boundedText(sourceFilters[key]);
    if (value) filters[key] = value;
  }
  for (const key of ['storage_gb', 'ram_gb', 'price_max'] as const) {
    const value = sourceFilters[key];
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) filters[key] = value;
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

  if (resultType && !['text', 'faq', 'no_result', 'error', ...PRODUCT_ADVICE_TYPES].includes(resultType)) {
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

  return { ...publicResponse, result_type: ['text', 'faq', 'no_result', 'error'].includes(resultType) ? resultType : 'text',
    response: redactWorkflowText(text.trim()).slice(0, 12000) };
}

/** All displayed facts come from the same Backend catalog snapshot; n8n supplies intent/prose/ordered ID hints only. */
export async function prepareCustomerChatbotResponse(value: unknown, sessionId: string, database: typeof prisma): Promise<PublicChatbotRecord> {
  const record = normalizeChatbotWorkflowResponse(value);
  if (record && isQuotationDraftResponse(record)) {
    try {
      const draft = await prepareQuotationDraftResponse(record, sessionId, database);
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
    try { verified = await resolveChatbotCatalogProducts(database, lookupIds); }
    catch (error) { available = false; console.warn('[Chatbot Route] Response grounding unavailable.', safeErrorSummary(error)); }
  }
  const byId = new Map(verified.map(p => [p.id, p]));
  const products = hintedIds.flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
  const rawProducts = [...(Array.isArray(record.products) ? record.products : []), ...(isPublicChatbotRecord(record.product) ? [record.product] : [])];
  const rawText = typeof record.response === 'string' ? record.response : typeof record.message === 'string' ? record.message : '';
  const countedText = hasCatalog ? rawText.replace(/\b(\d+)\s+(sản phẩm|mẫu|products|models)\b/giu,
    (match, count, noun) => Number(count) === record.total ? `${products.length} ${noun}` : match) : rawText;
  const factProducts = scopeChatbotFactProducts(products, rawProducts, projectedState.selected_variant_id);
  let response = groundChatbotProse(redactWorkflowText(countedText), factProducts, rawProducts, kind);
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
  if (isChatConversationState(record.conversation_state)) {
    const replaceResults = ['product_search', 'recommendation'].includes(kind) && hintedIds.length > 0;
    dto.conversation_state = available && lookupIds.length
      ? reconcileChatbotCatalogState(projectedState, replaceResults ? products : verified, replaceResults)
      : projectedState;
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

async function saveUserMessageAndLoadHistory(sessionId: string, content: string, database = prisma): Promise<ChatContextSnapshot> {
  try {
    return await database.$transaction(async (tx) => {
      const conversation = await tx.chatConversation.upsert({
        where: { sessionId },
        create: { sessionId },
        update: {}
      });

      const previousMessages = await tx.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: CHAT_CONTEXT_MESSAGE_LIMIT,
        select: { role: true, content: true }
      });

      await tx.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content
        }
      });

      return {
        history: previousMessages
          .reverse()
          .filter((message): message is ChatContextMessage => message.role === 'user' || message.role === 'assistant')
          .map((message) => ({ role: message.role, content: message.content })),
        state: isChatConversationState(conversation.context) ? conversation.context : null
      };
    });
  } catch (error) {
    // Chat should remain usable if the optional history store is unavailable.
    console.warn('[Chatbot Route] Conversation context unavailable; continuing stateless.');
    return { history: [], state: null };
  }
}

async function saveAssistantMessage(sessionId: string, content: string, state?: unknown, database = prisma) {
  const trimmedContent = content.trim();
  const nextState = toPrismaConversationState(state);
  if (!trimmedContent && !nextState) return;

  try {
    const conversation = await database.chatConversation.upsert({
      where: { sessionId },
      create: nextState ? { sessionId, context: nextState } : { sessionId },
      update: nextState ? { context: nextState } : {}
    });

    if (nextState && !trimmedContent) return;

    await database.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: trimmedContent
      }
    });
  } catch (error) {
    console.warn('[Chatbot Route] Assistant message could not be stored.');
  }
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

router.post('/message', async (req, res) => {
  try {
    // 1. Validate 'message'
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Nội dung tin nhắn không được để trống.' });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Nội dung tin nhắn không được để trống.' });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Tin nhắn không được vượt quá 2000 ký tự.' });
    }

    // 2. Validate or generate 'sessionId'
    let sessionId = req.body.sessionId;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0 || sessionId.length > 100) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = sessionId.trim();
    }

    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;
    let n8nHeaders: Record<string, string>;
    try {
      if (!n8nUrl) throw new Error('Webhook URL missing');
      const endpoint = new URL(n8nUrl);
      n8nHeaders = chatbotWebhookHeaders(process.env, endpoint.pathname.endsWith('/webphone-chatbot'));
    } catch {
      return res.status(503).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service is temporarily unavailable', sessionId });
    }

    // 3. Load bounded, session-scoped context and record the current user turn.
    const contextSnapshot = await saveUserMessageAndLoadHistory(sessionId, trimmedMessage, database);
    const history = contextSnapshot.history;

    // 4. Ensure Environment Variable
    if (!n8nUrl) {
      console.error('[Chatbot Route] N8N_CHAT_WEBHOOK_URL is not configured.');
      return res.status(503).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service is temporarily unavailable', sessionId });
    }

    // 5. Prepare n8n Request
    const previousIds = chatbotProductHints({ products: contextSnapshot.state?.last_result_set });
    let verifiedContext: Awaited<ReturnType<typeof resolveChatbotCatalogProducts>> | undefined;
    if (previousIds.length) {
      try { verifiedContext = await resolveChatbotCatalogProducts(database, previousIds); }
      catch { /* Keep bounded identity/position hints; do not forward unverified prices. */ }
    }
    const n8nPayload = buildCustomerN8nPayload({
      message: trimmedMessage,
      sessionId,
      history,
      conversationState: contextSnapshot.state,
      verifiedCatalog: verifiedContext,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

    let n8nResponse;
    try {
      n8nResponse = await (dependencies.fetcher || fetch)(n8nUrl, {
        method: 'POST',
        headers: n8nHeaders,
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Chatbot Route] n8n request timed out.');
        return res.status(504).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service timed out. Please try again later.', sessionId });
      }
      console.error('[Chatbot Route] Network error calling n8n:', safeFetchErrorSummary(fetchError));
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Failed to communicate with chat service.', sessionId });
    }

    clearTimeout(timeoutId);

    // 6. Handle non-2xx Response
    if (!n8nResponse.ok) {
      console.error(`[Chatbot Route] n8n returned status ${n8nResponse.status} ${n8nResponse.statusText}`);
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service encountered an error.', sessionId });
    }

    // 7. Check Content-Type for Binary/PDF
    const contentType = n8nResponse.headers.get('content-type') || '';

    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream') || contentType.includes('application/vnd.')) {
      await saveAssistantMessage(sessionId, CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE, undefined, database);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).json({
        sessionId,
        result_type: 'quotation',
        response_type: 'text',
        success: false,
        quote_status: 'NOT_ACTIVATED',
        response: CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE,
      });
    }

    // 8. Handle JSON Response
    let responseData;
    try {
      responseData = await n8nResponse.json();
    } catch (parseError) {
      console.error('[Chatbot Route] Failed to parse n8n JSON response:', parseError);
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Received invalid data from chat service.', sessionId });
    }

    const publicResponse = await prepareCustomerChatbotResponse(responseData, sessionId, database);
    const assistantContent = isPublicChatbotRecord(publicResponse)
      ? typeof publicResponse.response === 'string'
        ? publicResponse.response
        : typeof publicResponse.message === 'string'
          ? publicResponse.message
          : ''
      : '';
    await saveAssistantMessage(sessionId, assistantContent, isPublicChatbotRecord(publicResponse) ? publicResponse.conversation_state : undefined, database);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.status(200).json(publicResponse);

  } catch (err: any) {
    console.error('[Chatbot Route] Unexpected error:', err.message);
    return res.status(500).json({ result_type: 'error', response_type: 'text', success: false, response: 'Internal server error' });
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
