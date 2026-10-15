import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCustomerQuotations } from '../quotations/useCustomerQuotations';
import { customerQuotationStatus } from '../quotations/customer-quotation-status';
import { formatVnd, type QuotationRecord } from '../quotations/QuotationDetails';
import { downloadApprovedCustomerQuotation, quotationApiEnabled } from '../quotations/quotation-api';

export function ChatQuotationCard({ quotation, busy, onDownload }: {
  quotation: QuotationRecord; busy?: boolean; onDownload: () => void;
}) {
  const status = customerQuotationStatus(quotation);
  return <article className="rounded-xl border border-blue-100 bg-white p-3 text-xs" data-quotation-id={quotation.id}>
    <p className="font-bold">Báo giá #{quotation.quoteNumber} · v{quotation.version ?? 1}</p>
    <p className="mt-2 leading-relaxed">{status.message}</p>
    <p className="mt-2 font-semibold">Tổng thanh toán: {formatVnd(quotation.totalAmount)}</p>
    <p className="mt-1 text-neutral-500">Hiệu lực đến: {new Date(quotation.expiresAt).toLocaleString('vi-VN')}</p>
    {status.downloadable && <button type="button" disabled={busy} onClick={onDownload}
      className="mt-3 rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Đang tải PDF…' : 'Tải PDF báo giá'}</button>}
  </article>;
}

/** No n8n, AI-generated amounts, public file URLs, or Order/create actions on this surface. */
export function CustomerQuotationPanel() {
  const { token, user } = useAuthStore();
  const query = useCustomerQuotations();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!quotationApiEnabled() || user?.role && user.role !== 'customer') return null;
  if (!token || !user) return <p className="text-xs text-neutral-600"><Link to="/login" className="text-blue-700">Đăng nhập Customer</Link> để xem trạng thái và PDF báo giá của bạn.</p>;
  const download = async (quotation: QuotationRecord) => {
    if (busy) return;
    setBusy(quotation.id); setError('');
    const identity = { token, id: user.id };
    try {
      await downloadApprovedCustomerQuotation(quotation, token, () => {
        const session = useAuthStore.getState();
        return session.token === identity.token && session.user?.id === identity.id;
      });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải PDF báo giá.'); void query.refetch(); }
    finally { setBusy(null); }
  };
  return <section aria-label="Báo giá của bạn trong Chatbot" className="space-y-2 rounded-xl bg-blue-50/60 p-3">
    <div className="flex items-center justify-between"><h4 className="text-xs font-bold">Báo giá của bạn</h4>
      <button type="button" disabled={query.isFetching} onClick={() => { setError(''); void query.refetch(); }} className="text-xs text-blue-700">Kiểm tra trạng thái</button></div>
    {query.isPending && <p role="status" className="text-xs">Đang kiểm tra báo giá…</p>}
    {(query.isError || error) && <p role="alert" className="text-xs text-rose-700">{error || query.error?.message}</p>}
    {!query.isPending && !query.isError && query.quotations.length === 0 && <p className="text-xs">Bạn chưa có báo giá.</p>}
    {query.quotations.map(quotation => <ChatQuotationCard key={quotation.id} quotation={quotation} busy={!!busy}
      onDownload={() => void download(quotation)} />)}
    <Link to="/profile?tab=quotations" className="inline-block text-xs font-semibold text-blue-700">Xem / xác nhận trong Báo giá của tôi</Link>
  </section>;
}
