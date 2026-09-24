import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MessageSquareWarning, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComplaintDetail } from './ComplaintDetail'; // We will create this next

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: React.ElementType }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20', icon: AlertTriangle },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/20', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-neutral-500', bg: 'bg-neutral-500/10 border-neutral-500/20', icon: XCircle },
};

export function Complaints() {
  const { token } = useAuthStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter) query.append('status', statusFilter);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/complaints/admin?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, statusFilter]);

  const stats = {
    total: complaints.length, // this is page level, but we can just use the length or a separate API
    pending: complaints.filter(c => c.status === 'PENDING').length,
    processing: complaints.filter(c => c.status === 'PROCESSING').length,
  };

  if (selectedComplaint) {
    return (
      <ComplaintDetail 
        complaint={selectedComplaint} 
        onBack={() => {
          setSelectedComplaint(null);
          fetchComplaints(); // refresh data
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Khiếu nại</h1>
          <p className="text-sm text-white/50 mt-1">Xử lý các vấn đề và khiếu nại từ khách hàng.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-white/50 text-sm mb-1">Trên trang này</div>
            <div className="text-2xl font-bold">{complaints.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-orange-500/20 flex items-center justify-between">
          <div>
            <div className="text-orange-400/70 text-sm mb-1">Chờ xử lý</div>
            <div className="text-2xl font-bold text-orange-400">{stats.pending}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-blue-500/20 flex items-center justify-between">
          <div>
            <div className="text-blue-400/70 text-sm mb-1">Đang xử lý</div>
            <div className="text-2xl font-bold text-blue-400">{stats.processing}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-white/40" />
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-white outline-none"
          >
            <option value="" className="text-black">Tất cả trạng thái</option>
            <option value="PENDING" className="text-black">Chờ xử lý</option>
            <option value="PROCESSING" className="text-black">Đang xử lý</option>
            <option value="RESOLVED" className="text-black">Đã giải quyết</option>
            <option value="REJECTED" className="text-black">Từ chối</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4 bg-[#1A1A1A] rounded-2xl border border-white/5">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-xs font-bold text-white/40 uppercase tracking-wider">
          <div className="col-span-2">Mã & Ngày</div>
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-3">Sản phẩm & Đơn hàng</div>
          <div className="col-span-2">Vấn đề</div>
          <div className="col-span-2">Trạng thái</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
            {complaints.length === 0 ? (
              <div className="text-center text-white/40 py-10">Không tìm thấy khiếu nại nào.</div>
            ) : (
              complaints.map((complaint, i) => {
                const statusInfo = STATUS_MAP[complaint.status] || STATUS_MAP.PENDING;
                
                return (
                  <motion.div 
                    key={complaint.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedComplaint(complaint)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 cursor-pointer items-center transition-colors group"
                  >
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="font-mono text-sm text-white/80">#{complaint.id.slice(0,6).toUpperCase()}</span>
                      <span className="text-xs text-white/40">{new Date(complaint.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <div className="col-span-3 flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{complaint.customer?.fullName}</span>
                      <span className="text-xs text-white/40">{complaint.customer?.phone}</span>
                    </div>

                    <div className="col-span-3 flex flex-col gap-0.5">
                      <span className="text-sm text-white/80 truncate max-w-[200px]" title={complaint.product?.name}>{complaint.product?.name}</span>
                      <span className="text-xs font-mono text-white/40">#{complaint.order?.orderCode}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-sm text-white/70 truncate block">{complaint.reason}</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/60 transition-colors" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="text-sm text-white/40">
            Trang {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              Trước
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
