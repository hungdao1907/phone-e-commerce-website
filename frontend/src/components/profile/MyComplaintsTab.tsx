import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { MessageSquareWarning, Loader2, AlertCircle, ChevronRight, CheckCircle, Clock, XCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';

const STATUS_MAP: Record<string, { label: string, color: string, icon: React.ElementType, bg: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: Clock },
  PROCESSING: { label: 'Đang xử lý', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Loader2 },
  RESOLVED: { label: 'Đã giải quyết', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
  CANCELLED: { label: 'Đã hủy', color: 'text-neutral-500', bg: 'bg-neutral-50 border-neutral-200', icon: XCircle },
};

export function MyComplaintsTab() {
  const { token } = useAuthStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/complaints/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setComplaints(data.complaints || data);
        }
      } catch (error) {
        console.error('Error fetching complaints:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComplaints();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (selectedComplaint) {
    const statusInfo = STATUS_MAP[selectedComplaint.status] || STATUS_MAP.PENDING;
    const StatusIcon = statusInfo.icon;

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          onClick={() => setSelectedComplaint(null)}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-1"
        >
          &larr; Quay lại danh sách
        </button>

        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Chi tiết khiếu nại #{selectedComplaint.id.slice(0,8).toUpperCase()}</h2>
              <p className="text-sm text-neutral-500 mt-1">
                Tạo ngày {new Date(selectedComplaint.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusInfo.bg} ${statusInfo.color} font-medium text-sm`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Order & Product info */}
            <div>
              <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Thông tin sản phẩm</h3>
              <div className="flex gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-20 h-20 bg-white rounded-lg border border-neutral-200 overflow-hidden shrink-0">
                  <img 
                    src={selectedComplaint.product?.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${selectedComplaint.product.image}` : (selectedComplaint.product?.image || 'https://via.placeholder.com/150')} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">{selectedComplaint.product?.name || 'Sản phẩm'}</h4>
                  <p className="text-sm text-neutral-500 mt-1">{selectedComplaint.variant?.attributes?.['Màu sắc'] || ''}</p>
                  <div className="mt-2 text-sm font-medium text-neutral-700">Đơn hàng: {selectedComplaint.order?.orderCode}</div>
                </div>
              </div>
            </div>

            {/* Complaint content */}
            <div>
              <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Nội dung khiếu nại</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Loại vấn đề</div>
                  <div className="font-semibold text-neutral-900">{selectedComplaint.reason}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500 mb-1">Mô tả chi tiết</div>
                  <div className="text-neutral-700 whitespace-pre-wrap bg-neutral-50 p-4 rounded-xl border border-neutral-100">{selectedComplaint.description}</div>
                </div>
                {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                  <div>
                    <div className="text-sm text-neutral-500 mb-2">Hình ảnh đính kèm</div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedComplaint.images.map((img: string, idx: number) => (
                        <a key={idx} href={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} target="_blank" rel="noopener noreferrer" className="w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 hover:border-blue-500 transition-colors block">
                          <img src={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Reply */}
            {selectedComplaint.resolution && (
              <div>
                <h3 className="text-sm font-bold text-neutral-900 mb-4 uppercase tracking-wider">Phản hồi từ cửa hàng</h3>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <MessageSquareWarning className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-neutral-900">Quản trị viên</span>
                        <span className="text-xs text-neutral-500">
                          {selectedComplaint.adminReplyAt ? new Date(selectedComplaint.adminReplyAt).toLocaleString('vi-VN') : ''}
                        </span>
                      </div>
                      <p className="text-neutral-700 whitespace-pre-wrap">{selectedComplaint.resolution}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">Khiếu nại của tôi</h2>
        <EmptyState 
          icon={MessageSquareWarning} 
          title="Không có khiếu nại nào" 
          description="Bạn chưa gửi yêu cầu khiếu nại hoặc hỗ trợ nào."
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-neutral-900 mb-6">Khiếu nại của tôi</h2>
      
      <div className="space-y-4">
        {complaints.map((complaint) => {
          const statusInfo = STATUS_MAP[complaint.status] || STATUS_MAP.PENDING;
          const StatusIcon = statusInfo.icon;

          return (
            <div 
              key={complaint.id} 
              className="bg-white rounded-2xl border border-neutral-200 p-5 hover:border-blue-300 transition-colors cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md"
              onClick={() => setSelectedComplaint(complaint)}
            >
              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden shrink-0 hidden sm:block">
                  <img 
                    src={complaint.product?.image?.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${complaint.product.image}` : (complaint.product?.image || 'https://via.placeholder.com/150')} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      #{complaint.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-neutral-400">
                      {new Date(complaint.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 truncate max-w-md">
                    {complaint.product?.name || 'Sản phẩm'}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1 font-medium">{complaint.reason}</p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-neutral-100">
                <div className={`flex items-center gap-1.5 ${statusInfo.color} font-medium text-sm`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusInfo.label}
                </div>
                
                <div className="text-neutral-400 group-hover:text-blue-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
