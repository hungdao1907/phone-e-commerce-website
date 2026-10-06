import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Megaphone, Plus, Search, Calendar, Tag, Percent, Trash2, Edit2, Play, Square, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AdminSelect } from '@/components/admin/common/AdminSelect';

export function Marketing() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Multi-select product modal state
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    appliesTo: 'all',
    targetIds: [] as string[],
    bannerUrl: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [campRes, prodRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`)
      ]);
      if (campRes.ok) setCampaigns(await campRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (error) { console.error(error); } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.appliesTo === 'product' && formData.targetIds.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm.');
      return;
    }

    if (formData.discountType === 'percentage') {
      if (formData.discountValue <= 0 || formData.discountValue > 100) {
        alert('Mức giảm phần trăm phải lớn hơn 0 và nhỏ hơn hoặc bằng 100.');
        return;
      }
    } else {
      if (formData.discountValue <= 0) {
        alert('Mức giảm cố định phải lớn hơn 0.');
        return;
      }
    }

    try {
      const url = editingId ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/${editingId}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns`;
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert('Lỗi lưu chiến dịch');
      }
    } catch (error) {
      alert('Lỗi lưu chiến dịch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa chiến dịch này?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchData();
    } catch (error) { alert('Lỗi xóa chiến dịch'); }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchData();
    } catch (error) { alert('Lỗi cập nhật trạng thái'); }
  };

  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  // Product Selector Logic
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  const toggleProductSelect = (id: string) => {
    setFormData(prev => ({
      ...prev,
      targetIds: prev.targetIds.includes(id)
        ? prev.targetIds.filter(pid => pid !== id)
        : [...prev.targetIds, id]
    }));
  };

  const selectAllProducts = () => {
    const allIds = filteredProducts.map(p => p.id);
    const newSelected = new Set([...formData.targetIds, ...allIds]);
    setFormData(prev => ({ ...prev, targetIds: Array.from(newSelected) }));
  };

  const deselectAllProducts = () => {
    const allIds = filteredProducts.map(p => p.id);
    setFormData(prev => ({ ...prev, targetIds: prev.targetIds.filter(id => !allIds.includes(id)) }));
  };

  const removeProduct = (id: string) => {
    setFormData(prev => ({ ...prev, targetIds: prev.targetIds.filter(pid => pid !== id) }));
  };

  const getProductPrice = (p: any) => p.variants && p.variants.length > 0 ? p.variants[0].price : (p.price || 0);

  const calculateDiscountedPrice = (price: number) => {
    if (formData.discountType === 'percentage') {
      return Math.max(0, price - (price * formData.discountValue / 100));
    }
    return Math.max(0, price - formData.discountValue);
  };

  return (
    <div className="flex flex-col h-full gap-6 text-slate-900 w-full relative">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chiến dịch Marketing (Săn Deal)</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý các chương trình Săn Deal Giá Sốc, Flash Sale.</p>
        </div>
        <button onClick={() => {
            setEditingId(null);
            setFormData({
              name: '', description: '', discountType: 'percentage', discountValue: 0,
              startDate: new Date().toISOString().slice(0, 16),
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
              isActive: true, appliesTo: 'all', targetIds: [], bannerUrl: ''
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Tạo chiến dịch
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Tìm kiếm chiến dịch..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 shadow-sm" />
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /></div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center h-40 text-slate-400">
            <Megaphone className="w-10 h-10 text-slate-300 mb-3" />
            <p>Không có chiến dịch nào</p>
          </div>
        ) : (
          filteredCampaigns.map((camp, index) => {
            const isOngoing = camp.isActive && new Date(camp.startDate) <= new Date() && new Date(camp.endDate) >= new Date();
            const isEnded = new Date(camp.endDate) < new Date();

            let previewProducts = [];
            if (camp.appliesTo === 'product' && camp.targetIds && camp.targetIds.length > 0) {
              previewProducts = camp.targetIds.map((id: string) => products.find(p => p.id === id)).filter(Boolean);
            }

            return (
              <motion.div key={camp.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                className={cn("bg-white border p-6 rounded-3xl flex flex-col relative overflow-hidden shadow-sm transition-all",
                  camp.isActive ? "border-slate-200 hover:shadow-md" : "border-slate-200 opacity-70 bg-slate-50/50")}
              >
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    {camp.bannerUrl ? (
                      <div className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden border border-slate-200">
                        <img src={camp.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                        camp.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                        <Percent className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-lg text-slate-900 leading-tight">{camp.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                          !camp.isActive ? "bg-slate-100 text-slate-600 border-slate-200" :
                          isEnded ? "bg-rose-50 text-rose-700 border-rose-200" :
                          isOngoing ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          {!camp.isActive ? 'Tạm dừng' : isEnded ? 'Đã kết thúc' : isOngoing ? 'Đang chạy' : 'Sắp diễn ra'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span>Giảm: <strong className="text-slate-900 font-bold">{camp.discountType === 'percentage' ? `${camp.discountValue}%` : `${camp.discountValue.toLocaleString()}đ`}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{new Date(camp.startDate).toLocaleDateString('vi-VN')} - {new Date(camp.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {camp.appliesTo === 'product' && (
                  <div className="mb-4 relative z-10 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">ÁP DỤNG CHO {camp.targetIds.length} SẢN PHẨM</p>
                    <div className="flex flex-col gap-1">
                      {previewProducts.slice(0, 3).map((p, i) => (
                        <div key={i} className="text-sm truncate text-slate-800 font-medium">• {p.name}</div>
                      ))}
                      {previewProducts.length > 3 && (
                        <div className="text-xs text-slate-500 italic mt-1">+{previewProducts.length - 3} sản phẩm khác</div>
                      )}
                    </div>
                  </div>
                )}
                {camp.appliesTo === 'all' && (
                  <div className="mb-4 relative z-10 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                    <p className="text-sm text-emerald-700 font-semibold">Áp dụng toàn cửa hàng</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between relative z-10">
                  <button onClick={() => handleToggleActive(camp.id, camp.isActive)} className={cn("flex items-center gap-2 text-sm font-semibold transition-colors", camp.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700")}>
                    {camp.isActive ? <><Square className="w-4 h-4" /> Tạm dừng</> : <><Play className="w-4 h-4" /> Kích hoạt</>}
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      setEditingId(camp.id);
                      setFormData({
                        name: camp.name, description: camp.description || '', discountType: camp.discountType, discountValue: camp.discountValue,
                        startDate: new Date(camp.startDate).toISOString().slice(0, 16),
                        endDate: new Date(camp.endDate).toISOString().slice(0, 16),
                        isActive: camp.isActive, appliesTo: camp.appliesTo, targetIds: camp.targetIds || [], bannerUrl: camp.bannerUrl || ''
                      });
                      setIsModalOpen(true);
                    }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(camp.id)} className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* CREATE/EDIT CAMPAIGN MODAL */}
      <AnimatePresence>
        {isModalOpen && !isProductSelectorOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 custom-scrollbar max-h-[90vh] overflow-y-auto text-slate-900">
              <h2 className="text-xl font-bold mb-6 text-slate-900">{editingId ? 'Sửa chiến dịch' : 'Tạo chiến dịch mới'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên chiến dịch</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả (tùy chọn)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white h-16 resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phạm vi áp dụng</label>
                  <AdminSelect
                    value={formData.appliesTo}
                    onChange={(v) => setFormData({ ...formData, appliesTo: v, targetIds: [] })}
                    options={[
                      { value: 'all', label: 'Tất cả sản phẩm' },
                      { value: 'product', label: 'Sản phẩm cụ thể' },
                    ]}
                    className="w-full"
                    menuWidth="w-full"
                    highlightActive={false}
                  />
                </div>

                {formData.appliesTo === 'product' && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-bold text-slate-900">Sản phẩm áp dụng</label>
                      <button type="button" onClick={() => setIsProductSelectorOpen(true)} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors shadow-sm">
                        + Chọn sản phẩm
                      </button>
                    </div>

                    {formData.targetIds.length > 0 ? (
                      <>
                        <p className="text-xs text-slate-500 mb-3">Đã chọn {formData.targetIds.length} sản phẩm</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {formData.targetIds.map(id => {
                            const p = products.find(prod => prod.id === id);
                            if (!p) return null;
                            return (
                              <div key={id} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full text-sm text-slate-800 shadow-sm">
                                <span className="truncate max-w-[150px]">{p.name}</span>
                                <button type="button" onClick={() => removeProduct(id)} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-400 italic mb-2">Chưa có sản phẩm nào được chọn.</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Loại giảm giá</label>
                    <AdminSelect
                      value={formData.discountType}
                      onChange={(v) => setFormData({ ...formData, discountType: v })}
                      options={[
                        { value: 'percentage', label: '% Phần trăm', icon: <Percent className="w-3.5 h-3.5" /> },
                        { value: 'fixed', label: 'Số tiền cố định (₫)', icon: <Tag className="w-3.5 h-3.5" /> },
                      ]}
                      className="w-full"
                      menuWidth="w-full"
                      highlightActive={false}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mức giảm</label>
                    <input required type="number" min="0" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white" />
                  </div>
                </div>

                {/* PRICE PREVIEW */}
                {formData.appliesTo === 'product' && formData.targetIds.length > 0 && formData.discountValue > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
                    <label className="block text-sm font-bold text-emerald-800 mb-3">Preview Giá Sau Giảm</label>
                    <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {formData.targetIds.map(id => {
                        const p = products.find(prod => prod.id === id);
                        if (!p) return null;
                        const price = getProductPrice(p);
                        const finalPrice = calculateDiscountedPrice(price);
                        return (
                          <div key={id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-emerald-100 shadow-sm">
                            {p.image && <img src={p.image} className="w-10 h-10 object-cover rounded-md border border-slate-200" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="line-through text-slate-400">{price.toLocaleString()}đ</span>
                                <span className="text-emerald-600 font-bold">{finalPrice.toLocaleString()}đ</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bắt đầu</label>
                    <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kết thúc</label>
                    <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white [color-scheme:light]" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-colors font-medium text-slate-700">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-sm">Lưu chiến dịch</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT SELECTOR MODAL */}
      <AnimatePresence>
        {isProductSelectorOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductSelectorOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh] text-slate-900">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-3xl">
                <h2 className="text-xl font-bold text-slate-900">Chọn sản phẩm</h2>
                <button onClick={() => setIsProductSelectorOpen(false)} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-5 border-b border-slate-200 shrink-0 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Tìm kiếm sản phẩm..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={selectAllProducts} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">Chọn tất cả kết quả</button>
                    <span className="text-slate-200">|</span>
                    <button onClick={deselectAllProducts} className="text-sm text-slate-500 hover:text-slate-700 font-medium">Bỏ chọn kết quả</button>
                  </div>
                  <div className="text-sm font-medium text-slate-600">
                    Đã chọn: <span className="text-emerald-600 font-bold">{formData.targetIds.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map(p => {
                    const isSelected = formData.targetIds.includes(p.id);
                    return (
                      <div key={p.id} onClick={() => toggleProductSelect(p.id)} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all", isSelected ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300")}>
                        <div className={cn("w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors", isSelected ? "bg-emerald-600 border-emerald-600" : "border-slate-300 bg-white")}>
                          {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-slate-200" />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 border border-slate-200" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-900 truncate">{p.name}</p>
                          <p className="text-xs text-slate-500 font-semibold">{getProductPrice(p).toLocaleString()}đ</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center py-10 text-slate-400">Không tìm thấy sản phẩm nào phù hợp</div>
                )}
              </div>

              <div className="p-5 border-t border-slate-200 flex justify-end shrink-0 bg-slate-50 rounded-b-3xl">
                <button onClick={() => setIsProductSelectorOpen(false)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-sm">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
