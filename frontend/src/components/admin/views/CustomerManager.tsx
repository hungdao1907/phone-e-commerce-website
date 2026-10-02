import React, { useState, useEffect } from 'react';
import { Plus, UserCircle, MapPin, Mail, Phone, Trash2 } from 'lucide-react';

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  Order?: {
    id: string;
    totalAmount: number;
    status: string;
  }[];
}

export function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state for adding new customer
  const [isAdding, setIsAdding] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [addError, setAddError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/customers`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          phone: newPhone,
          address: newAddress
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Thêm khách hàng thất bại');
      }

      // Reset form and refresh list
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewAddress('');
      setIsAdding(false);
      fetchCustomers();

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
          <h1 className="text-2xl font-bold text-slate-900">Danh Sách Khách Hàng (Customers)</h1>
          <p className="text-slate-500 text-sm mt-1">Dữ liệu người dùng hệ thống và lịch sử mua sắm</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng</span>
        </button>
      </div>

      {/* Add Customer Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Nhập Thông Tin Khách Hàng</h2>
          <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700">Họ và Tên</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                    placeholder="Nhập họ tên đầy đủ..."
                    required
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                    placeholder="Nhập email..."
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-700">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500 shadow-sm transition-colors placeholder:text-slate-400"
                    placeholder="Nhập địa chỉ nhận hàng..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? 'Đang thêm...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
          {addError && <p className="text-rose-600 text-sm mt-3">{addError}</p>}
        </div>
      )}

      {/* Customers Table */}
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
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ và Tên</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Số điện thoại</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Số đơn</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng chi tiêu</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tham gia</th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{c.fullName}</td>
                    <td className="p-4 text-sm text-slate-600">{c.email}</td>
                    <td className="p-4 text-sm text-slate-600">{c.phone || <span className="text-slate-400 italic">Trống</span>}</td>
                    <td className="p-4 text-sm text-slate-800 font-semibold">{c.Order?.length || 0}</td>
                    <td className="p-4 text-sm text-emerald-600 font-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.Order?.reduce((sum, o) => sum + o.totalAmount, 0) || 0)}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={async () => {
                          if (!confirm(`Bạn có chắc muốn xóa khách hàng ${c.fullName}?`)) return;
                          try {
                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/customers/${c.id}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) fetchCustomers();
                            else alert('Xóa thất bại');
                          } catch (err) {
                            alert('Lỗi xóa khách hàng');
                          }
                        }}
                        className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400"
                        title="Xóa khách hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Chưa có khách hàng nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
