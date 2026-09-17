import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Heart, Ticket, Star, ShieldCheck } from 'lucide-react';
import { AccountSidebar, TabId } from '@/components/profile/AccountSidebar';
import { OverviewTab } from '@/components/profile/OverviewTab';
import { InfoTab } from '@/components/profile/InfoTab';
import { AddressTab } from '@/components/profile/AddressTab';
import { OrdersTab } from '@/components/profile/OrdersTab';
import { EmptyState } from '@/components/profile/EmptyState';

export const CustomerProfile = () => {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  
  // Profile state
  const [fullName, setFullName] = useState(user?.username || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isFetching, setIsFetching] = useState(true);
  
  // Orders state
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

  const handleUpdateProfile = async (dataToUpdate: { fullName?: string; phone?: string; address?: string }) => {
    const payload = {
      fullName: dataToUpdate.fullName !== undefined ? dataToUpdate.fullName : fullName,
      phone: dataToUpdate.phone !== undefined ? dataToUpdate.phone : phone,
      address: dataToUpdate.address !== undefined ? dataToUpdate.address : address,
    };

    const response = await fetch('http://localhost:3001/api/customers/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Cập nhật thất bại');
    }

    if (dataToUpdate.fullName !== undefined) setFullName(dataToUpdate.fullName);
    if (dataToUpdate.phone !== undefined) setPhone(dataToUpdate.phone);
    if (dataToUpdate.address !== undefined) setAddress(dataToUpdate.address);
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
      <div className="min-h-[70vh] flex items-center justify-center bg-neutral-50/50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Breadcrumb / Page Header */}
        <div className="mb-8">
          <nav className="flex text-sm text-neutral-500 mb-2">
            <a href="/" className="hover:text-black">Trang chủ</a>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 font-medium">Tài khoản</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tài khoản của tôi</h1>
        </div>

        {/* Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <AccountSidebar activeTab={activeTab} onChangeTab={setActiveTab} />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'overview' && (
              <OverviewTab orders={orders} onChangeTab={setActiveTab} />
            )}
            
            {activeTab === 'info' && (
              <InfoTab 
                initialFullName={fullName} 
                initialPhone={phone} 
                onUpdate={handleUpdateProfile} 
              />
            )}

            {activeTab === 'address' && (
              <AddressTab 
                initialFullName={fullName} 
                initialPhone={phone} 
                initialAddress={address} 
                onUpdate={handleUpdateProfile} 
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab 
                orders={orders} 
                onReview={handleReview} 
                onDispute={handleDispute} 
                onComplete={handleCompleteOrder} 
              />
            )}

            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Sản phẩm yêu thích</h2>
                <EmptyState 
                  icon={Heart} 
                  title="Chưa có sản phẩm yêu thích" 
                  description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Khám phá ngay các sản phẩm nổi bật."
                  actionLabel="Khám phá sản phẩm"
                  onAction={() => window.location.href = '/'}
                />
              </div>
            )}

            {activeTab === 'voucher' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Voucher của tôi</h2>
                <EmptyState 
                  icon={Ticket} 
                  title="Chưa có voucher nào" 
                  description="Bạn hiện không có mã giảm giá nào. Hãy thường xuyên kiểm tra để nhận các ưu đãi mới nhất."
                />
              </div>
            )}

            {activeTab === 'points' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Điểm thưởng</h2>
                <EmptyState 
                  icon={Star} 
                  title="Tính năng đang cập nhật" 
                  description="Chương trình điểm thưởng khách hàng thân thiết đang được chúng tôi xây dựng và sẽ sớm ra mắt."
                />
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Bảo mật</h2>
                <EmptyState 
                  icon={ShieldCheck} 
                  title="Đổi mật khẩu" 
                  description="Tính năng đổi mật khẩu nâng cao đang được bảo trì."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


