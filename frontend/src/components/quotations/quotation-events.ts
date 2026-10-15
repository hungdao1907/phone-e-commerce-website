export const QUOTATION_DRAFT_CHANGED_EVENT = 'webphone:quotation-draft-changed';
export const QUOTATION_CREATED_EVENT = 'webphone:quotation-created';
export const QUOTATION_UPDATED_EVENT = 'webphone:quotation-updated';

export function subscribeToPersistedQuotationUpdates(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(QUOTATION_CREATED_EVENT, listener);
  window.addEventListener(QUOTATION_UPDATED_EVENT, listener);
  return () => {
    window.removeEventListener(QUOTATION_CREATED_EVENT, listener);
    window.removeEventListener(QUOTATION_UPDATED_EVENT, listener);
  };
}

/** Only after a successful persisted confirmation/rejection, never after draft writes. */
export function publishQuotationUpdated(quotationId: string): void {
  if (typeof window === 'undefined' || !quotationId) return;
  window.dispatchEvent(new CustomEvent(QUOTATION_UPDATED_EVENT, { detail: { quotationId } }));
}

export type QuotationDraftChangeSource = 'chatbot' | 'form' | 'clear';

export function publishQuotationDraftChanged(source: QuotationDraftChangeSource): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(QUOTATION_DRAFT_CHANGED_EVENT, { detail: { source } }));
}

export function subscribeToQuotationDraftChanges(
  listener: (source: QuotationDraftChangeSource) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const handleChange = (event: Event) => {
    const source = (event as CustomEvent<{ source?: unknown }>).detail?.source;
    if (source === 'chatbot' || source === 'form' || source === 'clear') listener(source);
    else listener('form');
  };
  window.addEventListener(QUOTATION_DRAFT_CHANGED_EVENT, handleChange);
  return () => window.removeEventListener(QUOTATION_DRAFT_CHANGED_EVENT, handleChange);
}

/** Emitted only after the Backend returns a persisted quotation record. */
export function publishQuotationCreated(quotationId: string): void {
  if (typeof window === 'undefined' || !quotationId) return;
  window.dispatchEvent(new CustomEvent(QUOTATION_CREATED_EVENT, { detail: { quotationId } }));
}
