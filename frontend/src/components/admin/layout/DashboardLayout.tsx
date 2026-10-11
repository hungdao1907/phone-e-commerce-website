import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { VerticalDock } from './VerticalDock';
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
import {
  StaffOverviewView,
  StaffNotificationsView,
  StaffProfileView
} from '@/components/staff/StaffViews';
import { StaffQuotations } from '@/components/quotations/StaffQuotations';
import { AdminQuotationAssignments } from '@/components/quotations/AdminQuotationAssignments';
import { ShieldAlert, Bell } from 'lucide-react';

import '@/css/admin.css';

// Map view IDs to readable titles
const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Tổng quan',
  calendar: 'Lịch làm việc',
  planned: 'Lịch kế hoạch',
  marketing: 'Chiến dịch marketing',
  banners: 'Quản lý Banner',
  'home-featured-products': 'Sản phẩm nổi bật',
  product: 'Sản phẩm',
  'product-list': 'Danh sách sản phẩm',
  orders: 'Đơn hàng',
  'orders-list': 'Danh sách đơn hàng',
  crm: 'CRM',
  'crm-leads': 'Khách hàng tiềm năng',
  'crm-customers': 'Khách hàng',
  user: 'Nhân sự',
  'user-staff': 'Quản lý Nhân sự',
  'marketing-module': 'Marketing',
  quotations: 'Báo giá Chatbot',
  'quotations-list': 'Danh sách báo giá',
  'quotations-pending': 'Báo giá chờ duyệt',
  'quotations-processed': 'Báo giá đã xử lý',
  'cart-rewards': 'Mốc thưởng Giỏ hàng',
  'promo-codes': 'Mã giảm giá',
  footer: 'Quản lý Footer',
  notifications: 'Thông báo của tôi',
  'my-notifications': 'Thông báo của tôi',
  profile: 'Hồ sơ cá nhân',
  settings: 'Cài đặt hệ thống',
};

const STAFF_ALLOWED_VIEWS = new Set([
  'dashboard',
  'product',
  'product-list',
  'products',
  'inventory',
  'categories',
  'orders',
  'orders-list',
  'orders-reviews',
  'orders-complaints',
  'orders-invoices',
  'crm',
  'crm-leads',
  'crm-customers',
  'marketing',
  'marketing-module',
  'banners',
  'home-featured-products',
  'quotations',
  'quotations-list',
  'quotations-pending',
  'quotations-processed',
  'settings',
  'cart-rewards',
  'promo-codes',
  'footer',
  'notifications',
  'my-notifications',
  'profile',
]);

