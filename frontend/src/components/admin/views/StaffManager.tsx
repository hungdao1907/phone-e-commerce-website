import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, User, Shield, Key, Trash2 } from 'lucide-react';

interface StaffUser {
  id: string;
  username: string;
  role: string;
  createdAt: string;
}

export function StaffManager() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state for adding new staff
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useAuthStore((state) => state.user);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, password: newPassword })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Thêm nhân sự thất bại');
      }

      // Reset form and refresh list
      setNewUsername('');
      setNewPassword('');
      setIsAdding(false);
      fetchUsers();
      
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Nhân Sự</h1>
          <p className="text-white/40 text-sm mt-1">Danh sách tài khoản quản trị và nhân viên hệ thống</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Sự Mới</span>
        </button>
      </div>

      {/* Add Staff Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
          <h2 className="text-lg font-semibold mb-4">Tạo Tài Khoản Nhân Sự</h2>
          <form onSubmit={handleAddStaff} className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm text-white/60">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                  placeholder="Nhập tên đăng nhập..."
                  required
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm text-white/60">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
            </button>
          </form>
          {addError && <p className="text-red-500 text-sm mt-3">{addError}</p>}
        </div>
      )}

      {/* Users Table */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-white/40">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-4 text-sm font-medium text-white/60">Tên Đăng Nhập</th>
                  <th className="p-4 text-sm font-medium text-white/60">Vai Trò</th>
                  <th className="p-4 text-sm font-medium text-white/60">Ngày Tạo</th>
                  <th className="p-4 text-sm font-medium text-white/60 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.role === 'superadmin' ? 'bg-[#99e300]/20 text-[#99e300]' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.role === 'superadmin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="font-medium">
                          {u.username}
                          {currentUser?.id === u.id && <span className="ml-2 text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">Bạn</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-md ${u.role === 'superadmin' ? 'bg-[#99e300]/10 text-[#99e300] border border-[#99e300]/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {u.role === 'superadmin' ? 'Super Admin' : 'Nhân Viên'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'superadmin' && (
                        <button className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-white/40">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
