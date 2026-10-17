import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, FileText, Loader2, Trash2 } from 'lucide-react';
import { fetchChatbotCatalogProducts } from '@/services/chatbot.api';
import type { ChatbotProduct, ChatbotVariant } from '@/components/chatbot/types';
import { useAuthStore } from '@/store/authStore';
import { createCustomerQuotation, quotationApiEnabled, recoverCustomerQuotation, type CustomerQuotationCreateRequest } from './quotation-api';
import {
  clearQuotationCreateRecoveryMarker,
  getQuotationCreateIntent,
  loadQuotationCreateRecoveryMarker,
  quotationCreateFingerprint,
  saveQuotationCreateRecoveryMarker,
  type QuotationCreateIntent,
} from './quotation-create-idempotency';
import { clearQuotationDraft, loadQuotationDraft, saveQuotationDraft, type QuotationSelectionItem } from './quotation-draft';
import { subscribeToQuotationDraftChanges } from './quotation-events';
import type { QuotationRecord } from './QuotationDetails';
import { PaymentMethodDropdown } from './PaymentMethodDropdown';

type DraftLine = QuotationSelectionItem & { quantityText: string };
type CustomerQuotationRequestFormProps = { onCreated: (quotation: QuotationRecord) => void };

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function isQuantityValid(value: string, stock: number): boolean {
  if (!/^\d+$/.test(value)) return false;
  const quantity = Number(value);
  return Number.isSafeInteger(quantity) && quantity > 0 && quantity <= stock;
}

function getVariant(product: ChatbotProduct | undefined, variantId: string): ChatbotVariant | undefined {
  return product?.variants?.find(variant => variant.id === variantId);
}

