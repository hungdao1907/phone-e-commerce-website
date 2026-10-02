import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaUrl } from '@/utils/media';

interface VariantManagementModalProps {
  product: any;
  onClose: () => void;
  onSaved: () => void;
}

export function VariantManagementModal({ product, onClose, onSaved }: VariantManagementModalProps) {
  const { token } = useAuthStore();
  const [variants, setVariants] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Deep copy to allow editing
  useEffect(() => {
    if (product?.variants) {
      setVariants(JSON.parse(JSON.stringify(product.variants)));
    }
  }, [product]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg('');
    try {
      // Vì API hiện tại chỉ hỗ trợ sửa/thêm lúc update toàn bộ Product,
      // Ta sẽ gọi PUT /api/products/:id với dữ liệu giữ nguyên trừ variants.
      const payload = {
        name: product.name,
        description: product.description,
        brand: product.brand,
        image: product.image,
        images: product.images,
        categoryId: product.categoryId,
        status: product.status,
        specifications: product.specifications,
        variants: variants.map(v => ({
          id: v.id,
          sku: v.sku,
          price: Number(v.price),
          salePrice: v.salePrice ? Number(v.salePrice) : null,
          stock: Number(v.stock),
          attributes: v.attributes,
          colorCode: v.colorCode || null,
          image: v.image || null
        }))
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu biến thể');

      onSaved();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 shrink-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản lý biến thể</h2>
            <p className="text-sm text-emerald-700 font-semibold mt-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {errorMsg}
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white shadow-sm">
            <table className="w-full text-sm text-left whitespace-nowrap min-w-[800px]">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Thuộc tính</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Giá bán (₫)</th>
                  <th className="px-4 py-3 font-medium">Giá khuyến mãi (₫)</th>
                  <th className="px-4 py-3 font-medium w-24">Tồn kho</th>
                  <th className="px-2 py-3 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Không có biến thể nào. (Có thể tạo trong màn hình Sửa Sản Phẩm)</td>
                  </tr>
                ) : (
                  variants.map((v, idx) => {
                    const variantName = Object.values(v.attributes || {}).filter(Boolean).join(' / ') || 'Mặc định';
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {v.image ? (
                              <img src={resolveMediaUrl(v.image)} alt="var" className="w-8 h-8 object-cover rounded bg-slate-100 border border-slate-200" />
                            ) : v.colorCode ? (
                              <div className="w-8 h-8 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: v.colorCode }} />
                            ) : (
                              <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-slate-400"/></div>
                            )}
                            <span className="font-semibold text-slate-800">{variantName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={v.sku} onChange={e => { const r = [...variants]; r[idx].sku = e.target.value; setVariants(r); }} className="w-full bg-transparent border-b border-slate-200 focus:border-emerald-500 px-1 outline-none text-slate-800 font-mono text-xs" placeholder="SKU" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={v.price} onChange={e => { const r = [...variants]; r[idx].price = e.target.value; setVariants(r); }} className="w-28 bg-transparent border-b border-slate-200 focus:border-emerald-500 px-1 outline-none text-slate-800" placeholder="0" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={v.salePrice || ''} onChange={e => { const r = [...variants]; r[idx].salePrice = e.target.value; setVariants(r); }} className="w-28 bg-transparent border-b border-slate-200 focus:border-emerald-500 px-1 outline-none text-emerald-700 font-semibold placeholder:text-slate-400" placeholder="Trống" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" value={v.stock} onChange={e => { const r = [...variants]; r[idx].stock = e.target.value; setVariants(r); }} className="w-16 h-8 bg-slate-50 border border-slate-200 rounded px-2 outline-none focus:border-emerald-500 text-slate-800" placeholder="0" />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button type="button" onClick={() => setVariants(variants.filter((_, i) => i !== idx))} className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors inline-block hover:bg-slate-100">
                            <Trash2 className="w-4 h-4" />
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

        <div className="p-4 md:p-6 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isSaving} className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Save className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
