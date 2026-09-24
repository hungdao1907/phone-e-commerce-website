import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Star, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reviews/admin`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchReviews();
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleUpdateReview = async (id: string, status: string) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reviews/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchReviews();
    } catch (error) { console.error(error); }
  };

  const handleReplyReview = async (id: string) => {
    const reply = prompt('Nhập phản hồi cho đánh giá này:');
    if (!reply) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reviews/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reply })
      });
      if (res.ok) fetchReviews();
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đánh giá Sản phẩm</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý phản hồi từ khách hàng.</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar pr-2 h-full space-y-3 pb-20">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-5 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{review.customer.fullName}</span>
                      <span className="text-sm text-white/40">({review.customer.email})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
                      ))}
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    review.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    review.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                    'bg-orange-500/10 text-orange-400'
                  }`}>
                    {review.status === 'APPROVED' ? 'Đã duyệt' : review.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                  </div>
                </div>

                <p className="text-sm text-white/70">{review.comment}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {review.images.map((img: string, idx: number) => (
                      <a key={idx} href={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} target="_blank" rel="noopener noreferrer">
                        <img src={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} alt="review" className="w-16 h-16 object-cover rounded-lg" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="text-xs text-white/40 mt-2 font-mono">
                  Sản phẩm: {review.product?.name} ({review.variant?.sku})
                </div>

                {review.adminReply && (
                  <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 text-sm">
                    <div className="font-semibold text-white/60 mb-1 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Phản hồi từ cửa hàng
                    </div>
                    <p className="text-white/80">{review.adminReply}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                  {review.status === 'PENDING' && (
                    <>
                      <button onClick={() => handleUpdateReview(review.id, 'APPROVED')} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors">Duyệt</button>
                      <button onClick={() => handleUpdateReview(review.id, 'REJECTED')} className="px-4 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium transition-colors">Từ chối</button>
                    </>
                  )}
                  {review.status === 'APPROVED' && !review.adminReply && (
                    <button onClick={() => handleReplyReview(review.id)} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">Trả lời</button>
                  )}
                </div>
              </motion.div>
            ))}
            {reviews.length === 0 && <div className="text-center text-white/50 py-10">Không có đánh giá nào.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
