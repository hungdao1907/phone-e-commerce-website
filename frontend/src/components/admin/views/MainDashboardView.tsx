import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ShoppingCart, Package, Users, User } from 'lucide-react';
import { AppleWatchWeatherFace } from '@/components/admin/widgets/AppleWatchWeatherFace';
import { DoanhThuChart } from '@/components/admin/widgets/DoanhThuChart';
import { KpiWidget } from '@/components/admin/widgets/KpiWidget';
import { RevenueFlowWidget } from '@/components/admin/widgets/RevenueFlowWidget';
import { NotificationsWidget } from '@/components/admin/widgets/NotificationsWidget';
import { CustomerListWidget } from '@/components/admin/widgets/CustomerListWidget';
import { TopProductsWidget } from '@/components/admin/widgets/TopProductsWidget';
import { PlanScheduleWidget } from '@/components/admin/widgets/PlanScheduleWidget';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

export const MainDashboardView = React.memo(function MainDashboardView({ onViewAll }: { onViewAll?: () => void }) {
  const navigate = useNavigate();
  const { data: summary, isLoading } = useDashboardSummary();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="w-full flex flex-col gap-5">

      {/* ═══════════════════════════════════════════
          ROW 1 — 4 WIDGETS (3 KPI WIDGETS (1 COL EACH) + 1 REVENUE FLOW WIDGET (2 COLS))
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
        {/* WIDGET 1: DOANH THU THUẦN (Xanh lá Neon) - 1 Cột */}
        <div className="col-span-1 h-full">
          <KpiWidget
            title="Doanh thu thuần"
            value={summary ? formatCurrency(summary.netRevenue.current) : '0 ₫'}
            change={summary ? `${summary.netRevenue.growth > 0 ? '+' : ''}${summary.netRevenue.growth.toFixed(1)}%` : '-100.0%'}
            changeType={summary && summary.netRevenue.growth >= 0 ? 'up' : 'down'}
            subDescription="So với tháng trước"
            icon={
              <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
              </svg>
            }
            index={0}
            isLoading={isLoading}
            variant="green"
            actionText="Chi tiết →"
            onAction={() => {}}
          />
        </div>

        {/* WIDGET 2: ĐƠN HÀNG (Cam Hổ Phách Neon) - 1 Cột */}
        <div className="col-span-1 h-full">
          <KpiWidget
            title="Đơn hàng"
            value={summary ? formatNumber(summary.successfulOrders.current) : '0'}
            subDescription={summary ? `${summary.pendingOrders} đơn đang chờ` : '22 đơn đang chờ'}
            icon={
              <svg className="w-4 h-4 text-orange-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
              </svg>
            }
            index={1}
            isLoading={isLoading}
            variant="orange"
            subtitle={
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-300/30">
                {summary ? `${summary.pendingOrders} PENDING` : '22 PENDING'}
              </span>
            }
            actionText="Xem đơn →"
            onAction={() => navigate('/dashboard/orders?status=PENDING')}
          />
        </div>

        {/* WIDGET 3: SẢN PHẨM (Xanh Lam Neon) - 1 Cột */}
        <div className="col-span-1 h-full">
          <KpiWidget
            title="Sản phẩm"
            value={summary ? formatNumber(summary.totalStock) : '851'}
            subDescription="Tổng biến thể đang bán"
            icon={
              <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
              </svg>
            }
            index={2}
            isLoading={isLoading}
            variant="blue"
            subtitle={
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-200 border border-amber-300/30">
                {summary ? `${summary.lowStockVariants} sắp hết` : '197 sắp hết'}
              </span>
            }
            actionText="Kho hàng →"
            onAction={() => navigate('/dashboard/inventory')}
          />
        </div>

        {/* WIDGET 4: REVENUE FLOW (Widget Analytic Card từ ảnh - 2 Cột) */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 h-full">
          <RevenueFlowWidget
            dynamicRevenue={summary && summary.netRevenue.current > 0 ? formatCurrency(summary.netRevenue.current) : undefined}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2 — MAIN DASHBOARD AREA
          Revenue (big) | Clock + Welcome + Notifications | Activity (vertical)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[5fr_4fr_2.27fr] gap-4 items-stretch">

        {/* Sales Overview — BIG WIDGET */}
        <div className="h-full">
          <div
            className="w-full h-full backdrop-blur-xl overflow-hidden flex flex-col"
            style={{
              background: 'rgba(4, 22, 15, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '28px',
              boxShadow: '0 10px 40px -14px rgba(62, 224, 140, 0.25)'
            }}
          >
            <DoanhThuChart />
          </div>
        </div>

        {/* Middle Column: Clock + Welcome (top), Notifications (bottom) */}
        <div className="flex flex-col gap-4 justify-between h-full">
          {/* Top row: Clock + Welcome Widget (Expanded to take over adjacent widget) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="w-full h-[215px] overflow-hidden drop-shadow-2xl relative"
            style={{
              borderRadius: '24px',
              flex: '0 0 auto',
              background: 'linear-gradient(135deg, #28D882 0%, #157A54 45%, #0C291E 100%)',
              border: '1px solid rgba(74, 222, 128, 0.25)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5), 0 0 30px rgba(40, 216, 130, 0.12)'
            }}
          >
            <div className="w-full h-full">
              <AppleWatchWeatherFace />
            </div>
          </motion.div>

          {/* Notifications — horizontal */}
          <div className="relative">
            <NotificationsWidget onViewAll={onViewAll} />
          </div>
        </div>

        {/* Top Products — Vertical Right Column (Replaced ActivityWidget) */}
        <div className="relative h-full">
          <div className="absolute inset-0">
            <TopProductsWidget />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 3 — CUSTOMER LIST + PLAN SCHEDULE
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[3fr_2fr] gap-4 items-stretch">
        {/* Customer List — large */}
        <CustomerListWidget />

        {/* Plan Schedule Widget (Merged TopProducts & PremiumPlan area) */}
        <PlanScheduleWidget />
      </div>

    </div>
  );
});
