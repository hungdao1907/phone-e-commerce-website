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
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface Order {
  id: string;
  orderCode: string;
  customer?: Customer | null;
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
  if (!dateString) return '---';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleDateString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const STATUS_MAP: Record<string, { label: string, color: string, icon: any, bg: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30', icon: Clock },
  pending_payment: { label: 'Chờ xác nhận', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30', icon: Clock },
  confirmed: { label: 'Đã xác nhận', color: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-400/30', icon: CheckCircle2 },
  shipping: { label: 'Đang giao hàng', color: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-400/30', icon: Truck },
  delivered: { label: 'Đã giao', color: 'text-[#2ee88a]', bg: 'bg-emerald-500/20 border-emerald-400/30', icon: Package },
  completed: { label: 'Hoàn thành', color: 'text-[#2ee88a]', bg: 'bg-emerald-500/20 border-emerald-400/30', icon: CheckCircle2 },
  cancelled: { label: 'Đã hủy', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-400/30', icon: XCircle },
  returned: { label: 'Đã trả hàng', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-400/30', icon: XCircle },
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
  unpaid: { label: 'Chưa thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-400/20' },
  UNPAID: { label: 'Chưa thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-400/20' },
  PENDING: { label: 'Chưa thanh toán', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-400/20' },
  paid: { label: 'Đã thanh toán', color: 'text-[#2ee88a]', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  PAID: { label: 'Đã thanh toán', color: 'text-[#2ee88a]', bg: 'bg-emerald-500/15 border-emerald-400/30' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-400/30' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-400/30' }
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
        (o.orderCode && o.orderCode.toLowerCase().includes(q)) ||
        (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q)) ||
        (o.customer?.phone && o.customer.phone.includes(q)) ||
        (o.customer?.email && o.customer.email.toLowerCase().includes(q)) ||
        (o.shippingPhone && o.shippingPhone.includes(q)) ||
        (o.shippingAddress && o.shippingAddress.toLowerCase().includes(q))
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

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const handleExportData = () => {
    const ordersToExport = selectedIds.length > 0 
      ? orders.filter(o => selectedIds.includes(o.id))
      : processedOrders;
    
    if (ordersToExport.length === 0) {
      alert('Không có đơn hàng nào để xuất');
      return;
    }

    const headers = ['Mã đơn hàng', 'Khách hàng', 'Số điện thoại', 'Ngày đặt', 'Tổng tiền (VND)', 'Phương thức TT', 'Trạng thái TT', 'Trạng thái đơn hàng', 'Địa chỉ giao hàng'];
    const rows = ordersToExport.map(o => [
      `"${o.orderCode}"`,
      `"${(o.customer?.fullName || 'Khách vãng lai').replace(/"/g, '""')}"`,
      `"${o.customer?.phone || o.shippingPhone || ''}"`,
      `"${formatDate(o.createdAt)}"`,
      `"${o.totalAmount + o.shippingFee}"`,
      `"${PAYMENT_METHOD_MAP[o.paymentMethod] || o.paymentMethod}"`,
      `"${PAYMENT_STATUS_MAP[o.paymentStatus]?.label || o.paymentStatus}"`,
      `"${STATUS_MAP[o.status]?.label || o.status}"`,
      `"${(o.shippingAddress || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `don-hang-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30"><CheckCircle2 className="w-4 h-4"/></div>
              <div className="w-px h-8 bg-white/10 my-1"></div>
            </div>
            <div className="pb-4">
              <p className="text-white text-sm font-medium">Đã đặt hàng</p>
              <p className="text-white/50 text-xs mt-0.5">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30"><XCircle className="w-4 h-4"/></div>
            </div>
            <div>
              <p className="text-red-400 text-sm font-medium">Đã hủy</p>
              <p className="text-red-400/50 text-xs mt-0.5">{formatDate(order.updatedAt)}</p>
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
          const isFuture = index > currentIdx;
          
          let timeString = null;
          if (index === 0) timeString = formatDate(order.createdAt);
          else if (isCurrent) timeString = formatDate(order.updatedAt);

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 border", 
                  isPast || isCurrent ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]" : "bg-white/5 text-white/30 border-white/10"
                )}>
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                {index < steps.length - 1 && (
                  <div className={cn("w-px h-8 my-1", isPast ? "bg-emerald-500/50" : "bg-white/10")} />
                )}
              </div>
              <div className={cn("pb-6", index === steps.length - 1 && "pb-0")}>
                <p className={cn("text-sm font-medium", isPast || isCurrent ? "text-white" : "text-white/40")}>{step.label}</p>
                {(timeString || isPast) && (
                  <p className="text-white/50 text-xs mt-0.5">{timeString || "Hoàn tất"}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-full gap-5 text-white w-full pb-16">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-1 pt-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Đơn hàng</h1>
          <p className="text-xs text-zinc-400 mt-1">Theo dõi, cập nhật trạng thái và quản lý giao dịch.</p>
        </div>
        <button 
          onClick={() => setIsBankHistoryOpen(true)} 
          className="btn-neon-primary px-5 py-2.5 rounded-full text-sm flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(46,232,138,0.4)]"
        >
          <CreditCard className="w-4 h-4" />
          Lịch sử ngân hàng
        </button>
      </header>

      {/* 5 THẺ KPI ĐƠN HÀNG (ĐỒNG BỘ NEON RIM GLOW) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 shrink-0">
        {/* Tổng đơn hàng */}
        <div 
          onClick={() => setFilterStatus('all')} 
          className={cn(
            "kpi-glow-card p-5 flex flex-col justify-between cursor-pointer transition-all",
            filterStatus === 'all' && "ring-1 ring-emerald-400/60 shadow-[0_0_25px_rgba(46,232,138,0.25)]"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Tổng đơn hàng</span>
          <div className="text-3xl font-bold text-white mt-3">{orders.length}</div>
        </div>

        {/* Chờ xác nhận (Cảnh báo Cam Hổ Phách) */}
        <div 
          onClick={() => setFilterStatus('pending')} 
          className={cn(
            "kpi-glow-card kpi-glow-amber p-5 flex flex-col justify-between cursor-pointer transition-all",
            filterStatus === 'pending' && "ring-1 ring-amber-400/60 shadow-[0_0_25px_rgba(255,180,50,0.25)]"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-amber-300/90">Chờ xác nhận</span>
          <div className="text-3xl font-bold text-amber-300 mt-3">
            {orders.filter(o => o.status === 'pending' || o.status === 'pending_payment').length}
          </div>
        </div>

        {/* Đang giao (Tông Cyan) */}
        <div 
          onClick={() => setFilterStatus('shipping')} 
          className={cn(
            "kpi-glow-card kpi-glow-cyan p-5 flex flex-col justify-between cursor-pointer transition-all",
            filterStatus === 'shipping' && "ring-1 ring-cyan-400/60 shadow-[0_0_25px_rgba(56,189,248,0.25)]"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-cyan-300/90">Đang giao</span>
          <div className="text-3xl font-bold text-cyan-300 mt-3">
            {orders.filter(o => o.status === 'shipping' || o.status === 'delivered').length}
          </div>
        </div>

        {/* Hoàn thành (Neon Mint) */}
        <div 
          onClick={() => setFilterStatus('completed')} 
          className={cn(
            "kpi-glow-card p-5 flex flex-col justify-between cursor-pointer transition-all",
            filterStatus === 'completed' && "ring-1 ring-emerald-400/60 shadow-[0_0_25px_rgba(46,232,138,0.25)]"
          )}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-300/90">Hoàn thành</span>
          <div className="text-3xl font-bold text-[#2ee88a] mt-3">
            {orders.filter(o => o.status === 'completed').length}
          </div>
        </div>

        {/* Doanh thu hoàn thành */}
        <div className="kpi-glow-card p-5 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Doanh thu hoàn thành</span>
          <div 
            className="text-xl sm:text-2xl font-bold text-[#2ee88a] mt-3 tracking-tight truncate" 
            title={formatCurrency(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount + o.shippingFee, 0))}
          >
            {formatCurrency(orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount + o.shippingFee, 0))}
          </div>
        </div>
      </section>

      {/* THANH BỘ LỌC & TÌM KIẾM ĐƠN HÀNG */}
      <section className="neon-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Mã đơn, tên, email, SĐT..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black/45 border border-white/10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-400/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="relative">
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)} 
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#06120d] text-white">Tất cả trạng thái</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key} className="bg-[#06120d] text-white">{val.label}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <select 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#06120d] text-white">Mọi thời gian</option>
              <option value="today" className="bg-[#06120d] text-white">Hôm nay</option>
              <option value="7days" className="bg-[#06120d] text-white">7 ngày qua</option>
              <option value="30days" className="bg-[#06120d] text-white">30 ngày qua</option>
              <option value="this_month" className="bg-[#06120d] text-white">Tháng này</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Option */}
          <div className="relative">
            <select 
              value={sortOption} 
              onChange={e => setSortOption(e.target.value)} 
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="newest" className="bg-[#06120d] text-white">Mới nhất</option>
              <option value="oldest" className="bg-[#06120d] text-white">Cũ nhất</option>
              <option value="total_desc" className="bg-[#06120d] text-white">Giá trị cao → thấp</option>
              <option value="total_asc" className="bg-[#06120d] text-white">Giá trị thấp → cao</option>
            </select>
            <ArrowDownUp className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(search || filterStatus !== 'all' || filterDate !== 'all' || sortOption !== 'newest') && (
            <button 
              onClick={() => { setSearch(''); setFilterStatus('all'); setFilterDate('all'); setSortOption('newest'); }}
              className="glass-btn-3d px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 border-rose-500/20 hover:border-rose-500/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Xoá lọc
            </button>
          )}
        </div>
      </section>

      {/* THANH THAO TÁC HÀNG LOẠT */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="neon-panel px-5 py-3 flex flex-wrap items-center justify-between gap-3 bg-emerald-500/[0.08] border-emerald-400/30 shrink-0"
          >
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-[#2ee88a]">Đã chọn {selectedIds.length} đơn hàng</span>
              <button 
                onClick={handleExportData} 
                className="glass-btn-3d px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 flex items-center gap-2 hover:border-emerald-400/40 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-300" />
                Xuất dữ liệu
              </button>
            </div>
            <button 
              onClick={() => setSelectedIds([])} 
              className="text-xs text-zinc-400 hover:text-white transition cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
      <section className="neon-panel overflow-hidden flex flex-col w-full shadow-2xl shrink-0">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-black/50 backdrop-blur-md">
              <tr className="border-b border-white/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-2 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0} 
                    onChange={toggleSelectAll} 
                    className="neon-checkbox cursor-pointer" 
                  />
                </th>
                <th className="py-3.5 px-3">Mã đơn</th>
                <th className="py-3.5 px-3">Khách hàng</th>
                <th className="py-3.5 px-3">Ngày đặt</th>
                <th className="py-3.5 px-3">Sản phẩm</th>
                <th className="py-3.5 px-3">Tổng tiền & Thanh toán</th>
                <th className="py-3.5 px-3">Trạng thái</th>
                <th className="py-3.5 pl-3 pr-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={8} className="p-4"><div className="h-10 bg-white/5 rounded-xl animate-pulse w-full"></div></td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-zinc-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20 text-emerald-400" />
                    Không tìm thấy đơn hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP['pending'];
                  const StatusIcon = statusInfo.icon;
                  const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || PAYMENT_STATUS_MAP['unpaid'];

                  const firstItem = order.items?.[0];
                  const otherCount = Math.max(0, (order.items?.length || 0) - 1);
                  const itemsSummary = otherCount > 0 ? `${firstItem?.productName || 'Sản phẩm'} + ${otherCount} SP khác` : (firstItem?.productName || 'Sản phẩm');

                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                      className={cn("border-b border-white/5 transition-colors group cursor-pointer", isSelected ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.04]")} 
                      style={{ height: '72px' }}
                    >
                      <td className="py-4 pl-5 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={(e) => toggleSelectRow(order.id, e as any)} 
                          className="neon-checkbox cursor-pointer" 
                        />
                      </td>
                      <td className="py-4 px-3">
                        <span className="font-mono text-[13px] font-semibold text-[#2ee88a] group-hover:underline">
                          {order.orderCode}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-400/30 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {(order.customer?.fullName?.trim()?.charAt(0) || order.shippingPhone?.charAt(0) || 'K').toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-white truncate max-w-[150px]">
                              {order.customer?.fullName || order.shippingPhone || 'Khách vãng lai'}
                            </span>
                            <span className="text-[11px] text-zinc-400">
                              {order.customer?.phone || order.shippingPhone || '---'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-xs text-zinc-300 whitespace-nowrap">
                        <div>{formatDate(order.createdAt).split(' ')[0] || ''}</div>
                        <div className="text-zinc-500 text-[11px] mt-0.5">{formatDate(order.createdAt).split(' ')[1] || ''}</div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="text-zinc-200 text-[13px] truncate max-w-[200px] inline-block" title={itemsSummary}>
                          {itemsSummary}
                        </span>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-[14px]">
                            {formatCurrency(order.totalAmount + order.shippingFee)}
                          </span>
                          <span className={cn("text-[11px] font-medium mt-0.5", paymentInfo.color)}>
                            {paymentInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-3 whitespace-nowrap">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", statusInfo.bg, statusInfo.color)}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="relative inline-block text-left" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === order.id ? null : order.id); }} 
                            className="w-8 h-8 rounded-lg glass-btn-3d inline-flex items-center justify-center text-zinc-300 hover:text-white transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeMenu === order.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#091a13] shadow-2xl ring-1 ring-emerald-400/20 border border-emerald-400/30 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                              <div className="py-1">
                                <button onClick={() => { setActiveMenu(null); setSelectedOrder(order); setIsDetailOpen(true); }} className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-200 hover:bg-emerald-500/10 hover:text-[#2ee88a] w-full text-left transition-colors">
                                  <Eye className="w-4 h-4" /> Xem chi tiết
                                </button>
                                
                                {['pending', 'pending_payment'].includes(order.status) && (
                                  <button onClick={(e) => { setActiveMenu(null); openConfirm(order.id, 'Xác nhận đơn hàng', 'confirmed', 'success', undefined, e); }} className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 w-full text-left transition-colors">
                                    <CheckCircle2 className="w-4 h-4" /> Xác nhận đơn
                                  </button>
                                )}
                                
                                {['pending', 'pending_payment', 'confirmed'].includes(order.status) && (
                                  <button onClick={(e) => { setActiveMenu(null); openConfirm(order.id, 'Hủy đơn hàng', 'cancelled', 'danger', undefined, e); }} className="flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 w-full text-left transition-colors">
                                    <Ban className="w-4 h-4" /> Hủy đơn hàng
                                  </button>
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

        {/* PHÂN TRANG */}
        <div className="px-5 py-3.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 bg-black/40 shrink-0">
          <span>
            Hiển thị <strong className="text-white">{(page - 1) * limit + (paginatedOrders.length > 0 ? 1 : 0)} – {(page - 1) * limit + paginatedOrders.length}</strong> trên <strong className="text-white">{processedOrders.length}</strong> đơn hàng
          </span>
          <div className="flex items-center gap-3">
            <span>Hiển thị:</span>
            <select 
              value={limit} 
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} 
              className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-emerald-400/50 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition"
              >
                &lt;
              </button>
              {paginationRange[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      page === 1 ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                    )}
                  >
                    1
                  </button>
                  {paginationRange[0] > 2 && <span className="text-zinc-500 px-0.5">...</span>}
                </>
              )}
              {paginationRange.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    page === p ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
              {paginationRange[paginationRange.length - 1] < totalPages && (
                <>
                  {paginationRange[paginationRange.length - 1] < totalPages - 1 && <span className="text-zinc-500 px-0.5">...</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      page === totalPages ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                    )}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages || totalPages === 0} 
                className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MODAL: CHI TIẾT ĐƠN HÀNG ===== */}
      <AnimatePresence>
        {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-40 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDetailOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[520px] h-full bg-[#06120d] shadow-2xl flex flex-col border-l border-emerald-400/20 z-50 backdrop-blur-2xl"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40 shrink-0">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                    Chi tiết đơn hàng 
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[#2ee88a] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400/30 text-sm">{selectedOrder.orderCode}</span>
                    <span className="text-xs text-white/40">·</span>
                    <span className="text-xs text-zinc-400">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => setIsDetailOpen(false)} className="w-8 h-8 rounded-lg glass-btn-3d flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* BODY */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                
                {/* ORDER TIMELINE */}
                <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-5">Tiến trình đơn hàng</h3>
                  {renderTimeline(selectedOrder)}
                </div>

                {/* KHÁCH HÀNG & GIAO HÀNG */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Thông tin khách hàng</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><User className="w-4 h-4 text-white/60" /></div>
                        <div>
                          <p className="font-medium text-white text-sm">{selectedOrder.customer?.fullName || selectedOrder.shippingPhone || 'Khách vãng lai'}</p>
                          {selectedOrder.customer?.email && <p className="text-xs text-white/50 mt-0.5">{selectedOrder.customer.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Phone className="w-4 h-4 text-white/60" /></div>
                        <div>
                          <p className="font-medium text-white text-sm">{selectedOrder.customer?.phone || selectedOrder.shippingPhone || '---'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5"><MapPin className="w-4 h-4 text-white/60" /></div>
                        <div>
                          <p className="text-sm text-white/80 leading-relaxed">{selectedOrder.shippingAddress || 'Chưa có thông tin địa chỉ'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                    <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Thanh toán & Giao hàng</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-white/50">Phương thức thanh toán</span>
                        <div className="flex items-center gap-2 mt-1">
                          <CreditCard className="w-4 h-4 text-white/40" />
                          <span className="text-sm font-medium text-white/90">{PAYMENT_METHOD_MAP[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                        </div>
                        <span className={cn("inline-block text-[11px] font-bold mt-1 w-max px-2 py-0.5 rounded border", PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.bg, PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.color)}>
                          {PAYMENT_STATUS_MAP[selectedOrder.paymentStatus]?.label || selectedOrder.paymentStatus}
                        </span>

                      {selectedOrder.paymentMethod === 'BANK_TRANSFER' && (
                        <div className="pt-4 mt-3 border-t border-white/5 flex flex-col gap-3">
                          <h4 className="text-[11px] uppercase font-bold text-yellow-500/80 tracking-wider">Xác nhận chuyển khoản</h4>
                          {['pending_verification', 'PENDING_VERIFICATION'].includes(selectedOrder.paymentStatus) ? (
                            <div className="flex flex-col gap-3 bg-yellow-500/5 p-3 rounded-xl border border-yellow-500/10">
                              <p className="text-xs text-yellow-400">Khách hàng đã báo cáo thanh toán (đã upload bill).</p>
                              <div className="flex gap-2">
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'PAID')} className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-bold transition-colors">Đã nhận tiền</button>
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'REJECTED')} className="flex-1 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-colors">Từ chối bill</button>
                              </div>
                            </div>
                          ) : ['paid', 'PAID'].includes(selectedOrder.paymentStatus) ? (
                            <p className="text-xs text-emerald-400 font-medium">Đã xác nhận nhận tiền.</p>
                          ) : ['rejected', 'REJECTED'].includes(selectedOrder.paymentStatus) ? (
                            <p className="text-xs text-red-400 font-medium">Đã từ chối bill. Đang chờ khách gửi lại.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs text-yellow-500/60">Chưa nhận được bill từ khách.</p>
                              <button onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.status, 'PAID')} className="py-2 w-full bg-emerald-500/10 text-emerald-500/60 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-xs font-bold transition-colors">Ép xác nhận đã nhận tiền (Bỏ qua bill)</button>
                            </div>
                          )}
                        </div>
                      )}
                      </div>
                      {selectedOrder.note && (
                        <div className="pt-3 border-t border-white/5">
                          <span className="text-xs text-white/50 mb-1 block">Ghi chú của khách hàng</span>
                          <p className="text-sm text-yellow-400/90 italic bg-yellow-400/5 p-3 rounded-xl border border-yellow-400/10">{selectedOrder.note}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SẢN PHẨM */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Sản phẩm đã đặt ({(selectedOrder.items || []).reduce((s,i)=>s+i.quantity,0)})</h3>
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                    <div className="divide-y divide-white/5">
                      {(selectedOrder.items || []).map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 items-center">
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            {item.image ? <img src={item.image} alt="" className="w-full h-full object-contain p-1" /> : <Package className="w-5 h-5 text-white/20" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">{item.productName}</p>
                            <p className="text-xs text-white/40 mt-0.5 truncate">{item.variantInfo || 'Mặc định'}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              <span className="text-white/70">{formatCurrency(item.unitPrice)}</span>
                              <span className="text-white/30">×</span>
                              <span className="font-bold text-white">{item.quantity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-white text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* TỔNG KẾT */}
                <div className="p-5 rounded-2xl bg-[#1f2123] border border-white/5 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between text-white/60">
                    <span>Tạm tính</span>
                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  {selectedOrder.discountAmount ? (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Giảm giá</span>
                      <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-white/60">
                    <span>Phí vận chuyển</span>
                    <span>{formatCurrency(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold text-emerald-400 mt-2 pt-3 border-t border-white/10">
                    <span>Tổng cộng</span>
                    <span>{formatCurrency(selectedOrder.totalAmount + selectedOrder.shippingFee - (selectedOrder.discountAmount || 0))}</span>
                  </div>
                </div>

                {/* Bottom spacing for sticky footer */}
                <div className="h-4"></div>
              </div>

              {/* STICKY FOOTER ACTIONS */}
              {!['cancelled', 'returned'].includes(selectedOrder.status) && (
                <div className="p-4 bg-[#181a1b] border-t border-white/10 shrink-0 flex gap-3">
                  {['pending', 'pending_payment'].includes(selectedOrder.status) && (
                    <>
                      <button onClick={() => openConfirm(selectedOrder.id, 'Hủy đơn hàng', 'cancelled', 'danger')} className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors">Hủy đơn</button>
                      
                      {selectedOrder.paymentMethod === 'BANK_TRANSFER' && !['paid', 'PAID'].includes(selectedOrder.paymentStatus) ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 text-xs font-medium text-center px-2 cursor-not-allowed">
                          <span>Chưa thể duyệt đơn</span>
                          <span className="text-[10px] opacity-70">Phải xác nhận đã thanh toán trước</span>
                        </div>
                      ) : (
                        <button onClick={() => openConfirm(selectedOrder.id, 'Xác nhận đơn hàng', 'confirmed', 'success')} className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium shadow-lg transition-colors">Xác nhận đơn</button>
                      )}
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Giao cho vận chuyển', 'shipping', 'success')} className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white text-sm font-medium shadow-lg transition-colors">Bắt đầu giao hàng</button>
                  )}
                  {selectedOrder.status === 'shipping' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Xác nhận đã giao hàng', 'delivered', 'success')} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium shadow-lg transition-colors">Xác nhận đã giao</button>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <button onClick={() => openConfirm(selectedOrder.id, 'Hoàn thành đơn hàng', 'completed', 'success', 'paid')} className="w-full py-2.5 rounded-xl bg-[#22C55E] hover:bg-green-400 text-white text-sm font-medium shadow-lg transition-colors text-shadow">Hoàn thành & Đã thu tiền</button>
                  )}
                  {selectedOrder.status === 'completed' && (
                    <div className="w-full py-2.5 text-center text-emerald-500 text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Đơn hàng đã hoàn tất
                    </div>
                  )}
                </div>
              )}
              {['cancelled', 'returned'].includes(selectedOrder.status) && (
                 <div className="p-4 bg-[#181a1b] border-t border-white/10 shrink-0 text-center">
                    <div className="py-2.5 text-red-500 text-sm font-bold flex items-center justify-center gap-2">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-[#1c1c1e] border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0 border", confirmAction.tone === 'danger' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20")}>
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{confirmAction.actionLabel}?</h3>
                  <p className="text-sm text-white/50 mt-1">Xác nhận thao tác này.</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 font-medium text-sm transition-colors">Quay lại</button>
                <button 
                  onClick={() => handleUpdateStatus(confirmAction.orderId, confirmAction.newStatus, confirmAction.newPaymentStatus)}
                  disabled={isUpdating}
                  className={cn("flex-1 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg transition-colors disabled:opacity-50 flex items-center justify-center", 
                    confirmAction.tone === 'danger' ? "bg-red-500 hover:bg-red-400" : "bg-emerald-500 hover:bg-emerald-400"
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
