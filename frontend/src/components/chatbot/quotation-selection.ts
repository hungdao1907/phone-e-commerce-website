import type { QuotationSelectionItem } from '../quotations/quotation-draft';

export function isValidChatbotQuantity(value: string, stock: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= stock;
}

export function makeQuotationSelection(
  productId: unknown,
  variantId: unknown,
  quantity: string,
  stock: number,
): QuotationSelectionItem | null {
  if (typeof productId !== 'string' || !productId.trim()
    || typeof variantId !== 'string' || !variantId.trim()
    || !isValidChatbotQuantity(quantity, stock)) return null;
  return { productId: productId.trim(), variantId: variantId.trim(), quantity: Number(quantity) };
}
