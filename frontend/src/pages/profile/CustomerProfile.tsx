import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export const CustomerProfile = () => {
  const { user, token } = useAuthStore();
  const [fullName, setFullName] = useState(user?.username || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isFetching, setIsFetching] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrders(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/customers/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFullName(data.fullName || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
        }
      } catch (error) {
        console.error('Error fetching profile', error);
      } finally {
        setIsFetching(false);
      }
    };

    if (token) {
      fetchProfile();
      fetchOrders();
    } else {
      setIsFetching(false);
    }
  }, [token]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const response = await fetch('http://localhost:3001/api/customers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, phone, address })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }

      setMessage({ text: 'Cập nhật thông tin thành công!', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOrder = async (id: string) => {
    if(!confirm('Xác nhận đã nhận hàng thành công?')) return;
    try {
      const res = await fetch(`http://localhost:3001/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        alert('Cảm ơn bạn đã mua sắm!');
        fetchOrders();
      }
    } catch (e) { alert('Lỗi'); }
  };

  const handleReview = async (orderId: string, productId: string) => {
    const comment = prompt('Nhập đánh giá của bạn (Ví dụ: Sản phẩm rất tốt):');
    if(!comment) return;
    const ratingStr = prompt('Cho điểm (1-5):');
    const rating = parseInt(ratingStr || '5', 10);
    try {
      const res = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId, customerId: user?.id, rating, comment })
      });
      if (res.ok) alert('Đã gửi đánh giá!');
      else alert('Gửi đánh giá thất bại');
    } catch (e) { alert('Lỗi'); }
  };

  const handleDispute = async (orderId: string) => {
    const reason = prompt('Nhập lý do khiếu nại:');
    if(!reason) return;
    try {
      const res = await fetch('http://localhost:3001/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId, customerId: user?.id, reason, description: reason })
      });
      if (res.ok) alert('Đã tạo khiếu nại! Admin sẽ liên hệ lại.');
      else alert('Tạo khiếu nại thất bại');
    } catch (e) { alert('Lỗi'); }
  };

  if (isFetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50/50">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Form */}
        <div className="md:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200/60 h-fit">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Hồ Sơ</h1>
            <p className="text-neutral-500 mt-2 text-sm">Cập nhật thông tin giao hàng.</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-[#99e300]/10 text-[#5a8500] border border-[#99e300]/30' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
              <input type="text" disabled value={user?.username || ''} className="w-full h-11 px-4 bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Họ và tên</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Số điện thoại</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full h-11 px-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Địa chỉ giao hàng</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-4 bg-white border border-neutral-200 rounded-xl text-sm text-neutral-900 resize-none" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 bg-black hover:bg-neutral-800 text-white font-medium rounded-xl text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>

        {/* Order History */}
        <div className="md:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-neutral-200/60">
          <div className="mb-6 flex justify-between items-center border-b border-neutral-100 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Lịch sử đơn hàng</h2>
            <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-sm font-medium">{orders.length} đơn</span>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-neutral-500 text-center py-10">Bạn chưa có đơn hàng nào.</p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono bg-neutral-100 text-neutral-600 px-2 py-1 rounded">{order.orderCode}</span>
                      <p className="text-sm text-neutral-500 mt-2">Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          order.status === 'shipping' ? 'bg-blue-100 text-blue-700' : 
                          order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-700'}`}
                      >
                        {order.status === 'pending' ? 'Chờ xác nhận' : 
                         order.status === 'shipping' ? 'Đang giao' : 
                         order.status === 'delivered' ? 'Chờ nhận hàng' :
                         order.status === 'completed' ? 'Hoàn thành' : order.status}
                      </span>
                      <p className="font-bold text-lg text-neutral-900 mt-2">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    {order.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm items-center">
                        <span className="text-neutral-800 font-medium">{item.productName} <span className="text-neutral-500 font-normal">x{item.quantity}</span></span>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-600">{item.unitPrice.toLocaleString('vi-VN')}đ</span>
                          {(order.status === 'completed' || order.status === 'delivered') && (
                            <button onClick={() => handleReview(order.id, item.productId)} className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">Đánh giá</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 flex justify-end gap-3 border-t border-neutral-100">
                    <button onClick={() => handleDispute(order.id)} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200">
                      Khiếu nại
                    </button>
                    {order.status === 'delivered' && (
                      <button onClick={() => handleCompleteOrder(order.id)} className="px-4 py-2 text-sm font-bold bg-black text-white hover:bg-neutral-800 rounded-lg transition-colors">
                        Đã nhận được hàng
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