export function DashboardLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const { view: routeView } = useParams<{ view?: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState(() => routeView || 'dashboard');
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);

  useEffect(() => {
    if (routeView && routeView !== activeView) {
      setActiveView(routeView);
    } else if (!routeView && activeView !== 'dashboard') {
      setActiveView('dashboard');
    }
  }, [routeView, activeView]);

  const handleNavigate = (newView: string) => {
    setActiveView(newView);
    navigate(newView === 'dashboard' ? '/dashboard' : `/dashboard/${newView}`, { replace: false });
  };

  const handleOpenNotifCenter = useCallback(() => setIsNotifCenterOpen(true), []);

  const isStaff = role === 'staff';
  const isAdmin = role === 'admin' || role === 'superadmin';
  // Staff is forbidden from accessing HR (user / user-staff) and Calendar (calendar / planned)
  const isUnauthorizedForStaff = isStaff && (
    activeView === 'user' ||
    activeView === 'user-staff' ||
    activeView === 'calendar' ||
    activeView === 'planned'
  );

  return (
    <div className="admin-shell relative min-h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans">
      {/* Main Content Area */}
      <div className="relative z-10 flex h-screen p-4 pl-24">
        {/* Left Dock */}
        <VerticalDock activeView={activeView} onNavigate={handleNavigate} />

        {/* Right Area (Navbar + Main Workspace) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Navbar */}
          <header className="relative z-50 h-[80px] shrink-0 flex items-center px-8 border-b border-slate-200/60 bg-transparent">
            {/* Left Workspace Indicator */}
            <div className="flex-1 flex items-center gap-3">
              {isStaff ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Không gian làm việc Nhân viên</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span>Trung tâm Quản trị Admin</span>
                </div>
              )}
            </div>

            {/* Center Search */}
            <div className="w-[320px] z-[100] flex justify-center">
              <SearchButton onNavigate={setActiveView} />
            </div>

            {/* Right Icons */}
            <div className="flex flex-1 items-center justify-end gap-3 relative">
              <button
                type="button"
                onClick={handleOpenNotifCenter}
                title="Trung tâm thông báo"
                className="relative p-2.5 rounded-xl border bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-all cursor-pointer flex items-center justify-center"
              >
                <Bell className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar transform-gpu will-change-transform">
            {isUnauthorizedForStaff ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] bg-white border border-rose-100 rounded-3xl p-8 text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">403 — Không có quyền truy cập</h2>
                <p className="mt-2 text-sm text-slate-500 max-w-md">
                  Tài khoản của bạn với vai trò <strong>Nhân viên (Staff)</strong> không có quyền truy cập vào mục <strong>{VIEW_LABELS[activeView] || activeView}</strong>. Vui lòng liên hệ Admin nếu bạn cần quyền này.
                </p>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Quay về Tổng quan
                </button>
              </div>
            ) : activeView === 'dashboard' ? (
              <MainDashboardView onViewAll={handleOpenNotifCenter} />
            ) : activeView === 'user-staff' || activeView === 'user' ? (
              <StaffManager />
            ) : activeView === 'crm-customers' ? (
              <CustomerManager />
            ) : activeView === 'crm-leads' || activeView === 'crm' ? (
              <LeadManager />
            ) : activeView === 'planned' || activeView === 'calendar' ? (
              <InteractiveCalendar isStaff={isStaff} />
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
            ) : activeView === 'marketing' || activeView === 'marketing-module' ? (
              <Marketing />
            ) : activeView === 'orders' || activeView === 'orders-list' ? (
              <Orders isStaff={isStaff} />
            ) : activeView === 'orders-reviews' ? (
              <Reviews />
            ) : activeView === 'orders-complaints' ? (
              <Complaints />
            ) : activeView === 'orders-invoices' ? (
              <Invoices />
            ) : activeView === 'quotations' || activeView === 'quotations-list' || activeView === 'quotations-pending' || activeView === 'quotations-processed' ? (
              isStaff ? <StaffQuotations initialTab={activeView} /> : isAdmin ? <AdminQuotationAssignments /> : (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">Chỉ Staff được phân công xem báo giá; chỉ Admin/Superadmin được quản lý phân công.</div>
              )
            ) : activeView === 'notifications' || activeView === 'my-notifications' ? (
              <StaffNotificationsView />
            ) : activeView === 'profile' ? (
              <StaffProfileView />
            ) : activeView === 'settings' || activeView === 'cart-rewards' || activeView === 'promo-codes' || activeView === 'footer' ? (
              <SettingsManager initialTab={activeView === 'settings' ? undefined : (activeView as any)} />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-slate-400 text-sm">Đang xem</p>
                <h1 className="text-slate-900 text-2xl font-bold">{VIEW_LABELS[activeView] ?? activeView}</h1>
                <p className="text-slate-500 text-sm mt-4">
                  Nội dung của <strong className="text-slate-800">{VIEW_LABELS[activeView]}</strong> sẽ hiển thị ở đây.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Admin Chat Widget (Hidden for Staff) */}
      {!isStaff && <AdminChatWidget />}

      {/* Notification Center Drawer — overlay on full layout */}
      <NotificationCenter
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
      />
    </div>
  );
}
