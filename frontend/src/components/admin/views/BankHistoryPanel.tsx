import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Filter, RefreshCw, CreditCard, ExternalLink, CheckCircle2, AlertTriangle, AlertCircle, Eye, Link as LinkIcon, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

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
  UNMATCHED: { label: 'Chưa đối soát', color: 'text-neutral-400', bg: 'bg-neutral-500/10 border-neutral-500/20', icon: AlertCircle },
  MATCHED: { label: 'Đã đối soát', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  INVALID_AMOUNT: { label: 'Sai số tiền', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: AlertTriangle },
  INVALID_CONTENT: { label: 'Sai cú pháp', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
  MANUAL_REVIEW: { label: 'Cần kiểm tra', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', icon: Eye }
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-5xl h-full bg-[#181a1b] shadow-2xl flex flex-col border-l border-white/10"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#1f2123] shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Banknote className="w-5 h-5 text-emerald-400" />
                  Lịch sử ngân hàng
                </h2>
                <p className="text-sm text-white/50 mt-1">Theo dõi giao dịch chuyển khoản và tự động đối soát đơn hàng.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchData} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors" title="Làm mới">
                  <RefreshCw className={cn("w-4 h-4 text-white/70", isLoading && "animate-spin")} />
                </button>
                <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-white/70 hover:text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* SUMMARY CARDS */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col">
                    <span className="text-white/50 text-xs font-medium mb-1 uppercase">Tổng giao dịch</span>
                    <span className="text-2xl font-bold text-white">{stats.total}</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col">
                    <span className="text-emerald-400/80 text-xs font-medium mb-1 uppercase">Đã đối soát</span>
                    <span className="text-2xl font-bold text-emerald-400">{stats.matched}</span>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex flex-col">
                    <span className="text-yellow-400/80 text-xs font-medium mb-1 uppercase">Chưa đối soát / Lỗi</span>
                    <span className="text-2xl font-bold text-yellow-400">{stats.unmatched + stats.needsReview}</span>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col">
                    <span className="text-blue-400/80 text-xs font-medium mb-1 uppercase">Tổng tiền vào</span>
                    <span className="text-2xl font-bold text-blue-400 truncate" title={formatCurrency(stats.totalAmountIn)}>{formatCurrency(stats.totalAmountIn)}</span>
                  </div>
                </div>
              )}

              {/* TOOLBAR */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Mã GD, Nội dung, Mã Đơn..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-black/20 border border-white/10 text-sm text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-white/30" 
                  />
                </div>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="h-10 px-4 rounded-xl bg-black/20 border border-white/10 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="UNMATCHED">Chưa đối soát</option>
                  <option value="MATCHED">Đã đối soát</option>
                  <option value="INVALID_AMOUNT">Sai số tiền</option>
                  <option value="INVALID_CONTENT">Sai cú pháp</option>
                </select>
              </div>

              {/* TABLE */}
              <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
                        <th className="p-4 font-medium">Thời gian</th>
                        <th className="p-4 font-medium">Mã GD / Ngân hàng</th>
                        <th className="p-4 font-medium max-w-[200px]">Nội dung</th>
                        <th className="p-4 font-medium text-right">Số tiền</th>
                        <th className="p-4 font-medium">Đơn hàng</th>
                        <th className="p-4 font-medium">Trạng thái</th>
                        <th className="p-4 font-medium text-center">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {isLoading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-white/50">Đang tải dữ liệu...</td></tr>
                      ) : filteredTx.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-white/50">Không có giao dịch nào</td></tr>
                      ) : (
                        filteredTx.map(tx => {
                          const status = STATUS_MAP[tx.status] || STATUS_MAP.UNMATCHED;
                          const StatusIcon = status.icon;
                          
                          return (
                            <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 text-white/70">{formatDate(tx.transactionDate)}</td>
                              <td className="p-4">
                                <div className="flex flex-col">
                                  <span className="text-white font-mono text-xs bg-white/5 px-2 py-0.5 rounded w-fit">{tx.transactionId}</span>
                                  <span className="text-white/40 text-[11px] mt-1">{tx.bankName || 'Unknown Bank'}</span>
                                </div>
                              </td>
                              <td className="p-4 text-white/90 truncate max-w-[200px]" title={tx.description}>{tx.description}</td>
                              <td className={cn("p-4 text-right font-bold", tx.transactionType === 'IN' ? 'text-emerald-400' : 'text-red-400')}>
                                {tx.transactionType === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </td>
                              <td className="p-4">
                                {tx.orderCode ? (
                                  <span className="font-mono text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/10 rounded">{tx.orderCode}</span>
                                ) : (
                                  <span className="text-white/30 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold uppercase", status.bg, status.color)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => { setSelectedTx(tx); setIsDetailOpen(true); }}
                                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors inline-block"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#1f2123] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
              <h3 className="font-bold text-white flex items-center gap-2">Chi tiết giao dịch</h3>
              <button onClick={() => setIsDetailOpen(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex flex-col gap-1 items-center justify-center p-6 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white/50 text-xs uppercase tracking-wider">Số tiền nhận</span>
                <span className="text-3xl font-bold text-emerald-400">+{formatCurrency(selectedTx.amount)}</span>
                <span className="text-white/40 text-xs mt-1">{formatDate(selectedTx.transactionDate)}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Mã giao dịch</span>
                  <span className="font-mono text-white/90 bg-white/5 px-2 py-0.5 rounded">{selectedTx.transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Ngân hàng</span>
                  <span className="text-white/90">{selectedTx.bankName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white/50">Nội dung</span>
                  <span className="text-white/90 text-right max-w-[60%]">{selectedTx.description}</span>
                </div>
              </div>

              {/* KẾT QUẢ ĐỐI SOÁT */}
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Kết quả đối soát</h4>
                
                {selectedTx.status === 'MATCHED' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Giao dịch đã được đối soát tự động thành công với đơn hàng <span className="font-mono font-bold text-white">{selectedTx.orderCode}</span>.</p>
                    </div>
                    {selectedTx.order && (
                       <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center mt-2">
                         <div>
                           <p className="text-xs text-white/50">Đơn hàng tương ứng</p>
                           <p className="font-mono font-bold text-emerald-400">{selectedTx.order.orderCode}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-white/50">Tổng tiền đơn</p>
                           <p className="font-bold text-white">{formatCurrency(selectedTx.order.totalAmount)}</p>
                         </div>
                       </div>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_AMOUNT' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-orange-400">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Tìm thấy mã đơn <span className="font-mono font-bold text-white">{selectedTx.orderCode}</span> nhưng số tiền không khớp.</p>
                    </div>
                    {selectedTx.order && (
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 space-y-2 mt-2 text-sm">
                        <div className="flex justify-between text-white/70">
                          <span>Đơn hàng yêu cầu:</span>
                          <span className="font-bold text-white">{formatCurrency(selectedTx.order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                          <span>Đã chuyển:</span>
                          <span className="font-bold text-emerald-400">{formatCurrency(selectedTx.amount)}</span>
                        </div>
                        <div className="flex justify-between text-red-400 pt-2 border-t border-red-500/20 font-bold">
                          <span>Chênh lệch:</span>
                          <span>{selectedTx.amount > selectedTx.order.totalAmount ? '+' : ''}{formatCurrency(selectedTx.amount - selectedTx.order.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                    {selectedTx.order && selectedTx.order.paymentStatus !== 'PAID' && (
                      <button onClick={() => handleManualMatch(selectedTx.id, selectedTx.order.id)} className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors">
                        Bỏ qua cảnh báo và Đối soát thủ công
                      </button>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_CONTENT' ? (
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">Không tìm thấy mã đơn hàng hợp lệ (cấu trúc DHxxxx) trong nội dung chuyển khoản.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-white/60">
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
