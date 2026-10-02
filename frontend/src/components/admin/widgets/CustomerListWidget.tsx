import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, PackageX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePendingOrders } from '@/hooks/useDashboardSummary';

export function CustomerListWidget() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePendingOrders();

  const orders = data?.orders || [];
  const count = data?.count || 0;

  // Helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const getAvatarInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTimeAgo = (isoStr: string) => {
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return '1 ngày trước';
    return `${diffD} ngày trước`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="text-slate-900 font-semibold text-base">Đơn hàng chờ xác nhận</h3>
          {!isLoading && count > 0 && (
            <span className="text-amber-700 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              [{count}]
            </span>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 grid grid-cols-[1.8fr_2fr_1.2fr] gap-4 text-slate-400 text-[11px] font-medium uppercase tracking-wider shrink-0 bg-slate-50/50 border-b border-slate-100">
        <span>Khách hàng</span>
        <span>Sản phẩm</span>
        <span className="text-right">Tổng tiền</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 relative min-h-[220px]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-slate-500 text-sm">Không thể tải đơn hàng</p>
            <button className="text-blue-600 text-xs hover:underline">Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <PackageX className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-slate-700 text-sm font-medium">Không có đơn hàng chờ xác nhận</p>
            <p className="text-slate-400 text-[11px] mt-1">Tất cả đơn hàng mới đã được xử lý.</p>
          </div>
        )}

        {!isLoading && !isError && orders.map((order, i) => {
          const mainItem = order.items[0];
          const hasMoreItems = order.items.length > 1;
          const remainingItemsCount = order.items.slice(1).reduce((sum, item) => sum + item.quantity, 0);

          let mainProductText = `${mainItem?.productName || 'Sản phẩm'} ${mainItem?.variantInfo && mainItem.variantInfo !== 'Mặc định' ? `- ${mainItem.variantInfo}` : ''}`;
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => navigate(`/dashboard/orders?search=${order.orderCode}`)}
              className="grid grid-cols-[1.8fr_2fr_1.2fr] gap-4 items-center px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer mb-1 border border-transparent hover:border-slate-200/60"
            >
              {/* Customer */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-700 text-[11px] font-bold shrink-0 border border-amber-200">
                  {getAvatarInitials(order.customer?.fullName || 'Khách Hàng')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {order.customer?.fullName || 'Khách Hàng'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                    {order.orderCode}
                  </p>
                </div>
              </div>

              {/* Product */}
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-sm text-slate-700 font-medium truncate" title={mainProductText}>
                  {mainProductText} <span className="text-slate-400 font-normal">× {mainItem?.quantity || 1}</span>
                </p>
                {hasMoreItems && (
                  <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                    + {remainingItemsCount} sản phẩm khác
                  </p>
                )}
              </div>

              {/* Total & Time */}
              <div className="text-right min-w-0 flex flex-col justify-center">
                <p className="text-sm text-slate-900 font-semibold truncate">
                  {formatCurrency(order.totalAmount)}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <p className="text-[10px] text-slate-500 truncate">
                    {formatTimeAgo(order.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer / View All */}
      {!isLoading && !isError && count > 0 && (
        <div className="px-6 py-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
          <button
            onClick={() => navigate('/dashboard/orders?status=PENDING')}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>[{count}] Xem tất cả</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
