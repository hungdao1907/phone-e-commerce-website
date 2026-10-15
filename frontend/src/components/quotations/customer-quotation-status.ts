import type { QuotationRecord } from './QuotationDetails';

/** Presentation only: approval and amounts always come from the authenticated Backend. */
export function customerQuotationStatus(quotation: QuotationRecord, now = Date.now()) {
  if (quotation.status === 'CONVERTED') return { downloadable: true,
    message: 'Báo giá của bạn đã được duyệt và chuyển thành đơn hàng. Bạn có thể tải file PDF để xem chi tiết.' };
  const unexpired = Number.isFinite(Date.parse(quotation.expiresAt)) && Date.parse(quotation.expiresAt) > now;
  if (quotation.status === 'APPROVED' && unexpired) return { downloadable: true,
    message: 'Báo giá của bạn đã được duyệt. Bạn có thể tải file PDF để xem chi tiết.' };
  const messages: Record<string, string> = {
    PENDING_CUSTOMER_CONFIRMATION: 'Báo giá đang chờ bạn xác nhận trong Báo giá của tôi.',
    CUSTOMER_CONFIRMED: 'Bạn đã xác nhận báo giá; đang chờ nhân viên duyệt.',
    NEEDS_REQUOTE: 'Báo giá cần xác nhận lại. Hãy xem phiên bản mới trong Báo giá của tôi.',
    REJECTED: 'Báo giá đã bị từ chối.', CUSTOMER_REJECTED: 'Bạn đã từ chối báo giá.',
    EXPIRED: 'Báo giá đã hết hiệu lực.',
  };
  return { downloadable: false, message: !unexpired && ['APPROVED', 'PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'].includes(quotation.status)
    ? 'Báo giá đã hết hiệu lực.' : messages[quotation.status] || 'Trạng thái báo giá chưa được xác định.' };
}
