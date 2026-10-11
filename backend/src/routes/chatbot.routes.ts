import express from 'express';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { ChatbotCatalogInputError, resolveChatbotCatalogProducts } from '../services/chatbot-catalog.service';
import { safeErrorSummary } from '../utils/safe-error-summary';

const router = express.Router();

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

const CHATBOT_PRODUCT_SEARCH_MESSAGE =
  'Danh sách dưới đây được xác minh từ danh mục WebPhone. Giá và tình trạng hiện tại do Backend cung cấp; vui lòng mở chi tiết sản phẩm để kiểm tra trước khi mua.';
const CHATBOT_UNVERIFIED_TEXT_MESSAGE =
  'Tôi chưa thể xác minh thông tin sản phẩm hoặc giá trong câu trả lời này. Hãy chọn một sản phẩm trong danh mục WebPhone để xem dữ liệu hiện tại do Backend cung cấp.';
const PRODUCT_ADVICE_TYPES = new Set(['product_search', 'product_detail', 'product_compare', 'recommendation']);
const WORKFLOW_SECRET_KEY = /(?:jwt|bearer|token|password|passwd|credential|authorization|\botp\b|private.*pdf|pdf.*url|download.*url)/i;
const PRIVATE_QUOTATION_FILE_URL = /(?:https?:\/\/[^\s"'<>]+|\/)[^\s"'<>]*(?:\/api\/(?:staff\/|admin\/)?quotations\/[^/\s"'<>]+\/pdf|\/uploads\/quotations\/)[^\s"'<>]*/gi;

const CUSTOMER_RESPONSE_SCALAR_FIELDS = ['response', 'message', 'result_type', 'response_type'] as const;
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
  if (Object.keys(filters).length) projected.active_filters = filters;

  for (const key of ['preferred_brands', 'excluded_brands'] as const) {
    const values = Array.isArray(state[key])
      ? (state[key] as unknown[]).map(value => boundedText(value, 80)).filter((value): value is string => Boolean(value)).slice(0, 10)
      : [];
    if (values.length) projected[key] = values;
  }

  const lastResults = Array.isArray(state.last_result_set) ? state.last_result_set : [];
  projected.last_result_set = lastResults.slice(0, 12).flatMap(value => {
    if (!isPublicChatbotRecord(value)) return [];
    const id = boundedText(value.id, 128);
    if (!id) return [];
    const item: Record<string, string> = { id };
    for (const key of ['name', 'brand', 'model', 'category'] as const) {
      const text = boundedText(value[key]);
      if (text) item[key] = text;
    }
    return [item];
  });

  const selectedProductId = boundedText(state.selected_product_id, 128);
  if (selectedProductId) projected.selected_product_id = selectedProductId;
  for (const key of ['last_intent', 'last_turn_action'] as const) {
    const value = boundedText(state[key], 40);
    if (value) projected[key] = value;
  }
  if (typeof state.state_version === 'number' && Number.isSafeInteger(state.state_version)) {
    projected.state_version = state.state_version;
  }
  if (isPublicChatbotRecord(state.pending_question)) {
    const pending: Record<string, string> = {};
    for (const key of ['type', 'field'] as const) {
      const value = boundedText(state.pending_question[key], 40);
      if (value) pending[key] = value;
    }
    if (Object.keys(pending).length) projected.pending_question = pending;
  }
  return projected;
}

/** Build the customer-facing payload without forwarding n8n's internal state. */
export function sanitizeCustomerChatbotResponse(value: unknown, sessionId: string): unknown {
  if (Array.isArray(value)) {
    return value
      .filter(isPublicChatbotRecord)
      .map((item) => sanitizeCustomerChatbotResponse(item, sessionId));
  }

  if (!isPublicChatbotRecord(value)) return value;

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

  if (PRODUCT_ADVICE_TYPES.has(resultType)) {
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
      result_type: 'product_search',
      response: CHATBOT_PRODUCT_SEARCH_MESSAGE,
      products: productIds,
    };
  }

  if (resultType === 'text') {
    return {
      sessionId,
      result_type: 'text',
      response: CHATBOT_UNVERIFIED_TEXT_MESSAGE,
    };
  }

  for (const field of CUSTOMER_RESPONSE_SCALAR_FIELDS) {
    const fieldValue = value[field];
    if (isPublicChatbotScalar(fieldValue)) publicResponse[field] = fieldValue;
  }

  return publicResponse;
}

/** No authenticated identity or bearer token is ever sent to the chatbot workflow. */
export function buildCustomerN8nPayload(input: {
  message: string;
  sessionId: string;
  history: ChatContextMessage[];
  conversationState: ChatConversationState | null;
}) {
  const sanitizedContext = sanitizeChatbotWorkflowContext(input.history, input.conversationState);
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

async function saveUserMessageAndLoadHistory(sessionId: string, content: string): Promise<ChatContextSnapshot> {
  try {
    return await prisma.$transaction(async (tx) => {
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

async function saveAssistantMessage(sessionId: string, content: string, state?: unknown) {
  const trimmedContent = content.trim();
  const nextState = toPrismaConversationState(state);
  if (!trimmedContent && !nextState) return;

  try {
    const conversation = await prisma.chatConversation.upsert({
      where: { sessionId },
      create: nextState ? { sessionId, context: nextState } : { sessionId },
      update: nextState ? { context: nextState } : {}
    });

    if (nextState && !trimmedContent) return;

    await prisma.chatMessage.create({
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

router.post('/catalog', async (req, res) => {
  try {
    const products = await resolveChatbotCatalogProducts(prisma, req.body?.productIds);
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

    // 3. Load bounded, session-scoped context and record the current user turn.
    const contextSnapshot = await saveUserMessageAndLoadHistory(sessionId, trimmedMessage);
    const history = contextSnapshot.history;

    // 4. Ensure Environment Variable
    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error('[Chatbot Route] N8N_CHAT_WEBHOOK_URL is not configured.');
      return res.status(503).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service is temporarily unavailable', sessionId });
    }

    // 5. Prepare n8n Request
    const n8nPayload = buildCustomerN8nPayload({
      message: trimmedMessage,
      sessionId,
      history,
      conversationState: contextSnapshot.state,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

    let n8nResponse;
    try {
      n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Chatbot Route] n8n request timed out.');
        return res.status(504).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service timed out. Please try again later.', sessionId });
      }
      console.error('[Chatbot Route] Network error calling n8n:', fetchError.message);
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
      await saveAssistantMessage(sessionId, CHATBOT_QUOTATION_NOT_ACTIVATED_MESSAGE);
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

    // Normalize if array with 1 item
    if (Array.isArray(responseData) && responseData.length === 1) {
      responseData = responseData[0];
    }

    // Fallback if somehow it's still an array or weird object without sessionId
    if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
      if (!responseData.sessionId) {
        responseData.sessionId = sessionId;
      }
    } else if (Array.isArray(responseData)) {
       // if it's an array of multiple items, add a header for session id just in case.
       res.setHeader('X-Chat-Session-Id', sessionId);
    }

    const publicResponse = sanitizeCustomerChatbotResponse(responseData, sessionId);
    const assistantContent = isPublicChatbotRecord(publicResponse)
      ? typeof publicResponse.response === 'string'
        ? publicResponse.response
        : typeof publicResponse.message === 'string'
          ? publicResponse.message
          : ''
      : '';
    await saveAssistantMessage(sessionId, assistantContent, responseData?.conversation_state);
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

export default router;
