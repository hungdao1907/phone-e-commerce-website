import React, { useEffect, useRef } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { CartRewardProgress } from './CartRewardProgress';
import { PromoCode } from './PromoCode';
import { CartRecommendations } from './CartRecommendations';
import { CartItemCard } from './CartItemCard';
import { useNavigate } from 'react-router-dom';
import { useRewardsStore } from '../../store/useRewardsStore';

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen } = useAppStore();
  const { items, appliedPromo, setAppliedPromo } = useCartStore();
  const { milestones } = useRewardsStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartDrawerOpen(false);
    };
    if (cartDrawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [cartDrawerOpen, setCartDrawerOpen]);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setCartDrawerOpen(false);
      }
    };
    if (cartDrawerOpen) {
      setTimeout(() => window.addEventListener('click', handleClickOutside), 10);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [cartDrawerOpen, setCartDrawerOpen]);

  if (!cartDrawerOpen) return null;

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 1. Tính toán Ưu đãi tiến trình
  const activeMilestones = milestones.filter(m => m.isActive).sort((a, b) => b.amount - a.amount);
  const reachedMilestone = activeMilestones.find(m => subtotal >= m.amount && m.type === 'voucher' && m.discount);
  const milestoneDiscount = reachedMilestone && reachedMilestone.discount ? Math.floor(subtotal * (reachedMilestone.discount / 100)) : 0;

  // 2. Tính toán Mã giảm giá
  let promoDiscount = 0;
  if (appliedPromo && subtotal >= appliedPromo.minOrderValue) {
    promoDiscount = appliedPromo.discountType === 'percentage' 
      ? Math.floor(subtotal * (appliedPromo.discountValue / 100))
      : appliedPromo.discountValue;
  }

  const totalDiscount = milestoneDiscount + promoDiscount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const handleApplyPromo = async (code: string) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/promo-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, subtotal })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Mã giảm giá không hợp lệ.');
    }
    setAppliedPromo(data.campaign);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handleCheckout = () => {
    setCartDrawerOpen(false);
    navigate('/checkout');
  };



  return (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-300" 
        onClick={() => setCartDrawerOpen(false)}
      />

      {/* Drawer */}
      <div 
        ref={drawerRef}
        className="relative w-full max-w-[440px] h-[100dvh] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 ease-out border-l border-neutral-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/60 bg-white">
          <div className="flex items-center gap-2 text-neutral-900">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="text-base font-bold tracking-tight">GIỎ HÀNG</h2>
            <span className="text-sm font-semibold text-neutral-500">({totalQuantity})</span>
          </div>
          <button 
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 -mr-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length > 0 ? (
          <>
            {/* Scrollable Content */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain bg-white flex flex-col focus:outline-none"
              tabIndex={0}
              data-lenis-prevent
            >
              <CartRewardProgress subtotal={subtotal} />
              
              {/* Cart Items */}
              <div className="flex flex-col divide-y divide-neutral-100 px-5">
                {items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </div>

              <PromoCode 
                onApply={handleApplyPromo} 
                onRemove={handleRemovePromo} 
                appliedCode={appliedPromo ? appliedPromo.name : null} 
                discountAmount={promoDiscount} 
              />
              
              <CartRecommendations />
            </div>

            <div className="border-t border-neutral-200 bg-white p-5 space-y-4">
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-neutral-900">{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                
                <div className="flex justify-between text-emerald-600">
                  <span>Ưu đãi tiến trình</span>
                  <span className="font-semibold">-{milestoneDiscount.toLocaleString('vi-VN')}đ</span>
                </div>
                
                <div className="flex justify-between text-emerald-600">
                  <span>Mã giảm giá</span>
                  <span className="font-semibold">-{promoDiscount.toLocaleString('vi-VN')}đ</span>
                </div>
                
                <div className="flex justify-between text-emerald-600 border-t border-dashed border-emerald-100 pt-2.5 mt-1">
                  <span className="font-bold">Giá được giảm</span>
                  <span className="font-bold">-{totalDiscount.toLocaleString('vi-VN')}đ</span>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-neutral-100">
                  <span className="font-bold text-neutral-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-neutral-900 tracking-tight">
                    {finalTotal.toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 text-right uppercase tracking-wider">Đã bao gồm VAT</p>
              </div>
              
              <div className="flex flex-col gap-2.5 pt-2">
                <button 
                  onClick={handleCheckout}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold h-12 rounded-xl transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  TIẾP TỤC THANH TOÁN
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f8f9fc]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-neutral-100 mb-5">
              <ShoppingBag className="w-8 h-8 text-neutral-300" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Giỏ hàng đang trống</h3>
            <p className="text-sm text-neutral-500 mb-8 max-w-[250px]">
              Thêm sản phẩm vào giỏ để bắt đầu mua sắm và nhận các ưu đãi hấp dẫn.
            </p>
            <button 
              onClick={() => setCartDrawerOpen(false)}
              className="bg-black text-white px-8 h-11 rounded-full text-sm font-bold hover:bg-neutral-800 transition-colors active:scale-95 shadow-sm"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
