import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MessageSquareWarning, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComplaintDetail } from './ComplaintDetail'; // We will create this next

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: React.ElementType }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertTriangle },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: XCircle },
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
    <div className="flex flex-col h-full gap-6 text-slate-900 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Khiếu nại</h1>
          <p className="text-sm text-slate-500 mt-1">Xử lý các vấn đề và khiếu nại từ khách hàng.</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-sm mb-1">Trên trang này</div>
            <div className="text-2xl font-bold text-slate-900">{complaints.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-amber-600 text-sm mb-1">Chờ xử lý</div>
            <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-blue-600 text-sm mb-1">Đang xử lý</div>
            <div className="text-2xl font-bold text-blue-700">{stats.processing}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-sm text-slate-800 outline-none cursor-pointer"
          >
            <option value="" className="text-slate-900">Tất cả trạng thái</option>
            <option value="PENDING" className="text-slate-900">Chờ xử lý</option>
            <option value="PROCESSING" className="text-slate-900">Đang xử lý</option>
            <option value="RESOLVED" className="text-slate-900">Đã giải quyết</option>
            <option value="REJECTED" className="text-slate-900">Từ chối</option>
          </select>
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-hidden flex flex-col gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-2">Mã & Ngày</div>
          <div className="col-span-3">Khách hàng</div>
          <div className="col-span-3">Sản phẩm & Đơn hàng</div>
          <div className="col-span-2">Vấn đề</div>
          <div className="col-span-2">Trạng thái</div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
            {complaints.length === 0 ? (
              <div className="text-center text-slate-400 py-10">Không tìm thấy khiếu nại nào.</div>
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
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer items-center transition-colors group"
                  >
                    <div className="col-span-2 flex flex-col gap-1">
                      <span className="font-mono text-sm font-semibold text-slate-800">#{complaint.id.slice(0,6).toUpperCase()}</span>
                      <span className="text-xs text-slate-400">{new Date(complaint.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    
                    <div className="col-span-3 flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-slate-900">{complaint.customer?.fullName || 'Khách hàng'}</span>
                      <span className="text-xs text-slate-500">{complaint.customer?.phone}</span>
                    </div>

                    <div className="col-span-3 flex flex-col gap-0.5">
                      <span className="text-sm text-slate-800 truncate max-w-[200px]" title={complaint.product?.name}>{complaint.product?.name}</span>
                      <span className="text-xs font-mono text-slate-500">#{complaint.order?.orderCode}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-sm text-slate-600 truncate block">{complaint.reason}</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusInfo.color} ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* PAGINATION */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="text-sm text-slate-500">
            Trang {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-700 transition-colors"
            >
              Trước
            </button>
            <button 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 text-sm font-medium text-slate-700 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