export function CustomerQuotationRequestForm({ onCreated }: CustomerQuotationRequestFormProps) {
  const token = useAuthStore(state => state.token);
  const [lines, setLines] = useState<DraftLine[]>(() => loadQuotationDraft().map(item => ({ ...item, quantityText: String(item.quantity) })));
  const [products, setProducts] = useState<ChatbotProduct[]>([]);
  const [catalogRefreshRevision, setCatalogRefreshRevision] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANK_TRANSFER'>('COD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [recoveryState, setRecoveryState] = useState<'idle' | 'checking' | 'unresolved'>('idle');
  const [recoveryCheckNonce, setRecoveryCheckNonce] = useState(0);
  const submittingRef = useRef(false);
  const createIntentRef = useRef<QuotationCreateIntent | null>(null);
  const onCreatedRef = useRef(onCreated);

  useEffect(() => { onCreatedRef.current = onCreated; }, [onCreated]);

  useEffect(() => subscribeToQuotationDraftChanges(source => {
    const currentDraft = loadQuotationDraft();
    setLines(currentDraft.map(item => ({ ...item, quantityText: String(item.quantity) })));
    if (source === 'chatbot') setCatalogRefreshRevision(revision => revision + 1);
  }), []);

  useEffect(() => {
    const marker = token ? loadQuotationCreateRecoveryMarker() : null;
    if (!marker || !token) {
      setRecoveryState('idle');
      return;
    }
    let cancelled = false;
    setRecoveryState('checking');
    void recoverCustomerQuotation(marker.key, token).then(result => {
      if (cancelled) return;
      if (result.status === 'found') {
        clearQuotationCreateRecoveryMarker();
        createIntentRef.current = null;
        setRecoveryState('idle');
        onCreatedRef.current(result.quotation);
      } else {
        setRecoveryState('unresolved');
      }
    }).catch(() => {
      if (!cancelled) setRecoveryState('unresolved');
    });
    return () => { cancelled = true; };
  }, [token, recoveryCheckNonce]);

  const productIds = useMemo(() => [...new Set(lines.map(line => line.productId))], [lines]);

  useEffect(() => {
    if (!productIds.length) {
      setProducts([]);
      setCatalogError('');
      return;
    }
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError('');
    void fetchChatbotCatalogProducts(productIds).then(catalog => {
      if (cancelled) return;
      setProducts(catalog);
      if (!catalog.length) setCatalogError('Không tìm thấy sản phẩm đang hoạt động trong danh mục Backend. Hãy chọn lại sản phẩm từ Chatbot.');
    }).catch(() => {
      if (!cancelled) setCatalogError('Không thể xác minh lại phiên bản, giá và tồn kho từ Backend. Yêu cầu chưa được gửi.');
    }).finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [productIds.join('|'), catalogRefreshRevision]);

  const resolvedLines = lines.map(line => {
    const product = products.find(candidate => candidate.id === line.productId);
    const variant = getVariant(product, line.variantId);
    const valid = Boolean(variant && variant.availability === 'in_stock' && variant.stock > 0
      && Number.isSafeInteger(variant.price) && variant.price! >= 0
      && isQuantityValid(line.quantityText, variant.stock));
    return { line, product, variant, valid };
  });
  const canSubmit = Boolean(token && quotationApiEnabled() && recoveryState !== 'checking' && lines.length > 0 && !catalogLoading && !catalogError
    && resolvedLines.every(item => item.valid)
    && shippingAddress.trim().length > 0 && shippingAddress.trim().length <= 1000
    && shippingPhone.trim().length >= 6 && shippingPhone.trim().length <= 40 && !busy);

  const persistLines = (next: DraftLine[]) => {
    setLines(next);
    if (!next.length) {
      clearQuotationDraft();
      return;
    }
    const validItems = next
      .filter(line => /^\d+$/.test(line.quantityText))
      .map(line => ({ productId: line.productId, variantId: line.variantId, quantity: Number(line.quantityText) }));
    if (validItems.length === next.length) saveQuotationDraft(validItems);
  };

  const updateLine = (index: number, update: Partial<DraftLine>) => {
    persistLines(lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...update } : line));
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setError('');
    if (!token) {
      setError('Vui lòng đăng nhập bằng tài khoản khách hàng để gửi yêu cầu báo giá.');
      return;
    }
    if (!quotationApiEnabled()) {
      setError('Quotation API is not activated. The request was not sent.');
      return;
    }
    if (!canSubmit) {
      setError('Kiểm tra lại sản phẩm, phiên bản, số lượng, địa chỉ và số điện thoại trước khi gửi.');
      return;
    }
    const request: CustomerQuotationCreateRequest = {
      items: lines.map(line => ({ variantId: line.variantId, quantity: Number(line.quantityText) })),
      shippingAddress: shippingAddress.trim(),
      shippingPhone: shippingPhone.trim(),
      paymentMethod,
      deliveryMethod: 'delivery',
    };
    if (recoveryState === 'unresolved'
      && (!createIntentRef.current || createIntentRef.current.fingerprint !== quotationCreateFingerprint(request))) {
      setError('The previous result is unresolved. Check recovery with the same key; do not start a new request.');
      return;
    }
    let intent: QuotationCreateIntent;
    try {
      intent = getQuotationCreateIntent(createIntentRef.current, request);
    } catch {
      setError('Trình duyệt không có bộ tạo khóa an toàn. Hãy cập nhật trình duyệt trước khi gửi yêu cầu.');
      return;
    }
    createIntentRef.current = intent;
    if (!saveQuotationCreateRecoveryMarker({ key: intent.key, createdAt: Date.now() })) {
      setError('Secure session storage is unavailable. The request was not sent to avoid losing its recovery key on refresh.');
      return;
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      const quotation = await createCustomerQuotation(request, token, intent.key);
      clearQuotationCreateRecoveryMarker();
      createIntentRef.current = null;
      clearQuotationDraft();
      setLines([]);
      setRecoveryState('idle');
      if (useAuthStore.getState().token === token) onCreatedRef.current(quotation);
    } catch (cause) {
      setRecoveryState('unresolved');
      setError(cause instanceof Error
        ? cause.message
        : 'Chưa xác nhận được kết quả. Hãy thử lại đúng nội dung hiện tại để khôi phục kết quả báo giá.');
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><FileText className="h-5 w-5" /></span>
        <div>
          <h3 className="font-bold text-slate-900">Tạo yêu cầu báo giá</h3>
          <p className="mt-1 text-sm text-slate-500">Chọn sản phẩm trong Chatbot rồi tiếp tục tại đây. Backend sẽ xác minh variant, giá và tồn kho; biểu mẫu không gửi giá do trình duyệt tự tính.</p>
        </div>
      </div>

      {!lines.length ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Chưa có sản phẩm được chọn. Hãy mở Chatbot, chọn một phiên bản còn hàng và nhấn “Yêu cầu báo giá”.</p>
      ) : (
        <form onSubmit={event => void submit(event)} className="space-y-4">
          <div className="space-y-3">
            {resolvedLines.map(({ line, product, variant, valid }, index) => {
              const selectableVariants = product?.variants || [];
              return (
                <div key={`${line.productId}:${index}`} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{product?.name || 'Đang xác minh sản phẩm…'}</p>
                      {variant && Number.isSafeInteger(variant.price) && <p className="mt-1 text-xs text-slate-600">Giá Backend hiện tại: {formatVnd(variant.price!)}</p>}
                    </div>
                    <button type="button" aria-label="Xóa sản phẩm khỏi yêu cầu báo giá" onClick={() => persistLines(lines.filter((_, lineIndex) => lineIndex !== index))} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  {product && <label className="mt-3 block text-xs font-semibold text-slate-600">Phiên bản
                    <select value={line.variantId} onChange={event => updateLine(index, { variantId: event.target.value, quantityText: '1' })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                      {selectableVariants.map(option => <option key={option.id} value={option.id} disabled={option.availability !== 'in_stock'}>{Object.entries(option.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || option.id}{option.availability !== 'in_stock' ? ' — Hết hàng' : ''}</option>)}
                    </select>
                  </label>}
                  {variant && <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={valid ? 'text-emerald-700' : 'text-rose-700'}>{valid ? `Còn ${variant.stock} sản phẩm` : 'Phiên bản không khả dụng hoặc số lượng vượt tồn kho.'}</span>
                    <label className="font-semibold text-slate-600">Số lượng <input aria-label={`Số lượng ${product?.name || 'sản phẩm'}`} type="number" min={1} max={variant.stock} step={1} value={line.quantityText} onChange={event => updateLine(index, { quantityText: event.target.value })} className="ml-2 w-20 rounded-lg border border-slate-200 px-2 py-1.5" /></label>
                  </div>}
                  {!variant && <p className="mt-2 text-xs text-rose-700">Không xác minh được variant này trong danh mục hiện tại. Vui lòng xóa và chọn lại từ Chatbot.</p>}
                </div>
              );
            })}
          </div>

          {catalogLoading && <p role="status" className="text-sm text-slate-500">Đang xác minh sản phẩm, giá và tồn kho từ Backend…</p>}
          {!quotationApiEnabled() && <p role="status" className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">Quotation API chưa được kích hoạt; request không được gửi cho đến khi Backend sẵn sàng.</p>}
          {recoveryState === 'checking' && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Đang tìm kết quả đã commit bằng khóa khôi phục.</p>}
          {recoveryState === 'unresolved' && <div role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p>Kết quả request trước chưa được xác nhận. Không gửi request mới; hãy kiểm tra bằng cùng khóa. Chỉ retry khi payload trong phiên hiện tại khớp.</p>
            <button type="button" onClick={() => setRecoveryCheckNonce(value => value + 1)} className="mt-2 rounded-lg border border-amber-300 px-3 py-1.5 font-semibold">Kiểm tra trạng thái</button>
          </div>}
          {catalogError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{catalogError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Địa chỉ giao hàng<input required maxLength={1000} value={shippingAddress} onChange={event => setShippingAddress(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" autoComplete="street-address" /></label>
            <label className="text-xs font-semibold text-slate-600">Số điện thoại<input required minLength={6} maxLength={40} value={shippingPhone} onChange={event => setShippingPhone(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" autoComplete="tel" /></label>
          </div>
          <PaymentMethodDropdown value={paymentMethod} onChange={setPaymentMethod} disabled={busy} />

          {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
          {!token && <p className="text-sm text-amber-800">Bạn cần đăng nhập bằng tài khoản khách hàng trước khi gửi yêu cầu.</p>}
          {token && !busy && !catalogLoading && !catalogError && quotationApiEnabled() && recoveryState !== 'checking' && !canSubmit && <p id="quotation-submit-help" role="status" className="text-sm text-amber-800">
            {!resolvedLines.every(item => item.valid)
              ? 'Vui lòng chọn phiên bản còn hàng và số lượng hợp lệ trước khi gửi.'
              : !shippingAddress.trim() || shippingAddress.trim().length > 1000
                ? 'Vui lòng nhập địa chỉ giao hàng hợp lệ (tối đa 1.000 ký tự).'
                : 'Vui lòng nhập số điện thoại từ 6 đến 40 ký tự trước khi gửi.'}
          </p>}
          <button type="submit" disabled={!canSubmit} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi yêu cầu…</> : 'Gửi yêu cầu báo giá'}
          </button>
        </form>
      )}
    </section>
  );
}
