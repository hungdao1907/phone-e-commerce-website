import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useRewardsStore } from '../../store/useRewardsStore';

interface CheckoutSidebarProps {
  buttonText: string;
  isSubmitting?: boolean;
  onNext: () => void;
  shippingFeeOverride?: number; // e.g. 0 if free, or actual if known
  pricingSnapshot?: {
    lines: Array<{ variantId: string; quantity: number; effectiveUnitPrice: number; lineSubtotal: number }>;
    originalSubtotal: number;
    subtotal: number;
    discountBreakdown: {
      catalogDiscountAmount: number;
      cart: Array<{ id: string; source: 'promo' | 'reward'; appliedAmount: number; eligible: boolean }>;
      cartDiscountAmount: number;
    };
    shipping: { amount: number; free: boolean };
    grandTotal: number;
  } | null;
  pricingLoading?: boolean;
  pricingMessage?: string | null;
  disableButton?: boolean;
  backendPricingRequired?: boolean;
}

export function CheckoutSidebar({ buttonText, isSubmitting = false, onNext, shippingFeeOverride, pricingSnapshot, pricingLoading = false, pricingMessage, disableButton = false, backendPricingRequired = false }: CheckoutSidebarProps) {
  const { items, appliedPromo } = useCartStore();
  const { milestones } = useRewardsStore();

  const subtotal = pricingSnapshot?.subtotal ?? (backendPricingRequired ? 0 : items.reduce((total: number, item: any) => total + item.price * item.quantity, 0));

  // Calculate reward discount
  const activeMilestones = milestones?.filter(m => m.isActive) || [];
  const achievedMilestones = activeMilestones.filter(m => subtotal >= m.amount);
  
  // Highest discount percentage from milestones
  const highestMilestonePercent = achievedMilestones
    .filter(m => m.type === 'voucher' && m.discount)
    .reduce((max, m) => Math.max(max, m.discount || 0), 0);
    
  const rewardDiscount = pricingSnapshot
    ? pricingSnapshot.discountBreakdown.cart.filter(discount => discount.source === 'reward').reduce((sum, discount) => sum + discount.appliedAmount, 0)
    : highestMilestonePercent > 0 ? Math.floor(subtotal * (highestMilestonePercent / 100)) : 0;

  // Promo code discount
  let promoDiscountValue = 0;
  if (pricingSnapshot) {
    promoDiscountValue = pricingSnapshot.discountBreakdown.cart.filter(discount => discount.source === 'promo').reduce((sum, discount) => sum + discount.appliedAmount, 0);
  } else if (appliedPromo && subtotal >= (appliedPromo.minOrderValue || 0)) {
    promoDiscountValue = appliedPromo.discountType === 'percentage'
      ? Math.floor(subtotal * (appliedPromo.discountValue / 100))
      : appliedPromo.discountValue;
  }

  // Free shipping logic
  const isFreeShipping = achievedMilestones.some(m => m.type === 'shipping') || subtotal >= 25000000;
  const shippingFee = pricingSnapshot?.shipping.amount ?? (shippingFeeOverride !== undefined ? shippingFeeOverride : (isFreeShipping ? 0 : 50000));

  const totalDiscount = pricingSnapshot?.discountBreakdown.cartDiscountAmount ?? rewardDiscount + promoDiscountValue;
  const finalTotal = pricingSnapshot?.grandTotal ?? Math.max(0, subtotal - totalDiscount) + shippingFee;

  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm sticky top-24">
      <h3 className="text-base font-bold text-neutral-900 mb-4 pb-4 border-b border-neutral-100 flex items-center justify-between">
        <span>Tóm tắt đơn hàng</span>
        <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full text-xs">{items.length} sản phẩm</span>
      </h3>
      
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto no-scrollbar">
        {items.map(item => (
          <div key={item.id} className="flex gap-3">
            <div className="w-16 h-16 bg-[#f5f7fb] rounded-lg p-1.5 shrink-0 border border-neutral-100">
              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-neutral-900 truncate">{item.name}</p>
              <p className="text-[10px] text-neutral-500 my-0.5">{item.colorName} · {item.storageLabel}</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-medium text-neutral-500">SL: {item.quantity}</span>
                <span className="text-xs font-bold text-neutral-900">{((pricingSnapshot?.lines.find(line => line.variantId === (item.variantId || item.id))?.effectiveUnitPrice ?? item.price) * item.quantity).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 text-sm border-t border-neutral-100 pt-4 mb-6">
        {pricingLoading ? (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">Đang lấy giá chính thức từ hệ thống…</div>
        ) : null}
        {pricingSnapshot && !pricingLoading ? (
          <>
            <div className="flex justify-between text-neutral-600">
              <span>Giá gốc</span><span className="font-semibold text-neutral-900">{pricingSnapshot.originalSubtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Ưu đãi giá sản phẩm</span><span className="font-semibold text-emerald-600">-{pricingSnapshot.discountBreakdown.catalogDiscountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          </>
        ) : null}
        {backendPricingRequired && !pricingSnapshot && !pricingLoading ? (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">Chưa có giá được Backend xác nhận. Không thể đặt hàng cho tới khi tải được bảng giá chính thức.</div>
        ) : null}
        {(!backendPricingRequired || Boolean(pricingSnapshot)) && <>
        <div className="flex justify-between text-neutral-600">
          <span>Tạm tính</span>
          <span className="font-semibold text-neutral-900">{subtotal.toLocaleString('vi-VN')}đ</span>
        </div>
        
        <div className="flex justify-between text-neutral-600">
          <span>Ưu đãi tiến trình</span>
          <span className="font-semibold text-emerald-600">-{rewardDiscount.toLocaleString('vi-VN')}đ</span>
        </div>

        {pricingMessage ? <p role="status" className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">{pricingMessage}</p> : null}

        <div className="flex justify-between text-neutral-600">
          <span>Mã giảm giá {appliedPromo ? `(${appliedPromo.name})` : ''}</span>
          <span className="font-semibold text-emerald-600">-{promoDiscountValue.toLocaleString('vi-VN')}đ</span>
        </div>

        <div className="flex justify-between text-neutral-600">
          <span>Giá được giảm</span>
          <span className="font-semibold text-emerald-600">-{totalDiscount.toLocaleString('vi-VN')}đ</span>
        </div>

        <div className="flex justify-between text-neutral-600">
          <span>Phí vận chuyển</span>
          <span className="font-semibold text-neutral-900">{shippingFee === 0 ? <span className="text-emerald-600">Miễn phí</span> : `${shippingFee.toLocaleString('vi-VN')}đ`}</span>
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-neutral-100">
          <span className="font-bold text-neutral-900">Tổng cộng</span>
          <span className="text-2xl font-bold text-neutral-900 tracking-tight">{finalTotal.toLocaleString('vi-VN')}đ</span>
        </div>
        <p className="text-[10px] text-neutral-400 text-right uppercase tracking-wider">Đã bao gồm VAT</p>
        </>}
      </div>

      <button 
        onClick={onNext}
        disabled={isSubmitting || pricingLoading || disableButton}
        className="w-full h-12 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'ĐANG XỬ LÝ...' : buttonText}
      </button>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Thông tin của bạn được mã hóa an toàn.
      </p>
    </div>
  );
}
