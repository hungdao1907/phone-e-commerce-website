import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Plus, User, Shield, Key, Trash2, Edit2, X, Search, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for adding new staff
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit / Reset password modal
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<StaffUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isSuperadmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin' || isSuperadmin;

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Không thể tải danh sách tài khoản');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, token]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      setAddError('Tên đăng nhập phải từ 3 đến 30 ký tự');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      setAddError('Tên đăng nhập chỉ chứa chữ cái, số, gạch dưới (_) hoặc gạch nối (-)');
      return;
    }
    if (newPassword.length < 6) {
      setAddError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      // Primary: POST /api/users
      let res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: trimmedUsername, password: newPassword, role: 'staff' })
      });

      // Fallback to /api/auth/register if needed
      if (res.status === 404) {
        res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ username: trimmedUsername, password: newPassword })
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Thêm nhân sự thất bại');
      }

      setAddSuccess(`Đã tạo tài khoản nhân viên "${trimmedUsername}" thành công!`);
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');

    if (editPassword.length < 6) {
      setEditError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: editPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Cập nhật mật khẩu thất bại');
      }

      setEditingUser(null);
      setEditPassword('');
      fetchUsers();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteError('');

    try {
      setIsDeleting(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Xóa tài khoản thất bại');
      }

      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900 flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
        <span>Chỉ Admin hoặc Superadmin mới có quyền quản lý tài khoản nhân viên.</span>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 h-full text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Nhân Sự</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tạo tài khoản, phân quyền và quản lý nhân viên hệ thống HM STORE
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(!isAdding); setAddError(''); setAddSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Đóng form' : 'Thêm Nhân Sự Mới'}</span>
        </button>
      </div>

      {addSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{addSuccess}</span>
        </div>
      )}

      {/* Add Staff Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Tạo Tài Khoản Nhân Viên Mới</h2>
          <p className="text-xs text-slate-500 mb-4">
            Tài khoản được tạo sẽ có quyền "staff" để đăng nhập vào khu vực nhân viên với quyền hạn được phân công.
          </p>
          <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Tên đăng nhập (Username) *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs transition-colors placeholder:text-slate-400"
                  placeholder="Ví dụ: staff_minh, sale01..."
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mật khẩu ban đầu *</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 pl-10 pr-10 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs transition-colors placeholder:text-slate-400"
                  placeholder="Tối thiểu 6 ký tự..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo tài khoản'}
              </button>
            </div>
          </form>
          {addError && <p className="text-rose-600 text-xs font-medium mt-3">{addError}</p>}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên đăng nhập hoặc vai trò..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-emerald-500 transition-colors shadow-xs"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tổng số: <strong className="text-slate-900">{users.length}</strong> tài khoản
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[300px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 py-16">
            Đang tải dữ liệu nhân sự...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-rose-600 py-16">
            {error}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
            <User className="w-10 h-10 text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Không tìm thấy tài khoản nào</p>
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
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const isUserSuperadmin = u.role === 'superadmin';
                  const canDelete = !isUserSuperadmin && !isCurrent && (isSuperadmin || u.role === 'staff');
                  const canEdit = isSuperadmin || (u.role === 'staff') || isCurrent;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                            u.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            u.role === 'admin' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {u.role === 'superadmin' || u.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              {u.username}
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-600 font-normal">
                                  Tài khoản của bạn
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border inline-flex items-center gap-1 ${
                          u.role === 'superadmin' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                          u.role === 'admin' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          {u.role === 'superadmin' ? 'Superadmin' : u.role === 'admin' ? 'Quản trị viên (Admin)' : 'Nhân viên (Staff)'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              onClick={() => { setEditingUser(u); setEditPassword(''); setEditError(''); }}
                              title="Đặt lại mật khẩu"
                              className="p-2 hover:bg-slate-100 hover:text-slate-800 rounded-lg transition-colors text-slate-400 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setDeletingUser(u); setDeleteError(''); }}
                              title="Xóa tài khoản"
                              className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Reset Password Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Đặt Lại Mật Khẩu</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Đặt lại mật khẩu ban đầu cho nhân viên <strong>{editingUser.username}</strong> ({editingUser.role}).
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu mới *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {editError && <p className="text-rose-600 text-xs font-medium">{editError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 w-full max-w-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác Nhận Xóa Tài Khoản</h3>
            <p className="text-sm text-slate-600 mb-4">
              Bạn có chắc chắn muốn xóa tài khoản nhân viên <strong>{deletingUser.username}</strong>? Hành động này không thể hoàn tác.
            </p>

            {deleteError && <p className="text-rose-600 text-xs font-medium mb-4">{deleteError}</p>}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
