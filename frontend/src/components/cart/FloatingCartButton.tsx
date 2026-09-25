import React from 'react';
import Lottie from 'lottie-react';
import bagAnimation from '../../../public/lottie/bag.json';
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

  const lottieRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (cartItemCount > 0 && lottieRef.current) {
      lottieRef.current.stop();
      lottieRef.current.play();
    }
  }, [cartItemCount]);

  return (
    <button
      id="floating-cart-btn"
      onClick={() => {
        if (lottieRef.current) {
          lottieRef.current.stop();
          lottieRef.current.play();
        }
        setCartDrawerOpen(true);
      }}
      className="fixed right-6 bottom-10 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-40 w-[60px] h-[60px] rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
      style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.4), inset 0 -1px 1px rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      }}
      aria-label="Mở giỏ hàng"
    >
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <Lottie
          lottieRef={lottieRef}
          animationData={bagAnimation}
          loop={false}
          autoplay={false}
          style={{ width: '42px', height: '42px' }}
        />
        {cartItemCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(239,68,68,0.4)] border border-red-400">
            {cartItemCount}
          </span>
        )}
      </div>
    </button>
  );
}
