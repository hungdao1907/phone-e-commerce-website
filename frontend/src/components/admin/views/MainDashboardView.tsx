import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, ShoppingCart, Package, Users, User } from 'lucide-react';
import { AppleWatchWeatherFace } from '@/components/admin/widgets/AppleWatchWeatherFace';
import { DoanhThuChart } from '@/components/admin/widgets/DoanhThuChart';
import { KpiWidget } from '@/components/admin/widgets/KpiWidget';
import { PerformanceWidget } from '@/components/admin/widgets/PerformanceWidget';
import { NotificationsWidget } from '@/components/admin/widgets/NotificationsWidget';
import { CustomerListWidget } from '@/components/admin/widgets/CustomerListWidget';
import { TopProductsWidget } from '@/components/admin/widgets/TopProductsWidget';
import { PlanScheduleWidget } from '@/components/admin/widgets/PlanScheduleWidget';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useAuthStore } from '@/store/authStore';

export const MainDashboardView = React.memo(function MainDashboardView({ onViewAll }: { onViewAll?: () => void }) {
  const user = useAuthStore(state => state.user);
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
          ROW 1 — 5 EQUAL KPI WIDGETS
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-5 gap-4">
        {/* Welcome Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-5 flex items-center gap-3 overflow-hidden relative shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-500 text-[11px] font-medium">Welcome back</p>
            <p className="text-slate-900 font-bold text-sm truncate">{user?.username || 'Admin'}</p>
            <p className="text-slate-400 text-[10px] truncate capitalize">{user?.role || 'Staff'}</p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <KpiWidget
          title="Doanh thu thuần"
          value={summary ? formatCurrency(summary.netRevenue.current) : '0 ₫'}
          change={summary ? `${summary.netRevenue.growth > 0 ? '+' : ''}${summary.netRevenue.growth.toFixed(1)}%` : '0%'}
          changeType={summary && summary.netRevenue.growth >= 0 ? 'up' : 'down'}
          changeLabel="vs last month"
          icon={<DollarSign className="w-4 h-4" />}
          index={1}
          isLoading={isLoading}
        />
        <KpiWidget
          title="Đơn hàng"
          value={summary ? formatNumber(summary.successfulOrders.current) : '0'}
          change={summary ? `${summary.successfulOrders.growth > 0 ? '+' : ''}${summary.successfulOrders.growth.toFixed(1)}%` : '0%'}
          changeType={summary && summary.successfulOrders.growth >= 0 ? 'up' : 'down'}
          changeLabel="vs last month"
          icon={<ShoppingCart className="w-4 h-4" />}
          index={2}
          isLoading={isLoading}
          subtitle={
            summary && summary.pendingOrders > 0 ? (
              <span className="text-orange-600 font-semibold text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 whitespace-nowrap">
                [ {summary.pendingOrders} PENDING ]
              </span>
            ) : null
          }
        />
        <KpiWidget
          title="Sản phẩm"
          value={summary ? formatNumber(summary.totalStock) : '0'}
          change="tồn kho"
          changeType="up"
          changeLabel=""
          icon={<Package className="w-4 h-4" />}
          index={3}
          isLoading={isLoading}
          subtitle={
            summary && summary.lowStockVariants > 0 ? (
              <span className="text-amber-700 font-semibold text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 whitespace-nowrap">
                [ {summary.lowStockVariants} sắp hết ]
              </span>
            ) : null
          }
        />
        <KpiWidget
          title="AOV"
          value={summary ? formatCurrency(summary.aov) : '0 ₫'}
          change=""
          changeType="up"
          changeLabel=""
          icon={<DollarSign className="w-4 h-4" />}
          index={4}
          isLoading={isLoading}
        />
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2 — MAIN DASHBOARD AREA
          Revenue (big) | Clock + Performance + Notifications | Activity (vertical)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[5fr_4fr_2.27fr] gap-4">

        {/* Sales Overview — BIG WIDGET */}
        <div className="relative h-full">
          <div className="absolute inset-0 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <DoanhThuChart />
          </div>
        </div>

        {/* Middle Column: Clock + Performance (top), Notifications (bottom) */}
        <div className="flex flex-col gap-4">
          {/* Top row: Clock + Performance */}
          <div className="grid grid-cols-[170px_1fr] gap-4" style={{ flex: '0 0 auto' }}>
            {/* Clock — Apple Watch Weather */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="bg-white border border-slate-200/80 overflow-hidden shadow-sm aspect-[180/220] p-1"
              style={{ borderRadius: '40px' }}
            >
              <div className="w-full h-full">
                <AppleWatchWeatherFace />
              </div>
            </motion.div>

            {/* Performance Widget */}
            <PerformanceWidget />
          </div>

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
      <div className="grid grid-cols-[3fr_2fr] gap-4" style={{ minHeight: '320px' }}>
        {/* Customer List — large */}
        <CustomerListWidget />

        {/* Plan Schedule Widget (Merged TopProducts & PremiumPlan area) */}
        <PlanScheduleWidget />
      </div>

    </div>
  );
});
