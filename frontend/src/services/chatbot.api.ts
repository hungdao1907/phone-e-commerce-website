import type { ChatbotProduct } from '../components/chatbot/types';
import { dedupeChatbotProducts } from '../components/chatbot/catalog-products';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:3001';

export async function sendChatMessage(message: string, sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/api/chatbot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
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
