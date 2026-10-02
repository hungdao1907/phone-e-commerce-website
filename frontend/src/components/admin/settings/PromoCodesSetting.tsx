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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/promo-codes`);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/promo-codes`, {
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
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/promo-codes/${id}`, {
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
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/promo-codes/${id}`, {
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
          <h2 className="text-xl font-bold text-slate-900">Promo Codes (Mã giảm giá)</h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý các mã giảm giá cho phép khách hàng áp dụng trong giỏ hàng.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo mã mới
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" /> Tạo mã giảm giá
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Mã Code (Tự động in hoa)</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="VD: TET2026" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 uppercase focus:outline-none focus:border-emerald-500 shadow-sm placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Mức giảm (VNĐ hoặc %)</label>
              <input type="number" value={discountAmount} onChange={e => setDiscountAmount(e.target.value)} placeholder="VD: 100000" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Đơn tối thiểu (VNĐ)</label>
              <input type="number" value={minOrderValue} onChange={e => setMinOrderValue(e.target.value)} placeholder="VD: 500000" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Giới hạn số lần dùng</label>
              <input type="number" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} placeholder="0 = Không giới hạn" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Ngày hết hạn</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm [color-scheme:light]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button onClick={() => setIsAdding(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">Hủy</button>
            <button onClick={handleAdd} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm">Tạo Mã</button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mã giảm giá</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Chi tiết áp dụng</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã dùng</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hết hạn</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promoCodes.map((promo) => {
                const isExpired = new Date(promo.endDate) < new Date();
                const isExhausted = promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit;
                const statusColor = !promo.isActive ? 'bg-slate-300' : (isExpired || isExhausted) ? 'bg-rose-500' : 'bg-emerald-600';

                return (
                  <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <button 
                        onClick={() => toggleActive(promo.id, promo.isActive)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${statusColor}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${promo.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono font-bold text-slate-900">{promo.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-emerald-600">-{promo.discountValue.toLocaleString('vi-VN')}{promo.discountType === 'percentage' ? '%' : 'đ'}</p>
                      {promo.minOrderValue > 0 && <p className="text-xs text-slate-500 mt-0.5">Đơn tối thiểu: {promo.minOrderValue.toLocaleString('vi-VN')}đ</p>}
                    </td>
                    <td className="py-4 px-6">
                      {promo.usageLimit > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${(promo.usedCount / promo.usageLimit) * 100}%` }}></div>
                          </div>
                          <span className="text-xs font-medium text-slate-600">{promo.usedCount}/{promo.usageLimit}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Không giới hạn</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600">
                      {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                      {isExpired && <span className="ml-2 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded uppercase font-bold">Hết hạn</span>}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => deletePromo(promo.id)} className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-rose-600 transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Chưa có mã giảm giá nào được tạo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

