import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VerticalDock } from './VerticalDock';
import { LottieIcon } from '@/components/ui/LottieIcon';
import InteractiveCalendar from '@/components/admin/widgets/InteractiveCalendar';
import { SearchButton } from '@/components/admin/layout/SearchButton';
import { ProductList } from '@/components/admin/views/ProductList';
import { Inventory } from '@/components/admin/views/Inventory';
import { Categories } from '@/components/admin/views/Categories';
import { Marketing } from '@/components/admin/views/Marketing';
import { Banners } from '@/components/admin/views/Banners';
import { FooterManagement } from '@/components/admin/views/FooterManagement';
import { Delivery } from '@/components/admin/views/Delivery';
import { Orders } from '@/components/admin/views/Orders';
import { Disputes } from '@/components/admin/views/Disputes';
import { Invoices } from '@/components/admin/views/Invoices';
import { MainDashboardView } from '@/components/admin/views/MainDashboardView';
import { NotificationDropdown } from '@/components/admin/layout/NotificationDropdown';
import { StaffManager } from '@/components/admin/views/StaffManager';
import { CustomerManager } from '@/components/admin/views/CustomerManager';
import { Search } from 'lucide-react';
import notificationAnimation from '@/data/notification.json';
import settingAnimation from '@/data/setting.json';

// Map view IDs to readable titles
const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  calendar: 'Nội dung & Marketing',
  planned: 'Lịch kế hoạch',
  marketing: 'Chiến dịch marketing',
  banners: 'Quản lý Banner',
  footer: 'Quản lý Footer',
  delivery: 'Lịch giao hàng',
  product: 'Sản phẩm',
  orders: 'Đơn hàng',
  user: 'Khách hàng',
  'user-staff': 'Quản lý Nhân sự',
  performance: 'Hiệu suất',
};

export function DashboardLayout() {
  const { view: routeView } = useParams<{ view?: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(() => routeView || 'dashboard');

  useEffect(() => {
    if (routeView && routeView !== activeView) {
      setActiveView(routeView);
    } else if (!routeView && activeView !== 'dashboard') {
      setActiveView('dashboard');
    }
  }, [routeView]);

  const handleNavigate = (newView: string) => {
    setActiveView(newView);
    navigate(newView === 'dashboard' ? '/dashboard' : `/dashboard/${newView}`, { replace: false });
  };
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotifOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-white font-sans">
      
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80"
      >
        <source src="/videos/dbbg.mp4" type="video/mp4" />
      </video>

      {/* Main Content Area */}
      <div className="relative z-10 flex h-screen p-4 pl-24">
        {/* Left Dock */}
        <VerticalDock activeView={activeView} onNavigate={handleNavigate} />

        {/* Right Area (Navbar + Main Workspace) */}
        <div className="flex-1 flex flex-col gap-5 h-full">
          {/* Top Navbar */}
          <header className="relative z-50 h-[64px] shrink-0 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg flex items-center justify-between px-6">
            
            {/* Left Search */}
            <div className="w-[320px] z-[100]">
              <SearchButton />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              {/* Setting Icon */}
              <button className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors">
                <div className="w-7 h-7">
                  <LottieIcon animationData={settingAnimation} />
                </div>
              </button>

              {/* Notification Icon & Dropdown */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <div className="w-7 h-7">
                    <LottieIcon animationData={notificationAnimation} />
                  </div>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                </button>
                <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-white/10 mx-2"></div>

              {/* User Avatar */}
              <button className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 hover:border-white/30 transition-colors shadow-lg">
                <img 
                  src="https://ui-avatars.com/api/?name=Admin&background=random&color=fff" 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                />
              </button>
            </div>

          </header>

          {/* Main Content Area */}
          <main className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg overflow-hidden p-8 custom-scrollbar transform-gpu will-change-transform">
            {activeView === 'dashboard' ? (
              <MainDashboardView />
            ) : activeView === 'user-staff' ? (
              <StaffManager />
            ) : activeView === 'user-customers' ? (
              <CustomerManager />
            ) : activeView === 'planned' ? (
              <InteractiveCalendar />
            ) : activeView === 'product' || activeView === 'product-list' ? (
              <ProductList />
            ) : activeView === 'inventory' ? (
              <Inventory />
            ) : activeView === 'categories' ? (
              <Categories />
            ) : activeView === 'banners' ? (
              <Banners />
            ) : activeView === 'footer' ? (
              <FooterManagement />
            ) : activeView === 'marketing' ? (
              <Marketing />
            ) : activeView === 'delivery' ? (
              <Delivery />
            ) : activeView === 'orders' || activeView === 'orders-list' ? (
              <Orders />
            ) : activeView === 'orders-disputes' ? (
              <Disputes />
            ) : activeView === 'orders-invoices' ? (
              <Invoices />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-white/40 text-sm">Đang xem</p>
                <h1 className="text-white text-2xl font-bold">{VIEW_LABELS[activeView] ?? activeView}</h1>
                <p className="text-white/40 text-sm mt-4">
                  Nội dung của <strong className="text-white/60">{VIEW_LABELS[activeView]}</strong> sẽ hiển thị ở đây.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
