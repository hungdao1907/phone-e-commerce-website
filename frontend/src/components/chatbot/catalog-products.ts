import type { ChatbotProduct } from './types';

export function dedupeChatbotProducts(products: ChatbotProduct[]): ChatbotProduct[] {
  const seen = new Set<string>();
  return products.filter(product => {
    if (typeof product.id !== 'string' || !product.id.trim() || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}
