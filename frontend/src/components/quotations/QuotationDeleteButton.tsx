import React, { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { QuotationRecord } from './QuotationDetails';
import { requestQuotationJson } from './quotation-api';
import { publishQuotationUpdated } from './quotation-events';
import { createQuotationDeleteGate } from './quotation-delete-state';

export function QuotationDeleteDialog({ quoteNumber, busy, error, onCancel, onConfirm }: {
  quoteNumber: string; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-label="Xác nhận xóa báo giá" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
      <h2 className="text-lg font-bold">Xóa báo giá #{quoteNumber}?</h2>
      <p className="mt-3 text-sm">Báo giá sẽ bị xóa vĩnh viễn và không thể khôi phục. Dữ liệu và PDF chỉ thuộc báo giá này cũng bị xóa. Không xóa đơn hàng hoặc thanh toán.</p>
      {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl border px-4 py-2 text-sm">Hủy</button>
        <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang xóa…' : 'Xóa vĩnh viễn'}</button>
      </div>
    </section>
  </div>;
}

export function QuotationDeleteButton({ quotation, scope, token, disabled, onDeleted }: {
  quotation: QuotationRecord; scope: 'admin' | 'staff'; token: string; disabled?: boolean; onDeleted: (id: string, pdfCleanupPending?: boolean) => void;
}) {
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const gate = useRef(createQuotationDeleteGate());
  const protectedOrder = quotation.status === 'CONVERTED' || !!quotation.orders?.length;
  const confirm = async () => {
    if (gate.current.busy || protectedOrder) return;
    await gate.current.run(async () => {
    setBusy(true); setError('');
    try {
      const result = await requestQuotationJson<{ id: string; deleted: boolean; pdfCleanupPending?: boolean }>(`/api/${scope}/quotations/${encodeURIComponent(quotation.id)}`, token, { method: 'DELETE' });
      if (result.id !== quotation.id || result.deleted !== true) throw new Error('Backend chưa xác nhận xóa báo giá.');
      setOpen(false); onDeleted(quotation.id, result.pdfCleanupPending); publishQuotationUpdated(quotation.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể xóa báo giá.'); }
    finally { setBusy(false); }
    });
  };
  return <>
    <button type="button" disabled={disabled || busy || protectedOrder} title={protectedOrder ? 'Báo giá đã liên kết đơn hàng; cần xử lý đơn hàng theo quy trình riêng.' : undefined}
      onClick={() => { setError(''); setOpen(true); }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50">
      <Trash2 className="h-4 w-4" /> Xóa báo giá
    </button>
    {open && <QuotationDeleteDialog quoteNumber={quotation.quoteNumber} busy={busy} error={error} onCancel={() => { if (!gate.current.busy) setOpen(false); }} onConfirm={() => void confirm()} />}
  </>;
}
