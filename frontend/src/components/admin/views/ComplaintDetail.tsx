import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, MessageSquareWarning, Package, Clock, CheckCircle, XCircle, AlertTriangle, Send, Loader2, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: LucideIcon }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: AlertTriangle },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: XCircle },
};

export function ComplaintDetail({ complaint, onBack }: { complaint: any, onBack: () => void }) {
  const { token } = useAuthStore();
  const [status, setStatus] = useState(complaint.status);
  const [reply, setReply] = useState(complaint.resolution || '');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const statusInfo = STATUS_MAP[status] || STATUS_MAP.PENDING;
  const StatusIcon = statusInfo.icon;

  const handleUpdateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) setStatus(newStatus);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/complaints/${complaint.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reply })
      });
      if (res.ok) {
        alert('Phản hồi thành công');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-slate-900 w-full overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chi tiết Khiếu nại #{complaint.id.slice(0,6).toUpperCase()}</h1>
          <p className="text-sm text-slate-500 mt-1">Gửi lúc: {new Date(complaint.createdAt).toLocaleString('vi-VN')}</p>
        </div>
        <div className="ml-auto">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusInfo.color} ${statusInfo.bg}`}>
            <StatusIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{statusInfo.label}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col md:flex-row gap-6">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-6">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Thông tin khách hàng</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Họ tên</span>
                <span className="font-semibold text-slate-900">{complaint.customer?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Số điện thoại</span>
                <span className="font-semibold text-slate-900">{complaint.customer?.phone || 'Chưa cung cấp'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-1">Email</span>
                <span className="font-semibold text-slate-900">{complaint.customer?.email}</span>
              </div>
            </div>
          </div>

          {/* Product & Order Info */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Sản phẩm & Đơn hàng</h3>
            <div className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                <img 
                  src={complaint.product?.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${complaint.product.image}` : (complaint.product?.image || 'https://via.placeholder.com/150')} 
                  alt="Product" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-slate-900">{complaint.product?.name}</div>
                <div className="text-sm text-slate-500 mt-1">Phân loại: {complaint.variant?.attributes?.['Màu sắc'] || complaint.variant?.sku}</div>
                <div className="text-sm text-slate-500 mt-1">Mã đơn hàng: <span className="font-mono font-medium text-slate-800">#{complaint.order?.orderCode}</span></div>
              </div>
            </div>
          </div>

          {/* Complaint Content */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Nội dung khiếu nại</h3>
            <div>
              <span className="text-slate-500 block mb-1 text-sm">Loại vấn đề</span>
              <span className="font-medium px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-md text-sm inline-block">{complaint.reason}</span>
            </div>
            <div className="pt-2">
              <span className="text-slate-500 block mb-2 text-sm">Mô tả chi tiết</span>
              <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                {complaint.description}
              </p>
            </div>
            {complaint.images && complaint.images.length > 0 && (
              <div className="pt-2">
                <span className="text-slate-500 block mb-2 text-sm">Hình ảnh đính kèm ({complaint.images.length})</span>
                <div className="flex gap-3 flex-wrap">
                  {complaint.images.map((img: string, idx: number) => (
                    <a key={idx} href={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} target="_blank" rel="noopener noreferrer">
                      <img src={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} alt={`evidence-${idx}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200 hover:border-emerald-500 transition-colors shadow-sm" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="w-full md:w-80 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Trạng thái xử lý</h3>
            <div className="space-y-2">
              {['PENDING', 'PROCESSING', 'RESOLVED', 'REJECTED'].map(s => {
                const sInfo = STATUS_MAP[s];
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    disabled={isUpdating}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isActive ? `${sInfo.bg} ${sInfo.color}` : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <sInfo.icon className="w-4 h-4" />
                      {sInfo.label}
                    </div>
                    {isActive && <CheckCircle className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[300px]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Phản hồi khách hàng</h3>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder="Nhập nội dung phản hồi. Khách hàng sẽ thấy nội dung này..."
              className="flex-1 w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none focus:border-slate-400 transition-colors custom-scrollbar mb-4"
            />
            <button
              onClick={handleReply}
              disabled={isUpdating || !reply.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi phản hồi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
