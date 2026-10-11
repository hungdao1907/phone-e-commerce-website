import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { fetchCustomerOrderDetail, orderStatusLabel, type CustomerOrderDetail } from './customer-order-detail';

const money = (value: number) => `${value.toLocaleString('vi-VN')} đ`;
const paymentStatus = (status: string) => ({ PENDING: 'Chưa thanh toán', UNPAID: 'Chưa thanh toán',
  PENDING_VERIFICATION: 'Chờ xác minh thanh toán', PAID: 'Đã thanh toán', REFUNDED: 'Đã hoàn tiền',
  REJECTED: 'Thanh toán chưa được xác nhận' } as Record<string, string>)[status.toUpperCase()] || status;

export function CustomerOrderDetailView({ order }: { order: CustomerOrderDetail }) {
  return <div className="mx-auto max-w-5xl space-y-6" data-order-id={order.id}>
    <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-black"><ArrowLeft className="h-4 w-4" /> Tài khoản của tôi</Link>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-neutral-900">Chi tiết đơn hàng #{order.orderCode}</h1>
        <p className="mt-2 text-sm text-neutral-500">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</p></div>
      <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{orderStatusLabel(order.status)}</span>
    </header>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 lg:col-span-2 sm:p-7">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold"><Package className="h-5 w-5 text-neutral-400" /> Sản phẩm</h2>
        <div className="divide-y divide-neutral-100">{order.items.map(item => <div key={item.id} className="py-4 first:pt-0">
          <h3 className="font-semibold text-neutral-900">{item.productName}</h3>
          <p className="mt-1 break-words text-sm text-neutral-500">{item.variantInfo}</p>
          <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm"><span>Số lượng: {item.quantity}</span><span>Đơn giá: {money(item.unitPrice)}</span><strong>Thành tiền: {money(item.lineTotal)}</strong></div>
        </div>)}</div>
      </section>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="mb-3 flex items-center gap-2 font-bold"><MapPin className="h-4 w-4" /> Giao nhận</h2>
          <p className="whitespace-pre-wrap break-words text-sm">{order.shippingAddress}</p><p className="mt-2 text-sm text-neutral-600">{order.shippingPhone}</p></section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="mb-3 flex items-center gap-2 font-bold"><CreditCard className="h-4 w-4" /> Thanh toán</h2>
          <p className="text-sm">{order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : order.paymentMethod}</p>
          <p className="mt-2 text-sm font-medium text-neutral-600">{paymentStatus(order.paymentStatus)}</p></section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="mb-4 font-bold">Tổng kết đơn hàng</h2>
          <dl className="grid grid-cols-2 gap-y-3 text-sm"><dt>Tạm tính</dt><dd className="text-right">{money(order.subtotal)}</dd>
            <dt>Giảm giá</dt><dd className="text-right">−{money(order.discountAmount)}</dd>
            <dt>Phí vận chuyển</dt><dd className="text-right">{money(order.shippingFee)}</dd>
            <dt className="border-t pt-4 font-bold">Tổng thanh toán</dt><dd className="border-t pt-4 text-right text-lg font-bold text-blue-700">{money(order.totalAmount)}</dd></dl></section>
      </aside>
    </div>
    {order.note && <section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-semibold">Ghi chú đơn hàng</h2><p className="mt-2 whitespace-pre-wrap break-words text-sm text-neutral-600">{order.note}</p></section>}
  </div>;
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token, user } = useAuthStore();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setOrder(null); setError(''); setLoading(true);
    if (!orderId || !token || user?.role !== 'customer') {
      setError('Vui lòng đăng nhập bằng tài khoản khách hàng.'); setLoading(false);
      return () => controller.abort();
    }
    void fetchCustomerOrderDetail(orderId, token, user.id, {
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001', signal: controller.signal,
    }).then(value => { if (!controller.signal.aborted) setOrder(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Không thể tải đơn hàng.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [orderId, token, user?.id, user?.role, retry]);
  return <main className="min-h-screen bg-[#f8f9fc] px-4 py-10 sm:px-6">
    {loading ? <p role="status" className="py-16 text-center text-neutral-500">Đang tải chi tiết đơn hàng…</p>
      : error ? <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-white p-6 text-center"><p>{error}</p><button onClick={() => setRetry(value => value + 1)} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-white">Thử lại</button><Link to="/profile" className="ml-4 text-sm text-blue-700">Về tài khoản</Link></div>
        : order ? <CustomerOrderDetailView order={order} /> : null}
  </main>;
}
