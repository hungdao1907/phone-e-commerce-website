import React from 'react';
import { MessageCircle } from 'lucide-react';

/** Placeholder only: no API, chat, phone, email, or cancellation side effects. */
export function CustomerQuotationContactButton() {
  return <button type="button" disabled title="Chức năng liên hệ chưa được kích hoạt"
    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 opacity-60">
    <MessageCircle className="h-4 w-4" /> Liên hệ
  </button>;
}
