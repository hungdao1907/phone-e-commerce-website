import React from 'react';
import { Package, Heart, Ticket, ChevronRight, ShoppingBag } from 'lucide-react';
import { useWishlistStore } from '@/store/useWishlistStore';
import { useAuthStore } from '@/store/authStore';

interface OverviewTabProps {
  orders: any[];
  onChangeTab: (tab: any) => void;
}

export function OverviewTab({ orders, onChangeTab }: OverviewTabProps) {
  const { user } = useAuthStore();
  const wishlistItems = useWishlistStore(state => state.items);
  const userName = user?.username ? user.username.split('@')[0] : 'bạn';

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Xin chào, {userName} 👋
        </h1>
        <p className="text-sm text-neutral-500">
          Quản lý đơn hàng và thông tin tài khoản của bạn.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div 
          onClick={() => onChangeTab('orders')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm cursor-pointer hover:border-black transition-colors"
        >
          <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-neutral-700" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">{orders.length}</p>
          <p className="text-xs font-medium text-neutral-500">Đơn hàng</p>
        </div>

        <div 
          onClick={() => onChangeTab('wishlist')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm cursor-pointer hover:border-black transition-colors"
        >
          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center mb-3">
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">{wishlistItems.length}</p>
          <p className="text-xs font-medium text-neutral-500">Yêu thích</p>
        </div>

        <div 
          onClick={() => onChangeTab('voucher')}
          className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm cursor-pointer hover:border-black transition-colors"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <Ticket className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 mb-1">0</p>
          <p className="text-xs font-medium text-neutral-500">Voucher</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-900">Đơn hàng gần đây</h2>
          <button 
            onClick={() => onChangeTab('orders')}
            className="text-sm font-semibold text-neutral-500 hover:text-black flex items-center gap-1 transition-colors"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-neutral-200/60 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow cursor-pointer" onClick={() => onChangeTab('orders')}>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold font-mono bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                      #{order.orderCode}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {order.items?.[0]?.productName || 'Đơn hàng'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {order.items?.length > 1 ? `và ${order.items.length - 1} sản phẩm khác` : '1 sản phẩm'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-sm font-bold text-neutral-900">
                    {order.totalAmount?.toLocaleString('vi-VN')}đ
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                    order.status === 'shipping' ? 'bg-blue-100 text-blue-700' : 
                    order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'
                  }`}>
                    {order.status === 'pending' ? 'Chờ duyệt' : 
                     order.status === 'shipping' ? 'Đang giao' : 
                     order.status === 'delivered' ? 'Chờ nhận' :
                     order.status === 'completed' ? 'Đã giao' : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Bạn chưa có đơn hàng nào</h3>
            <p className="text-xs text-neutral-500 max-w-sm mb-4">
              Khám phá các sản phẩm nổi bật và bắt đầu mua sắm ngay hôm nay.
            </p>
            <a href="/" className="text-xs font-bold bg-black text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors">
              Khám phá sản phẩm
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
