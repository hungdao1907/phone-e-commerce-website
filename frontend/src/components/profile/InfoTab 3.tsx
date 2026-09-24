import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';

interface InfoTabProps {
  initialFullName: string;
  initialPhone: string;
  onUpdate: (data: { fullName: string; phone: string }) => Promise<void>;
}

export function InfoTab({ initialFullName, initialPhone, onUpdate }: InfoTabProps) {
  const { user } = useAuthStore();
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [dob, setDob] = useState('1990-01-01'); // UI fake data
  const [gender, setGender] = useState('male'); // UI fake data
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await onUpdate({ fullName, phone });
      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Cập nhật thất bại', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
      <div className="mb-8 border-b border-neutral-100 pb-6">
        <h2 className="text-xl font-bold text-neutral-900">Thông tin cá nhân</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Quản lý thông tin cá nhân của bạn.
        </p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar Side */}
          <div className="flex flex-col items-center gap-3 sm:w-1/4">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200 overflow-hidden">
              <span className="text-3xl text-neutral-400 font-bold uppercase">
                {fullName.charAt(0) || user?.username.charAt(0) || 'U'}
              </span>
            </div>
            <button type="button" className="text-xs font-semibold text-neutral-600 hover:text-black hover:underline cursor-pointer">
              Đổi ảnh đại diện
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex-1 space-y-5">
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Họ và tên</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                placeholder="Nhập họ và tên"
                className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5 flex justify-between">
                Email
                <span className="text-xs text-neutral-400 font-normal">Không thể thay đổi</span>
              </label>
              <input 
                type="text" 
                disabled 
                value={user?.username || ''} 
                className="w-full h-11 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed select-none" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">Số điện thoại</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="Ví dụ: 0912345678"
                className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">Ngày sinh</label>
                <input 
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-1.5">Giới tính</label>
                <div className="relative">
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)} 
                    className="w-full h-11 px-4 pr-10 appearance-none bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow cursor-pointer"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-neutral-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <button 
                type="submit" 
                disabled={isLoading} 
                className="px-8 h-11 bg-black hover:bg-neutral-800 text-white font-bold rounded-full text-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
