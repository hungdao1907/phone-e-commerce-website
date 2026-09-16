import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import { useRewardsStore, Milestone } from '@/store/useRewardsStore';

export function CartRewardsSetting() {
  const { milestones, setMilestones, fetchMilestones } = useRewardsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);
  
  // States for form
  const [amount, setAmount] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState('shipping');
  const [discount, setDiscount] = useState('');

  const handleSave = async () => {
    if (!amount || !label) return;
    
    try {
      if (editingId !== null) {
        const response = await fetch(`http://localhost:3001/api/rewards/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            label,
            type,
            ...(type === 'voucher' ? { discount: Number(discount) } : { discount: null })
          })
        });
        if (response.ok) {
          fetchMilestones();
        }
      } else {
        const response = await fetch('http://localhost:3001/api/rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            label,
            type,
            ...(type === 'voucher' ? { discount: Number(discount) } : {})
          })
        });
        if (response.ok) {
          fetchMilestones();
        }
      }
      
      setIsAdding(false);
      setEditingId(null);
      setAmount('');
      setLabel('');
      setType('shipping');
      setDiscount('');
    } catch (error) {
      console.error('Error saving milestone:', error);
      alert('Có lỗi xảy ra khi lưu!');
    }
  };

  const handleEditClick = (milestone: Milestone) => {
    setEditingId(milestone.id);
    setAmount(milestone.amount.toString());
    setLabel(milestone.label);
    setType(milestone.type);
    setDiscount(milestone.discount ? milestone.discount.toString() : '');
    setIsAdding(true);
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setAmount('');
    setLabel('');
    setType('shipping');
    setDiscount('');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/rewards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (response.ok) {
        fetchMilestones();
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
    }
  };

  const deleteMilestone = async (id: string) => {
    if(confirm('Bạn có chắc chắn muốn xóa mốc thưởng này?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/rewards/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchMilestones();
        }
      } catch (error) {
        console.error('Error deleting milestone:', error);
        alert('Có lỗi xảy ra khi xóa!');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Cart Rewards (Mốc thưởng Giỏ hàng)</h2>
          <p className="text-sm text-white/50 mt-1">Quản lý các cột mốc ưu đãi hiển thị trên thanh tiến trình giỏ hàng.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setAmount('');
            setLabel('');
            setType('shipping');
            setIsAdding(true);
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Thêm mốc mới
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Cập nhật Mốc ưu đãi' : 'Thêm Mốc ưu đãi mới'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Giá trị đơn tối thiểu (VNĐ)</label>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="VD: 500000"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Nhãn hiển thị</label>
              <input 
                type="text" 
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="VD: Miễn phí vận chuyển"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-2">Loại phần thưởng</label>
              <select 
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
              >
                <option value="shipping">Miễn phí vận chuyển (Shipping)</option>
                <option value="voucher">Giảm giá theo % (Voucher)</option>
                <option value="gift">Tặng quà (Gift)</option>
              </select>
            </div>
            
            {type === 'voucher' && (
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Mức giảm giá (%)</label>
                <input 
                  type="number" 
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  placeholder="VD: 5 cho 5%"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30" 
                  min="1" max="100"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={handleCancel} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 transition-colors">Hủy</button>
            <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-200 transition-colors">Lưu cấu hình</button>
          </div>
        </div>
      )}

      <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden shadow-lg backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Mức chi tiêu</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Phần thưởng (Nhãn)</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Loại</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {milestones.map((milestone) => (
                <tr key={milestone.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => toggleActive(milestone.id, milestone.isActive)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${milestone.isActive ? 'bg-emerald-500' : 'bg-white/20'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${milestone.isActive ? 'translate-x-4.5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-white">
                    {milestone.amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="py-4 px-6 font-semibold text-white/90">
                    {milestone.label}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                      milestone.type === 'shipping' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      milestone.type === 'voucher' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {milestone.type}
                    </span>
                    {milestone.type === 'voucher' && milestone.discount && (
                      <span className="ml-2 text-xs font-bold text-emerald-400">-{milestone.discount}%</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button onClick={() => handleEditClick(milestone)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMilestone(milestone.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {milestones.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-white/40">Chưa có mốc thưởng nào được cấu hình.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
