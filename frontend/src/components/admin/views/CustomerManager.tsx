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
      const res = await fetch('http://localhost:3001/api/customers');
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
      const res = await fetch('http://localhost:3001/api/customers', {
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
    <div className="flex flex-col gap-6 h-full text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Danh Sách Khách Hàng (Customers)</h1>
          <p className="text-white/40 text-sm mt-1">Dữ liệu người dùng hệ thống và lịch sử mua sắm</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-[#99e300] hover:bg-[#88ca00] text-black font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Khách Hàng</span>
        </button>
      </div>

      {/* Add Customer Form (Collapsible) */}
      {isAdding && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
          <h2 className="text-lg font-semibold mb-4">Nhập Thông Tin Khách Hàng</h2>
          <form onSubmit={handleAddCustomer} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-white/60">Họ và Tên</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                    placeholder="Nhập họ tên đầy đủ..."
                    required
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm text-white/60">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                    placeholder="Nhập email..."
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm text-white/60">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm text-white/60">Địa chỉ</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#99e300] transition-colors"
                    placeholder="Nhập địa chỉ nhận hàng..."
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-white hover:bg-neutral-200 text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang thêm...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
          {addError && <p className="text-red-500 text-sm mt-3">{addError}</p>}
        </div>
      )}

      {/* Customers Table */}
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
                  <th className="p-4 text-sm font-medium text-white/60">Họ và Tên</th>
                  <th className="p-4 text-sm font-medium text-white/60">Email</th>
                  <th className="p-4 text-sm font-medium text-white/60">Số điện thoại</th>
                  <th className="p-4 text-sm font-medium text-white/60">Số đơn</th>
                  <th className="p-4 text-sm font-medium text-white/60">Tổng chi tiêu</th>
                  <th className="p-4 text-sm font-medium text-white/60">Ngày tham gia</th>
                  <th className="p-4 text-sm font-medium text-white/60 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white">{c.fullName}</td>
                    <td className="p-4 text-sm text-white/80">{c.email}</td>
                    <td className="p-4 text-sm text-white/80">{c.phone || <span className="text-white/20">Trống</span>}</td>
                    <td className="p-4 text-sm text-white/80 font-bold">{c.Order?.length || 0}</td>
                    <td className="p-4 text-sm text-[#99e300] font-bold">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.Order?.reduce((sum, o) => sum + o.totalAmount, 0) || 0)}
                    </td>
                    <td className="p-4 text-sm text-white/60">
                      {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={async () => {
                          if (!confirm(`Bạn có chắc muốn xóa khách hàng ${c.fullName}?`)) return;
                          try {
                            const res = await fetch(`http://localhost:3001/api/customers/${c.id}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) fetchCustomers();
                            else alert('Xóa thất bại');
                          } catch (err) {
                            alert('Lỗi xóa khách hàng');
                          }
                        }}
                        className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-white/40" 
                        title="Xóa khách hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-white/40">
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
