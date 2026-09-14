import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MessageSquare, Star, AlertTriangle, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const STATUS_MAP: Record<string, { label: string, color: string, icon: any }> = {
  open: { label: 'Mới', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', icon: Clock },
  processing: { label: 'Đang xử lý', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: AlertTriangle },
  resolved: { label: 'Đã giải quyết', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle },
};

export function Disputes() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'disputes'>('reviews');
  const [reviews, setReviews] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/reviews', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setReviews(await res.json());
    } catch (error) { console.error(error); }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/disputes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setDisputes(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReviews(), fetchDisputes()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleUpdateDispute = async (id: string, status: string, resolution?: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/disputes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, resolution })
      });
      if (res.ok) fetchDisputes();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đánh giá & Khiếu nại</h1>
          <p className="text-sm text-white/50 mt-1">Lắng nghe và hỗ trợ khách hàng tốt nhất.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-white/5 p-1 rounded-xl w-max shrink-0 border border-white/10">
        <button
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'reviews' ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80 hover:bg-white/5"
          )}
        >
          <Star className="w-4 h-4" /> Đánh giá ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'disputes' ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80 hover:bg-white/5"
          )}
        >
          <AlertTriangle className="w-4 h-4" /> Khiếu nại ({disputes.length})
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/5 border border-white/10 rounded-2xl p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
        ) : activeTab === 'reviews' ? (
          <div className="grid grid-cols-2 gap-4">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-black/20 border border-white/10 p-5 rounded-2xl flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center font-bold text-white/70">
                      {review.customer.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{review.customer.fullName}</p>
                      <p className="text-xs text-white/40">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className={cn("w-4 h-4", star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-white/20")} />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-white/80 mt-2 bg-white/5 p-3 rounded-xl">
                  {review.comment || <span className="text-white/30 italic">Không có bình luận</span>}
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-1">Đơn hàng: {review.order.orderCode}</div>
              </motion.div>
            ))}
            {reviews.length === 0 && <div className="col-span-2 text-center text-white/50 py-10">Chưa có đánh giá nào.</div>}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {disputes.map((dispute, i) => {
              const statusInfo = STATUS_MAP[dispute.status] || STATUS_MAP['open'];
              const StatusIcon = statusInfo.icon;
              return (
                <motion.div key={dispute.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-black/20 border border-white/10 p-5 rounded-2xl flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs">{dispute.order.orderCode}</span>
                        <span className="text-sm font-semibold">{dispute.customer.fullName}</span>
                        <span className="text-sm text-white/40">({dispute.customer.phone})</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-2">{dispute.reason}</h3>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border", statusInfo.color)}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <p className="text-sm text-white/70">{dispute.description}</p>
                  
                  {dispute.resolution && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
                      <strong className="text-emerald-400">Kết quả xử lý: </strong>
                      <span className="text-emerald-400/80">{dispute.resolution}</span>
                    </div>
                  )}

                  {dispute.status === 'open' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={() => handleUpdateDispute(dispute.id, 'processing')} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-sm font-medium transition-colors">Bắt đầu xử lý</button>
                      <button onClick={() => {
                        const res = prompt("Nhập cách giải quyết:");
                        if (res) handleUpdateDispute(dispute.id, 'resolved', res);
                      }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-sm font-medium transition-colors">Đánh dấu đã giải quyết</button>
                      <button onClick={() => handleUpdateDispute(dispute.id, 'rejected', 'Từ chối do không hợp lệ')} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors">Từ chối</button>
                    </div>
                  )}
                  {dispute.status === 'processing' && (
                    <div className="flex items-center gap-3 pt-2">
                      <button onClick={() => {
                        const res = prompt("Nhập cách giải quyết:");
                        if (res) handleUpdateDispute(dispute.id, 'resolved', res);
                      }} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-xl text-sm font-medium transition-colors">Đánh dấu đã giải quyết</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
            {disputes.length === 0 && <div className="text-center text-white/50 py-10">Không có khiếu nại nào.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
