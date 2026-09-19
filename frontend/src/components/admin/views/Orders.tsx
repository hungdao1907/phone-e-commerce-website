import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Edit2, Trash2, CheckCircle2, Clock, Truck, Package, X, ChevronRight, MapPin, Phone, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// --- TYPES ---
interface OrderItem {
  id: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
}

interface Customer {
  fullName: string;
  email: string;
  phone: string | null;
}

interface Order {
  id: string;
  orderCode: string;
  customer: Customer;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingFee: number;
  totalAmount: number;
  note: string | null;
  estimatedDelivery: string | null;
  items: OrderItem[];
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const STATUS_MAP: Record<string, { label: string, color: string, icon: any }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 },
  shipping: { label: 'Đang giao hàng', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: Truck },
  delivered: { label: 'Đã giao hàng', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: Package },
  completed: { label: 'Hoàn thành', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: X },
  returned: { label: 'Đã trả hàng', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: X },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo'
};

const PAYMENT_STATUS_MAP: Record<string, { label: string, color: string }> = {
  unpaid: { label: 'Chưa thanh toán', color: 'text-orange-400' },
  paid: { label: 'Đã thanh toán', color: 'text-emerald-400' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-red-400' }
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  // Modal Detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Status Update State
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string, newPaymentStatus?: string) => {
    try {
      setIsUpdating(true);
      const dataToUpdate: any = { status: newStatus };
      if (newPaymentStatus) dataToUpdate.paymentStatus = newPaymentStatus;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dataToUpdate)
      });
      
      if (res.ok) {
        await fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus, paymentStatus: newPaymentStatus || prev.paymentStatus } : null);
        }
      }
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.phone?.includes(search);
    
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách đơn hàng</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý và xử lý {orders.length} đơn đặt hàng từ khách hàng.</p>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col">
          <span className="text-white/50 text-sm font-medium mb-1">Tổng đơn hàng</span>
          <span className="text-2xl font-bold text-white">{orders.length}</span>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-2xl flex flex-col">
          <span className="text-orange-400/70 text-sm font-medium mb-1">Chờ xác nhận</span>
          <span className="text-2xl font-bold text-orange-400">{orders.filter(o => o.status === 'pending').length}</span>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl flex flex-col">
          <span className="text-purple-400/70 text-sm font-medium mb-1">Đang giao</span>
          <span className="text-2xl font-bold text-purple-400">{orders.filter(o => o.status === 'shipping').length}</span>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl flex flex-col">
          <span className="text-emerald-400/70 text-sm font-medium mb-1">Doanh thu hoàn thành</span>
          <span className="text-2xl font-bold text-emerald-400">
            {formatCurrency(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount + o.shippingFee, 0))}
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Tìm theo mã đơn, tên khách, SĐT..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30" />
        </div>
        
        <select 
          value={filterStatus} 
          onChange={e => setFilterStatus(e.target.value)}
          className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors"
        >
          <option value="all" className="bg-[#1c1c1e]">Tất cả trạng thái</option>
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key} className="bg-[#1c1c1e]">{val.label}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
          <div className="col-span-2 pl-2">Mã đơn</div>
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-2">Ngày đặt</div>
          <div className="col-span-2">Tổng tiền</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1 text-center">Tác vụ</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/40">
              <Package className="w-10 h-10 text-white/15 mb-3" />
              <p>Không tìm thấy đơn hàng nào</p>
            </div>
          ) : (
            filteredOrders.map((order, index) => {
              const statusInfo = STATUS_MAP[order.status] || STATUS_MAP['pending'];
              const StatusIcon = statusInfo.icon;
              
              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="group relative grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                >
                  <div className="col-span-2 font-mono text-sm font-medium text-emerald-400">{order.orderCode}</div>
                  
                  <div className="col-span-3 flex flex-col overflow-hidden">
                    <span className="font-medium text-white truncate">{order.customer.fullName}</span>
                    <span className="text-xs text-white/50 truncate mt-0.5">{order.shippingPhone}</span>
                  </div>

                  <div className="col-span-2 text-sm text-white/80">{formatDate(order.createdAt)}</div>
                  
                  <div className="col-span-2 flex flex-col">
                    <span className="font-bold text-white">{formatCurrency(order.totalAmount + order.shippingFee)}</span>
                    <span className={cn("text-xs mt-0.5", PAYMENT_STATUS_MAP[order.paymentStatus]?.color || "text-white/40")}>
                      {PAYMENT_STATUS_MAP[order.paymentStatus]?.label}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", statusInfo.color)}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== MODAL: CHI TIẾT ĐƠN HÀNG ===== */}
      <AnimatePresence>
        {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-[#1c1c1e] border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-3">
                    Chi tiết đơn hàng 
                    <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-sm">{selectedOrder.orderCode}</span>
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Đặt lúc: {formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5 text-white/70" /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {/* Trạng thái & Action */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white/70 mb-1">Trạng thái hiện tại</h3>
                      <div className="flex items-center gap-3">
                        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border", STATUS_MAP[selectedOrder.status]?.color)}>
                          {React.createElement(STATUS_MAP[selectedOrder.status]?.icon || Clock, { className: "w-4 h-4" })}
                          {STATUS_MAP[selectedOrder.status]?.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Cập nhật nhanh trạng thái */}
                    {selectedOrder.status === 'pending' && (
                      <button onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')} disabled={isUpdating} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-medium text-sm transition-colors">
                        Xác nhận đơn
                      </button>
                    )}
                    {selectedOrder.status === 'confirmed' && (
                      <button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping')} disabled={isUpdating} className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-medium text-sm transition-colors">
                        Giao cho vận chuyển
                      </button>
                    )}
                    {selectedOrder.status === 'shipping' && (
                      <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} disabled={isUpdating} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-medium text-sm transition-colors">
                        Xác nhận đã giao
                      </button>
                    )}
                    {selectedOrder.status === 'delivered' && (
                      <button onClick={() => handleUpdateStatus(selectedOrder.id, 'completed', 'paid')} disabled={isUpdating} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors">
                        Hoàn thành đơn & Đã thu tiền
                      </button>
                    )}
                  </div>
                </div>

                {/* Thông tin giao hàng */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Thông tin khách hàng</h3>
                    <div className="space-y-3 p-4 rounded-xl bg-black/20 border border-white/5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white/70" /></div>
                        <div>
                          <p className="font-medium text-white">{selectedOrder.customer.fullName}</p>
                          <p className="text-sm text-white/50">{selectedOrder.customer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-white/70" /></div>
                        <div>
                          <p className="font-medium text-white">{selectedOrder.shippingPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 text-white/70" /></div>
                        <div>
                          <p className="text-sm text-white/80 leading-relaxed">{selectedOrder.shippingAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Thanh toán & Giao hàng</h3>
                    <div className="space-y-3 p-4 rounded-xl bg-black/20 border border-white/5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-white/70" /></div>
                        <div>
                          <p className="font-medium text-white">Phương thức thanh toán</p>
                          <p className="text-sm text-white/50">{PAYMENT_METHOD_MAP[selectedOrder.paymentMethod]}</p>
                          <span className={cn("text-xs font-bold mt-1 inline-block", PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.color)}>
                            {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.label}
                          </span>
                        </div>
                      </div>
                      {selectedOrder.estimatedDelivery && (
                        <div className="flex items-start gap-3 mt-4">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Clock className="w-4 h-4 text-white/70" /></div>
                          <div>
                            <p className="font-medium text-white">Dự kiến giao</p>
                            <p className="text-sm text-white/50">{formatDate(selectedOrder.estimatedDelivery)}</p>
                          </div>
                        </div>
                      )}
                      {selectedOrder.note && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                          <p className="text-xs font-semibold text-yellow-500 mb-1">Ghi chú của khách:</p>
                          <p className="text-sm text-yellow-500/80 italic">{selectedOrder.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div>
                  <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Sản phẩm đã đặt ({selectedOrder.items.reduce((s,i)=>s+i.quantity,0)})</h3>
                  <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/20">
                    <div className="grid grid-cols-12 gap-4 p-3 border-b border-white/10 text-xs font-semibold text-white/50 bg-white/5">
                      <div className="col-span-6 pl-2">Sản phẩm</div>
                      <div className="col-span-2 text-center">Đơn giá</div>
                      <div className="col-span-2 text-center">SL</div>
                      <div className="col-span-2 text-right pr-2">Thành tiền</div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 p-3 items-center">
                          <div className="col-span-6 flex flex-col pl-2">
                            <span className="font-medium text-white">{item.productName}</span>
                            <span className="text-xs text-white/50 mt-0.5">{item.variantInfo}</span>
                          </div>
                          <div className="col-span-2 text-center text-sm text-white/80">{formatCurrency(item.unitPrice)}</div>
                          <div className="col-span-2 text-center text-sm font-medium">{item.quantity}</div>
                          <div className="col-span-2 text-right pr-2 text-sm font-bold text-white">{formatCurrency(item.unitPrice * item.quantity)}</div>
                        </div>
                      ))}
                    </div>
                    {/* Tổng kết tiền */}
                    <div className="p-4 bg-white/5 border-t border-white/10 flex flex-col gap-2 items-end text-sm">
                      <div className="flex items-center justify-between w-48 text-white/60">
                        <span>Tạm tính:</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between w-48 text-white/60">
                        <span>Phí giao hàng:</span>
                        <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                      </div>
                      <div className="flex items-center justify-between w-48 text-lg font-bold text-emerald-400 mt-2 pt-2 border-t border-white/10">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(selectedOrder.totalAmount + selectedOrder.shippingFee)}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dummy User icon component since lucide-react User isn't exported in the above destructuring
function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
