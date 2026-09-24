import React, { useState, useMemo } from 'react';
import { ShoppingBag, Package } from 'lucide-react';

interface OrdersTabProps {
  orders: any[];
  onReview: (orderId: string, productId: string) => Promise<void>;
  onComplete: (orderId: string) => Promise<void>;
  onOpenComplaint: (item: any, order: any) => void;
}

type OrderFilter = 'all' | 'pending' | 'shipping' | 'delivered' | 'completed' | 'cancelled';

const STATUS_FILTERS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ xác nhận' },
  { id: 'shipping', label: 'Đang giao' },
  { id: 'delivered', label: 'Đã giao' },
  { id: 'completed', label: 'Hoàn thành' },
];

export function OrdersTab({ orders, onReview, onComplete, onOpenComplaint }: OrdersTabProps) {
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'all') return orders;
    return orders.filter(order => order.status === activeFilter);
  }, [orders, activeFilter]);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'pending': return { text: 'Chờ xác nhận', classes: 'bg-amber-100 text-amber-700' };
      case 'shipping': return { text: 'Đang giao', classes: 'bg-blue-100 text-blue-700' };
      case 'delivered': return { text: 'Chờ nhận hàng', classes: 'bg-emerald-100 text-emerald-700' };
      case 'completed': return { text: 'Hoàn thành', classes: 'bg-green-100 text-green-700' };
      case 'cancelled': return { text: 'Đã hủy', classes: 'bg-red-100 text-red-700' };
      default: return { text: status, classes: 'bg-neutral-100 text-neutral-700' };
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 space-y-4">
        <h2 className="text-xl font-bold text-neutral-900">Đơn hàng của tôi</h2>
        
        {/* Status Filters */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            const count = filter.id === 'all' 
              ? orders.length 
              : orders.filter(o => o.status === filter.id).length;
              
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-200 border ${
                  isActive 
                    ? 'bg-neutral-900 border-neutral-900 text-white' 
                    : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {filter.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
            <Package className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-neutral-900 mb-1">Không có đơn hàng nào</h4>
            <p className="text-sm text-neutral-500 mb-4 max-w-xs mx-auto">
              Chưa có đơn hàng nào khớp với trạng thái bạn đang chọn.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusObj = getStatusDisplay(order.status);
            
            return (
              <div key={order.id} className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-colors bg-white">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 pb-4 border-b border-neutral-100">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-bold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded">
                        #{order.orderCode}
                      </span>
                      <span className="text-xs font-semibold text-neutral-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusObj.classes}`}>
                      {statusObj.text}
                    </span>
                    <p className="font-bold text-lg text-neutral-900 ml-auto sm:ml-0">
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.items.map((item: any) => {
                    const productId = item.productId || item.variant?.product?.id || item.variant?.productId || item.variant?.product?.slug;
                    const productImage = item.variant?.product?.image || item.variant?.image || item.image;
                    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                    const imgSrc = productImage?.startsWith('/uploads') ? `${apiUrl}${productImage}` : productImage;

                    const validProductId = productId && productId !== 'undefined' ? productId : null;

                    return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center shrink-0 border border-neutral-200/50 overflow-hidden">
                        {imgSrc ? (
                          <img src={imgSrc} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h4 className="text-sm font-bold text-neutral-900 leading-tight mb-1">
                              {item.productName}
                            </h4>
                            <p className="text-xs font-medium text-neutral-500">
                              Số lượng: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900 shrink-0">
                            {item.unitPrice.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                        
                        {(order.status === 'completed' || order.status === 'delivered') && (
                          <div className="mt-2 flex items-center gap-2">
                            {validProductId && (
                              <button 
                                onClick={() => onReview(order.id, validProductId)} 
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
                              >
                                Viết đánh giá
                              </button>
                            )}
                            <button 
                              onClick={() => onOpenComplaint(item, order)} 
                              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                            >
                              Khiếu nại
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 flex flex-wrap items-center justify-between border-t border-neutral-100">
                  <div>
                    <a 
                      href={`/profile/orders/${order.id}`}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Xem chi tiết đơn hàng &rarr;
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {order.status === 'delivered' && (
                      <button 
                        onClick={() => onComplete(order.id)} 
                        className="px-5 py-2 text-sm font-bold bg-black text-white hover:bg-neutral-800 rounded-full transition-colors shadow-sm active:scale-95"
                      >
                        Đã nhận được hàng
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
