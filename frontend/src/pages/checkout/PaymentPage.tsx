import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { checkoutProfileError, useCheckoutStore } from '../../store/useCheckoutStore';
import { useRecipientProfile } from '../../components/profile/use-recipient-profile';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';
import { useQuery } from '@tanstack/react-query';
import { CheckoutSidebar } from '../../components/checkout/CheckoutSidebar';
import { clearCheckoutIntent, getCheckoutIntent } from '../../components/checkout/checkout-idempotency';
import { CreditCard, Wallet, Banknote, Loader2, CheckCircle2, AlertTriangle, Clock, AlertCircle } from 'lucide-react';

const checkoutIdempotencyEnabled = import.meta.env.VITE_CHECKOUT_IDEMPOTENCY_ENABLED === 'true';

export function PaymentPage() {
  const revision = useCheckoutStore(state => state.sessionRevision);
  return <AccountPaymentPage key={revision} />;
}

function AccountPaymentPage() {
  const { user, token } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const navigate = useNavigate();
  const { deliveryInfo, paymentMethod, setPaymentMethod } = useCheckoutStore();
  const { profileStatus, profileError, sessionRevision } = useRecipientProfile();
  const mounted = useRef(true);
  const submitting = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const currentSession = () => mounted.current && !!useAuthStore.getState().token
    && useAuthStore.getState().user?.id === user?.id
    && useCheckoutStore.getState().sessionRevision === sessionRevision;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [serverPricing, setServerPricing] = useState<any>(null);
  const [pricingConfirmation, setPricingConfirmation] = useState<string | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingMessage, setPricingMessage] = useState<string | null>(null);
  const [needsReconfirmation, setNeedsReconfirmation] = useState(false);

  const { appliedPromo } = useCartStore();
  const orderCode = paymentData?.orderCode;

  // React Query for polling payment status
  const { data: paymentStatusData } = useQuery({
    queryKey: ['payment-status', user?.id, sessionRevision, orderCode],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/${orderCode}/payment-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    enabled: !!orderCode && !!token && !!user,
    refetchInterval: (query) => {
      const data = query.state?.data as any;
      if (data?.paymentStatus === 'PAID') return false; // Stop when paid
      if (data?.transaction?.status === 'INVALID_AMOUNT') return false; // Stop when invalid amount found
      if (data?.transaction?.status === 'INVALID_CONTENT' || data?.transaction?.status === 'MANUAL_REVIEW') return false; // Stop when needs manual check
      return 5000; // Poll every 5s otherwise
    },
  });

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

  useEffect(() => {
    if (!token || !user || items.length === 0 || isOrderPlaced) return;
    let cancelled = false;
    const loadPrice = async () => {
      setIsLoadingPricing(true);
      setPricingConfirmation(null);
      setPricingMessage(null);
      setNeedsReconfirmation(false);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders/price-preview`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            items: items.map(item => ({ variantId: item.variantId || item.id, quantity: item.quantity })),
            promoCode: appliedPromo?.name || null,
       deliveryMethod: (deliveryInfo.deliveryMethod === 'store_pickup' ? 'pickup' : 'delivery') as 'pickup' | 'delivery',
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Không thể lấy giá từ Backend.');
        if (cancelled) return;
        setServerPricing(result.pricing);
        setPricingConfirmation(result.pricingConfirmation);
        if (result.pricing.promo?.reason) {
          const reasonText = result.pricing.promo.reason === 'not_found' ? 'không tồn tại'
            : result.pricing.promo.reason === 'usage_limit' ? 'đã hết lượt sử dụng'
              : result.pricing.promo.reason === 'minimum_subtotal' ? 'chưa đạt giá trị đơn hàng tối thiểu'
                : result.pricing.promo.reason === 'expired' ? 'đã hết hạn'
                  : result.pricing.promo.reason === 'not_started' ? 'chưa đến thời gian áp dụng'
                    : result.pricing.promo.reason === 'another_offer_is_better' ? 'không được cộng dồn vì ưu đãi khác giảm nhiều hơn'
                      : 'hiện không đủ điều kiện';
          setPricingMessage(`Mã ${result.pricing.promo.code} ${reasonText}; tổng tiền bên dưới đã được Backend tính theo ưu đãi hợp lệ.`);
        }
      } catch (error) {
        if (!cancelled) {
          setPricingMessage(error instanceof Error ? error.message : 'Không thể lấy giá từ Backend.');
          setPricingConfirmation(null);
        }
      } finally {
        if (!cancelled) setIsLoadingPricing(false);
      }
    };
    void loadPrice();
    return () => { cancelled = true; };
  }, [token, user?.id, items, appliedPromo?.name, deliveryInfo.deliveryMethod, isOrderPlaced]);

  const handlePlaceOrder = async () => {
    if (submitting.current) return;
    const identityError = checkoutProfileError();
    if (!currentSession() || identityError) {
      setPricingMessage(identityError || 'Phiên đăng nhập đã thay đổi.');
      return;
    }
    if (!user || !token) return;
    if (!deliveryInfo.fullName.trim() || deliveryInfo.fullName.trim().length > 200 || !/^(03|05|07|08|09)[0-9]{8}$/.test(deliveryInfo.phone)) {
      navigate('/checkout');
      return;
    }
    if (!pricingConfirmation || !serverPricing) {
      setPricingMessage('Chưa nhận được xác nhận giá chính thức. Vui lòng chờ hoặc tải lại giá trước khi đặt hàng.');
      return;
    }
    setIsSubmitting(true);
    submitting.current = true;
    
    // Determine actual address
    let finalAddress = deliveryInfo.address;
    if (deliveryInfo.deliveryMethod === 'shipping') {
      finalAddress = `${deliveryInfo.address}, ${deliveryInfo.ward}, ${deliveryInfo.district}, ${deliveryInfo.city}`;
    } else {
      finalAddress = `Nhận tại cửa hàng: ${deliveryInfo.storeId}`;
    }

      const orderPayload = {
      items: items.map(i => ({
        productId: i.productId || i.id,
        variantId: i.variantId || null,
        quantity: i.quantity
      })),
      paymentMethod,
      shippingAddress: finalAddress,
      shippingPhone: deliveryInfo.phone,
      recipientName: deliveryInfo.fullName.trim() as string | undefined,
       deliveryMethod: (deliveryInfo.deliveryMethod === 'store_pickup' ? 'pickup' : 'delivery') as 'pickup' | 'delivery',
      promoCode: appliedPromo?.name,
      pricingConfirmation,
      note: deliveryInfo.note || '',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };

    let checkoutRequestSent = false;
    let pendingIdempotencyKey: string | null = null;
    try {
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      let requestSignal: AbortSignal | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      if (checkoutIdempotencyEnabled) {
        const intent = await getCheckoutIntent(user.id, {
          items: orderPayload.items.map(item => ({ variantId: item.variantId || '', quantity: item.quantity })),
          promoCode: appliedPromo?.name || null,
          deliveryMethod: orderPayload.deliveryMethod,
          paymentMethod: orderPayload.paymentMethod,
          shippingAddress: orderPayload.shippingAddress,
          shippingPhone: orderPayload.shippingPhone,
          recipientName: orderPayload.recipientName,
          note: orderPayload.note,
        }, undefined, undefined, Date.now(), currentSession);
        pendingIdempotencyKey = intent.key;
        if (intent.omitRecipientName) delete orderPayload.recipientName;
        orderPayload.estimatedDelivery = intent.estimatedDelivery;
        requestHeaders['Idempotency-Key'] = intent.key;
        const controller = new AbortController();
        requestSignal = controller.signal;
        timeout = setTimeout(() => controller.abort(), 30_000);
      }

      let res: Response;
      try {
        if (!currentSession() || checkoutProfileError()) return;
        checkoutRequestSent = true;
        res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/orders`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(orderPayload),
        ...(requestSignal ? { signal: requestSignal } : {}),
        });
      } finally {
        if (timeout) clearTimeout(timeout);
      }
      if (res.ok) {
        const result = await res.json();
        if (!currentSession()) return;
        if (pendingIdempotencyKey) clearCheckoutIntent(user.id, pendingIdempotencyKey);
        setIsOrderPlaced(true);
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
        if (!currentSession()) return;
        if (res.status === 409 && error.code === 'PRICE_CONFIRMATION_REQUIRED' && error.pricing && error.pricingConfirmation) {
          const previousTotal = serverPricing?.grandTotal;
          setServerPricing(error.pricing);
          setPricingConfirmation(error.pricingConfirmation);
          setNeedsReconfirmation(true);
          setPricingMessage(Number.isSafeInteger(previousTotal) && previousTotal !== error.pricing.grandTotal
            ? `Tổng tiền đã thay đổi từ ${previousTotal.toLocaleString('vi-VN')}đ thành ${error.pricing.grandTotal.toLocaleString('vi-VN')}đ. Vui lòng kiểm tra giá mới rồi xác nhận lại.`
            : 'Xác nhận giá trước đã hết hạn hoặc giá/ưu đãi đã thay đổi. Vui lòng kiểm tra lại bảng giá rồi xác nhận trước khi đặt hàng.');
          setIsSubmitting(false);
          return;
        }
        alert(error.message || 'Lỗi đặt hàng');
        setIsSubmitting(false);
      }
    } catch (e) { 
      if (!currentSession()) return;
      console.error(e);
      if (!checkoutRequestSent && e instanceof Error) {
        alert(e.message);
      } else if (checkoutIdempotencyEnabled) {
        alert('Chưa nhận được kết quả từ máy chủ. Khóa thử lại của cùng checkout đã được giữ; hãy thử lại cùng giỏ hàng và thông tin nhận hàng để nhận đúng kết quả, không đổi khóa.');
      } else {
        alert('Không xác định được máy chủ đã nhận đơn hay chưa. Hãy kiểm tra mục đơn hàng trước khi gửi lại để tránh tạo đơn trùng.');
      }
      setIsSubmitting(false);
    } finally {
      submitting.current = false;
      if (currentSession()) setIsSubmitting(false);
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
              buttonText={needsReconfirmation ? 'XÁC NHẬN GIÁ MỚI VÀ ĐẶT HÀNG' : 'ĐẶT HÀNG'}
              isSubmitting={isSubmitting}
              onNext={handlePlaceOrder}
              shippingFeeOverride={deliveryInfo.deliveryMethod === 'store_pickup' ? 0 : undefined}
              pricingSnapshot={serverPricing}
              pricingLoading={isLoadingPricing}
              pricingMessage={profileError || pricingMessage}
              disableButton={!token || !user || profileStatus !== 'ready' || !pricingConfirmation || !serverPricing}
              backendPricingRequired
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
              
              {/* STATUS BASED UI */}
              {(() => {
                const isPaid = paymentStatusData?.paymentStatus === 'PAID';
                const txStatus = paymentStatusData?.transaction?.status;
                
                // 3. PAYMENT_SUCCESS
                if (isPaid) {
                  return (
                    <div className="flex flex-col items-center text-center space-y-4 py-8">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-bold text-neutral-900">Thanh toán thành công</h4>
                      <p className="text-sm text-neutral-500 max-w-[280px]">Hệ thống đã nhận được khoản thanh toán của bạn cho đơn hàng <span className="font-bold font-mono">{paymentData.orderCode}</span>.</p>
                      
                      <div className="w-full pt-6">
                        <button 
                          onClick={() => navigate('/order-success', { state: { orderId: paymentData.orderCode } })}
                          className="w-full h-12 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl transition-colors shadow-sm"
                        >
                          Xem chi tiết đơn hàng
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // 4. INVALID_AMOUNT
                if (txStatus === 'INVALID_AMOUNT') {
                  return (
                    <div className="flex flex-col text-center space-y-4 py-6">
                      <div className="flex justify-center">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-2">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-neutral-900">Thanh toán cần được kiểm tra</h4>
                      <p className="text-sm text-neutral-600">Hệ thống đã nhận được giao dịch nhưng số tiền chuyển khoản chưa khớp với giá trị đơn hàng.</p>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-left space-y-2 mt-4">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Số tiền cần thanh toán:</span>
                          <span className="font-bold text-neutral-900">{paymentData.amount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Số tiền đã nhận:</span>
                          <span className="font-bold text-orange-600">{paymentStatusData.transaction.amount.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-orange-200">
                          <span className="font-bold text-orange-600">Còn thiếu:</span>
                          <span className="font-bold text-orange-600">{(paymentData.amount - paymentStatusData.transaction.amount).toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-neutral-500 mt-4">Vui lòng liên hệ CSKH hoặc chờ nhân viên liên hệ lại để xử lý.</p>
                    </div>
                  );
                }

                // 5. MANUAL_REVIEW / UNMATCHED / INVALID_CONTENT
                if (['MANUAL_REVIEW', 'UNMATCHED', 'INVALID_CONTENT'].includes(txStatus)) {
                  return (
                    <div className="flex flex-col items-center text-center space-y-4 py-8">
                      <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-2">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-neutral-900">Đang được kiểm tra</h4>
                      <p className="text-sm text-neutral-600 max-w-[280px]">Giao dịch của bạn đang được nhân viên kiểm tra thủ công. Xin vui lòng đợi trong giây lát.</p>
                    </div>
                  );
                }

                // 1 & 2. PENDING / CHECKING
                return (
                  <>
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
                          <span className="text-sm font-bold text-neutral-900 bg-neutral-200/50 px-2 py-0.5 rounded font-mono">{paymentData.transferContent}</span>
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
                      {isCheckingPayment ? (
                        <p className="text-xs text-blue-600 font-bold flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Hệ thống đang kiểm tra giao dịch chuyển khoản...
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 font-medium flex items-center justify-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          Hệ thống đang chờ nhận thanh toán...
                        </p>
                      )}
                      
                      <p className="text-[10px] text-neutral-400 leading-relaxed max-w-[320px] mx-auto">
                        Đơn hàng của bạn đang ở trạng thái <b>Chờ Thanh Toán</b>. Vui lòng chuyển khoản đúng số tiền và nội dung.
                      </p>
                    </div>

                    <div className="mt-6">
                      <button 
                        onClick={() => setIsCheckingPayment(true)}
                        disabled={isCheckingPayment}
                        className="w-full h-12 bg-black hover:bg-neutral-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isCheckingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang kiểm tra...
                          </>
                        ) : (
                          "Tôi đã chuyển khoản"
                        )}
                      </button>
                    </div>
                  </>
                );
              })()}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
