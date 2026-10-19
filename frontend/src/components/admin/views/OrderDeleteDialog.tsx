import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

type OrderDeleteDialogProps = {
  orderCode: string; value: string; busy: boolean; error: string;
  onChange: (value: string) => void; onCancel: () => void; onConfirm: () => void;
};

export function OrderDeleteActions({ orderCode, value, busy, onCancel, onConfirm }: Omit<OrderDeleteDialogProps, 'error' | 'onChange'>) {
  return <div className="mt-6 flex gap-3">
    <button type="button" disabled={busy} onClick={() => { if (!busy) onCancel(); }} className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm hover:bg-white/5 disabled:opacity-50">Hủy</button>
    <button type="button" disabled={busy || !value || value !== orderCode} onClick={() => { if (!busy && value && value === orderCode) onConfirm(); }}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed">
      <Trash2 className="h-4 w-4" />{busy ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
    </button>
  </div>;
}

export function OrderDeleteDialog({ orderCode, value, busy, error, onChange, onCancel, onConfirm }: OrderDeleteDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector('input')?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="order-delete-title"
        onKeyDown={event => {
          if (event.key === 'Escape' && !busy) onCancel();
          if (event.key === 'Tab') {
            const controls = dialog.current?.querySelectorAll<HTMLElement>('input:not(:disabled), button:not(:disabled)');
            const first = controls?.[0], last = controls?.[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }
        }}
        className="w-full max-w-lg rounded-2xl border border-emerald-400/20 bg-[#091a13] p-6 shadow-2xl text-zinc-200">
        <h3 id="order-delete-title" className="flex items-center gap-3 text-lg font-bold text-white"><AlertTriangle className="h-6 w-6 text-red-400" />Xóa vĩnh viễn đơn hàng</h3>
        <p className="mt-4 text-sm">Đơn hàng: <strong className="text-white break-all">{orderCode}</strong></p>
        <p className="mt-3 text-sm text-red-400">Thao tác không thể hoàn tác.</p>
        <p className="mt-3 text-sm text-zinc-400">Sẽ xóa đơn hàng, các dòng sản phẩm, Payment chưa thu tiền và thông báo thuộc đơn. Khóa idempotency được giữ để ngăn tạo lại đơn qua retry.</p>
        <p className="mt-3 text-sm text-zinc-400">Chỉ chấp nhận đơn đã hủy, chưa thanh toán. Đơn có hóa đơn, giao dịch ngân hàng, báo giá, đánh giá hoặc khiếu nại sẽ bị từ chối. Không xóa Customer, không hoàn kho hay hoàn tiền.</p>
        <label className="block mt-5 text-sm" htmlFor="order-delete-code">Nhập chính xác mã đơn hàng để xác nhận</label>
        <input id="order-delete-code" autoComplete="off" spellCheck={false} value={value} disabled={busy}
          onChange={event => onChange(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-400/50" />
        {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
        <OrderDeleteActions orderCode={orderCode} value={value} busy={busy} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
