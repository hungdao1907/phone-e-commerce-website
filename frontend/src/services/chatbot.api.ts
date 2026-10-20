import type { ChatbotProduct } from '../components/chatbot/types';
import { dedupeChatbotProducts } from '../components/chatbot/catalog-products';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

export class ChatbotMessageError extends Error {
  constructor(public readonly status: number, public readonly code?: string,
    public readonly sessionId?: string, public readonly sessionToken?: string) {
    super(code === 'CHAT_SESSION_BUSY' ? 'Chatbot đang xử lý tin nhắn trước. Vui lòng thử lại sau.'
      : code === 'CHAT_SESSION_STALE' ? 'Lượt xử lý đã hết hạn. Hãy thử lại tin nhắn đang chờ.'
      : code === 'CHAT_SESSION_UPGRADE_REQUIRED' ? 'Phiên chat cần cập nhật. Hãy thử lại; lịch sử cũ vẫn được giữ nguyên.'
      : code === 'CHAT_SESSION_INVALID' ? 'Phiên chat không còn hợp lệ. Hãy bắt đầu cuộc trò chuyện mới để tiếp tục.'
      : code === 'CHAT_REQUEST_ID_CONFLICT' ? 'Mã lượt chat đã được dùng cho nội dung khác. Tin nhắn đang chờ vẫn được giữ lại.'
      : code === 'CHAT_SESSION_LEGACY_RECOVERY_REQUIRED' ? 'Chưa xác định được kết quả lượt chat ở phiên cũ. Hãy bắt đầu cuộc trò chuyện mới nếu bạn muốn gửi lại.'
      : 'Không thể gửi tin nhắn. Vui lòng thử lại.');
  }
}

export type ChatbotSession = { sessionId: string; sessionToken?: string };
export type ChatSessionHistoryEntry = {
  requestId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};
export type ChatSessionBootstrap = ChatbotSession & {
  history: ChatSessionHistoryEntry[];
  historyTruncated: boolean;
  pendingTurn: { requestId: string; text: string } | null;
  previousSessionPreserved?: boolean;
};
let sessionBootstrapSupported: boolean | undefined;

export function requireChatSessionUpgrade() {
  sessionBootstrapSupported = undefined;
}

/** One bootstrap per secure conversation; persists ownership before the first user POST.
 * A 404/405 supports a frontend-first rollout against the previous backend. No automatic
 * retry of /message occurs, and no new security guarantee is asserted for that old backend.
 */
