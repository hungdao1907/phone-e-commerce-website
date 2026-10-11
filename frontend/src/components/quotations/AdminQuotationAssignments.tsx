import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, UserRoundCog } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { QuotationApiError, downloadPrivateQuotationPdf, quotationApiEnabled, requestQuotationJson } from './quotation-api';
import { QuotationDetails, quotationStatusLabel, type QuotationRecord } from './QuotationDetails';
import { QuotationDeleteButton } from './QuotationDeleteButton';
import { removeDeletedQuotation } from './quotation-delete-state';

type StaffUser = { id: string; username: string; role: string };
type QuotationListResponse = { quotations: QuotationRecord[] };
type QuotationDetailResponse = { quotation: QuotationRecord };
type UserListResponse = StaffUser[];

export function AdminQuotationAssignments() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [selected, setSelected] = useState<QuotationRecord | null>(null);
  const [staffId, setStaffId] = useState('');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'inactive' | 'error'>('loading');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<'assign' | 'pdf' | null>(null);
  const [deleteNotice, setDeleteNotice] = useState('');
  const onDeleted = (id: string, pending?: boolean) => { setQuotations(current => removeDeletedQuotation(current, id)); setSelected(current => current?.id === id ? null : current); setDeleteNotice(pending ? 'Đã xóa vĩnh viễn báo giá. Tệp PDF riêng tư không còn tải được nhưng còn chờ dọn khỏi ổ đĩa.' : 'Đã xóa vĩnh viễn báo giá khỏi danh sách.'); };

  const loadData = useCallback(async () => {
    if (!quotationApiEnabled()) {
      setQuotations([]);
      setStaff([]);
      setSelected(null);
      setLoadState('inactive');
      setError('Quotation API chưa được bật; không có yêu cầu nào được gửi.');
      return;
    }
    if (!token || !isAdmin) {
      setLoadState('error');
      setError('Chỉ Admin hoặc Superadmin được truy cập phân công báo giá.');
      return;
    }
    setLoadState('loading');
    setError('');
    try {
      const [quotationData, users] = await Promise.all([
        requestQuotationJson<QuotationListResponse>('/api/admin/quotations', token, {}, 'list'),
        requestQuotationJson<UserListResponse>('/api/users', token, {}, 'list'),
      ]);
      setQuotations(Array.isArray(quotationData.quotations) ? quotationData.quotations : []);
      setStaff(Array.isArray(users) ? users.filter(person => person.role === 'staff') : []);
      setLoadState('ready');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách báo giá hoặc Staff.');
      setLoadState(cause instanceof QuotationApiError && cause.status === 404 ? 'inactive' : 'error');
      setQuotations([]);
    }
  }, [token, isAdmin]);

  useEffect(() => { void loadData(); }, [loadData]);

  const visibleQuotations = useMemo(
    () => showUnassigned ? quotations.filter(quotation => !quotation.assignedStaffId && !quotation.assignedStaff) : quotations,
    [quotations, showUnassigned],
  );

  const openQuotation = async (quotation: QuotationRecord) => {
    setSelected(quotation);
    setStaffId(quotation.assignedStaff?.id || '');
    setActionError('');
    setNotice('');
    if (!token) return;
    try {
      const detail = await requestQuotationJson<QuotationDetailResponse>(`/api/admin/quotations/${encodeURIComponent(quotation.id)}`, token, {}, 'detail');
      setSelected(detail.quotation);
      setStaffId(detail.quotation.assignedStaff?.id || '');
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải chi tiết báo giá.');
    }
  };

  const assignQuotation = async () => {
    if (!selected || !token || !staffId || busy) return;
    setBusy('assign');
    setActionError('');
    setNotice('');
    try {
      const data = await requestQuotationJson<QuotationDetailResponse>(
        `/api/admin/quotations/${encodeURIComponent(selected.id)}/assign`,
        token,
        { method: 'POST', body: JSON.stringify({ staffId }) },
        'action',
      );
      setSelected(data.quotation);
      setStaffId(data.quotation.assignedStaff?.id || staffId);
      setNotice('Đã phân công báo giá theo phản hồi Backend.');
      await loadData();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể phân công báo giá.');
    } finally {
      setBusy(null);
    }
  };

  const downloadPdf = async () => {
    if (!selected || !token || busy) return;
    setBusy('pdf');
    setActionError('');
    try {
      await downloadPrivateQuotationPdf('admin/quotations', selected.id, token);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'Không thể tải PDF riêng tư.');
    } finally {
      setBusy(null);
    }
  };

  if (!isAdmin) {
    return <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Chỉ Admin hoặc Superadmin được phân công Quotation. Staff không thể tự nhận báo giá.</div>;
  }

  return (
    <div className="space-y-5 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Phân công báo giá</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉ Admin/Superadmin phân công; Staff chỉ xử lý báo giá đã được gán.</p>
        </div>
        <button type="button" onClick={() => void loadData()} disabled={loadState === 'loading'} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><RefreshCw className="h-4 w-4" />Tải lại</button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-800">{showUnassigned ? 'Quotation chưa phân công' : 'Tất cả Quotation'}</p>
        <button type="button" aria-pressed={showUnassigned} onClick={() => setShowUnassigned(value => !value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50">{showUnassigned ? 'Xem tất cả' : 'Lọc chưa phân công'}</button>
      </div>

      {loadState === 'loading' && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Đang tải báo giá…</div>}
      {loadState === 'inactive' && <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{error} Giao diện chưa gửi thay đổi và không dùng dữ liệu mẫu.</div>}
      {loadState === 'error' && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">{error}</div>}
      {deleteNotice && <p role="status" className="text-sm text-emerald-700">{deleteNotice}</p>}

      {loadState === 'ready' && (
        visibleQuotations.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {visibleQuotations.map(quotation => (
                <div key={quotation.id} className="flex items-center gap-2 pr-4"><button type="button" onClick={() => void openQuotation(quotation)} className={`flex flex-1 flex-wrap items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 ${selected?.id === quotation.id ? 'bg-slate-50' : ''}`}>
                  <span><span className="block font-semibold">#{quotation.quoteNumber}</span><span className="mt-1 block text-xs text-slate-500">{quotation.customer?.fullName || 'Khách hàng'} · {quotation.assignedStaff?.username || 'Chưa phân công'} · {quotationStatusLabel(quotation.status, quotation.expiresAt)}</span></span>
                  <span className="text-sm font-bold">{quotation.totalAmount.toLocaleString('vi-VN')} ₫</span>
                </button><QuotationDeleteButton quotation={quotation} scope="admin" token={token || ''} disabled={!!busy} onDeleted={onDeleted} /></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{showUnassigned ? 'Không có báo giá chưa phân công.' : 'Không có báo giá.'}</div>
        )
      )}

      {selected && loadState === 'ready' && (
        <QuotationDetails quotation={selected} showCustomer>
          {actionError && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
          {notice && <p role="status" className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
          <div className="flex flex-wrap items-end gap-3">
            <QuotationDeleteButton quotation={selected} scope="admin" token={token || ''} disabled={!!busy} onDeleted={onDeleted} />
            <label className="min-w-64 flex-1 text-sm font-semibold text-slate-700" htmlFor="quotation-assigned-staff">Nhân viên phụ trách
              <select id="quotation-assigned-staff" value={staffId} onChange={event => setStaffId(event.target.value)} disabled={!['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'].includes(selected.status) || !!busy} className="mt-1 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal">
                <option value="">Chọn Staff…</option>
                {staff.map(person => <option key={person.id} value={person.id}>{person.username}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void assignQuotation()} disabled={!staffId || !!busy || !['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'].includes(selected.status)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"><UserRoundCog className="h-4 w-4" />{busy === 'assign' ? 'Đang phân công…' : selected.assignedStaff ? 'Phân công lại' : 'Phân công'}</button>
            <button type="button" onClick={() => void downloadPdf()} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><Download className="h-4 w-4" />{busy === 'pdf' ? 'Đang chuẩn bị PDF…' : 'Xem / tải PDF riêng tư'}</button>
          </div>
          {!['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'].includes(selected.status) && <p className="mt-3 text-xs text-slate-500">Trạng thái hiện tại không cho phép phân công hoặc phân công lại theo API contract.</p>}
        </QuotationDetails>
      )}
    </div>
  );
}
