import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { useCheckoutStore } from '../../store/useCheckoutStore';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { CheckoutSidebar } from '../../components/checkout/CheckoutSidebar';
import { CreditCard, Wallet, Banknote } from 'lucide-react';

export function PaymentPage() {
  const { user, token } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { deliveryInfo, paymentMethod, setPaymentMethod } = useCheckoutStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);

  const { appliedPromo } = useCartStore();

  useEffect(() => {
    if (isOrderPlaced) return;
    
    if (!token || !user) {
      alert('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }
    if (items.length === 0) {
      navigate('/');
      return;
    }
    // Redirect back to delivery if required fields are missing
    if (!deliveryInfo.fullName || !deliveryInfo.phone) {
      navigate('/checkout');
    }
  }, [token, items, navigate, deliveryInfo, isOrderPlaced]);

  const handlePlaceOrder = async () => {
    if (!user || !token) return;
    setIsSubmitting(true);
    
    // Determine actual address
    let finalAddress = deliveryInfo.address;
    if (deliveryInfo.deliveryMethod === 'shipping') {
      finalAddress = `${deliveryInfo.address}, ${deliveryInfo.ward}, ${deliveryInfo.district}, ${deliveryInfo.city}`;
    } else {
      finalAddress = `Nhận tại cửa hàng: ${deliveryInfo.storeId}`;
    }

      const orderPayload = {
      customerId: user.id,
      items: items.map(i => ({
        productId: i.productId || i.id,
        variantId: i.variantId || null,
        quantity: i.quantity
      })),
      paymentMethod,
      shippingAddress: finalAddress,
      shippingPhone: deliveryInfo.phone,
      shippingFee: 0, 
      promoCode: appliedPromo?.code,
      note: deliveryInfo.note || '',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        setIsOrderPlaced(true);
        const result = await res.json();
        clearCart();
        
        if (paymentMethod === 'BANK' || paymentMethod === 'BANK_TRANSFER') {
          const paymentInfo = result.order?.Payment?.[0];
          if (paymentInfo) {
            setPaymentData({
              orderCode: result.order.orderCode,
              amount: paymentInfo.amount,
              qrUrl: paymentInfo.qrData,
              transferContent: paymentInfo.transferContent,
              bankId: result.paymentConfig?.bankId || 'MB',
              accountNo: result.paymentConfig?.accountNo || '0123456789',
              accountName: result.paymentConfig?.accountName || 'APPLEWEB'
            });
            setIsSubmitting(false);
            return;
          }
        }
        
        navigate('/order-success', { state: { orderId: result.orderId || result.order?.id || '#ORD-SUCCESS' } });
      } else {
        const error = await res.json();
        alert(error.message || 'Lỗi đặt hàng');
        setIsSubmitting(false);
      }
    } catch (e) { 
      console.error(e);
      alert('Lỗi đặt hàng. Vui lòng thử lại sau.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isOrderPlaced) return null;

  return (
    <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-[1000px] mx-auto">
        <CheckoutProgress currentStep="payment" />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-neutral-100">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-neutral-900" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">Phương thức thanh toán</h2>
                  <p className="text-sm text-neutral-500">Chọn cách bạn muốn thanh toán cho đơn hàng.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                  paymentMethod === 'COD' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'
                }`}>
                  <input 
                    type="radio" 
                    value="COD" 
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 w-4 h-4 text-black focus:ring-black cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Banknote className="w-5 h-5 text-neutral-700" />
                      <h4 className="text-sm font-bold text-neutral-900">Thanh toán khi nhận hàng (COD)</h4>
                    </div>
                    <p className="text-xs text-neutral-500">Thanh toán bằng tiền mặt khi hàng được giao tới.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                  paymentMethod === 'BANK' ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-black'
                }`}>
                  <input 
                    type="radio" 
                    value="BANK" 
                    checked={paymentMethod === 'BANK'}
                    onChange={() => setPaymentMethod('BANK')}
                    className="mt-1 w-4 h-4 text-black focus:ring-black cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-5 h-5 text-neutral-700" />
                      <h4 className="text-sm font-bold text-neutral-900">Chuyển khoản ngân hàng</h4>
                    </div>
                    <p className="text-xs text-neutral-500">Chuyển khoản trực tiếp qua tài khoản ngân hàng của chúng tôi.</p>
                  </div>
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSidebar 
              buttonText="ĐẶT HÀNG"
              isSubmitting={isSubmitting}
              onNext={handlePlaceOrder}
              shippingFeeOverride={deliveryInfo.deliveryMethod === 'store_pickup' ? 0 : undefined}
            />
          </div>
        </div>
      </div>

      {/* VIETQR MODAL */}
      {paymentData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-black text-white p-6 text-center relative">
              <h3 className="text-xl font-bold">THANH TOÁN CHUYỂN KHOẢN</h3>
              <p className="text-sm text-neutral-300 mt-2">Đơn hàng của bạn đã được tạo thành công!</p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="w-56 h-56 bg-white p-2 border-2 border-neutral-100 rounded-2xl shadow-sm mb-4">
                  <img src={paymentData.qrUrl} alt="VietQR" className="w-full h-full object-contain rounded-xl" />
                </div>
                <p className="text-sm font-semibold text-neutral-500">Quét mã bằng app ngân hàng</p>
              </div>

              <div className="bg-neutral-50 rounded-2xl p-4 space-y-4 border border-neutral-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">Ngân hàng</span>
                  <span className="text-sm font-bold text-neutral-900">{paymentData.bankId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">Chủ tài khoản</span>
                  <span className="text-sm font-bold text-neutral-900">{paymentData.accountName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">Số tài khoản</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{paymentData.accountNo}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(paymentData.accountNo)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                    >
                      COPY
                    </button>
                  </div>
                </div>
                <div className="h-px bg-neutral-200" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">Số tiền</span>
                  <span className="text-base font-bold text-emerald-600">{paymentData.amount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-medium">Nội dung</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">{paymentData.transferContent}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(paymentData.transferContent)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                    >
                      COPY
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-center">
                <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Hệ thống đang chờ nhận thanh toán...
                </p>
                <p className="text-[10px] text-neutral-400 leading-relaxed">
                  Đơn hàng của bạn đang ở trạng thái <b>Chờ Thanh Toán</b>. Việc bấm nút dưới đây chỉ để chuyển về trang thông báo, không xác nhận việc thanh toán thành công nếu tiền chưa vào tài khoản.
                </p>
              </div>

              <div className="mt-6">
                <button 
                  onClick={() => navigate('/order-success', { state: { orderId: paymentData.orderCode } })}
                  className="w-full h-12 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl transition-colors shadow-sm active:scale-[0.98]"
                >
                  Tôi đã chuyển khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