export async function bootstrapChatSession(sessionId: string, sessionToken?: string): Promise<ChatSessionBootstrap | null> {
  if (sessionBootstrapSupported === false) return null;
  const response = await fetch(`${API_BASE_URL}/api/chatbot/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ...(sessionToken ? { sessionToken } : {}) }),
  });
  if (response.status === 404 || response.status === 405) {
    sessionBootstrapSupported = false;
    return null;
  }
  if (!response.ok) throw new ChatbotMessageError(response.status, 'CHAT_SESSION_BOOTSTRAP_FAILED');
  const body = await response.json();
  if (typeof body?.sessionId !== 'string' || !body.sessionId || body.sessionId.length > 100 ||
      typeof body.sessionToken !== 'string' || !body.sessionToken || body.sessionToken.length > 512) {
    throw new ChatbotMessageError(502, 'CHAT_SESSION_BOOTSTRAP_FAILED');
  }
  sessionBootstrapSupported = true;
  const history = Array.isArray(body.history) ? body.history.filter((entry: unknown): entry is ChatSessionHistoryEntry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return false;
    const item = entry as Record<string, unknown>;
    return typeof item.requestId === 'string' && item.requestId.length <= 128
      && (item.role === 'user' || item.role === 'assistant')
      && typeof item.content === 'string' && item.content.length <= 12000
      && typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt));
  }) : [];
  const pending = body.pendingTurn && typeof body.pendingTurn === 'object' && !Array.isArray(body.pendingTurn)
    ? body.pendingTurn as Record<string, unknown> : null;
  const pendingTurn = pending && typeof pending.requestId === 'string' && pending.requestId.length <= 128
    && typeof pending.text === 'string' && pending.text.trim().length > 0 && pending.text.length <= 2000
    ? { requestId: pending.requestId, text: pending.text } : null;
  return { sessionId: body.sessionId, sessionToken: body.sessionToken, history,
    historyTruncated: body.historyTruncated === true, pendingTurn, previousSessionPreserved: body.previousSessionPreserved === true };
}

export async function sendChatMessage(message: string, sessionId: string, sessionToken?: string, requestId: string = crypto.randomUUID()) {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, sessionToken, requestId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (body.code === 'CHAT_SESSION_UPGRADE_REQUIRED') requireChatSessionUpgrade();
    throw new ChatbotMessageError(response.status, body.code, body.sessionId, body.sessionToken);
  }

  const body = await response.json();
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      (typeof body.response !== 'string' && typeof body.message !== 'string')) {
    throw new ChatbotMessageError(502, 'CHAT_RESPONSE_INVALID');
  }
  return body;
}

/** Only opaque product IDs cross from n8n; Backend rehydrates all catalog data. */
export function extractSuggestedProductIds(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  const products = Array.isArray(record.products) ? record.products : record.product ? [record.product] : [];
  if (!Array.isArray(products)) return [];

  return [...new Set(products
    .filter((product): product is Record<string, unknown> => Boolean(product && typeof product === 'object' && !Array.isArray(product)))
    .map(product => product.id)
    .filter((id): id is string => typeof id === 'string' && id.trim().length > 0 && id.length <= 128)
    .map(id => id.trim()))].slice(0, 12);
}

/** Only the Backend can set this marker after catalog rehydration; never consume raw workflow prices. */
export function readVerifiedChatbotProducts(value: any): ChatbotProduct[] | null {
  if (value?.catalog_verified !== true || !Array.isArray(value.products)) return null;
  if (value.products.some((p: any) => typeof p?.id !== 'string' || typeof p?.name !== 'string' || !Array.isArray(p.variants)
    || !Number.isSafeInteger(p.stock) || p.stock < 0 || (p.price !== undefined && (!Number.isSafeInteger(p.price) || p.price < 0))
    || p.variants.some((v: any) => typeof v?.id !== 'string' || !Number.isSafeInteger(v.stock) || v.stock < 0
      || (v.price !== null && (!Number.isSafeInteger(v.price) || v.price < 0))))) return null;
  return dedupeChatbotProducts(value.products);
}

export async function resolveChatbotProductResponse(response: any, loader = fetchChatbotCatalogProducts) {
  const cached = readVerifiedChatbotProducts(response);
  const ids = extractSuggestedProductIds(response);
  try {
    const products = cached ?? dedupeChatbotProducts(await loader(ids));
    if (ids.length && !products.length) return { text: 'Không xác minh được các sản phẩm gợi ý trong danh mục hiện tại. Vui lòng tìm lại sản phẩm.', products: [], isError: true };
    return { text: typeof response.response === 'string' ? response.response : '', products,
      isError: response.catalog_verified === false };
  } catch {
    return { text: 'Danh mục Backend tạm thời không khả dụng. Vui lòng thử lại.', products: [], isError: true };
  }
}

/** Resolve chatbot suggestions through the public, Backend-owned active catalog. */
export async function fetchChatbotCatalogProducts(productIds: string[]): Promise<ChatbotProduct[]> {
  const safeIds = [...new Set(productIds.filter(id => typeof id === 'string' && id.length > 0))].slice(0, 12);
  if (safeIds.length === 0) return [];

  const response = await fetch(`${API_BASE_URL}/api/chatbot/catalog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIds: safeIds }),
  });
  if (!response.ok) throw new Error('Backend product catalog could not be verified');
  const payload = await response.json();
  return Array.isArray(payload?.products) ? payload.products as ChatbotProduct[] : [];
}

/** Search by product name, then rehydrate every card from the Backend-owned catalog. */
export async function searchChatbotCatalogProducts(productName: string): Promise<ChatbotProduct[]> {
  const name = productName.trim();
  if (!name || name.length > 120) return [];

  const query = new URLSearchParams({ search: name, page: '1', limit: '12' });
  const response = await fetch(`${API_BASE_URL}/api/products/search?${query.toString()}`);
  if (!response.ok) throw new Error('Backend catalog search failed');
  const payload = await response.json();
  if (!Array.isArray(payload?.data)) throw new Error('Backend catalog search returned an invalid response');

  const ids: string[] = [];
  for (const candidate of payload.data as unknown[]) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue;
    const id = (candidate as Record<string, unknown>).id;
    if (typeof id === 'string' && id.trim().length > 0 && id.length <= 128) ids.push(id.trim());
  }
  return fetchChatbotCatalogProducts([...new Set(ids)].slice(0, 12));
}

export function resolveBackendUrl(path?: string) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
