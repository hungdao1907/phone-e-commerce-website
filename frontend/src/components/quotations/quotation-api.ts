import type { QuotationRecord } from './QuotationDetails';
import { customerQuotationStatus } from './customer-quotation-status';

export class QuotationApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
    public readonly code: string | null = null,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'QuotationApiError';
  }
}

export function quotationApiStatusMessage(status: number, context: 'list' | 'detail' | 'action' | 'create' = 'action'): string {
  if (status === 401) return 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Tài khoản hiện tại không có quyền truy cập thao tác này.';
  if (status === 404) {
    if (context === 'list') return 'Quotation API chưa được kích hoạt. Dữ liệu báo giá chưa khả dụng.';
    if (context === 'create') return 'Quotation API chưa được kích hoạt. Yêu cầu chưa thể được xác nhận; giữ nguyên nội dung và thử lại sau khi API sẵn sàng.';
    if (context === 'action') return 'Quotation API chưa kích hoạt hoặc báo giá không tồn tại; thao tác chưa thành công.';
    return 'Không tìm thấy báo giá hoặc tài liệu riêng tư.';
  }
  if (status === 503) return context === 'create'
    ? 'Chưa xác nhận được kết quả tạo báo giá. Hãy thử lại đúng nội dung này; hệ thống sẽ dùng lại khóa an toàn của yêu cầu.'
    : 'Quotation API/Backend chưa sẵn sàng hoặc chưa được kích hoạt. Yêu cầu chưa được xác nhận thành công; vui lòng thử lại sau.';
  if (status === 409) return 'Báo giá vừa thay đổi hoặc không còn ở trạng thái cho phép. Hãy tải lại trước khi thao tác tiếp.';
  if (status === 410) return 'Báo giá đã hết hạn. Không thể tiếp tục xử lý báo giá này.';
  if (status >= 500) return 'Backend đang gặp lỗi. Chưa có thao tác nào được xác nhận thành công; vui lòng thử lại sau.';
  return `Không thể hoàn thành yêu cầu báo giá (HTTP ${status}).`;
}

export function quotationApiBaseUrl(): string {
  return import.meta.env?.VITE_API_URL || 'http://localhost:3001';
}

/** The quotation REST API remains opt-in until its schema and routers are activated. */
export function quotationApiEnabled(): boolean {
  return import.meta.env?.VITE_QUOTATION_API_ENABLED === 'true';
}

export type CustomerQuotationCreateRequest = {
  items: Array<{ variantId: string; quantity: number }>;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: 'COD' | 'BANK_TRANSFER';
  deliveryMethod: 'delivery';
};

function isCreatedQuotation(value: unknown): value is QuotationRecord {
  if (!value || typeof value !== 'object') return false;
  const quotation = value as Record<string, unknown>;
  return typeof quotation.id === 'string' && quotation.id.length > 0
    && typeof quotation.quoteNumber === 'string' && quotation.quoteNumber.length > 0
    && typeof quotation.status === 'string'
    && Array.isArray(quotation.items)
    && Number.isSafeInteger(quotation.subtotal)
    && Number.isSafeInteger(quotation.discountAmount)
    && Number.isSafeInteger(quotation.shippingFee)
    && Number.isSafeInteger(quotation.totalAmount)
    && typeof quotation.expiresAt === 'string';
}

/** Customer identity and all monetary values are deliberately omitted from this request. */
export async function createCustomerQuotation(
  input: CustomerQuotationCreateRequest,
  token: string,
  idempotencyKey: string,
): Promise<QuotationRecord> {
  const response = await requestQuotationJson<{ quotation?: unknown }>(
    '/api/quotations',
    token,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(input) },
    'create',
  );
  if (!isCreatedQuotation(response?.quotation)) {
    throw new QuotationApiError('Chưa xác nhận được kết quả tạo báo giá. Hãy thử lại đúng nội dung này với cùng khóa yêu cầu.');
  }
  return response.quotation;
}

export type QuotationCreateRecoveryResult =
  | { status: 'found'; quotation: QuotationRecord }
  | { status: 'not_found_at_check' };

