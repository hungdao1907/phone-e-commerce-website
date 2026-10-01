import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, UploadCloud, CheckCircle2, AlertCircle, XCircle, Image as ImageIcon, X, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { OrderDeliveryTimeline, OrderStatus } from '../../components/order/OrderDeliveryTimeline';
import { cn } from '../../lib/utils';

const PAYMENT_STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  unpaid: { label: 'Chưa thanh toán', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertCircle },
  UNPAID: { label: 'Chưa thanh toán', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertCircle },
  pending: { label: 'Đang chờ xác nhận', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  PENDING: { label: 'Chưa thanh toán', color: 'text-orange-500', bg: 'bg-orange-50', icon: AlertCircle },
  pending_verification: { label: 'Đang chờ xác nhận', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  PENDING_VERIFICATION: { label: 'Đang chờ xác nhận', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  paid: { label: 'Đã thanh toán', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  PAID: { label: 'Đã thanh toán', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
  rejected: { label: 'Thanh toán chưa được xác nhận', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
  REJECTED: { label: 'Thanh toán chưa được xác nhận', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
};

const ORDER_STATUS_MAP: Record<string, { label: string, color: string, bg: string }> = {
  pending: { label: 'Đang xử lý', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-50' },
  processing: { label: 'Đang chuẩn bị', color: 'text-blue-700', bg: 'bg-blue-50' },
  shipping: { label: 'Đang giao hàng', color: 'text-blue-700', bg: 'bg-blue-50' },
  delivered: { label: 'Đã giao', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  completed: { label: 'Đã hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Đã hủy', color: 'text-red-700', bg: 'bg-red-50' },
  returned: { label: 'Đã trả hàng', color: 'text-neutral-700', bg: 'bg-neutral-100' }
};

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { token } = useAuthStore();
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for Cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Tôi không còn nhu cầu');
  const [cancelNote, setCancelNote] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const foundOrder = await res.json();
          setOrder(foundOrder);
        } else if (res.status === 404 || res.status === 403) {
          setOrder(null);
        }
      } catch (error) {
        console.error(error);
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token, navigate]);

  const isPaid = order?.paymentStatus === 'PAID' || order?.paymentStatus === 'paid';

  const handleCancelClick = () => {
    if (order.status === 'delivered' || order.status === 'completed') {
      alert('Đơn hàng đã hoàn tất, không thể hủy.');
      return;
    }
    if (order.paymentMethod === 'BANK_TRANSFER' && isPaid) {
      document.getElementById('cancel-modal')?.classList.remove('hidden');
      return;
    }
    if (order.paymentMethod === 'COD' && (order.status === 'shipping' || order.status === 'processing')) {
      if (order.status === 'shipping') {
        setShowShippingModal(true);
        return;
      }
    }
    setShowCancelModal(true);
  };

  const handleCancelOrder = async () => {
    if (!token || !order) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${order.id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: cancelReason, note: cancelNote })
      });
      if (res.ok) {
        alert('Đã hủy đơn hàng thành công');
        setOrder({ ...order, status: 'cancelled' });
        setShowCancelModal(false);
      } else {
        const data = await res.json();
        alert(data.message || 'Hủy đơn hàng thất bại');
      }
    } catch (error) {
      console.error(error);
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = () => {
    if (!order?.items) return;
    let addedCount = 0;
    
    order.items.forEach((item: any) => {
      const product = item.variant?.product;
      const variant = item.variant;
      if (product && variant && product.status === 'active' && variant.stock > 0) {
        const skuSplit = variant.sku ? variant.sku.split('-') : [];
        const colorName = skuSplit.length > 2 ? skuSplit[skuSplit.length - 1] : 'Khác';
        
        addItem({
          productId: product.id,
          productSlug: product.id,
          brand: product.brand || 'Khác',
          name: product.name,
          image: variant.image || product.image || '',
          variantId: variant.id,
          sku: variant.sku || product.id,
          colorName: colorName,
          storageLabel: item.variantInfo || 'Mặc định',
          price: variant.salePrice || variant.price,
          stock: variant.stock,
          quantity: item.quantity > variant.stock ? variant.stock : item.quantity
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      alert(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng`);
      navigate('/checkout'); 
    } else {
      alert('Xin lỗi, các sản phẩm trong đơn hàng này đã hết hàng hoặc ngừng kinh doanh.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-neutral-500 mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.</p>
          <Link to="/profile" className="px-5 py-2.5 bg-black text-white rounded-lg font-bold hover:bg-neutral-800 transition-colors">
            Quay lại Danh sách Đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  // --- LOGIC ---
  const displayPaymentMethod = order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản ngân hàng' : order.paymentMethod;
  const isStorePickup = order.shippingAddress?.startsWith('Nhận tại cửa hàng:');
  const storeId = isStorePickup ? order.shippingAddress.replace('Nhận tại cửa hàng:', '').trim() : null;

  // Real timeline logic mapped to our UI states
  const fakeHistory = [
    { status: 'pending' as OrderStatus, timestamp: order.createdAt },
    ...(order.status !== 'pending' && order.status !== 'cancelled' ? [{ status: 'confirmed' as OrderStatus, timestamp: order.updatedAt }] : []),
    ...(['processing', 'shipping', 'delivered', 'completed'].includes(order.status) ? [{ status: 'processing' as OrderStatus, timestamp: order.updatedAt }] : []),
    ...(['shipping', 'delivered', 'completed'].includes(order.status) ? [{ status: 'shipping' as OrderStatus, timestamp: order.updatedAt }] : []),
    ...(['delivered', 'completed'].includes(order.status) ? [{ status: 'delivered' as OrderStatus, timestamp: order.updatedAt }] : []),
    ...(order.status === 'completed' ? [{ status: 'completed' as OrderStatus, timestamp: order.updatedAt }] : [])
  ];

  const STORES = [
    { id: 'store_1', name: 'Apple Store Quận 1', address: '123 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM', phone: '0972501501' },
    { id: 'store_2', name: 'Apple Store Quận 7', address: 'Crescent Mall, 101 Tôn Dật Tiên, Q.7, TP.HCM', phone: '0972501502' },
  ];
  const matchedStore = storeId ? STORES.find(s => s.id === storeId) : null;

  const firstProductId = order.items?.[0]?.productId || order.items?.[0]?.variant?.productId || '';
  
  const txStatus = order.bankTransaction?.status;
  const isInvalidAmount = txStatus === 'INVALID_AMOUNT' || txStatus === 'UNMATCHED';
  const isManualReview = txStatus === 'MANUAL_REVIEW';

  const statusConfig = ORDER_STATUS_MAP[order.status] || { label: order.status, color: 'text-neutral-700', bg: 'bg-neutral-100' };

  return (
    <div className="min-h-screen bg-[#f7f8fa] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Quay lại đơn hàng
          </Link>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-2">
              Chi tiết đơn hàng
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-medium">#{order.orderCode || order.id}</span>
              <span className="text-neutral-400">•</span>
              <span className="text-neutral-500">Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
              <span className="text-neutral-400">•</span>
              <span className={cn("font-medium px-2 py-0.5 rounded", statusConfig.bg, statusConfig.color)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {order.status === 'pending' && !isPaid && (
              <button 
                onClick={() => navigate(`/checkout/payment?orderId=${order.orderCode || order.id}`)}
                className="px-5 py-2.5 text-sm font-semibold bg-black text-white hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Thanh toán ngay
              </button>
            )}

            {(order.status === 'confirmed' || order.status === 'processing') && (
              <button className="px-5 py-2.5 text-sm font-semibold bg-neutral-100 text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors">
                Theo dõi đơn hàng
              </button>
            )}

            {order.status === 'shipping' && (
              <button className="px-5 py-2.5 text-sm font-semibold bg-black text-white hover:bg-neutral-800 rounded-lg transition-colors">
                Theo dõi giao hàng
              </button>
            )}

            {(order.status === 'delivered' || order.status === 'completed') && (
              <button 
                onClick={() => {
                  if (firstProductId) window.location.href = `/product/${firstProductId}#reviews`;
                }}
                className="px-5 py-2.5 text-sm font-semibold bg-black text-white hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Đánh giá sản phẩm
              </button>
            )}

            {(['delivered', 'completed', 'cancelled', 'shipping'].includes(order.status)) && (
              <button 
                onClick={handleReorder}
                className="px-5 py-2.5 text-sm font-semibold bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                Mua lại
              </button>
            )}

            {order.status !== 'cancelled' && order.status !== 'delivered' && order.status !== 'completed' && (
              <button 
                onClick={handleCancelClick}
                className="px-5 py-2.5 text-sm font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SẢN PHẨM */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-5">Sản phẩm</h2>
              <div className="divide-y divide-neutral-100">
                {order.items?.map((item: any, idx: number) => {
                  const imageSrc = item.variant?.product?.image || item.productImage || 'https://via.placeholder.com/150';
                  return (
                    <div key={idx} className="py-5 flex gap-5">
                      <div className="w-20 h-20 bg-[#f7f8fa] rounded-lg flex items-center justify-center p-2 border border-neutral-100 shrink-0">
                        <img src={imageSrc} alt={item.productName} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 flex flex-col justify-start min-w-0">
                        <h3 className="text-base font-semibold text-neutral-900 leading-tight">{item.productName}</h3>
                        <p className="text-sm text-neutral-500 mt-1">{item.variantInfo || 'Mặc định'}</p>
                        <p className="text-sm text-neutral-500 mt-1">SL: {item.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-neutral-900">{(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TỔNG TIỀN */}
              <div className="pt-5 mt-2 border-t border-neutral-100">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Tạm tính</span>
                    <span className="font-semibold text-neutral-900">{(order.totalAmount - (order.shippingFee || 0) + (order.discountAmount || 0)).toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold text-neutral-900">{order.shippingFee ? `${order.shippingFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Giảm giá</span>
                      <span className="font-semibold text-red-600">-{order.discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-end pt-5 border-t border-neutral-100 mt-5">
                  <span className="text-sm font-bold text-neutral-900 uppercase">Tổng cộng</span>
                  <span className="text-xl font-bold text-neutral-900">{(order.totalAmount || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* THÔNG TIN GIAO HÀNG */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-5">Thông tin giao hàng</h2>
              <div className="space-y-4 text-sm">
                {!isStorePickup ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">👤 Người nhận</div>
                      <div className="font-medium text-neutral-900">{order.customer?.fullName || 'Chưa có thông tin'}</div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">☎ Số điện thoại</div>
                      <div className="font-medium text-neutral-900">{order.shippingPhone || order.customer?.phone || 'Chưa có thông tin'}</div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">📍 Địa chỉ</div>
                      <div className="font-medium text-neutral-900 leading-relaxed max-w-sm">{order.shippingAddress || 'Chưa có thông tin'}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">🏪 Cửa hàng</div>
                      <div className="font-medium text-neutral-900">{matchedStore?.name || `Cửa hàng: ${storeId}`}</div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">📍 Địa chỉ</div>
                      <div className="font-medium text-neutral-900 leading-relaxed max-w-sm">{matchedStore?.address || 'Chưa có thông tin'}</div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">☎ Số điện thoại</div>
                      <div className="font-medium text-neutral-900">{matchedStore?.phone || 'Chưa có thông tin'}</div>
                    </div>
                  </>
                )}
                {order.shippingNote && (
                  <div className="flex items-start gap-4 pt-4 border-t border-neutral-100">
                    <div className="text-neutral-500 w-28 shrink-0 flex items-center gap-2">📝 Ghi chú</div>
                    <div className="font-medium text-neutral-900 leading-relaxed">{order.shippingNote}</div>
                  </div>
                )}
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-5">Phương thức thanh toán</h2>
              
              {order.status === 'cancelled' && isPaid ? (
                <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                  <p className="text-red-700 font-bold mb-2 text-sm">Đơn hàng đã được thanh toán và đã hủy</p>
                  <p className="text-sm text-red-600 mb-4">Vui lòng liên hệ cửa hàng để được hỗ trợ hoàn tiền.</p>
                  <button 
                    onClick={() => document.getElementById('stores-modal')?.classList.remove('hidden')}
                    className="px-4 py-2 bg-white text-red-600 font-semibold text-sm rounded-lg border border-red-200 hover:bg-red-50"
                  >
                    Xem cửa hàng gần nhất
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-4">
                    <div className="text-neutral-500 w-28 shrink-0">Phương thức</div>
                    <div className="font-medium text-neutral-900 flex items-center gap-2">
                      💳 {displayPaymentMethod}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-neutral-500 w-28 shrink-0">Trạng thái</div>
                    <div className="flex-1">
                      {order.paymentMethod === 'BANK_TRANSFER' ? (
                         <span className={cn("inline-flex items-center px-2 py-0.5 rounded font-medium text-xs", PAYMENT_STATUS_MAP[order.paymentStatus]?.bg, PAYMENT_STATUS_MAP[order.paymentStatus]?.color)}>
                           ● {PAYMENT_STATUS_MAP[order.paymentStatus]?.label || 'Chưa thanh toán'}
                         </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-medium text-xs bg-orange-50 text-orange-600">
                          ● Chưa thanh toán
                        </span>
                      )}
                    </div>
                  </div>

                  {order.paymentMethod === 'BANK_TRANSFER' && !isPaid && order.status !== 'cancelled' && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-neutral-600">Đơn hàng đang chờ thanh toán. Giao dịch sẽ được hệ thống đối soát tự động.</p>
                      
                      {isInvalidAmount && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-700 text-xs">
                          <p className="font-bold flex items-center gap-1.5 mb-1"><AlertCircle className="w-3.5 h-3.5" /> Thanh toán chưa khớp</p>
                          <p>Số tiền bạn đã chuyển không khớp. Đã nhận: {(order.bankTransaction?.amount || 0).toLocaleString('vi-VN')}đ</p>
                        </div>
                      )}
                      {isManualReview && (
                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-yellow-700 text-xs">
                          <p className="font-bold flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5" /> Đang được kiểm tra</p>
                          <p>Giao dịch đang được nhân viên kiểm tra thủ công. Vui lòng chờ.</p>
                        </div>
                      )}

                      <button 
                        onClick={() => navigate(`/checkout/payment?orderId=${order.orderCode || order.id}`)}
                        className="px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors inline-block"
                      >
                        Thanh toán ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* THÔNG TIN GIAO DỊCH */}
            {order.paymentMethod === 'BANK_TRANSFER' && isPaid && order.bankTransaction && (
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-4">Thông tin giao dịch</h2>
                
                <div className="flex items-center gap-2 mb-4 p-3 bg-emerald-50/50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100/50">
                  <CheckCircle2 className="w-4 h-4" />
                  Thanh toán đã được hệ thống xác nhận
                </div>

                <div className="space-y-0 text-sm border-t border-neutral-100">
                  <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                    <span className="text-neutral-500">Số tiền</span>
                    <span className="font-semibold text-neutral-900">{(order.bankTransaction.amount).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {order.bankTransaction.transactionDate && (
                    <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                      <span className="text-neutral-500">Thời gian thanh toán</span>
                      <span className="font-medium text-neutral-900">{new Date(order.bankTransaction.transactionDate).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {order.bankTransaction.transactionId && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-neutral-500">Mã giao dịch</span>
                      <span className="font-mono text-neutral-900">{order.bankTransaction.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* TRẠNG THÁI ĐƠN HÀNG */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm sticky top-24">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-6">Trạng thái đơn hàng</h2>
              
              {order.status === 'cancelled' ? (
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                  <XCircle className="w-5 h-5" />
                  <span className="font-semibold text-sm">Đơn hàng đã bị hủy</span>
                </div>
              ) : (
                <OrderDeliveryTimeline currentStatus={order.status} history={fakeHistory} />
              )}
            </div>

            {/* HỖ TRỢ ĐƠN HÀNG */}
            <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">Cần hỗ trợ?</h2>
              <p className="text-sm text-neutral-600 mb-4 leading-relaxed">Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào về đơn hàng.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => window.open('tel:0972501501', '_self')}
                  className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Liên hệ hỗ trợ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal logic handled by showCancelModal state */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-2">Hủy đơn hàng</h2>
              <p className="text-sm text-neutral-500 mb-6">Bạn có chắc chắn muốn hủy đơn hàng #{order.orderCode || order.id}?</p>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-neutral-700">Lý do hủy đơn</label>
                <div className="space-y-2">
                  {['Tôi muốn thay đổi sản phẩm', 'Tôi muốn thay đổi địa chỉ nhận hàng', 'Tôi không còn nhu cầu', 'Tìm được sản phẩm khác', 'Khác'].map(reason => (
                    <label key={reason} className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-neutral-50">
                      <input 
                        type="radio" 
                        name="cancelReason" 
                        value={reason} 
                        checked={cancelReason === reason} 
                        onChange={e => setCancelReason(e.target.value)}
                        className="w-4 h-4 text-black focus:ring-black"
                      />
                      <span className="text-sm text-neutral-700">{reason}</span>
                    </label>
                  ))}
                </div>
                {cancelReason === 'Khác' && (
                  <textarea
                    placeholder="Vui lòng cho chúng tôi biết lý do chi tiết..."
                    value={cancelNote}
                    onChange={e => setCancelNote(e.target.value)}
                    className="w-full mt-3 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm min-h-[80px]"
                  />
                )}
              </div>
            </div>
            
            <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Quay lại
              </button>
              <button 
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="px-5 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Request Modal (For PAID orders) */}
      <div id="cancel-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">Đơn hàng đã thanh toán</h3>
            <p className="text-sm text-neutral-600 leading-relaxed mb-6">
              Đơn hàng này đã được thanh toán thành công. Để đảm bảo quá trình kiểm tra và hoàn tiền chính xác, vui lòng liên hệ cửa hàng để được hỗ trợ hủy đơn.<br/><br/>
              Hotline: <span className="font-bold text-neutral-900">0972501501</span><br/>
              Hoặc bạn có thể đến cửa hàng gần nhất để được hỗ trợ trực tiếp.
            </p>
            <div className="space-y-3">
              <a href="tel:0972501501" className="flex items-center justify-center w-full py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors">
                Gọi 0972501501
              </a>
              <button 
                onClick={() => {
                  document.getElementById('cancel-modal')?.classList.add('hidden');
                  document.getElementById('stores-modal')?.classList.remove('hidden');
                }}
                className="w-full py-3 bg-neutral-100 text-neutral-900 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Xem cửa hàng gần nhất
              </button>
              <button 
                onClick={() => document.getElementById('cancel-modal')?.classList.add('hidden')}
                className="w-full py-3 text-neutral-500 text-sm font-semibold hover:text-neutral-900 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Warning Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 mb-2">🚚 Đơn hàng đang được giao</h2>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                Đơn hàng <span className="font-bold text-neutral-900">#{order.orderCode || order.id}</span> đang trên đường giao tới bạn.<br/><br/>
                Vui lòng liên hệ đơn vị vận chuyển hoặc tổng đài để yêu cầu hủy đơn nếu cần.
              </p>
              
              <button 
                onClick={() => setShowShippingModal(false)}
                className="w-full px-5 py-3 text-sm font-semibold bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stores Location Modal */}
      <div id="stores-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-100 shrink-0">
            <h3 className="text-lg font-bold text-neutral-900">Hệ thống cửa hàng</h3>
            <button 
              onClick={() => document.getElementById('stores-modal')?.classList.add('hidden')}
              className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            {STORES.map((store) => (
              <div key={store.id} className="p-4 rounded-lg border border-neutral-200 hover:border-black transition-colors">
                <h4 className="font-bold text-neutral-900 mb-1">{store.name}</h4>
                <p className="text-sm text-neutral-600 mb-1">{store.address}</p>
                <p className="text-sm text-neutral-600 mb-4">SĐT: {store.phone}</p>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-neutral-100 text-neutral-900 text-xs font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 mr-1.5" /> Xem bản đồ
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
