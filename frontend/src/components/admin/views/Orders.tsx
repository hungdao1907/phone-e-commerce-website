import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Eye, Edit2, Trash2, CheckCircle2, Clock, Truck, Package, X, ChevronRight, ChevronLeft, MapPin, Phone, CreditCard, CheckSquare, Square, Calendar, Download, AlertTriangle, MoreVertical, Ban, RefreshCw, XCircle, ArrowDownUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { BankHistoryPanel } from './BankHistoryPanel';

// --- TYPES ---
interface OrderItem {
  id: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
  image?: string;
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
  discountAmount?: number;
  note: string | null;
  estimatedDelivery: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
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

const STATUS_MAP: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  pending_payment: { label: 'Chờ xác nhận', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  shipping: { label: 'Đang giao hàng', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: Truck },
  delivered: { label: 'Đã giao', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: Package },
  completed: { label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
  returned: { label: 'Đã trả hàng', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: XCircle },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  COD: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  momo: 'Ví MoMo',
  MOMO: 'Ví MoMo'
};

const PAYMENT_STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  unpaid: { label: 'Chưa thanh toán', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  UNPAID: { label: 'Chưa thanh toán', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  PENDING: { label: 'Chưa thanh toán', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  paid: { label: 'Đã thanh toán', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  PAID: { label: 'Đã thanh toán', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  // Modal Detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isBankHistoryOpen, setIsBankHistoryOpen] = useState(false);

  // Confirm Modal
  const [confirmAction, setConfirmAction] = useState<{ orderId: string, actionLabel: string, newStatus: string, newPaymentStatus?: string, tone: 'danger' | 'success' } | null>(null);
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

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
        setConfirmAction(null);
      } else {
        alert('Có lỗi xảy ra khi cập nhật.');
      }
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  };

  const processedOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderCode.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone?.includes(q) ||
        o.customer.email?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'pending') {
        result = result.filter(o => o.status === 'pending' || o.status === 'pending_payment');
      } else {
        result = result.filter(o => o.status === filterStatus);
      }
    }

    // Date Filter
    if (filterDate !== 'all') {
      const now = new Date();
      result = result.filter(o => {
        const d = new Date(o.createdAt);
        if (filterDate === 'today') return d.toDateString() === now.toDateString();
        if (filterDate === '7days') return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
        if (filterDate === '30days') return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
        if (filterDate === 'this_month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === 'total_desc') return (b.totalAmount + b.shippingFee) - (a.totalAmount + a.shippingFee);
      if (sortOption === 'total_asc') return (a.totalAmount + a.shippingFee) - (b.totalAmount + b.shippingFee);
      // default newest
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [orders, search, filterStatus, filterDate, sortOption]);

  const totalPages = Math.ceil(processedOrders.length / limit) || 1;
  const paginatedOrders = processedOrders.slice((page - 1) * limit, page * limit);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0) setSelectedIds([]);
    else setSelectedIds(paginatedOrders.map(o => o.id));
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const openConfirm = (orderId: string, actionLabel: string, newStatus: string, tone: 'danger' | 'success', newPaymentStatus?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmAction({ orderId, actionLabel, newStatus, newPaymentStatus, tone });
  };

  const renderTimeline = (order: Order) => {
    if (order.status === 'cancelled') {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200"><CheckCircle2 className="w-4 h-4"/></div>
              <div className="w-px h-8 bg-slate-200 my-1"></div>
            </div>
            <div className="pb-4">
              <p className="text-slate-900 text-sm font-medium">Đã đặt hàng</p>
              <p className="text-slate-500 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200"><XCircle className="w-4 h-4"/></div>
            </div>
            <div>
              <p className="text-rose-600 text-sm font-medium">Đã hủy</p>
              <p className="text-rose-500 text-xs mt-0.5">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>
      );
    }

    const steps = [
      { id: 'pending', label: 'Đã đặt hàng', icon: Package },
      { id: 'confirmed', label: 'Đã xác nhận', icon: CheckCircle2 },
      { id: 'shipping', label: 'Đang giao', icon: Truck },
      { id: 'completed', label: 'Hoàn thành', icon: CheckCircle2 },
    ];

    const currentIdx = steps.findIndex(s => s.id === order.status || (order.status === 'pending_payment' && s.id === 'pending')) !== -1
      ? steps.findIndex(s => s.id === order.status || (order.status === 'pending_payment' && s.id === 'pending'))
      : (order.status === 'delivered' ? 2 : order.status === 'completed' ? 3 : 0);

    return (
      <div className="flex flex-col relative">
        {steps.map((step, index) => {
          const isPast = index < currentIdx;
          const isCurrent = index === currentIdx;

          let timeString = null;
          if (index === 0) timeString = formatDate(order.createdAt);
          else if (isCurrent) timeString = formatDate(order.updatedAt);

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 border",
                  isPast || isCurrent ? "bg-emerald-50 text-emerald-600 border-emerald-300 shadow-sm" : "bg-slate-100 text-slate-400 border-slate-200"
                )}>
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={cn("w-px h-8 my-1", isPast ? "bg-emerald-400" : "bg-slate-200")} />
                )}
              </div>
              <div className={cn("pb-6", index === steps.length - 1 && "pb-0")}>
                <p className={cn("text-sm font-medium", isPast || isCurrent ? "text-slate-900" : "text-slate-400")}>{step.label}</p>
                {(timeString || isPast) && (
                  <p className="text-slate-500 text-xs mt-0.5">{timeString || "Hoàn tất"}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-5 text-slate-900 w-full">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đơn hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi, cập nhật trạng thái và quản lý giao dịch.</p>
        </div>
        <button onClick={() => setIsBankHistoryOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-medium transition-colors w-fit shadow-sm">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          Lịch sử ngân hàng
        </button>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <div onClick={() => setFilterStatus('all')} className="bg-white hover:bg-slate-50 cursor-pointer border border-slate-200 p-4 rounded-2xl flex flex-col transition-colors shadow-sm">
          <span className="text-slate-500 text-xs font-medium mb-1 uppercase">Tổng đơn hàng</span>
          <span className="text-2xl font-bold text-slate-900">{orders.length}</span>
        </div>
        <div onClick={() => setFilterStatus('pending')} className="bg-amber-50/60 hover:bg-amber-100/60 cursor-pointer border border-amber-200 p-4 rounded-2xl flex flex-col transition-colors shadow-sm">
          <span className="text-amber-700 text-xs font-medium mb-1 uppercase">Chờ xác nhận</span>
          <span className="text-2xl font-bold text-amber-600">{orders.filter(o => o.status === 'pending' || o.status === 'pending_payment').length}</span>
        </div>
        <div onClick={() => setFilterStatus('shipping')} className="bg-purple-50/60 hover:bg-purple-100/60 cursor-pointer border border-purple-200 p-4 rounded-2xl flex flex-col transition-colors shadow-sm">
          <span className="text-purple-700 text-xs font-medium mb-1 uppercase">Đang giao</span>
          <span className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'shipping' || o.status === 'delivered').length}</span>
        </div>
        <div onClick={() => setFilterStatus('completed')} className="bg-emerald-50/60 hover:bg-emerald-100/60 cursor-pointer border border-emerald-200 p-4 rounded-2xl flex flex-col transition-colors shadow-sm">
          <span className="text-emerald-700 text-xs font-medium mb-1 uppercase">Hoàn thành</span>
          <span className="text-2xl font-bold text-emerald-600">{orders.filter(o => o.status === 'completed').length}</span>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl flex flex-col shadow-sm">
          <span className="text-emerald-700 text-xs font-medium mb-1 uppercase">Doanh thu hoàn thành</span>
          <span className="text-2xl font-bold text-emerald-600 truncate" title={formatCurrency(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount + o.shippingFee, 0))}>
            {formatCurrency(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount + o.shippingFee, 0))}
          </span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col md:flex-row gap-3 shrink-0 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Mã đơn, tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="relative">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Date */}
          <div className="relative">
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="all">Mọi thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
            </select>
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="total_desc">Giá trị cao → thấp</option>
              <option value="total_asc">Giá trị thấp → cao</option>
            </select>
            <ArrowDownUp className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {(search || filterStatus !== 'all' || filterDate !== 'all' || sortOption !== 'newest') && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDate('all'); setSortOption('newest'); }}
              className="h-10 px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Xoá lọc
            </button>
          )}
        </div>
      </div>

      {/* BULK ACTIONS */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl">
              <span className="text-sm font-medium text-blue-700">Đã chọn {selectedIds.length} đơn hàng</span>
              <div className="h-4 w-px bg-blue-200 mx-2" />
              <button className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"><Download className="w-3.5 h-3.5" /> Xuất dữ liệu</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLE */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-0">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <div className="flex items-center justify-center cursor-pointer" onClick={toggleSelectAll}>
                    {selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                </th>
                <th className="p-4">Mã đơn</th>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Ngày đặt</th>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Tổng tiền & Thanh toán</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={8} className="p-4"><div className="h-10 bg-slate-100 rounded animate-pulse w-full"></div></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP['pending'];
                  const StatusIcon = statusInfo.icon;
                  const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || PAYMENT_STATUS_MAP['unpaid'];

                  const firstItem = order.items[0];
                  const otherCount = order.items.length - 1;
                  const itemsSummary = otherCount > 0 ? `${firstItem?.productName || 'Sản phẩm'} + ${otherCount} SP khác` : (firstItem?.productName || 'Sản phẩm');

                  return (
                    <tr key={order.id}
                      onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                      className={cn("border-b border-slate-100 transition-colors group cursor-pointer", isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50/80")}
                      style={{ height: '72px' }}
                    >
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center" onClick={(e) => toggleSelectRow(order.id, e)}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-[13px] font-semibold text-emerald-600 group-hover:underline">{order.orderCode}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 text-xs font-bold">
                            {order.customer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 truncate max-w-[150px]">{order.customer.fullName}</span>
                            <span className="text-xs text-slate-400">{order.customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{formatDate(order.createdAt).split(' ')[0]}</span>
                          <span className="text-xs text-slate-400">{formatDate(order.createdAt).split(' ')[1]}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-700 text-[13px] truncate max-w-[200px] inline-block" title={itemsSummary}>{itemsSummary}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-[14px]">{formatCurrency(order.totalAmount + order.shippingFee)}</span>
                          <span className={cn("text-[11px] font-medium mt-0.5", paymentInfo.color)}>{paymentInfo.label}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border", statusInfo.bg, statusInfo.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === order.id ? null : order.id); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenu === order.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
                              <div className="py-1">
                                <button onClick={() => { setActiveMenu(null); setSelectedOrder(order); setIsDetailOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><Eye className="w-4 h-4 text-slate-500" /> Xem chi tiết</button>

                                {['pending', 'pending_payment'].includes(order.status) && (
                                  <button onClick={(e) => { setActiveMenu(null); openConfirm(order.id, 'Xác nhận đơn hàng', 'confirmed', 'success', undefined, e); }} className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 w-full text-left transition-colors font-medium"><CheckCircle2 className="w-4 h-4" /> Xác nhận đơn</button>
                                )}

                                {['pending', 'pending_payment', 'confirmed'].includes(order.status) && (
                                  <button onClick={(e) => { setActiveMenu(null); openConfirm(order.id, 'Hủy đơn hàng', 'cancelled', 'danger', undefined, e); }} className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left transition-colors font-medium"><Ban className="w-4 h-4" /> Hủy đơn hàng</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm shrink-0 bg-slate-50/50">
          <div className="text-slate-500">
            Hiển thị <span className="text-slate-900 font-medium">{(page - 1) * limit + (paginatedOrders.length > 0 ? 1 : 0)}</span> – <span className="text-slate-900 font-medium">{(page - 1) * limit + paginatedOrders.length}</span> / <span className="text-slate-900 font-medium">{processedOrders.length}</span> đơn hàng
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Hiển thị:</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500 text-slate-700 shadow-sm text-sm">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
              <div className="flex gap-1 px-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-900 shadow-sm">{page}</span>
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODAL: CHI TIẾT ĐƠN HÀNG ===== */}
      <AnimatePresence>
        {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-40 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 z-50 text-slate-900"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                    Chi tiết đơn hàng
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-sm font-semibold">{selectedOrder.orderCode}</span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                {/* ORDER TIMELINE */}
                <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">Tiến trình đơn hàng</h3>
                  {renderTimeline(selectedOrder)}
                </div>

                {/* KHÁCH HÀNG & GIAO HÀNG */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Thông tin khách hàng</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm"><User className="w-4 h-4 text-slate-500" /></div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{selectedOrder.customer.fullName}</p>
                          {selectedOrder.customer.email && <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.customer.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm"><Phone className="w-4 h-4 text-slate-500" /></div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{selectedOrder.shippingPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm"><MapPin className="w-4 h-4 text-slate-500" /></div>
                        <div>
                          <p className="text-sm text-slate-700 leading-relaxed">{selectedOrder.shippingAddress}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200">
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Thanh toán & Giao hàng</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500">Phương thức thanh toán</span>
                        <div className="flex items-center gap-2 mt-1">
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-800">{PAYMENT_METHOD_MAP[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                        </div>
                        <span className={cn("inline-block text-[11px] font-bold mt-1 w-max px-2.5 py-0.5 rounded border", PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.bg, PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.color)}>
                          {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                        </span>

                      {selectedOrder.paymentMethod === 'BANK_TRANSFER' && (
                        <div className="pt-4 mt-3 border-t border-slate-200 flex flex-col gap-3">
                          <h4 className="text-[11px] uppercase font-bold text-amber-700 tracking-wider">Xác nhận chuyển khoản</h4>
                          {['pending_verification', 'PENDING_VERIFICATION'].includes(selectedOrder.paymentStatus) ? (
                            <div className="flex flex-col gap-3 bg-amber-50 p-3 rounded-xl border border-amber-200">
                              <p className="text-xs text-amber-800 font-medium">Khách hàng đã báo cáo thanh toán (đã upload bill).</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'PAID')} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">Đã nhận tiền</button>
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'REJECTED')} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm">Từ chối bill</button>
                              </div>
                            </div>
                          ) : ['paid', 'PAID'].includes(selectedOrder.paymentStatus) ? (
                            <p className="text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 p-2 rounded-lg">Đã xác nhận nhận tiền.</p>
                          ) : ['rejected', 'REJECTED'].includes(selectedOrder.paymentStatus) ? (
                            <p className="text-xs text-rose-700 font-medium bg-rose-50 border border-rose-200 p-2 rounded-lg">Đã từ chối bill. Đang chờ khách gửi lại.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs text-amber-700">Chưa nhận được bill từ khách.</p>
                              <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'PAID')} className="py-2 w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">Ép xác nhận đã nhận tiền (Bỏ qua bill)</button>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                      {selectedOrder.note && (
                        <div className="pt-3 border-t border-slate-200">
                          <span className="text-xs text-slate-500 mb-1 block">Ghi chú của khách hàng</span>
                          <p className="text-sm text-amber-800 italic bg-amber-50 p-3 rounded-xl border border-amber-200">{selectedOrder.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SẢN PHẨM */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sản phẩm đã đặt ({selectedOrder.items.reduce((s,i)=>s+i.quantity,0)})</h3>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60">
                    <div className="divide-y divide-slate-200">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 items-center">
                          <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-5 h-5 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{item.variantInfo || 'Mặc định'}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <span className="text-slate-600">{formatCurrency(item.unitPrice)}</span>
                              <span className="text-slate-400">×</span>
                              <span className="font-bold text-slate-900">{item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-900 text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TỔNG KẾT */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tạm tính</span>
                    <span className="font-medium text-slate-800">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  {selectedOrder.discountAmount ? (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-slate-800">{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold text-emerald-600 mt-2 pt-3 border-t border-slate-200">
                    <span className="text-slate-900">Tổng cộng</span>
                    <span>{formatCurrency(selectedOrder.totalAmount + selectedOrder.shippingFee - (selectedOrder.discountAmount || 0))}</span>
                  </div>
                </div>

                {/* Bottom spacing for sticky footer */}
                <div className="h-4"></div>
              </div>

              {/* STICKY FOOTER ACTIONS */}
              {!['cancelled', 'returned'].includes(selectedOrder.status) && (
                <div className="p-4 bg-white border-t border-slate-200 shrink-0 flex gap-3">
                  {['pending', 'pending_payment'].includes(selectedOrder.status) && (
                    <>
                      <button onClick={() => openConfirm(selectedOrder.id, 'Hủy đơn hàng', 'cancelled', 'danger')} className="flex-1 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 transition-colors">Hủy đơn</button>

                      {selectedOrder.paymentMethod === 'BANK_TRANSFER' && !['paid', 'PAID'].includes(selectedOrder.paymentStatus) ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium text-center px-2 cursor-not-allowed">
                          <span>Chưa thể duyệt đơn</span>
                          <span className="text-[10px] opacity-80">Phải xác nhận đã thanh toán trước</span>
                        </div>
                      ) : (
                        <button onClick={() => openConfirm(selectedOrder.id, 'Xác nhận đơn hàng', 'confirmed', 'success')} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md transition-colors">Xác nhận đơn</button>
                      )}
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Giao cho vận chuyển', 'shipping', 'success')} className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium shadow-md transition-colors">Bắt đầu giao hàng</button>
                  )}
                  {selectedOrder.status === 'shipping' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Xác nhận đã giao hàng', 'delivered', 'success')} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition-colors">Xác nhận đã giao</button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Hoàn thành đơn hàng', 'completed', 'success', 'paid')} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-md transition-colors">Hoàn thành & Đã thu tiền</button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <div className="w-full py-2.5 text-center text-emerald-600 text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Đơn hàng đã hoàn tất
                    </div>
                  )}
                </div>
              )}
              {['cancelled', 'returned'].includes(selectedOrder.status) && (
                 <div className="p-4 bg-white border-t border-slate-200 shrink-0 text-center">
                    <div className="py-2.5 text-rose-600 text-sm font-bold flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" /> Đơn hàng đã bị {selectedOrder.status === 'cancelled' ? 'hủy' : 'trả lại'}
                    </div>
                 </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 text-slate-900">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 border", confirmAction.tone === 'danger' ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{confirmAction.actionLabel}?</h3>
                  <p className="text-sm text-slate-500 mt-1">Xác nhận thao tác này.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors">Quay lại</button>
                <button
                  onClick={() => handleUpdateStatus(confirmAction.orderId, confirmAction.newStatus, confirmAction.newPaymentStatus)}
                  disabled={isUpdating}
                  className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm text-white shadow-md transition-colors disabled:opacity-50 flex items-center justify-center",
                    confirmAction.tone === 'danger' ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
                  )}
                >
                  {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Xác nhận"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== BANK HISTORY PANEL ===== */}
      <BankHistoryPanel isOpen={isBankHistoryOpen} onClose={() => setIsBankHistoryOpen(false)} />
    </div>
  );
}

// Dummy User icon component since lucide-react User isn't exported in the above destructuring (if needed)
function User(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
