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
  UNMATCHED: { label: 'Chưa đối soát', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/30', icon: AlertCircle },
  MATCHED: { label: 'Đã đối soát', color: 'text-[#2ee88a]', bg: 'bg-emerald-500/20 border-emerald-400/30', icon: CheckCircle2 },
  INVALID_AMOUNT: { label: 'Sai số tiền', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-400/30', icon: AlertTriangle },
  INVALID_CONTENT: { label: 'Sai cú pháp', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-400/30', icon: AlertTriangle },
  MANUAL_REVIEW: { label: 'Cần kiểm tra', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-400/30', icon: Eye }
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

  const filteredTx = (transactions || []).filter(t => 
    (t.description || '').toLowerCase().includes((search || '').toLowerCase()) || 
    (t.transactionId || '').toLowerCase().includes((search || '').toLowerCase()) ||
    (t.orderCode || '').toLowerCase().includes((search || '').toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/75 backdrop-blur-md">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-transparent" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.95 }} 
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="neon-panel relative w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-emerald-400/30 bg-[#05100b]/90 backdrop-blur-xl z-10"
          >
            {/* HEADER */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#2ee88a] flex items-center justify-center border border-emerald-400/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Lịch sử ngân hàng</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Theo dõi giao dịch chuyển khoản và tự động đối soát đơn hàng.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button onClick={fetchData} className="w-9 h-9 rounded-xl glass-btn-3d flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer" title="Làm mới">
                  <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl glass-btn-3d flex items-center justify-center text-zinc-300 hover:text-white font-bold transition cursor-pointer" title="Đóng">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* BODY */}
            <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              
              {/* 4 Thẻ KPI SePay */}
              {stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="kpi-glow-card p-4">
                    <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Tổng giao dịch</span>
                    <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
                  </div>
                  <div className="kpi-glow-card p-4">
                    <span className="text-xs text-emerald-300 uppercase tracking-wider font-medium">Đã đối soát</span>
                    <div className="text-2xl font-bold text-[#2ee88a] mt-2">{stats.matched}</div>
                  </div>
                  <div className="kpi-glow-card kpi-glow-amber p-4">
                    <span className="text-xs text-amber-300 uppercase tracking-wider font-medium">Chưa đối soát / Lỗi</span>
                    <div className="text-2xl font-bold text-amber-300 mt-2">{stats.unmatched + stats.needsReview}</div>
                  </div>
                  <div className="kpi-glow-card kpi-glow-cyan p-4">
                    <span className="text-xs text-cyan-300 uppercase tracking-wider font-medium">Tổng tiền vào</span>
                    <div className="text-xl font-bold text-cyan-300 mt-2 truncate" title={formatCurrency(stats.totalAmountIn)}>
                      {formatCurrency(stats.totalAmountIn)}
                    </div>
                  </div>
                </div>
              )}

              {/* Thanh tìm kiếm SePay */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Mã GD, Nội dung, Mã Đơn..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-400/50 transition" 
                  />
                </div>
                <select 
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/50 cursor-pointer"
                >
                  <option value="all" className="bg-[#06120d] text-white">Tất cả trạng thái</option>
                  <option value="UNMATCHED" className="bg-[#06120d] text-white">Chưa đối soát</option>
                  <option value="MATCHED" className="bg-[#06120d] text-white">Đã đối soát</option>
                  <option value="INVALID_AMOUNT" className="bg-[#06120d] text-white">Sai số tiền</option>
                  <option value="INVALID_CONTENT" className="bg-[#06120d] text-white">Sai cú pháp</option>
                </select>
              </div>

              {/* Bảng giao dịch SePay */}
              <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/60 text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-4 font-semibold">Thời gian</th>
                        <th className="py-3 px-4 font-semibold">Mã GD / Ngân hàng</th>
                        <th className="py-3 px-4 font-semibold max-w-[200px]">Nội dung</th>
                        <th className="py-3 px-4 font-semibold text-right">Số tiền</th>
                        <th className="py-3 px-4 font-semibold">Đơn hàng</th>
                        <th className="py-3 px-4 font-semibold">Trạng thái</th>
                        <th className="py-3 px-4 font-semibold text-right">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {isLoading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Đang tải dữ liệu...</td></tr>
                      ) : filteredTx.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-zinc-400">Không có giao dịch nào</td></tr>
                      ) : (
                        filteredTx.map(tx => {
                          const status = STATUS_MAP[tx.status] || STATUS_MAP.UNMATCHED;
                          const StatusIcon = status.icon;
                          
                          return (
                            <tr key={tx.id} className="hover:bg-white/[0.04] transition">
                              <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-col">
                                  <span className="font-mono text-zinc-200">{tx.transactionId}</span>
                                  <span className="text-[10px] text-zinc-500 mt-0.5">{tx.bankName || 'Unknown Bank'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-300 font-mono truncate max-w-[200px]" title={tx.description}>{tx.description}</td>
                              <td className={cn("py-3.5 px-4 text-right font-bold", tx.transactionType === 'IN' ? 'text-[#2ee88a]' : 'text-rose-400')}>
                                {tx.transactionType === 'IN' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </td>
                              <td className="py-3.5 px-4">
                                {tx.orderCode ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">{tx.orderCode}</span>
                                ) : (
                                  <span className="text-zinc-500 font-mono">-</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1.5", status.bg, status.color)}>
                                  <StatusIcon className="w-3 h-3" />
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button 
                                  onClick={() => { setSelectedTx(tx); setIsDetailOpen(true); }}
                                  className="w-7 h-7 rounded-lg glass-btn-3d inline-flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-lg bg-[#06120d] rounded-2xl shadow-2xl border border-emerald-400/20 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/40">
              <h3 className="font-bold text-white flex items-center gap-2">Chi tiết giao dịch</h3>
              <button onClick={() => setIsDetailOpen(false)} className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex flex-col gap-1 items-center justify-center p-6 bg-emerald-500/[0.06] rounded-2xl border border-emerald-400/20 shadow-inner">
                <span className="text-zinc-400 text-xs uppercase tracking-wider">Số tiền nhận</span>
                <span className="text-3xl font-bold text-[#2ee88a]">+{formatCurrency(selectedTx.amount)}</span>
                <span className="text-zinc-500 text-xs mt-1">{formatDate(selectedTx.transactionDate)}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Mã giao dịch</span>
                  <span className="font-mono text-zinc-200 bg-white/5 px-2 py-0.5 rounded border border-white/10">{selectedTx.transactionId}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Ngân hàng</span>
                  <span className="text-white font-medium">{selectedTx.bankName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-400">Nội dung</span>
                  <span className="text-zinc-200 text-right max-w-[60%] font-mono text-xs">{selectedTx.description}</span>
                </div>
              </div>

              {/* KẾT QUẢ ĐỐI SOÁT */}
              <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Kết quả đối soát</h4>
                
                {selectedTx.status === 'MATCHED' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-[#2ee88a]">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Giao dịch đã được đối soát tự động thành công với đơn hàng <span className="font-mono font-bold text-white">{selectedTx.orderCode}</span>.</p>
                    </div>
                    {selectedTx.order && (
                       <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex justify-between items-center mt-2">
                         <div>
                           <p className="text-xs text-zinc-400">Đơn hàng tương ứng</p>
                           <p className="font-mono font-bold text-[#2ee88a]">{selectedTx.order.orderCode}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs text-zinc-400">Tổng tiền đơn</p>
                           <p className="font-bold text-white">{formatCurrency(selectedTx.order.totalAmount)}</p>
                         </div>
                       </div>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_AMOUNT' ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-amber-400">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="text-sm">Tìm thấy mã đơn <span className="font-mono font-bold text-white">{selectedTx.orderCode}</span> nhưng số tiền không khớp.</p>
                    </div>
                    {selectedTx.order && (
                      <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 space-y-2 mt-2 text-sm">
                        <div className="flex justify-between text-zinc-300">
                          <span>Đơn hàng yêu cầu:</span>
                          <span className="font-bold text-white">{formatCurrency(selectedTx.order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300">
                          <span>Đã chuyển:</span>
                          <span className="font-bold text-[#2ee88a]">{formatCurrency(selectedTx.amount)}</span>
                        </div>
                        <div className="flex justify-between text-rose-400 pt-2 border-t border-rose-500/20 font-bold">
                          <span>Chênh lệch:</span>
                          <span>{selectedTx.amount > selectedTx.order.totalAmount ? '+' : ''}{formatCurrency(selectedTx.amount - selectedTx.order.totalAmount)}</span>
                        </div>
                      </div>
                    )}
                    {selectedTx.order && selectedTx.order.paymentStatus !== 'PAID' && (
                      <button onClick={() => handleManualMatch(selectedTx.id, selectedTx.order.id)} className="w-full mt-2 py-2.5 btn-neon-primary rounded-xl text-sm font-bold transition-all cursor-pointer">
                        Bỏ qua cảnh báo và Đối soát thủ công
                      </button>
                    )}
                  </div>
                ) : selectedTx.status === 'INVALID_CONTENT' ? (
                  <div className="flex items-start gap-2 text-rose-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-sm">Không tìm thấy mã đơn hàng hợp lệ (cấu trúc DHxxxx) trong nội dung chuyển khoản.</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-zinc-400">
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
