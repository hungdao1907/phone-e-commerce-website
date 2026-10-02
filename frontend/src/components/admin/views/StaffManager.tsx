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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`);
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
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
    <div className="flex flex-col gap-6 h-full text-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Nhân Sự</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách tài khoản quản trị và nhân viên hệ thống</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Nhân Sự Mới</span>
        </button>
      </div>

      {/* Add Staff Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Tạo Tài Khoản Nhân Sự</h2>
          <form onSubmit={handleAddStaff} className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Tên đăng nhập</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                  placeholder="Nhập tên đăng nhập..."
                  required
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo'}
            </button>
          </form>
          {addError && <p className="text-rose-600 text-sm mt-3">{addError}</p>}
        </div>
      )}

      {/* Users Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Đang tải dữ liệu...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-rose-600">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên Đăng Nhập</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai Trò</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày Tạo</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${u.role === 'superadmin' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                          {u.role === 'superadmin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-slate-900">
                          {u.username}
                          {currentUser?.id === u.id && <span className="ml-2 text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600">Bạn</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${u.role === 'superadmin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {u.role === 'superadmin' ? 'Super Admin' : 'Nhân Viên'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'superadmin' && (
                        <button className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400">
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
