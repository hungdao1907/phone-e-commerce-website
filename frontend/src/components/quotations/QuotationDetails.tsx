import type { ReactNode } from 'react';

export type QuotationItemSnapshot = {
  id?: string;
  productName: string;
  variantSku?: string | null;
  variantAttributes?: unknown;
  quantity: number;
  unitPrice: number;
  originalUnitPrice?: number | null;
  saleUnitPrice?: number | null;
  lineTotal?: number;
};

export type QuotationRecord = {
  id: string;
  quoteNumber: string;
  version?: number;
  previousVersionId?: string | null;
  requoteReason?: string | null;
  status: string;
  currency?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  recipientName?: string | null;
  note?: string | null;
  expiresAt: string;
  createdAt?: string;
  customerConfirmedAt?: string | null;
  customerRejectedAt?: string | null;
  items: QuotationItemSnapshot[];
  customer?: { id?: string; fullName?: string | null; email?: string | null; phone?: string | null };
  assignedStaffId?: string | null;
  assignedStaff?: { id: string; username: string; role: string } | null;
  orders?: Array<{ id: string; orderCode: string }>;
  previousVersion?: { id: string; quoteNumber: string; totalAmount: number; status: string; version: number } | null;
  nextVersion?: { id: string; quoteNumber: string; totalAmount: number; status: string; version: number } | null;
};

