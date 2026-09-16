import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';

interface PromoCode {
  id: string;
  name: string;
  description: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  appliesTo: string;
  usageLimit: number;
  usedCount: number;
  minOrderValue: number;
}

export function PromoCodesSetting() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/promo-codes');
      if (res.ok) {
        const data = await res.json();
        setPromoCodes(data);
      }
    } catch (error) {
      console.error('Lỗi khi tải chiến dịch:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  // States for form
  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleAdd = async () => {
    if (!code || !discountAmount || !expiresAt) return;
    
    try {
      const res = await fetch('http://localhost:3001/api/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: code.toUpperCase(),
          description: '',
          discountType: 'fixed', // assume fixed amount for now, or percentage?
          discountValue: Number(discountAmount),
          startDate: new Date().toISOString(),
          endDate: new Date(expiresAt).toISOString(),
          isActive: true,
          appliesTo: 'all',
          targetIds: [],
          bannerUrl: '',
          minOrderValue: Number(minOrderValue) || 0,
          usageLimit: Number(usageLimit) || 0
        })
      });

      if (res.ok) {
        fetchCampaigns();
        setIsAdding(false);
        setCode(''); setDiscountAmount(''); setExpiresAt(''); setMinOrderValue(''); setUsageLimit('');
      } else {
        alert('Tạo mã thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`http://localhost:3001/api/promo-codes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      fetchCampaigns();
    } catch (error) {
      console.error(error);
    }
  };

  const deletePromo = async (id: string) => {
    if(confirm('Xóa mã giảm giá này?')) {
      try {
        await fetch(`http://localhost:3001/api/promo-codes/${id}`, {
          method: 'DELETE'
        });
        fetchCampaigns();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Promo Codes (Mã giảm giá)</h2>
          <p className="text-sm text-white/50 mt-1">Quản lý các mã giảm giá cho phép khách hàng áp dụng trong giỏ hàng.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Tạo mã mới
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Tag className="w-5 h-5"/> Tạo mã giảm giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Mã Code (Tự động in hoa)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="VD: TET2026" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white uppercase focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Mức giảm (VNĐ hoặc %)</label>
              <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="VD: 100000" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Đơn tối thiểu (VNĐ)</label>
              <input type="number" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} placeholder="VD: 500000" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Giới hạn số lần dùng</label>
              <input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="0 = Không giới hạn" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Ngày hết hạn</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" style={{ colorScheme: 'dark' }} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors">Hủy</button>
            <button onClick={handleAdd} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 transition-colors">Tạo Mã</button>
          </div>
        </div>
      )}

      <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Mã giảm giá</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Chi tiết áp dụng</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Đã dùng</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Hết hạn</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {promoCodes.map((promo) => {
                const isExpired = new Date(promo.endDate) < new Date();
                const isExhausted = promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit;
                const statusColor = !promo.isActive ? 'bg-white/20' : (isExpired || isExhausted) ? 'bg-red-500' : 'bg-emerald-500';

                return (
                  <tr key={promo.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => toggleActive(promo.id, promo.isActive)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${statusColor}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-white/70" />
                        <span className="font-mono font-bold text-white">{promo.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-emerald-400">-{promo.discountValue.toLocaleString('vi-VN')}{promo.discountType === 'percentage' ? '%' : 'đ'}</p>
                      {promo.minOrderValue > 0 && <p className="text-xs text-white/50 mt-0.5">Đơn tối thiểu: {promo.minOrderValue.toLocaleString('vi-VN')}đ</p>}
                    </td>
                    <td className="py-4 px-6">
                      {promo.usageLimit > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-white/70">{promo.usedCount}/{promo.usageLimit}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-white/50">Không giới hạn</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-white/70">
                      {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                      {isExpired && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded uppercase font-bold">Hết hạn</span>}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => deletePromo(promo.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/40">Chưa có mã giảm giá nào được tạo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

