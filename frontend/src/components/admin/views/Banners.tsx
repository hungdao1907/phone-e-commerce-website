import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Image as ImageIcon, Plus, Trash2, CheckCircle2, XCircle, LayoutTemplate } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Banners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '', image: '', link: '', position: 'homepage', sortOrder: 0, isActive: true
  });

  const fetchBanners = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3001/api/banners', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setBanners(await res.json());
    } catch (error) { console.error(error); } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (res.ok) setFormData(prev => ({ ...prev, image: data.imageUrl }));
    } catch (error) { alert('Lỗi tải ảnh'); } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) return alert('Vui lòng tải ảnh lên');
    try {
      const res = await fetch('http://localhost:3001/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, sortOrder: Number(formData.sortOrder) })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchBanners();
      }
    } catch (error) { alert('Lỗi lưu banner'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa banner này?')) return;
    try {
      await fetch(`http://localhost:3001/api/banners/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      fetchBanners();
    } catch (error) { alert('Lỗi xóa banner'); }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchBanners();
    } catch (error) { alert('Lỗi cập nhật banner'); }
  };

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Banner</h1>
          <p className="text-sm text-white/50 mt-1">Giao diện, hình ảnh quảng cáo trên website.</p>
        </div>
        <button onClick={() => {
            setFormData({ title: '', image: '', link: '', position: 'homepage', sortOrder: 0, isActive: true });
            setIsModalOpen(true);
          }} 
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-colors"
        >
          <Plus className="w-5 h-5" /> Thêm Banner
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
        ) : banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/40">
            <LayoutTemplate className="w-10 h-10 text-white/15 mb-3" />
            <p>Chưa có banner nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 pb-10">
            {banners.map((banner, index) => (
              <motion.div key={banner.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className={cn("bg-black/40 border rounded-3xl overflow-hidden flex flex-col transition-all", banner.isActive ? "border-white/20 shadow-xl" : "border-white/5 opacity-60")}
              >
                <div className="h-48 relative group">
                  <img src={`http://localhost:3001${banner.image}`} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => handleToggleActive(banner.id, banner.isActive)} className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
                      {banner.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="w-10 h-10 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {banner.position === 'homepage' ? 'Trang chủ' : banner.position === 'category' ? 'Danh mục' : 'Popup'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg leading-tight mb-1">{banner.title}</h3>
                  <p className="text-sm text-white/50 truncate mb-4">{banner.link || 'Không có link'}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <span className="text-white/40">Thứ tự: {banner.sortOrder}</span>
                    <span className={cn("font-bold", banner.isActive ? "text-emerald-400" : "text-white/40")}>
                      {banner.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL THÊM BANNER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-[#1c1c1e] rounded-3xl border border-white/10 shadow-2xl p-6">
              <h2 className="text-xl font-bold mb-6">Thêm Banner</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Upload Ảnh */}
                <div>
                  <label className="block text-sm text-white/70 mb-2">Hình ảnh Banner</label>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 group hover:border-white/30 transition-colors">
                    {formData.image ? (
                      <img src={`http://localhost:3001${formData.image}`} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                    ) : (
                      <div className="py-6 flex flex-col items-center text-white/40 group-hover:text-white/60">
                        {isUploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mb-2" /> : <ImageIcon className="w-8 h-8 mb-2" />}
                        <span className="text-sm">Click để tải ảnh lên</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/70 mb-1">Tiêu đề (nội bộ)</label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30" />
                </div>
                
                <div>
                  <label className="block text-sm text-white/70 mb-1">Đường dẫn khi click (URL)</label>
                  <input type="text" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30" placeholder="/product/iphone-15-pro" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Vị trí hiển thị</label>
                    <select value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30">
                      <option value="homepage">Trang chủ (Hero Slider)</option>
                      <option value="category">Trang Danh mục</option>
                      <option value="popup">Popup quảng cáo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Thứ tự sắp xếp (số nhỏ xếp trước)</label>
                    <input type="number" min="0" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30" />
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl hover:bg-white/10 transition-colors font-medium">Hủy</button>
                  <button type="submit" className="px-5 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors">Thêm Banner</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
