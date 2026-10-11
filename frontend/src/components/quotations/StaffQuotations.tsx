import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, FileText, RefreshCw, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { QuotationApiError, downloadPrivateQuotationPdf, quotationApiEnabled, requestQuotationJson } from './quotation-api';
import { formatVnd, QuotationDetails, quotationStatusLabel, type QuotationRecord } from './QuotationDetails';
import { QuotationDeleteButton } from './QuotationDeleteButton';
import { removeDeletedQuotation } from './quotation-delete-state';

type Tab = 'all' | 'pending' | 'processed';
type QuotationListResponse = { quotations: QuotationRecord[] };
type QuotationDetailResponse = { quotation: QuotationRecord };
type ApprovalResponse = { outcome: string; orderId?: string; orderCode?: string };

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID().replace(/-/g, '');
  const random = new Uint8Array(16);
  crypto.getRandomValues(random);
  return Array.from(random, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function StaffQuotations({ initialTab }: { initialTab?: string }) {
  const token = useAuthStore(state => state.token);
  const initial: Tab = initialTab === 'quotations-pending' ? 'pending' : initialTab === 'quotations-processed' ? 'processed' : 'all';
  const [tab, setTab] = useState<Tab>(initial);
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [selected, setSelected] = useState<QuotationRecord | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'inactive' | 'error'>('loading');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<'approve' | 'reject' | 'pdf' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteNotice, setDeleteNotice] = useState('');
  const onDeleted = (id: string, pending?: boolean) => { setQuotations(current => removeDeletedQuotation(current, id)); setSelected(current => current?.id === id ? null : current); setDeleteNotice(pending ? 'Đã xóa vĩnh viễn báo giá. Tệp PDF riêng tư không còn tải được nhưng còn chờ dọn khỏi ổ đĩa.' : 'Đã xóa vĩnh viễn báo giá khỏi danh sách.'); };
  const pendingReviewKeys = useRef(new Map<string, string>());

  useEffect(() => {
    setTab(initialTab === 'quotations-pending' ? 'pending' : initialTab === 'quotations-processed' ? 'processed' : 'all');
  }, [initialTab]);

  const loadQuotations = useCallback(async () => {
    if (!quotationApiEnabled()) {
      setQuotations([]);
      setSelected(null);
      setLoadState('inactive');
      setError('Quotation API chưa được bật; không có yêu cầu nào được gửi.');
      return;
    }
    if (!token) {
      setLoadState('error');
      setError('Cần phiên đăng nhập Staff hợp lệ.');
      return;
    }
    setLoadState('loading');
    setError('');
    try {
      const data = await requestQuotationJson<QuotationListResponse>('/api/staff/quotations', token, {}, 'list');
      setQuotations(Array.isArray(data.quotations) ? data.quotations : []);
      setLoadState('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải báo giá được phân công.');
      setLoadState(cause instanceof QuotationApiError && cause.status === 404 ? 'inactive' : 'error');
      setQuotations([]);
    }
  }, [token]);

  useEffect(() => { void loadQuotations(); }, [loadQuotations]);

  const visibleQuotations = useMemo(() => quotations.filter(quotation => {
    if (tab === 'pending') return ['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'].includes(quotation.status);
    if (tab === 'processed') return ['APPROVED', 'NEEDS_REQUOTE', 'REJECTED', 'CUSTOMER_REJECTED', 'EXPIRED', 'CONVERTED'].includes(quotation.status);
    return true;
  }), [quotations, tab]);

  const openQuotation = async (quotation: QuotationRecord) => {
    setSelected(quotation);
    setActionError('');
    setRejectReason('');
    if (!token) return;
    try {
      const detail = await requestQuotationJson<QuotationDetailResponse>(`/api/staff/quotations/${encodeURIComponent(quotation.id)}`, token, {}, 'detail');
      setSelected(detail.quotation);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải chi tiết báo giá.');
    }
  };

  const reviewQuotation = async (decision: 'approve' | 'reject') => {
    if (!selected || !token || busy || selected.status !== 'CUSTOMER_CONFIRMED') return;
    const intent = `${selected.id}:${decision}:${decision === 'reject' ? rejectReason.trim() : ''}`;
    const idempotencyKey = pendingReviewKeys.current.get(intent) || createIdempotencyKey();
    pendingReviewKeys.current.set(intent, idempotencyKey);
    setBusy(decision);
    setActionError('');
    try {
      const response = await requestQuotationJson<ApprovalResponse>(
        `/api/staff/quotations/${encodeURIComponent(selected.id)}/${decision}`,
        token,
        {
          method: 'POST',
          headers: { 'Idempotency-Key': idempotencyKey },
          ...(decision === 'reject' ? { body: JSON.stringify({ note: rejectReason.trim() || null }) } : {}),
        },
        'action',
      );
      pendingReviewKeys.current.delete(intent);
      if (decision === 'approve' && response.outcome === 'converted' && response.orderId && response.orderCode) {
        setSelected(current => current ? {
          ...current,
          status: 'CONVERTED',
          orders: [{ id: response.orderId!, orderCode: response.orderCode! }],
        } : current);
      } else if (decision === 'reject') {
        setSelected(current => current ? { ...current, status: 'REJECTED' } : current);
      }
      await loadQuotations();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể xử lý báo giá.');
      if (cause instanceof QuotationApiError && cause.status === 409) {
        await loadQuotations();
        try {
          const refreshed = await requestQuotationJson<QuotationDetailResponse>(
            `/api/staff/quotations/${encodeURIComponent(selected.id)}`, token, {}, 'detail',
          );
          setSelected(refreshed.quotation);
        } catch {
          // Keep the API error visible; never infer that the review succeeded.
        }
      }
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!selected || !token || busy) return;
    setBusy('pdf');
    setActionError('');
    try {
      await downloadPrivateQuotationPdf('staff/quotations', selected.id, token);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải PDF riêng tư.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Báo giá</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉ báo giá được phân công cho tài khoản Staff này mới hiển thị.</p>
        </div>
        <button type="button" onClick={() => void loadQuotations()} disabled={loadState === 'loading'} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Tải lại
        </button>
      </header>

      <div role="tablist" aria-label="Lọc báo giá" className="flex flex-wrap gap-2">
        {([['all', 'Danh sách báo giá'], ['pending', 'Báo giá chờ duyệt'], ['processed', 'Báo giá đã xử lý']] as const).map(([key, label]) => (
          <button type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => setTab(key)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${tab === key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadState === 'loading' && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải danh sách…</div>}
      {loadState === 'inactive' && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error} UI không sử dụng dữ liệu mẫu hoặc báo thành công giả.</div>}
      {loadState === 'error' && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>}
      {deleteNotice && <p role="status" className="text-sm text-emerald-700">{deleteNotice}</p>}

      {loadState === 'ready' && (
        visibleQuotations.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {visibleQuotations.map(quotation => (
                <div key={quotation.id} className="flex items-center gap-2 pr-4"><button type="button" onClick={() => void openQuotation(quotation)} className={`flex flex-1 flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 ${selected?.id === quotation.id ? 'bg-slate-50' : ''}`}>
                  <span><span className="block font-semibold">#{quotation.quoteNumber}</span><span className="mt-1 block text-xs text-slate-500">{quotation.customer?.fullName || 'Khách hàng'} · {quotationStatusLabel(quotation.status, quotation.expiresAt)}</span></span>
                  <span className="font-bold tabular-nums">{formatVnd(quotation.totalAmount)}</span>
                </button><QuotationDeleteButton quotation={quotation} scope="staff" token={token || ''} disabled={!!busy} onDeleted={onDeleted} /></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500"><FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" />Không có báo giá trong mục này được phân công cho bạn.</div>
        )
      )}

      {selected && loadState === 'ready' && (
        <QuotationDetails quotation={selected} showCustomer>
          {actionError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
          {selected.status === 'NEEDS_REQUOTE' && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Phiên bản này đã khóa duyệt. Chỉ phiên bản mới sau khi Customer xác nhận lại mới có thể được Staff duyệt.</p>}
          <div className="flex flex-wrap gap-2">
            <QuotationDeleteButton quotation={selected} scope="staff" token={token || ''} disabled={!!busy} onDeleted={onDeleted} />
            <button type="button" onClick={() => void downloadPdf()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" />{busy === 'pdf' ? 'Đang chuẩn bị PDF…' : 'Xem / tải PDF riêng tư'}</button>
          </div>
          {selected.status === 'CUSTOMER_CONFIRMED' && Date.parse(selected.expiresAt) > Date.now() && (
            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
              <label htmlFor="quotation-reject-reason" className="block text-sm font-semibold text-slate-700">Lý do từ chối (nếu từ chối)</label>
              <textarea id="quotation-reject-reason" value={rejectReason} maxLength={500} onChange={event => setRejectReason(event.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" placeholder="Ghi chú cho Customer, tối đa 500 ký tự" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void reviewQuotation('approve')} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"><Check className="h-4 w-4" />{busy === 'approve' ? 'Đang duyệt…' : 'Duyệt và chuyển thành Order'}</button>
                <button type="button" onClick={() => void reviewQuotation('reject')} disabled={!!busy || !rejectReason.trim()} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X className="h-4 w-4" />{busy === 'reject' ? 'Đang từ chối…' : 'Từ chối báo giá'}</button>
              </div>
              <p className="text-xs text-slate-500">Không thể sửa giá hoặc bỏ qua xác nhận của Customer. Backend sẽ kiểm tra lại trạng thái, giá snapshot và tồn kho.</p>
            </div>
          )}
        </QuotationDetails>
      )}
    </div>
  );
}
