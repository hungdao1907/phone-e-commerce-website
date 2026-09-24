import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { OrderDeliveryTimeline, OrderStatus } from '../../components/order/OrderDeliveryTimeline';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // In a real app, we fetch by ID. Here we fetch all and find, or mock if not found.
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const orders = await res.json();
          const foundOrder = orders.find((o: any) => o.id === orderId || o.orderCode === orderId);
          setOrder(foundOrder || {
            id: orderId,
            orderCode: orderId,
            status: 'processing' as OrderStatus,
            createdAt: new Date().toISOString(),
            totalAmount: 0,
            paymentMethod: 'COD',
            shippingAddress: 'Địa chỉ mẫu',
            items: []
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order) return null;

  // Generate fake history based on status for demo
  const fakeHistory = [
    { status: 'pending' as OrderStatus, timestamp: order.createdAt },
    ...(order.status !== 'pending' ? [{ status: 'confirmed' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 3600000).toISOString() }] : []),
    ...(order.status === 'processing' || order.status === 'shipping' || order.status === 'delivered' ? [{ status: 'processing' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 7200000).toISOString() }] : []),
    ...(order.status === 'shipping' || order.status === 'delivered' ? [{ status: 'shipping' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString() }] : []),
    ...(order.status === 'delivered' ? [{ status: 'delivered' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 172800000).toISOString() }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="mb-6">
          <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại Danh sách Đơn hàng
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
              Chi tiết đơn hàng <span className="text-base font-mono bg-neutral-200/60 px-3 py-1 rounded-lg">#{order.orderCode || order.id}</span>
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {order.status === 'pending' && (
              <button className="px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-full border border-red-200 transition-colors">
                Hủy đơn hàng
              </button>
            )}
            {order.status === 'delivered' && (
              <button className="px-5 py-2.5 text-sm font-bold bg-black text-white hover:bg-neutral-800 rounded-full transition-colors shadow-sm">
                Mua lại
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900 mb-6">Trạng thái vận chuyển</h2>
              <OrderDeliveryTimeline currentStatus={order.status} history={fakeHistory} />
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 text-neutral-400" /> Sản phẩm
              </h2>
              <div className="divide-y divide-neutral-100">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="py-4 flex gap-4">
                    <div className="w-16 h-16 bg-[#f5f7fb] rounded-xl flex items-center justify-center p-2 border border-neutral-100 shrink-0">
                      <img src={item.productImage || 'https://via.placeholder.com/150'} alt={item.productName} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-sm font-bold text-neutral-900">{item.productName}</h3>
                      <p className="text-xs text-neutral-500 mt-1">SL: {item.quantity}</p>
                    </div>
                    <div className="text-right flex flex-col justify-center">
                      <p className="text-sm font-bold text-neutral-900">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neutral-400" /> Thông tin giao hàng
              </h2>
              <div className="space-y-3 text-sm">
                <p className="text-neutral-900 font-semibold">{order.shippingAddress || 'Khách hàng'}</p>
                <p className="text-neutral-600">{order.shippingPhone || 'Chưa cập nhật SĐT'}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-neutral-400" /> Phương thức thanh toán
              </h2>
              <p className="text-sm font-semibold text-neutral-900">
                {order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
              <h2 className="text-base font-bold text-neutral-900 mb-5">Tổng kết</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-neutral-900">{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-emerald-600">Miễn phí</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-neutral-100 mt-2">
                  <span className="font-bold text-neutral-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-neutral-900 tracking-tight">{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