export function formatVnd(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function quotationStatusLabel(status: string, expiresAt?: string): string {
  if (status === 'PENDING_CUSTOMER_CONFIRMATION' && expiresAt && Date.parse(expiresAt) <= Date.now()) return 'Đã hết hạn';
  const labels: Record<string, string> = {
    PENDING_CUSTOMER_CONFIRMATION: 'Chờ khách xác nhận',
    CUSTOMER_CONFIRMED: 'Khách đã xác nhận — chờ duyệt',
    APPROVED: 'Đã duyệt',
    NEEDS_REQUOTE: 'Cần tạo lại báo giá',
    REJECTED: 'Đã từ chối',
    CUSTOMER_REJECTED: 'Khách hàng đã từ chối',
    EXPIRED: 'Đã hết hạn',
    CONVERTED: 'Đã chuyển thành đơn hàng',
  };
  return labels[status] || status;
}

function attributesText(attributes: unknown): string {
  if (!attributes || typeof attributes !== 'object') return '';
  return Object.entries(attributes as Record<string, unknown>)
    .filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

function requoteReasonLabel(reason?: string | null): string {
  const labels: Record<string, string> = {
    price_changed: 'Giá sản phẩm hoặc biến thể đã thay đổi.',
    totals_changed: 'Tổng giảm giá, phí vận chuyển hoặc tổng thanh toán đã thay đổi.',
    out_of_stock: 'Tồn kho hiện không đủ cho số lượng trong báo giá.',
    variant_unavailable: 'Một sản phẩm hoặc biến thể hiện không còn khả dụng.',
  };
  return reason ? labels[reason] || 'Backend phát hiện báo giá không còn khớp với dữ liệu hiện tại.' : '';
}

export function QuotationDetails({
  quotation,
  children,
  showCustomer = false,
}: {
  quotation: QuotationRecord;
  children?: ReactNode;
  showCustomer?: boolean;
}) {
  const isExpired = quotation.status === 'PENDING_CUSTOMER_CONFIRMATION' && Date.parse(quotation.expiresAt) <= Date.now();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={`Chi tiết báo giá ${quotation.quoteNumber}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Báo giá #{quotation.quoteNumber}</h2>
          <p className="mt-1 text-sm text-slate-500">Phiên bản {quotation.version ?? 1} · Tạo lúc {quotation.createdAt ? new Date(quotation.createdAt).toLocaleString('vi-VN') : '—'}</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {quotationStatusLabel(quotation.status, quotation.expiresAt)}
        </span>
      </div>

      {isExpired && (
        <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Báo giá đã hết hạn. Vui lòng yêu cầu tạo báo giá mới; không thể xác nhận báo giá này.
        </div>
      )}
      {quotation.status === 'NEEDS_REQUOTE' && (
        <div role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p>Giá hoặc khả năng cung ứng đã thay đổi. Phiên bản này không còn được duyệt để tạo Order.</p>
          {quotation.requoteReason && <p className="mt-1">Lý do: {requoteReasonLabel(quotation.requoteReason)}</p>}
          {quotation.nextVersion ? (
            <p className="mt-1">Báo giá mới #{quotation.nextVersion.quoteNumber} (v{quotation.nextVersion.version}): {formatVnd(quotation.nextVersion.totalAmount)}.</p>
          ) : (
            <p className="mt-1">Backend chưa phát hành phiên bản mới; cần xử lý khả năng cung ứng trước.</p>
          )}
        </div>
      )}
      {quotation.previousVersion && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          Phiên bản trước #{quotation.previousVersion.quoteNumber}: {formatVnd(quotation.previousVersion.totalAmount)}
          {quotation.previousVersion.totalAmount !== quotation.totalAmount && (
            <span> · Chênh lệch {quotation.totalAmount > quotation.previousVersion.totalAmount ? '+' : '−'}{formatVnd(Math.abs(quotation.totalAmount - quotation.previousVersion.totalAmount))}</span>
          )}
        </div>
      )}
      {showCustomer && quotation.customer && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <div className="text-xs font-semibold text-slate-500">Thông tin tài khoản</div>
          <div className="font-semibold text-slate-900">{quotation.customer.fullName || 'Khách hàng'}</div>
          <div>{quotation.customer.email || '—'}{quotation.customer.phone ? ` · ${quotation.customer.phone}` : ''}</div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="pb-2 pr-3">Sản phẩm / biến thể</th>
              <th className="pb-2 px-3 text-right">SL</th>
              <th className="pb-2 px-3 text-right">Giá snapshot</th>
              <th className="pb-2 pl-3 text-right">Thành tiền snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(quotation.items || []).map((item, index) => (
              <tr key={item.id || `${item.variantSku || item.productName}-${index}`}>
                <td className="py-3 pr-3">
                  <div className="font-medium text-slate-900">{item.productName}</div>
                  <div className="text-xs text-slate-500">
                    {[item.variantSku, attributesText(item.variantAttributes)].filter(Boolean).join(' · ') || 'Biến thể'}
                  </div>
                  {item.originalUnitPrice != null && item.originalUnitPrice !== item.unitPrice && (
                    <div className="mt-1 text-xs text-slate-500">Giá gốc snapshot: {formatVnd(item.originalUnitPrice)}</div>
                  )}
                  {item.saleUnitPrice != null && (
                    <div className="text-xs text-slate-500">salePrice snapshot: {formatVnd(item.saleUnitPrice)}</div>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatVnd(item.unitPrice)}</td>
                <td className="py-3 pl-3 text-right font-medium tabular-nums">{formatVnd(item.lineTotal)}</td>
              </tr>
            ))}
            {!quotation.items?.length && <tr><td colSpan={4} className="py-5 text-center text-slate-500">Không có dòng sản phẩm trong snapshot.</td></tr>}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-5 grid max-w-sm grid-cols-2 gap-x-5 gap-y-2 text-sm">
        <dt className="text-slate-500">Tạm tính</dt><dd className="text-right tabular-nums">{formatVnd(quotation.subtotal)}</dd>
        <dt className="text-slate-500">Tổng giảm giá</dt><dd className="text-right tabular-nums">−{formatVnd(quotation.discountAmount)}</dd>
        <dt className="text-slate-500">Vận chuyển</dt><dd className="text-right tabular-nums">{formatVnd(quotation.shippingFee)}</dd>
        <dt className="border-t border-slate-200 pt-2 font-bold text-slate-900">Tổng thanh toán</dt>
        <dd className="border-t border-slate-200 pt-2 text-right font-bold text-emerald-700 tabular-nums">{formatVnd(quotation.totalAmount)}</dd>
      </dl>

      {(quotation.recipientName || quotation.customer?.fullName || quotation.shippingPhone || quotation.shippingAddress || quotation.paymentMethod || quotation.note) && (
        <div className="mt-5 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
          <p><span className="font-medium text-slate-800">Người nhận:</span> {quotation.recipientName?.trim() || quotation.customer?.fullName || '—'}</p>
          {quotation.shippingPhone && <p><span className="font-medium text-slate-800">SĐT giao hàng:</span> {quotation.shippingPhone}</p>}
          {quotation.paymentMethod && <p><span className="font-medium text-slate-800">Thanh toán:</span> {quotation.paymentMethod === 'COD' ? 'COD' : quotation.paymentMethod}</p>}
          {quotation.shippingAddress && <p className="sm:col-span-2"><span className="font-medium text-slate-800">Địa chỉ:</span> {quotation.shippingAddress}</p>}
          {quotation.note && <p className="sm:col-span-2"><span className="font-medium text-slate-800">Ghi chú:</span> {quotation.note}</p>}
        </div>
      )}

      {quotation.assignedStaff && <p className="mt-4 text-sm text-slate-600">Nhân viên phụ trách: <span className="font-medium text-slate-900">{quotation.assignedStaff.username}</span></p>}
      {quotation.orders?.[0] && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Đã tạo đơn hàng #{quotation.orders[0].orderCode}</p>}
      {children && <div className="mt-5 border-t border-slate-100 pt-4">{children}</div>}
    </section>
  );
}
