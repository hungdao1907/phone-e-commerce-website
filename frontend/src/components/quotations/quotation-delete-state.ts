import type { QuotationRecord } from './QuotationDetails';

export function createQuotationDeleteGate() {
  let busy = false;
  return {
    get busy() { return busy; },
    async run(action: () => Promise<void>) {
      if (busy) return;
      busy = true;
      try { await action(); } finally { busy = false; }
    },
  };
}
export function removeDeletedQuotation(quotations: QuotationRecord[], id: string) {
  return quotations.filter(quotation => quotation.id !== id);
}
