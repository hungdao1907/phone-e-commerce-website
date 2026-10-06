import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, RefreshCw, CreditCard, ExternalLink, CheckCircle2, AlertTriangle, AlertCircle, Eye, Link as LinkIcon, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { AdminSelect } from '@/components/admin/common/AdminSelect';

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

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  UNMATCHED: { label: 'Chưa đối soát', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: AlertCircle },
  MATCHED: { label: 'Đã đối soát', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  INVALID_AMOUNT: { label: 'Sai số tiền', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  INVALID_CONTENT: { label: 'Sai cú pháp', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: AlertTriangle },
  MANUAL_REVIEW: { label: 'Cần kiểm tra', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Eye }
};

interface BankHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BankHistoryPanel({ isOpen, onClose }: BankHistoryPanelProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { token } = useAuthStore();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [txRes, statsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/bank/transactions?status=${filterStatus}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/bank/transactions/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (txRes.ok) {
        const json = await txRes.json();
        setTransactions(json.data || []);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Error fetching bank data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, filterStatus]);

  const handleManualMatch = async (txId: string, orderId: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/bank/transactions/${txId}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId })
      });
      if (res.ok) {
        alert('Đối soát thành công!');
        fetchData();
        setIsDetailOpen(false);
      } else {
        const error = await res.json();
        alert(`Lỗi: ${error.message}`);
      }
    } catch (error) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const filteredTx = transactions.filter(t =>
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.transactionId.toLowerCase().includes(search.toLowerCase()) ||
    t.orderCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-5xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 text-slate-900"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  Lịch sử ngân hàng
                </h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi giao dịch chuyển khoản và tự động đối soát đơn hàng.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="p-2 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-colors shadow-sm" title="Làm mới">
                  <RefreshCw className={cn("w-4 h-4 text-slate-600", isLoading && "animate-spin")} />
                </button>
                <button onClick={onClose} className="p-2 bg-white hover:bg-slate-100 rounded-full border border-slate-200 transition-colors shadow-sm">
                  <X className="w-4 h-4 text-slate-600 hover:text-slate-900" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

              {/* SUMMARY CARDS */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col shadow-sm">
                    <span className="text-slate-500 text-xs font-medium mb-1 uppercase">Tổng giao dịch</span>
                    <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col shadow-sm">
                    <span className="text-emerald-700 text-xs font-medium mb-1 uppercase">Đã đối soát</span>
                    <span className="text-2xl font-bold text-emerald-600">{stats.matched}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col shadow-sm">
                    <span className="text-amber-700 text-xs font-medium mb-1 uppercase">Chưa đối soát / Lỗi</span>
                    <span className="text-2xl font-bold text-amber-600">{stats.unmatched + stats.needsReview}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col shadow-sm">
                    <span className="text-blue-700 text-xs font-medium mb-1 uppercase">Tổng tiền vào</span>
                    <span className="text-2xl font-bold text-blue-600 truncate" title={formatCurrency(stats.totalAmountIn)}>{formatCurrency(stats.totalAmountIn)}</span>
                  </div>
                </div>
              )}

              {/* TOOLBAR */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Mã GD, Nội dung, Mã Đơn..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400 shadow-sm"
                  />
                </div>
                <AdminSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { value: 'all', label: 'Tất cả trạng thái' },
                    { value: 'UNMATCHED', label: 'Chưa đối soát', dotColor: 'bg-slate-400' },
                    { value: 'MATCHED', label: 'Đã đối soát', dotColor: 'bg-emerald-500' },
                    { value: 'INVALID_AMOUNT', label: 'Sai số tiền', dotColor: 'bg-amber-500' },
                    { value: 'INVALID_CONTENT', label: 'Sai cú pháp', dotColor: 'bg-rose-500' },
                  ]}
                  icon={<Filter className="w-3.5 h-3.5" />}
                  menuWidth="w-48"
                />
              </div>

              {/* TABLE */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                        <th className="p-4 font-medium">Thời gian</th>
                        <th className="p-4 font-medium">Mã GD / Ngân hàng</th>
                        <th className="p-4 font-medium max-w-[200px]">Nội dung</th>
                        <th className="p-4 font-medium text-right">Số tiền</th>
                        <th className="p-4 font-medium">Đơn hàng</th>
                        <th className="p-4 font-medium">Trạng thái</th>
                        <th className="p-4 font-medium text-center">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {isLoading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                      ) : filteredTx.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">Không có giao dịch nào</td></tr>
                      ) : (
                        filteredTx.map(tx => {
                          const status = STATUS_MAP[tx.status] || STATUS_MAP.UNMATCHED;
                          const StatusIcon = status.icon;

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4 text-slate-600">{formatDate(tx.transactionDate)}</td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-slate-800 font-mono text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-fit">{tx.transactionId}</span>
                                  <span className="text-slate-400 text-[11px] mt-1">{tx.bankName || 'Unknown Bank'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-800 truncate max-w-[200px]" title={tx.description}>{tx.description}</td>
                              <td className={cn("p-4 text-right font-bold", tx.transactionType === 'IN' ? 'text-emerald-600' : 'text-rose-600')}>
                                {tx.transactionType === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </td>
                              <td className="p-4">
                                {tx.orderCode ? (
                                  <span className="font-mono text-emerald-700 font-semibold text-xs px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded">{tx.orderCode}</span>
                                ) : (
                                  <span className="text-slate-300 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase border", status.bg, status.color)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => { setSelectedTx(tx); setIsDetailOpen(true); }}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 transition-colors inline-block"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailOpen && selectedTx && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-900"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">Chi tiết giao dịch</h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-6">

              <div className="flex flex-col gap-1 items-center justify-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 text-xs uppercase tracking-wider font-semibold">Số tiền nhận</span>
                <span className="text-3xl font-bold text-emerald-600">+{formatCurrency(selectedTx.amount)}</span>
                <span className="text-slate-500 text-xs mt-1">{formatDate(selectedTx.transactionDate)}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Mã giao dịch</span>
                  <span className="font-mono text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{selectedTx.transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Ngân hàng</span>
                  <span className="text-slate-800 font-medium">{selectedTx.bankName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Nội dung</span>
                  <span className="text-slate-800 text-right max-w-[60%]">{selectedTx.description}</span>
                </div>
              </div>

              {/* KẾT QUẢ ĐỐI SOÁT */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Kết quả đối soát</h4>

                {selectedTx.status === 'MATCHED' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Giao dịch đã được đối soát tự động thành công với đơn hàng <span className="font-mono font-bold text-slate-900">{selectedTx.orderCode}</span>.</p>
                    </div>
                    {selectedTx.order && (
                       <div className="p-3 bg-white rounded-lg border border-slate-200 flex justify-between items-center mt-2 shadow-sm">
                         <div>
                           <p className="text-xs text-slate-500">Đơn hàng tương ứng</p>
                           <p className="font-mono font-bold text-emerald-600">{selectedTx.order.orderCode}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-slate-500">Tổng tiền đơn</p>
                           <p className="font-bold text-slate-900">{formatCurrency(selectedTx.order.totalAmount)}</p>
                         </div>
                       </div>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_AMOUNT' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Tìm thấy mã đơn <span className="font-mono font-bold text-slate-900">{selectedTx.orderCode}</span> nhưng số tiền không khớp.</p>
                    </div>
                    {selectedTx.order && (
                      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-2 mt-2 text-sm">
                        <div className="flex justify-between text-slate-700">
                          <span>Đơn hàng yêu cầu:</span>
                          <span className="font-bold text-slate-900">{formatCurrency(selectedTx.order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-700">
                          <span>Đã chuyển:</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(selectedTx.amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-700 pt-2 border-t border-rose-200 font-bold">
                          <span>Chênh lệch:</span>
                          <span>{selectedTx.amount > selectedTx.order.totalAmount ? '+' : ''}{formatCurrency(selectedTx.amount - selectedTx.order.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                    {selectedTx.order && selectedTx.order.paymentStatus !== 'PAID' && (
                      <button onClick={() => handleManualMatch(selectedTx.id, selectedTx.order.id)} className="w-full mt-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md transition-colors">
                        Bỏ qua cảnh báo và Đối soát thủ công
                      </button>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_CONTENT' ? (
                  <div className="flex items-start gap-2 text-rose-700">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">Không tìm thấy mã đơn hàng hợp lệ (cấu trúc DHxxxx) trong nội dung chuyển khoản.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-slate-500">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">Giao dịch chưa được đối soát hoặc không tìm thấy đơn hàng tương ứng trong hệ thống.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
