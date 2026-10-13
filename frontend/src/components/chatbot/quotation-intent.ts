import type { ChatbotProduct } from './types';
import { extractSuggestedProductIds, fetchChatbotCatalogProducts, searchChatbotCatalogProducts } from '../../services/chatbot.api';
import { dedupeChatbotProducts } from './catalog-products';

export type QuotationIntent = {
  isQuotationIntent: boolean;
  productQuery: string | null;
  refersToCurrentProduct: boolean;
};

export type QuotationCatalogResult = {
  text: string;
  products: ChatbotProduct[];
  isError?: boolean;
};

function normalizeVietnamese(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/gi, 'd').toLocaleLowerCase('vi-VN');
}

const FAQ_TERMS = /\b(chinh sach|quy trinh|hieu luc|bao lau|dieu kien|ap dung|la gi|nhu the nao)\b/;
const PRODUCT_REFERENCE = /\b(san pham nay|dien thoai nay|may nay|mat hang nay|mau nay)\b/;

export function parseQuotationIntent(message: string): QuotationIntent {
  const normalized = normalizeVietnamese(message).replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const isQuotationIntent = /\bbao gia\b/.test(normalized);
  if (!isQuotationIntent) return { isQuotationIntent: false, productQuery: null, refersToCurrentProduct: false };

  const refersToCurrentProduct = PRODUCT_REFERENCE.test(normalized);
  const hasModelIdentifier = /\b\d{1,4}\b/.test(normalized) || /\b(iphone|ipad|galaxy|pixel|xiaomi|oppo|vivo|macbook)\b/.test(normalized);
  const explicitRequest = /\b(toi muon|toi can|cho toi|gui toi|tao|toi xin)\b/.test(normalized);
  if (FAQ_TERMS.test(normalized) && (!hasModelIdentifier || !explicitRequest) && !refersToCurrentProduct) {
    return { isQuotationIntent: false, productQuery: null, refersToCurrentProduct: false };
  }

  let query = normalized
    .replace(/\b(cho toi xin|cho toi|toi muon|toi can|toi xin|gui toi|bao gia giup|bao gia cho toi|bao gia|xin bao gia|tao bao gia)\b/g, ' ')
    .replace(/\b(san pham nay|dien thoai nay|may nay|mat hang nay|mau nay)\b/g, ' ')
    .replace(/\b\d+\s*(gb|tb)\b/g, ' ')
    .replace(/\b(black|white|blue|red|green|pink|titan|den|trang|xanh|do|hong|tim|tu nhien)\b/g, ' ')
    .replace(/\b(bao nhieu|duoc khong|nhe|giup minh|giup toi|mua|co|xin|a|oi|voi|khong)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Do not turn a generic reference into a catalog query.
  if (!query || FAQ_TERMS.test(normalized) && !hasModelIdentifier) query = '';
  return {
    isQuotationIntent: true,
    productQuery: query || null,
    refersToCurrentProduct,
  };
}

export async function resolveQuotationIntent(
  message: string,
  response: unknown,
  contextProducts: ChatbotProduct[] = [],
  dependencies: {
    byIds?: (ids: string[]) => Promise<ChatbotProduct[]>;
    byName?: (name: string) => Promise<ChatbotProduct[]>;
  } = {},
): Promise<QuotationCatalogResult | null> {
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const draft = response as Record<string, unknown>;
    if (draft.result_type === 'quotation' && draft.catalog_verified === true && typeof draft.response === 'string'
      && ['ready', 'needs_variant_selection', 'not_found', 'insufficient_stock', 'invalid_request'].includes(String(draft.quote_status))) {
      return { text: draft.response, products: dedupeChatbotProducts(Array.isArray(draft.products) ? draft.products as ChatbotProduct[] : []) };
    }
  }
  const intent = parseQuotationIntent(message);
  if (!intent.isQuotationIntent) return null;

  const loadByIds = dependencies.byIds || fetchChatbotCatalogProducts;
  const searchByName = dependencies.byName || searchChatbotCatalogProducts;
  const suggestedIds = extractSuggestedProductIds(response);

  try {
    // n8n IDs are hints only; Backend rehydrates them. If they do not resolve,
    // fall back to the extracted product name rather than the full user sentence.
    if (suggestedIds.length > 0) {
      const verified = dedupeChatbotProducts(await loadByIds(suggestedIds));
      if (verified.length > 0) return { text: 'Đã tìm thấy sản phẩm trong danh mục. Hãy chọn phiên bản và số lượng trên thẻ để tiếp tục yêu cầu báo giá.', products: verified };
    }

    if (intent.productQuery) {
      const products = dedupeChatbotProducts(await searchByName(intent.productQuery));
      if (products.length > 0) return { text: 'Đây là các sản phẩm phù hợp từ danh mục WebPhone. Hãy chọn phiên bản và số lượng; báo giá chỉ được tạo sau khi bạn xác nhận trong tài khoản.', products };
      return { text: `Chưa tìm thấy sản phẩm phù hợp với “${intent.productQuery}”. Bạn có thể thử tên hoặc dòng máy khác.`, products: [] };
    }

    if (intent.refersToCurrentProduct && contextProducts.length > 0) {
      return { text: 'Bạn có thể chọn phiên bản và số lượng trên thẻ sản phẩm trước đó để tiếp tục yêu cầu báo giá.', products: dedupeChatbotProducts(contextProducts) };
    }

    return { text: 'Bạn muốn báo giá mẫu máy nào? Hãy cho biết tên hoặc dòng máy, ví dụ iPhone 17.', products: [] };
  } catch {
    return { text: 'Hiện chưa thể tra cứu danh mục để xác minh sản phẩm. Vui lòng thử lại sau.', products: [], isError: true };
  }
}
