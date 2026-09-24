import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Megaphone, Plus, Search, Calendar, Tag, Percent, Trash2, Edit2, Play, Square, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Marketing() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chiến dịch Marketing</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý các chương trình khuyến mãi, flash sale.</p>
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
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-5 h-5" /> Tạo chiến dịch
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Tìm kiếm chiến dịch..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30" />
        </div>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pb-10">
        {isLoading ? (
          <div className="col-span-3 flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center h-40 text-white/40">
            <Megaphone className="w-10 h-10 text-white/15 mb-3" />
            <p>Không có chiến dịch nào</p>
          </div>
        ) : (
          filteredCampaigns.map((camp, index) => {
            const isOngoing = camp.isActive && new Date(camp.startDate) <= new Date() && new Date(camp.endDate) >= new Date();
            const isUpcoming = camp.isActive && new Date(camp.startDate) > new Date();
            const isEnded = new Date(camp.endDate) < new Date();

            return (
              <motion.div key={camp.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
                className={cn("bg-black/40 border p-6 rounded-3xl flex flex-col relative overflow-hidden", 
                  camp.isActive ? "border-white/20 shadow-xl shadow-emerald-500/5" : "border-white/5 opacity-70")}
              >
                {/* Background Glow */}
                {isOngoing && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full pointer-events-none" />}
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    {camp.bannerUrl ? (
                      <div className="w-12 h-12 rounded-2xl shrink-0 overflow-hidden border border-white/10">
                        <img src={camp.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", 
                        camp.isActive ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-black" : "bg-white/10 text-white/50")}>
                        <Percent className="w-6 h-6" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-bold text-lg text-white leading-tight">{camp.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider", 
                          !camp.isActive ? "bg-white/10 text-white/50" :
                          isEnded ? "bg-red-500/20 text-red-400" :
                          isOngoing ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                        )}>
                          {!camp.isActive ? 'Tạm dừng' : isEnded ? 'Đã kết thúc' : isOngoing ? 'Đang chạy' : 'Sắp diễn ra'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <Tag className="w-4 h-4 text-white/40" />
                    <span>Giảm: <strong className="text-white">{camp.discountType === 'percentage' ? `${camp.discountValue}%` : `${camp.discountValue.toLocaleString()}đ`}</strong></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/70">
                    <Calendar className="w-4 h-4 text-white/40" />
                    <span>{new Date(camp.startDate).toLocaleDateString('vi-VN')} - {new Date(camp.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                  <button onClick={() => handleToggleActive(camp.id, camp.isActive)} className={cn("flex items-center gap-2 text-sm font-medium transition-colors", camp.isActive ? "text-orange-400 hover:text-orange-300" : "text-emerald-400 hover:text-emerald-300")}>
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
                    }} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(camp.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* MODAL FORM */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#1c1c1e] rounded-3xl border border-white/10 shadow-2xl p-6 custom-scrollbar max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">{editingId ? 'Sửa chiến dịch' : 'Tạo chiến dịch mới'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Tên chiến dịch</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30" />
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Đường dẫn tệp tải ảnh Banner (URL)</label>
                  <div className="flex gap-2 relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input type="url" placeholder="https://..." value={formData.bannerUrl} onChange={e => setFormData({...formData, bannerUrl: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white outline-none focus:border-white/30" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Áp dụng cho</label>
                    <select value={formData.appliesTo} onChange={e => setFormData({...formData, appliesTo: e.target.value, targetIds: []})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30">
                      <option value="all">Tất cả sản phẩm</option>
                      <option value="product">Sản phẩm cụ thể</option>
                    </select>
                  </div>
                  {formData.appliesTo === 'product' && (
                    <div>
                      <label className="block text-sm text-white/70 mb-1">Chọn sản phẩm</label>
                      <select required value={formData.targetIds[0] || ''} onChange={e => setFormData({...formData, targetIds: [e.target.value]})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30">
                        <option value="" disabled>-- Chọn --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Loại giảm giá</label>
                    <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30">
                      <option value="percentage">% Phần trăm</option>
                      <option value="fixed">Số tiền cố định</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Mức giảm</label>
                    <input required type="number" min="0" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Bắt đầu</label>
                    <input required type="datetime-local" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Kết thúc</label>
                    <input required type="datetime-local" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30 [color-scheme:dark]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Mô tả (tùy chọn)</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30 h-20 resize-none" />
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors font-medium">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors">Lưu chiến dịch</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