/** Authenticated owner-scoped lookup only; it never retries or resubmits the create payload. */
export async function recoverCustomerQuotation(
  idempotencyKey: string,
  token: string,
): Promise<QuotationCreateRecoveryResult> {
  try {
    const response = await requestQuotationJson<{ quotation?: unknown }>(
      '/api/quotations/recovery',
      token,
      { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
      'recovery',
    );
    if (!isCreatedQuotation(response?.quotation)) {
      throw new QuotationApiError('Backend khĂ´ng tráº£ vá» má»™t bĂ¡o giĂ¡ cĂ³ thá»ƒ khĂ´i phá»¥c.');
    }
    return { status: 'found', quotation: response.quotation };
  } catch (error) {
    if (error instanceof QuotationApiError && error.status === 404 && error.code === 'IDEMPOTENCY_RESULT_NOT_FOUND') {
      return { status: 'not_found_at_check' };
    }
    throw error;
  }
}

export async function requestQuotationJson<T>(
  path: string,
  token: string,
  init: RequestInit = {},
  context: 'list' | 'detail' | 'action' | 'create' | 'recovery' = 'action',
): Promise<T> {
  if (!token) throw new QuotationApiError(quotationApiStatusMessage(401), 401);
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    response = await fetch(`${quotationApiBaseUrl()}${path}`, { ...init, headers });
  } catch {
    throw new QuotationApiError(context === 'create'
      ? 'Kết nối bị gián đoạn; báo giá có thể đã được tạo. Hãy thử lại đúng nội dung này để khôi phục kết quả đã lưu.'
      : 'Không thể kết nối Backend. Không có kết quả thành công nào được xác nhận.');
  }

  const body = await response.json().catch(() => null) as { message?: unknown; code?: unknown } | null;
  if (!response.ok) {
    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader && /^\d{1,7}$/.test(retryAfterHeader)
      ? Math.max(1, Number(retryAfterHeader))
      : null;
    const fallback = context === 'create' && response.status === 429
      ? `Quá nhiều yêu cầu báo giá. Hãy chờ ${retryAfterSeconds ?? 60} giây rồi retry đúng nội dung với cùng Idempotency-Key.`
      : context === 'create' && body?.code === 'IDEMPOTENCY_KEY_PAYLOAD_MISMATCH'
      ? 'Khóa này đã gắn với nội dung báo giá khác. Hãy chỉnh nội dung yêu cầu để bắt đầu một yêu cầu mới.'
      : context === 'create' && body?.code === 'IDEMPOTENCY_REQUEST_IN_PROGRESS'
        ? 'Yêu cầu cùng khóa đang được xử lý. Hãy chờ một chút rồi thử lại mà không thay đổi nội dung.'
        : context === 'create' && response.status === 409
          ? 'Chưa hoàn tất được yêu cầu báo giá. Hãy thử lại đúng nội dung hiện tại để hệ thống khôi phục hoặc tiếp tục xử lý.'
          : response.status === 409 && (body as any)?.outcome === 'needs_requote'
      ? 'Giá hoặc tồn kho đã thay đổi. Khách hàng cần nhận báo giá mới trước khi chuyển thành đơn hàng.'
      : context === 'recovery'
        ? (response.status === 404
            ? 'API khĂ´i phá»¥c chÆ°a sáºµn sĂ ng hoáº·c khĂ´ng tráº£ máº£ tráº¡ng thĂ¡i; khĂ´ng thá»ƒ káº¿t luáº­n request chÆ°a commit.'
            : quotationApiStatusMessage(response.status, 'detail'))
        : quotationApiStatusMessage(response.status, context);
    const readinessFallback = response.status === 404 && (context === 'action' || context === 'create') || response.status === 503;
    throw new QuotationApiError(
      context === 'create' && response.status === 429
        ? fallback
        : !readinessFallback && typeof body?.message === 'string' && body.message.trim() ? body.message : fallback,
      response.status,
      typeof body?.code === 'string' ? body.code : null,
      retryAfterSeconds,
    );
  }
  return body as T;
}

export async function getQuotationPdfBlob(path: string, token: string): Promise<Blob> {
  if (!token) throw new QuotationApiError(quotationApiStatusMessage(401), 401);
  let response: Response;
  try {
    response = await fetch(`${quotationApiBaseUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    throw new QuotationApiError('Không thể kết nối Backend để tải PDF riêng tư.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: unknown } | null;
    const fallback = quotationApiStatusMessage(response.status, 'detail');
    throw new QuotationApiError(typeof body?.message === 'string' && body.message.trim() ? body.message : fallback, response.status);
  }
  const blob = await response.blob();
  const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...signature) !== '%PDF-') {
    throw new QuotationApiError('Tệp tải về không phải PDF hợp lệ.');
  }
  return blob;
}

export async function downloadApprovedCustomerQuotation(quotation: QuotationRecord, token: string, isCurrentSession: () => boolean = () => true): Promise<void> {
  const data = await requestQuotationJson<{ quotation: QuotationRecord }>(`/api/quotations/${encodeURIComponent(quotation.id)}`, token, { cache: 'no-store' }, 'detail');
  if (!isCurrentSession()) throw new QuotationApiError('Phiên đăng nhập đã thay đổi. Vui lòng mở lại báo giá.', 401);
  if (!data.quotation || data.quotation.id !== quotation.id || data.quotation.version !== quotation.version || !customerQuotationStatus(data.quotation).downloadable) {
    throw new QuotationApiError('Trạng thái hoặc phiên bản báo giá đã thay đổi. Hãy xem thông tin mới trước khi tải.', 409);
  }
  await downloadPrivateQuotationPdf('quotations', quotation.id, token, { regenerate: true, isCurrentSession });
}

export async function downloadPrivateQuotationPdf(scope: 'quotations' | 'staff/quotations' | 'admin/quotations', id: string, token: string, options: { regenerate?: boolean; isCurrentSession?: () => boolean } = {}): Promise<void> {
  const path = `/api/${scope}/${encodeURIComponent(id)}/pdf`;
  if (options.regenerate) {
    await requestQuotationJson(path, token, { method: 'POST' }, 'action');
    const pdf = await getQuotationPdfBlob(path, token);
    if (options.isCurrentSession && !options.isCurrentSession()) throw new QuotationApiError('Phiên đăng nhập đã thay đổi. Vui lòng mở lại báo giá.', 401);
    saveBlob(pdf, `quotation-${id}.pdf`);
    return;
  }
  try {
    const existing = await getQuotationPdfBlob(path, token);
    saveBlob(existing, `quotation-${id}.pdf`);
    return;
  } catch (error) {
    if (!(error instanceof QuotationApiError) || error.status !== 404) throw error;
  }

  await requestQuotationJson(path, token, { method: 'POST' }, 'action');
  const generated = await getQuotationPdfBlob(path, token);
  saveBlob(generated, `quotation-${id}.pdf`);
}

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
