import { publishQuotationDraftChanged, type QuotationDraftChangeSource } from './quotation-events';

export const QUOTATION_DRAFT_SESSION_KEY = 'webphone_customer_quotation_selection_v1';

export type QuotationSelectionItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

const MAX_DRAFT_ITEMS = 100;
const MAX_ITEM_QUANTITY = 1000;
let memoryDraft: QuotationSelectionItem[] = [];
let memoryFallbackActive = false;

function copyDraft(items: QuotationSelectionItem[]): QuotationSelectionItem[] {
  return items.map(item => ({ ...item }));
}

function getSessionStorage(): Storage | undefined {
  try {
    return typeof sessionStorage === 'undefined' ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}

export function parseQuotationDraft(value: unknown): QuotationSelectionItem[] | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.items) || record.items.length === 0 || record.items.length > MAX_DRAFT_ITEMS) return null;

  const items: QuotationSelectionItem[] = [];
  for (const candidate of record.items) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
    const item = candidate as Record<string, unknown>;
    if (typeof item.productId !== 'string' || item.productId.trim().length === 0 || item.productId.length > 128
      || typeof item.variantId !== 'string' || item.variantId.trim().length === 0 || item.variantId.length > 128
      || !Number.isSafeInteger(item.quantity) || (item.quantity as number) <= 0 || (item.quantity as number) > 1000) return null;
    items.push({ productId: item.productId.trim(), variantId: item.variantId.trim(), quantity: item.quantity as number });
  }
  return items;
}

export function saveQuotationDraft(
  items: QuotationSelectionItem[],
  source: QuotationDraftChangeSource = 'form',
): boolean {
  const validated = parseQuotationDraft({ items });
  if (!validated) return false;
  // Keep the current SPA session usable even when browser storage is blocked.
  memoryDraft = copyDraft(validated);
  const storage = getSessionStorage();
  if (!storage) {
    memoryFallbackActive = true;
    publishQuotationDraftChanged(source);
    return true;
  }
  try {
    // Persist identifiers and quantities only: never prices, identity, tokens, address, or chat session.
    storage.setItem(QUOTATION_DRAFT_SESSION_KEY, JSON.stringify({ items: validated }));
    memoryFallbackActive = false;
  } catch {
    // A stale stored value must not override this in-memory update after a failed write.
    memoryFallbackActive = true;
  }
  publishQuotationDraftChanged(source);
  return true;
}

/** Merge selections from multiple chatbot cards without trusting card-supplied prices. */
export function mergeQuotationDraftSelection(
  existing: QuotationSelectionItem[],
  selection: QuotationSelectionItem,
): QuotationSelectionItem[] | null {
  const validExisting = existing.length === 0 ? [] : parseQuotationDraft({ items: existing });
  const validSelection = parseQuotationDraft({ items: [selection] })?.[0];
  if (!validExisting || !validSelection) return null;

  const existingIndex = validExisting.findIndex(item =>
    item.productId === validSelection.productId && item.variantId === validSelection.variantId,
  );
  if (existingIndex >= 0) {
    const combinedQuantity = validExisting[existingIndex].quantity + validSelection.quantity;
    if (!Number.isSafeInteger(combinedQuantity) || combinedQuantity > MAX_ITEM_QUANTITY) return null;
    return validExisting.map((item, index) => index === existingIndex ? { ...item, quantity: combinedQuantity } : item);
  }

  if (validExisting.length >= MAX_DRAFT_ITEMS) return null;
  return [...validExisting, validSelection];
}

export function addQuotationDraftSelection(selection: QuotationSelectionItem): boolean {
  const merged = mergeQuotationDraftSelection(loadQuotationDraft(), selection);
  if (!merged) return false;
  return saveQuotationDraft(merged, 'chatbot');
}

export function loadQuotationDraft(): QuotationSelectionItem[] {
  if (memoryFallbackActive) return copyDraft(memoryDraft);
  const storage = getSessionStorage();
  if (!storage) {
    memoryFallbackActive = true;
    return copyDraft(memoryDraft);
  }
  try {
    const stored = storage.getItem(QUOTATION_DRAFT_SESSION_KEY);
    if (stored) {
      const parsed = parseQuotationDraft(JSON.parse(stored));
      if (parsed) {
        memoryDraft = copyDraft(parsed);
        return copyDraft(parsed);
      }
    }
    return copyDraft(memoryDraft);
  } catch {
    memoryFallbackActive = true;
    return copyDraft(memoryDraft);
  }
}

export function clearQuotationDraft(source: QuotationDraftChangeSource = 'clear'): void {
  memoryDraft = [];
  const storage = getSessionStorage();
  if (!storage) memoryFallbackActive = true;
  else {
    try {
      storage.removeItem(QUOTATION_DRAFT_SESSION_KEY);
      memoryFallbackActive = false;
    } catch {
      memoryFallbackActive = true;
    }
  }
  publishQuotationDraftChanged(source);
}
