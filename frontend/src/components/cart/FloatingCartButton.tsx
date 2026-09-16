import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { useLocation } from 'react-router-dom';

export function FloatingCartButton() {
  const { setCartDrawerOpen } = useAppStore();
  const items = useCartStore((state: any) => state.items);
  const cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0);
  const location = useLocation();

  // Ẩn nút giỏ hàng ở trang Cửa hàng (Home), Khám phá (Explore), Checkout, Auth, Admin
  const hideCartPaths = ['/', '/login', '/dashboard', '/checkout', '/order-success', '/profile'];
  const isExplorePage = location.pathname.toLowerCase().includes('explore');
  const isHiddenPath = hideCartPaths.includes(location.pathname) || 
                       hideCartPaths.some(p => p !== '/' && location.pathname.startsWith(p + '/'));

  if (isExplorePage || isHiddenPath) return null;

  return (
    <button
      id="floating-cart-btn"
      onClick={() => setCartDrawerOpen(true)}
      className="fixed right-6 bottom-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-40 w-14 h-14 bg-black text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 hover:bg-neutral-800"
      aria-label="Mở giỏ hàng"
    >
      <div className="relative">
        <ShoppingBag className="w-6 h-6" />
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2.5 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-black">
            {cartItemCount}
          </span>
        )}
      </div>
    </button>
  );
}
