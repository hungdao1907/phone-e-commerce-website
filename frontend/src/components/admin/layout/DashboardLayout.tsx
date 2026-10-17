import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VerticalDock } from './VerticalDock';
import { dashboardViewPath, isQuotationView } from './dashboard-navigation';
import InteractiveCalendar from '@/components/admin/widgets/InteractiveCalendar';
import { SearchButton } from '@/components/admin/layout/SearchButton';
import { ProductList } from '@/components/admin/views/ProductList';
import { Inventory } from '@/components/admin/views/Inventory';
import { Categories } from '@/components/admin/views/Categories';
import { Marketing } from '@/components/admin/views/Marketing';
import { Banners } from '@/components/admin/views/Banners';
import { HomeFeaturedProducts } from '@/components/admin/views/HomeFeaturedProducts';
import { Orders } from '@/components/admin/views/Orders';
import { Reviews } from '@/components/admin/views/Reviews';
import { Complaints } from '@/components/admin/views/Complaints';
import { Invoices } from '@/components/admin/views/Invoices';
import { MainDashboardView } from '@/components/admin/views/MainDashboardView';
import { StaffManager } from '@/components/admin/views/StaffManager';
import { CustomerManager } from '@/components/admin/views/CustomerManager';
import { LeadManager } from '@/components/admin/views/LeadManager';
import { SettingsManager } from '@/components/admin/views/SettingsManager';
import { AdminChatWidget } from '@/components/admin/chat/AdminChatWidget';
import { NotificationCenter } from '@/components/admin/widgets/NotificationCenter';
import { StaffQuotations } from '@/components/quotations/StaffQuotations';
import { AdminQuotationAssignments } from '@/components/quotations/AdminQuotationAssignments';
import { StaffNotificationsView, StaffProfileView } from '@/components/staff/StaffViews';
import { useAuthStore } from '@/store/authStore';

// Map view IDs to readable titles
const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  calendar: 'Nội dung & Marketing',
  planned: 'Lịch kế hoạch',
  marketing: 'Chiến dịch marketing',
  banners: 'Quản lý Banner',
  'home-featured-products': 'Sản phẩm nổi bật',
  product: 'Sản phẩm',
  orders: 'Đơn hàng',
  crm: 'CRM',
  'crm-leads': 'Khách hàng tiềm năng',
  'crm-customers': 'Khách hàng',
  user: 'Nhân sự',
  'user-staff': 'Quản lý Nhân sự',
  'marketing-module': 'Marketing',
  quotations: 'Báo giá',
  notifications: 'Thông báo',
  profile: 'Hồ sơ cá nhân',
};

export function DashboardLayout() {
  const { view: routeView } = useParams<{ view?: string }>();
  const navigate = useNavigate();
  const activeView = routeView || 'dashboard';
  const role = useAuthStore((state) => state.user?.role);
  const isStaff = role === 'staff';
  const isAdmin = role === 'admin' || role === 'superadmin';
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);

  const handleNavigate = (newView: string) => {
    navigate(dashboardViewPath(newView));
  };

  const handleOpenNotifCenter = useCallback(() => setIsNotifCenterOpen(true), []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white font-sans"
      style={{
        background: `
          radial-gradient(60% 50% at 85% 0%, rgba(90, 255, 170, 0.38), transparent 70%),
          radial-gradient(50% 45% at 10% 20%, rgba(30, 170, 110, 0.35), transparent 70%),
          radial-gradient(70% 40% at 50% 100%, rgba(62, 224, 140, 0.14), transparent),
          linear-gradient(170deg, #0e6347 0%, #0a4430 30%, #062a1e 60%, #030d09 100%)
        `,
        backgroundColor: '#040b08',
        color: '#eefaf3'
      }}
    >

      {/* Main Content Area */}
      <div className="relative z-10 flex h-screen p-4 pl-24">
        {/* Left Dock */}
        <VerticalDock activeView={activeView} onNavigate={handleNavigate} />

        {/* Right Area (Navbar + Main Workspace) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Navbar */}
          <header className="relative z-50 h-[80px] shrink-0 flex items-center px-8">

            {/* Left Spacer */}
            <div className="flex-1"></div>

            {/* Center Search */}
            <div className="w-[320px] z-[100] flex justify-center">
              <SearchButton onNavigate={handleNavigate} />
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
            ) : activeView === 'product' || activeView === 'product-list' || activeView === 'products' ? (
              <ProductList />
            ) : activeView === 'inventory' ? (
              <Inventory />
            ) : activeView === 'categories' ? (
              <Categories />
            ) : activeView === 'banners' ? (
              <Banners />
            ) : activeView === 'home-featured-products' ? (
              <HomeFeaturedProducts />
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
            ) : isQuotationView(activeView) ? (
              isStaff ? <StaffQuotations initialTab={activeView} /> : isAdmin ? <AdminQuotationAssignments /> : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Chỉ Staff được phân công xem báo giá; chỉ Admin/Superadmin được quản lý phân công.</div>
              )
            ) : activeView === 'notifications' || activeView === 'my-notifications' ? (
              <StaffNotificationsView />
            ) : activeView === 'profile' ? (
              <StaffProfileView />
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

      {/* Floating Admin Chat Widget */}
      <AdminChatWidget />

      {/* Notification Center Drawer — overlay on full layout */}
      <NotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
      />
    </div>
  );
}
