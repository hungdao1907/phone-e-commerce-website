import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { VerticalDock } from './VerticalDock';
import InteractiveCalendar from '@/components/admin/widgets/InteractiveCalendar';
import { SearchButton } from '@/components/admin/layout/SearchButton';
import { ProductList } from '@/components/admin/views/ProductList';
import { Inventory } from '@/components/admin/views/Inventory';
import { Categories } from '@/components/admin/views/Categories';
import { Marketing } from '@/components/admin/views/Marketing';
import { Banners } from '@/components/admin/views/Banners';
import { Orders } from '@/components/admin/views/Orders';
import { Reviews } from '@/components/admin/views/Reviews';
import { Complaints } from '@/components/admin/views/Complaints';
import { Invoices } from '@/components/admin/views/Invoices';
import { MainDashboardView } from '@/components/admin/views/MainDashboardView';
import { StaffManager } from '@/components/admin/views/StaffManager';
import { CustomerManager } from '@/components/admin/views/CustomerManager';
import { LeadManager } from '@/components/admin/views/LeadManager';
import { SettingsManager } from '@/components/admin/views/SettingsManager';
import { NotificationCenter } from '@/components/admin/NotificationCenter';

// Map view IDs to readable titles
const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  calendar: 'Nội dung & Marketing',
  planned: 'Lịch kế hoạch',
  marketing: 'Chiến dịch marketing',
  banners: 'Quản lý Banner',
  product: 'Sản phẩm',
  orders: 'Đơn hàng',
  crm: 'CRM',
  'crm-leads': 'Khách hàng tiềm năng',
  'crm-customers': 'Khách hàng',
  user: 'Nhân sự',
  'user-staff': 'Quản lý Nhân sự',
  'marketing-module': 'Marketing',
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
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleOpenNotifCenter = React.useCallback(() => setIsNotifCenterOpen(true), []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#183D61] via-[#ACD99C] to-[#E0CD39] text-white font-sans">


      {/* Main Content Area */}
      <div className="relative z-10 flex h-screen p-4 pl-24">
        {/* Left Dock */}
        <VerticalDock activeView={activeView} onNavigate={handleNavigate} />

        {/* Right Area (Navbar + Main Workspace) */}
        <div className="flex-1 flex flex-col h-full bg-[#0D1F16]/70 backdrop-blur-md border border-white/10 rounded-3xl shadow-lg overflow-hidden">
          {/* Top Navbar */}
          <header className="relative z-50 h-[80px] shrink-0 flex items-center px-8">

            {/* Left Spacer */}
            <div className="flex-1"></div>

            {/* Center Search */}
            <div className="w-[320px] z-[100] flex justify-center">
              <SearchButton onNavigate={setActiveView} />
            </div>

            {/* Right Icons */}
            <div className="flex flex-1 items-center justify-end gap-4 relative">
              {/* Removed notification button */}
            </div>

          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar transform-gpu will-change-transform">
            {activeView === 'dashboard' ? (
              <MainDashboardView onViewAll={handleOpenNotifCenter} />
            ) : activeView === 'user-staff' ? (
              <StaffManager />
            ) : activeView === 'crm-customers' ? (
              <CustomerManager />
            ) : activeView === 'crm-leads' ? (
              <LeadManager />
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
            ) : activeView === 'marketing' ? (
              <Marketing />
            ) : activeView === 'orders' || activeView === 'orders-list' ? (
              <Orders />
            ) : activeView === 'orders-reviews' ? (
              <Reviews />
            ) : activeView === 'orders-complaints' ? (
              <Complaints />
            ) : activeView === 'orders-invoices' ? (
              <Invoices />
            ) : activeView === 'settings' ? (
              <SettingsManager />
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

      {/* Notification Center Drawer — overlay on full layout */}
      <NotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
      />
    </div>
  );
}
