import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, FileText, RefreshCw, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { QuotationApiError, downloadPrivateQuotationPdf, quotationApiEnabled, requestQuotationJson } from './quotation-api';
import { formatVnd, QuotationDetails, quotationStatusLabel, type QuotationRecord } from './QuotationDetails';
import { CustomerQuotationRequestForm } from './CustomerQuotationRequestForm';
import { publishQuotationCreated, publishQuotationUpdated } from './quotation-events';
import { useCustomerQuotations } from './useCustomerQuotations';
import { upsertPersistedQuotation } from './customer-quotation-state';
import { CustomerQuotationContactButton } from './CustomerQuotationContactButton';

type QuotationDetailResponse = { quotation: QuotationRecord };

export function CustomerQuotations() {
  const token = useAuthStore(state => state.token);
  const shared = useCustomerQuotations();
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [selected, setSelected] = useState<QuotationRecord | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'inactive' | 'error'>('loading');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState<'confirm' | 'decline' | 'pdf' | 'revision' | null>(null);

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
      setError('Vui lòng đăng nhập bằng tài khoản khách hàng để xem báo giá.');
      return;
    }
    setLoadState('loading');
    setError('');
    try {
      const result = await shared.refetch();
      if (result.error) throw result.error;
      setQuotations(result.data ?? []);
      setLoadState('ready');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể tải danh sách báo giá.';
      setError(message);
      setLoadState(cause instanceof QuotationApiError && cause.status === 404 ? 'inactive' : 'error');
      setQuotations([]);
    }
  }, [token, shared.refetch]);

  useEffect(() => {
    setQuotations(shared.quotations);
    if (!quotationApiEnabled()) { setLoadState('inactive'); setError('Quotation API chưa được bật.'); return; }
    if (!shared.enabled) { setLoadState('error'); setError('Vui lòng đăng nhập Customer để xem báo giá.'); return; }
    setLoadState(shared.isPending ? 'loading' : shared.isError ? 'error' : 'ready');
    setError(shared.error?.message ?? '');
    setSelected(current => current ? shared.quotations.find(quotation => quotation.id === current.id) ?? null : null);
  }, [shared.data, shared.isPending, shared.isError, shared.error, shared.enabled]);
  useEffect(() => { setSelected(null); setActionError(''); }, [token]);

  const openQuotation = async (quotation: QuotationRecord) => {
    setSelected(quotation);
    setActionError('');
    if (!token) return;
    try {
      const detail = await requestQuotationJson<QuotationDetailResponse>(`/api/quotations/${encodeURIComponent(quotation.id)}`, token, {}, 'detail');
      setSelected(detail.quotation);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải chi tiết báo giá.');
    }
  };

  const confirmQuotation = async () => {
    if (!selected || !token || busy) return;
    setBusy('confirm');
    setActionError('');
    try {
      const data = await requestQuotationJson<QuotationDetailResponse>(
        `/api/quotations/${encodeURIComponent(selected.id)}/confirm`, token, { method: 'POST' }, 'action',
      );
      setSelected(data.quotation);
      publishQuotationUpdated(data.quotation.id);
      await loadQuotations();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể xác nhận báo giá.');
    } finally {
      setBusy(null);
    }
  };

  const declineQuotation = async () => {
    if (!selected || !token || busy) return;
    setBusy('decline');
    setActionError('');
    try {
      const data = await requestQuotationJson<QuotationDetailResponse>(
        `/api/quotations/${encodeURIComponent(selected.id)}/decline`, token, { method: 'POST' }, 'action',
      );
      setSelected(data.quotation);
      publishQuotationUpdated(data.quotation.id);
      await loadQuotations();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể từ chối báo giá.');
    } finally {
      setBusy(null);
    }
  };

  const openRevisedQuotation = async () => {
    if (!selected?.nextVersion || !token || busy) return;
    setBusy('revision');
    setActionError('');
    try {
      const data = await requestQuotationJson<QuotationDetailResponse>(
        `/api/quotations/${encodeURIComponent(selected.nextVersion.id)}`, token, {}, 'detail',
      );
      setSelected(data.quotation);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải phiên bản báo giá mới.');
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!selected || !token || busy) return;
    setBusy('pdf');
    setActionError('');
    try {
      const customerId = useAuthStore.getState().user?.id;
      await downloadPrivateQuotationPdf('quotations', selected.id, token, { regenerate: true,
        isCurrentSession: () => useAuthStore.getState().token === token && useAuthStore.getState().user?.id === customerId });
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải PDF báo giá.');
    } finally {
      setBusy(null);
    }
  };

  const handleCreated = (quotation: QuotationRecord) => {
    setQuotations(current => upsertPersistedQuotation(current, quotation));
    setSelected(quotation);
    setLoadState('ready');
    setError('');
    publishQuotationCreated(quotation.id);
  };

  return (
    <div className="space-y-5 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Báo giá của tôi</h2>
          <p className="mt-1 text-sm text-slate-500">Báo giá và giá trị hiển thị lấy từ snapshot Backend.</p>
        </div>
        <button type="button" onClick={() => void loadQuotations()} disabled={loadState === 'loading'} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className="h-4 w-4" /> Tải lại
        </button>
      </div>

      <CustomerQuotationRequestForm onCreated={handleCreated} />

      {loadState === 'loading' && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải báo giá…</div>}
      {loadState === 'inactive' && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error} Giao diện không tạo báo giá hoặc hiển thị dữ liệu mẫu.</div>}
      {loadState === 'error' && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>}

      {loadState === 'ready' && (
        <>
          {quotations.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-semibold">Bạn chưa có báo giá</p>
              <p className="mt-1 text-sm text-slate-500">Khi Quotation API được kích hoạt, báo giá của bạn sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="divide-y divide-slate-100">
                {quotations.map(quotation => (
                  <div key={quotation.id} className="flex items-center gap-2 pr-4"><button type="button" onClick={() => void openQuotation(quotation)} className={`flex flex-1 flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 ${selected?.id === quotation.id ? 'bg-slate-50' : ''}`}>
                    <span>
                      <span className="block font-semibold">#{quotation.quoteNumber}</span>
                      <span className="mt-1 block text-xs text-slate-500">{quotationStatusLabel(quotation.status, quotation.expiresAt)} · Hạn {new Date(quotation.expiresAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                    <span className="font-bold tabular-nums text-slate-800">{formatVnd(quotation.totalAmount)}</span>
                  </button><CustomerQuotationContactButton /></div>
                ))}
              </div>
            </div>
          )}

          {selected && (
            <QuotationDetails quotation={selected}>
              {actionError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
              <div className="flex flex-wrap gap-2">
                <CustomerQuotationContactButton />
                <button type="button" onClick={() => void downloadPdf()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
                  <Download className="h-4 w-4" /> {busy === 'pdf' ? 'Đang chuẩn bị PDF…' : 'Xem / tải PDF riêng tư'}
                </button>
                {selected.status === 'PENDING_CUSTOMER_CONFIRMATION' && Date.parse(selected.expiresAt) > Date.now() && (
                  <>
                    <button type="button" onClick={() => void confirmQuotation()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
                      <CheckCircle2 className="h-4 w-4" /> {busy === 'confirm' ? 'Đang xác nhận…' : 'Xác nhận báo giá'}
                    </button>
                    <button type="button" onClick={() => void declineQuotation()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
                      <XCircle className="h-4 w-4" /> {busy === 'decline' ? 'Đang từ chối…' : 'Từ chối báo giá'}
                    </button>
                  </>
                )}
                {selected.status === 'NEEDS_REQUOTE' && selected.nextVersion && (
                  <button type="button" onClick={() => void openRevisedQuotation()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {busy === 'revision' ? 'Đang tải báo giá mới…' : `Xem báo giá mới #${selected.nextVersion.quoteNumber}`}
                  </button>
                )}
              </div>
              {selected.status === 'PENDING_CUSTOMER_CONFIRMATION' && <p className="mt-3 text-xs text-slate-500">Xác nhận chỉ ghi nhận lựa chọn của bạn; không tạo đơn hàng. Staff sẽ chỉ xem xét sau khi khách hàng xác nhận.</p>}
            </QuotationDetails>
          )}
        </>
      )}
    </div>
  );
}
