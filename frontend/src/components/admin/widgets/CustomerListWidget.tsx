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
    if (!name || typeof name !== 'string') return 'KH';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      const first = parts[0]?.[0] || '';
      const last = parts[parts.length - 1]?.[0] || '';
      return (first + last).toUpperCase() || 'KH';
    }
    return (name.slice(0, 2) || 'KH').toUpperCase();
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
      className="backdrop-blur-xl flex flex-col h-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(to top, rgba(255, 128, 64, 0.22), transparent 45%), rgba(4, 22, 15, 0.5)',
        border: '1px solid rgba(255, 128, 64, 0.35)',
        borderRadius: '28px',
        boxShadow: 'inset 0 -12px 22px -10px rgba(255, 128, 64, 0.8), 0 10px 40px -14px rgba(255, 128, 64, 0.5)'
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between shrink-0 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <h3 className="text-[#eefaf3] font-semibold text-base">Đơn hàng chờ xác nhận</h3>
          {!isLoading && count > 0 && (
            <span className="text-[#ffc24d] font-bold text-xs bg-[rgba(255,190,60,0.12)] px-2.5 py-0.5 rounded-lg border border-[rgba(255,190,60,0.45)] shadow-sm">
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="px-6 py-3 grid grid-cols-[1.8fr_2fr_1.2fr] gap-4 text-[#eefaf3]/55 text-[11px] font-medium uppercase tracking-wider shrink-0">
        <span>Khách hàng</span>
        <span>Sản phẩm</span>
        <span className="text-right">Tổng tiền</span>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 relative">
        {isLoading && (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#ff8040] animate-spin" />
          </div>
        )}

        {isError && (
          <div className="py-8 flex flex-col items-center justify-center gap-2">
            <p className="text-[#eefaf3]/60 text-sm">Không thể tải đơn hàng</p>
            <button className="text-[#ff8040] text-xs hover:underline">Thử lại</button>
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="py-8 flex flex-col items-center justify-center text-center px-4">
            <PackageX className="w-8 h-8 text-[#eefaf3]/30 mb-3" />
            <p className="text-[#eefaf3]/80 text-sm font-medium">Không có đơn hàng chờ xác nhận</p>
            <p className="text-[#eefaf3]/55 text-[11px] mt-1">Tất cả đơn hàng mới đã được xử lý.</p>
          </div>
        )}

        {!isLoading && !isError && orders.slice(0, 3).map((order, i) => {
          const items = order.items || [];
          const mainItem = items[0];
          const hasMoreItems = items.length > 1;
          const remainingItemsCount = items.slice(1).reduce((sum, item) => sum + (item.quantity || 1), 0);

          let mainProductText = `${mainItem?.productName || 'Sản phẩm'} ${mainItem?.variantInfo && mainItem.variantInfo !== 'Mặc định' ? `- ${mainItem.variantInfo}` : ''}`;
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onClick={() => navigate(`/dashboard/orders?search=${order.orderCode}`)}
              className="grid grid-cols-[1.8fr_2fr_1.2fr] gap-4 items-center px-3 py-3 rounded-2xl hover:bg-white/[0.05] transition-colors cursor-pointer mb-1 border-b border-white/[0.06] last:border-b-0"
            >
              {/* Customer */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[rgba(255,128,64,0.15)] flex items-center justify-center text-[#ff8040] text-[11px] font-bold shrink-0 border border-[rgba(255,128,64,0.35)] shadow-sm">
                  {getAvatarInitials(order.customer?.fullName || 'Khách Hàng')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#eefaf3] truncate">
                    {order.customer?.fullName || 'Khách Hàng'}
                  </p>
                  <p className="text-[11px] text-[#eefaf3]/55 truncate font-mono mt-0.5">
                    {order.orderCode}
                  </p>
                </div>
              </div>

              {/* Product */}
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-sm text-[#eefaf3]/90 font-medium truncate" title={mainProductText}>
                  {mainProductText} <span className="text-[#eefaf3]/55 font-normal">× {mainItem?.quantity || 1}</span>
                </p>
                {hasMoreItems && (
                  <p className="text-[11px] text-[#ffc24d] font-medium mt-0.5">
                    + {remainingItemsCount} sản phẩm khác
                  </p>
                )}
              </div>

              {/* Total & Time */}
              <div className="text-right min-w-0 flex flex-col justify-center">
                <p className="text-sm text-[#eefaf3] font-semibold truncate">
                  {formatCurrency(order.totalAmount)}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff8040] shrink-0 shadow-[0_0_6px_#ff8040]" />
                  <p className="text-[10px] text-[#eefaf3]/55 truncate">
                    {formatTimeAgo(order.createdAt)}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer / View All */}
      {!isLoading && !isError && (
        <div className="px-6 py-3 border-t border-white/[0.08] shrink-0 bg-white/[0.02]">
          <button
            onClick={() => navigate('/dashboard/orders?status=PENDING')}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#ff8040] hover:text-[#ff9e6c] transition-colors py-0.5"
          >
            <span>{count > 0 ? `Xem tất cả (${count})` : 'Xem tất cả đơn hàng'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
