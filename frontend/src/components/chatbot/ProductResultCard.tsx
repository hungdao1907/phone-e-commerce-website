import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChatbotProduct, ChatbotVariant } from './types';
import { resolveBackendUrl } from '../../services/chatbot.api';
import { isValidChatbotQuantity, makeQuotationSelection } from './quotation-selection';
import { addQuotationDraftSelection } from '../quotations/quotation-draft';
import { useAuthStore } from '../../store/authStore';
import { ShoppingBag, ChevronRight, Sparkles, FileText } from 'lucide-react';

interface ProductResultCardProps {
  product: ChatbotProduct;
}

function normalizeAttributeKey(key: string): string {
  return key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/gi, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function attributeLabel(key: string): string {
  const normalized = normalizeAttributeKey(key);
  const labels: Record<string, string> = {
    storage: 'Dung lượng', dungluong: 'Dung lượng', capacity: 'Dung lượng',
    color: 'Màu sắc', colors: 'Màu sắc', mausac: 'Màu sắc',
    ram: 'RAM', memory: 'Bộ nhớ', size: 'Kích thước', kichthuoc: 'Kích thước',
    version: 'Phiên bản', phienban: 'Phiên bản', connectivity: 'Kết nối',
    material: 'Chất liệu',
  };
  return labels[normalized] || key.trim();
}

function variantLabel(variant: ChatbotVariant, index: number): string {
  const attributes = Object.entries(variant.attributes || {})
    .filter(([, value]) => (typeof value === 'string' && value.trim().length > 0)
      || (typeof value === 'number' && Number.isFinite(value)))
    .sort(([left], [right]) => {
      const priority = (key: string) => {
        const normalized = normalizeAttributeKey(key);
        return ['storage', 'dungluong', 'capacity'].includes(normalized) ? 0
          : ['color', 'colors', 'mausac'].includes(normalized) ? 1 : 2;
      };
      return priority(left) - priority(right);
    })
    .map(([key, value]) => `${attributeLabel(key)}: ${String(value).trim()}`);
  if (attributes.length) return attributes.join(' · ');
  if (variant.sku?.trim()) return `SKU: ${variant.sku.trim()}`;
  return `Tùy chọn ${index + 1}`;
}

function formatVnd(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return null;
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function ProductResultCard({ product }: ProductResultCardProps) {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const [variantId, setVariantId] = useState(() =>
    variants.find(variant => variant.availability === 'in_stock')?.id || variants[0]?.id || '',
  );
  const [quantity, setQuantity] = useState('1');
  const [actionError, setActionError] = useState('');
  const selectedVariant = useMemo(() => variants.find(variant => variant.id === variantId), [variants, variantId]);
  const imageUrl = resolveBackendUrl(product.image_url);
  const price = formatVnd(selectedVariant?.price);
  const originalPrice = formatVnd(selectedVariant?.original_price);
  const discountPercent = selectedVariant?.price !== null && selectedVariant?.price !== undefined
    && selectedVariant?.original_price !== null && selectedVariant?.original_price !== undefined
    && selectedVariant.original_price > selectedVariant.price
    ? Math.round(((selectedVariant.original_price - selectedVariant.price) / selectedVariant.original_price) * 100)
    : null;
  const available = selectedVariant?.availability === 'in_stock' && selectedVariant.stock > 0 && price !== null;
  const validQuantity = available && isValidChatbotQuantity(quantity, selectedVariant.stock);

  const requestQuotation = () => {
    setActionError('');
    if (!available || !product.id || !selectedVariant) {
      setActionError('Phiên bản này hiện không có sẵn hoặc chưa thể xác minh. Vui lòng chọn phiên bản khác.');
      return;
    }
    const selection = makeQuotationSelection(product.id, selectedVariant.id, quantity, selectedVariant.stock);
    if (!selection || !addQuotationDraftSelection(selection)) {
      setActionError('Không thể lưu lựa chọn báo giá trên thiết bị. Vui lòng thử lại.');
      return;
    }
    if (!token) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'customer') {
      setActionError('Vui lòng đăng nhập bằng tài khoản khách hàng để tiếp tục yêu cầu báo giá.');
      return;
    }
    navigate('/profile');
  };

  return (
    <article className="group relative flex w-[235px] sm:w-[245px] flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-blue-400/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.09)]">
      <Link to={product.id ? `/product/${product.id}` : '/'} draggable={false} className="block">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-50 to-neutral-100/70 p-3">
          <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-blue-600 shadow-xs backdrop-blur-md">
              <Sparkles className="h-2.5 w-2.5" /> WebPhone
            </span>
            {discountPercent !== null && discountPercent > 0 && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{discountPercent}%</span>}
          </div>
          {imageUrl ? <img src={imageUrl} alt={product.name || 'Sản phẩm WebPhone'} draggable={false} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" loading="lazy" /> : <ShoppingBag className="h-10 w-10 stroke-[1.5] text-neutral-300" />}
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-between bg-white p-3.5">
        <div>
          <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">{product.brand || 'Sản phẩm WebPhone'}</div>
          <Link to={product.id ? `/product/${product.id}` : '/'} className="line-clamp-2 text-[13px] font-semibold leading-snug text-neutral-900 hover:text-blue-600">{product.name || 'Sản phẩm'}</Link>

          {variants.length > 0 ? (
            <label className="mt-3 block text-[11px] font-semibold text-neutral-600">
              Phiên bản
              <select value={variantId} onChange={event => { setVariantId(event.target.value); setQuantity('1'); setActionError(''); }} className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2 py-2 text-xs font-medium text-neutral-800">
                {variants.map((variant, index) => <option key={variant.id} value={variant.id} disabled={variant.availability !== 'in_stock'}>{variantLabel(variant, index)}{variant.availability !== 'in_stock' ? ' — Hết hàng' : ''}</option>)}
              </select>
            </label>
          ) : <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">Chưa xác minh được phiên bản sản phẩm để tạo báo giá.</p>}

          {price !== null ? <div className="mt-2.5 flex flex-wrap items-baseline gap-2"><span className="text-[15px] font-bold tracking-tight text-rose-600">{price}</span>{originalPrice && selectedVariant?.original_price! > (selectedVariant?.price || 0) && <span className="text-[11px] text-neutral-400 line-through">{originalPrice}</span>}</div> : <p className="mt-2.5 text-xs font-medium text-neutral-500">{selectedVariant ? 'Không thể xác minh giá hiện tại.' : 'Chưa có phiên bản khả dụng.'}</p>}
          {selectedVariant && <p className={`mt-1 text-[11px] ${available ? 'text-emerald-700' : 'text-rose-600'}`}>{available ? `Còn ${selectedVariant.stock} sản phẩm` : 'Phiên bản hiện không có sẵn'}</p>}
          {available && <label className="mt-2 block text-[11px] font-semibold text-neutral-600">Số lượng<input aria-label="Số lượng yêu cầu báo giá" type="number" min={1} max={selectedVariant.stock} step={1} value={quantity} onChange={event => setQuantity(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-200 px-2 py-1.5 text-xs" /></label>}
          {!validQuantity && available && <p className="mt-1 text-[11px] text-rose-600">Nhập số nguyên từ 1 đến {selectedVariant.stock}.</p>}
          {actionError && <p role="alert" className="mt-2 text-[11px] text-rose-700">{actionError}</p>}
        </div>

        <div className="mt-3 space-y-2 border-t border-neutral-100 pt-2.5">
          <button type="button" onClick={requestQuotation} disabled={!validQuantity} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-neutral-300">
            <FileText className="h-3.5 w-3.5" /> Yêu cầu báo giá
          </button>
          <Link to={product.id ? `/product/${product.id}` : '/'} className="inline-flex w-full items-center justify-center text-[11px] font-semibold text-blue-600 hover:text-blue-700">Xem sản phẩm <ChevronRight className="ml-0.5 h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </article>
  );
}
