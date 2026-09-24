import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItemId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantInfo: string;
  onSuccess: () => void;
}

const COMPLAINT_TYPES = [
  { value: 'PRODUCT_DEFECT', label: 'Sản phẩm bị lỗi' },
  { value: 'PRODUCT_DAMAGED', label: 'Sản phẩm bị hư hỏng' },
  { value: 'WRONG_PRODUCT', label: 'Giao sai sản phẩm' },
  { value: 'MISSING_ITEM', label: 'Thiếu sản phẩm / phụ kiện' },
  { value: 'WRONG_DESCRIPTION', label: 'Sản phẩm không đúng mô tả' },
  { value: 'WARRANTY', label: 'Vấn đề bảo hành' },
  { value: 'SHIPPING', label: 'Vấn đề giao hàng' },
  { value: 'PAYMENT', label: 'Vấn đề thanh toán' },
  { value: 'OTHER', label: 'Khác' },
];

export function ComplaintModal({
  isOpen,
  onClose,
  orderId,
  orderItemId,
  productId,
  variantId,
  productName,
  variantInfo,
  onSuccess
}: ComplaintModalProps) {
  const { token } = useAuthStore();
  const [type, setType] = useState('PRODUCT_DEFECT');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ảnh vượt quá 5MB');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh');
      
      const url = data.url || data.imageUrl;
      setImages(prev => [...prev, url]);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description.trim()) {
      setErrorMsg('Vui lòng chọn loại vấn đề và nhập mô tả chi tiết');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId,
          orderItemId,
          type,
          subject: subject || (COMPLAINT_TYPES.find(t => t.value === type)?.label || 'Khác'),
          description,
          images
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi gửi khiếu nại');

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#111111] rounded-2xl w-full max-w-lg overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-bold text-white">Khiếu nại đơn hàng</h2>
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">{errorMsg}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Sản phẩm</label>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="font-semibold text-white">{productName}</div>
                <div className="text-sm text-white/50 mt-1">{variantInfo}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Loại vấn đề <span className="text-red-400">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  required
                >
                  {COMPLAINT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Mô tả vấn đề <span className="text-red-400">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Hãy mô tả chi tiết vấn đề bạn đang gặp phải để chúng tôi có thể hỗ trợ tốt nhất..."
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all h-32 resize-none custom-scrollbar"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Hình ảnh bằng chứng (Tùy chọn)</label>
                <div className="flex flex-wrap gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-white/10">
                      <img src={img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img} alt="Evidence" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 5 && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 transition-all flex flex-col items-center justify-center cursor-pointer text-white/50 hover:text-white/80">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium">Thêm ảnh</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} disabled={isUploading} />
                    </label>
                  )}
                </div>
                <p className="text-xs text-white/40 mt-2">Hỗ trợ tối đa 5 ảnh (dưới 5MB/ảnh)</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Đang gửi...' : 'Gửi khiếu nại'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
