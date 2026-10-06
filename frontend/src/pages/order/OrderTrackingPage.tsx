import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  PackageSearch,
  ShieldCheck,
  Mail,
  Phone,
  Hash,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  AlertCircle,
  Copy,
  Check,
  Printer,
  HelpCircle,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { OrderDeliveryTimeline, OrderStatus } from '../../components/order/OrderDeliveryTimeline';
import { resolveMediaUrl } from '../../utils/media';
import { SettigationOtpInput } from '../../components/ui/SettigationOtpInput';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface OrderItem {
  id: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
  variant?: {
    image?: string;
    product?: {
      name: string;
      image?: string;
    };
  };
}

interface OrderData {
  id: string;
  orderCode: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  shippingPhone: string;
  totalAmount: number;
  shippingFee?: number;
  discountAmount?: number;
  note?: string;
  estimatedDelivery?: string;
  createdAt: string;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items?: OrderItem[];
}

function OrderItemThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveMediaUrl(src);

  if (!resolvedSrc || hasError) {
    return (
      <div className="w-18 h-18 bg-neutral-100/80 rounded-2xl border border-neutral-200/80 flex flex-col items-center justify-center p-2 shrink-0 text-neutral-400">
        <Package className="w-7 h-7 text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="w-18 h-18 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center justify-center p-2 shrink-0 overflow-hidden">
      <img
        src={resolvedSrc}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export function OrderTrackingPage() {
  // Step: 1 = Form, 2 = OTP, 3 = Order Details
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Inputs
  const [orderCode, setOrderCode] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');

  // OTP State
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [maskedDestination, setMaskedDestination] = useState('');
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Request & Verify states
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<OrderData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  // Handle Step 1: Request OTP
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const trimmedCode = orderCode.trim();
    const trimmedContact = phoneOrEmail.trim();

    if (!trimmedCode) {
      setErrorMsg('Vui lòng nhập Mã đơn hàng của bạn.');
      return;
    }
    if (!trimmedContact) {
      setErrorMsg('Vui lòng nhập Số điện thoại hoặc Email khi đặt hàng.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/track/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: trimmedCode,
          phoneOrEmail: trimmedContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không tìm thấy thông tin đơn hàng');
      }

      setMaskedDestination(data.maskedDestination || 'email của bạn');
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
      setOtpValues(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent, customOtp?: string) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);

    const fullOtp = customOtp || otpValues.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Vui lòng nhập đủ 6 chữ số mã xác thực OTP.');
      return;
    }

    setIsLoading(true);
    setIsVerified(false);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/track/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderCode: orderCode.trim(),
          otp: fullOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Mã xác thực không hợp lệ');
      }

      setIsVerified(true);
      setVerifiedOrder(data.order);

      // Smooth pause so the user enjoys the single unified verified box animation
      setTimeout(() => {
        setStep(3);
        setIsVerified(false);
      }, 2500);
    } catch (err: any) {
      setIsVerified(false);
      setErrorMsg(err.message || 'Xác thực OTP không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (verifiedOrder?.orderCode) {
      navigator.clipboard.writeText(verifiedOrder.orderCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setStep(1);
    setOrderCode('');
    setPhoneOrEmail('');
    setOtpValues(['', '', '', '', '', '']);
    setVerifiedOrder(null);
    setErrorMsg(null);
    setDebugOtp(null);
  };

  // Helper for generating order timeline
  const getOrderTimeline = (order: OrderData) => {
    return [
      { status: 'pending' as OrderStatus, timestamp: order.createdAt },
      ...(order.status !== 'pending'
        ? [{ status: 'confirmed' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 1800000).toISOString() }]
        : []),
      ...(order.status === 'processing' || order.status === 'shipping' || order.status === 'delivered'
        ? [{ status: 'processing' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 7200000).toISOString() }]
        : []),
      ...(order.status === 'shipping' || order.status === 'delivered'
        ? [{ status: 'shipping' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 86400000).toISOString() }]
        : []),
      ...(order.status === 'delivered'
        ? [{ status: 'delivered' as OrderStatus, timestamp: new Date(new Date(order.createdAt).getTime() + 172800000).toISOString() }]
        : []),
    ];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Chờ xử lý', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'confirmed':
        return { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'processing':
        return { label: 'Đang chuẩn bị hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'shipping':
        return { label: 'Đang giao hàng', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'delivered':
        return { label: 'Giao hàng thành công', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'cancelled':
        return { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status, color: 'bg-neutral-100 text-neutral-700 border-neutral-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafc] text-neutral-900 pb-20 pt-8 sm:pt-12">
      {/* Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs font-medium text-neutral-400 mb-8">
          <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-neutral-700 font-semibold">Tra cứu đơn hàng</span>
        </nav>

        {/* STEP 1: INITIAL LOOKUP FORM */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-600 mb-4 tracking-wide">
                <PackageSearch className="w-3.5 h-3.5 text-neutral-900" />
                HỆ THỐNG TRA CỨU ĐƠN HÀNG TRỰC TUYẾN
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight uppercase">
                TRA CỨU ĐƠN HÀNG
              </h1>
              <p className="mt-3 text-base text-neutral-600 font-medium">
                Theo dõi báo giá và tiến độ đơn hàng của bạn.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-7 sm:p-9 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-900" />

              <form onSubmit={handleRequestOtp} className="space-y-6">
                {/* Field 1: Mã đơn hàng */}
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Mã đơn hàng <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                      <Hash className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                      placeholder="DH-20261003-A82K"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 text-sm sm:text-base font-medium transition-all uppercase tracking-wide placeholder:normal-case placeholder:text-neutral-400"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    Ví dụ: DH-20261003-A82K hoặc mã được gửi trong email khi mua hàng.
                  </p>
                </div>

                {/* Field 2: Số điện thoại/Email */}
                <div>
                  <label className="block text-sm font-bold text-neutral-800 mb-2">
                    Số điện thoại/Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="Nhập số điện thoại hoặc email lúc đặt hàng"
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-200 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-900/5 text-sm sm:text-base font-medium transition-all placeholder:text-neutral-400"
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Dùng để đối chiếu và gửi mã OTP bảo mật trước khi hiển thị dữ liệu.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-semibold">Thông tin tra cứu chưa chính xác</p>
                      <p className="text-xs mt-0.5 text-rose-600">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-neutral-900 text-white font-bold text-base hover:bg-neutral-800 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-neutral-900/10 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Đang kiểm tra hệ thống...</span>
                    </>
                  ) : (
                    <>
                      <span>Tra cứu</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Security Notice */}
              <div className="mt-8 pt-6 border-t border-neutral-100 flex items-start gap-3.5 text-neutral-500 text-xs leading-relaxed bg-neutral-50/70 p-4 rounded-2xl border border-neutral-100">
                <ShieldCheck className="w-5 h-5 text-neutral-700 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-neutral-800">Cơ chế bảo mật 2 lớp:</strong> Sau khi kiểm tra thông tin hợp lệ, hệ thống sẽ gửi một mã OTP 6 chữ số đến email hoặc số điện thoại của bạn nhằm ngăn ngừa việc lộ thông tin địa chỉ và đơn hàng cá nhân.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SECURITY OTP VERIFICATION (SETTIGATION RITUAL STYLE) */}
        {step === 2 && (
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <AnimatePresence mode="wait">
                {isVerified ? (
                  <motion.div
                    key="header-verified"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/25 border border-emerald-400">
                      <Check className="w-7 h-7 text-white stroke-[3.5]" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                      XÁC THỰC THÀNH CÔNG
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 font-medium">
                      Mã xác thực chính xác. Đang chuyển tới chi tiết đơn hàng...
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="header-default"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-900 text-white flex items-center justify-center mb-4 shadow-xl shadow-cyan-950/20 border border-neutral-800">
                      <ShieldCheck className="w-7 h-7 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                      XÁC THỰC BẢO MẬT
                    </h2>
                    <div className="mt-3 text-sm text-neutral-600">
                      <p>Mã xác thực đã được gửi đến</p>
                      <div className="inline-block mt-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200/80 font-mono font-semibold text-neutral-900 text-sm tracking-wide shadow-inner">
                        {maskedDestination}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* OTP Card with Settigation Ritual Aesthetic in White Card Theme */}
            <div className="bg-white text-neutral-900 rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-200/60 p-7 sm:p-9 relative overflow-hidden">
              {/* Soft violet to aqua ambient lighting */}
              <div className="absolute -top-32 -left-32 w-72 h-72 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-cyan-400/10 rounded-full blur-[80px] pointer-events-none" />

              <form onSubmit={handleVerifyOtp} className="relative z-10 space-y-6">
                <div>
                  <div className="text-center mb-3">
                    <span className="text-[11px] font-mono tracking-widest uppercase text-cyan-700 font-bold bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
                      BẢO MẬT ĐA TẦNG • MÃ OTP 6 CHỮ SỐ
                    </span>
                  </div>

                  {/* SETTIGATION ANIMATED OTP INPUT */}
                  <SettigationOtpInput
                    value={otpValues}
                    onChange={(newVal) => {
                      setOtpValues(newVal);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    onComplete={(completedOtp) => {
                      handleVerifyOtp(undefined, completedOtp);
                    }}
                    isVerifying={isLoading}
                    isVerified={isVerified}
                    isError={Boolean(errorMsg)}
                    errorMessage={errorMsg}
                    length={6}
                    autoFocus={true}
                  />

                  {/* Quick autofill helper for dev testing */}
                  {debugOtp && !isVerified && (
                    <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center flex items-center justify-center gap-2">
                      <span>Mã thử nghiệm (Dev): <strong className="font-mono text-amber-900">{debugOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpValues(debugOtp.split(''));
                          if (errorMsg) setErrorMsg(null);
                          handleVerifyOtp(undefined, debugOtp);
                        }}
                        className="ml-2 px-2.5 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold cursor-pointer text-xs transition-colors"
                      >
                        Tự động điền & Xác thực
                      </button>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {!isVerified && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Confirm Button */}
                      <button
                        type="submit"
                        disabled={isLoading || isVerified || otpValues.join('').length < 6}
                        className="w-full py-4 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg shadow-neutral-900/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin text-white" />
                            <span>Đang hợp nhất và xác thực...</span>
                          </>
                        ) : (
                          <>
                            <span>Xác nhận</span>
                            <CheckCircle2 className="w-5 h-5" />
                          </>
                        )}
                      </button>

                      {/* Resend OTP & Change Info */}
                      <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
                        <button
                          type="button"
                          onClick={() => {
                            if (canResend) {
                              handleRequestOtp();
                            }
                          }}
                          disabled={!canResend || isLoading || isVerified}
                          className={`font-semibold transition-colors flex items-center gap-1.5 ${
                            canResend ? 'text-neutral-900 hover:underline cursor-pointer' : 'text-neutral-400 cursor-not-allowed'
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          {canResend ? 'Gửi lại mã OTP' : `Gửi lại mã sau (${countdown}s)`}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setStep(1);
                            setErrorMsg(null);
                            setIsVerified(false);
                          }}
                          className="hover:text-neutral-900 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Nhập lại thông tin khác
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Requirement rationale text */}
              <div className="mt-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 text-neutral-500 text-xs leading-relaxed text-center relative z-10">
                <p className="italic">
                  &ldquo;Điều này quan trọng vì chỉ có mã đơn hàng + số điện thoại không phải cơ chế bảo mật đủ tốt để bảo vệ thông tin cá nhân của bạn.&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DETAILED ORDER DASHBOARD */}
        {step === 3 && verifiedOrder && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Bar Navigation & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Tra cứu đơn hàng khác
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  In đơn hàng
                </button>
              </div>
            </div>

            {/* Order Header Summary Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center flex-wrap gap-2.5 mb-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Đơn hàng
                    </span>
                    <span className="text-xl sm:text-2xl font-mono font-extrabold text-neutral-900 tracking-tight">
                      #{verifiedOrder.orderCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
                      title="Sao chép mã đơn"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    Thời gian đặt:{' '}
                    <strong className="text-neutral-800">
                      {new Date(verifiedOrder.createdAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex items-center flex-wrap gap-3">
                  {(() => {
                    const badge = getStatusBadge(verifiedOrder.status);
                    return (
                      <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    );
                  })()}

                  <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
                    ['paid', 'PAID'].includes(verifiedOrder.paymentStatus)
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {['paid', 'PAID'].includes(verifiedOrder.paymentStatus) ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tracking Progress Timeline Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-neutral-700" />
                  Tiến độ vận chuyển & Bàn giao
                </h3>
                <span className="text-xs font-semibold text-neutral-500">
                  Dự kiến nhận:{' '}
                  <span className="text-emerald-600 font-bold">
                    {verifiedOrder.estimatedDelivery
                      ? new Date(verifiedOrder.estimatedDelivery).toLocaleDateString('vi-VN')
                      : '3 - 5 ngày làm việc'}
                  </span>
                </span>
              </div>

              <OrderDeliveryTimeline
                currentStatus={verifiedOrder.status}
                history={getOrderTimeline(verifiedOrder)}
              />

              <div className="mt-6 pt-5 border-t border-neutral-100 bg-neutral-50/70 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Đối tác giao vận: <strong>Giao Hàng Nhanh (GHN Express)</strong></span>
                </div>
                <div>
                  <span>Mã vận đơn bưu cục: <strong className="font-mono">GHN-{verifiedOrder.orderCode}</strong></span>
                </div>
              </div>
            </div>

            {/* 2-Columns Grid: Products & Order Summary / Shipping Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Items List (Span 2) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6 sm:p-8">
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-neutral-700" />
                  Sản phẩm trong đơn hàng ({verifiedOrder.items?.length || 0})
                </h3>

                <div className="divide-y divide-neutral-100">
                  {verifiedOrder.items && verifiedOrder.items.length > 0 ? (
                    verifiedOrder.items.map((item, idx) => {
                      return (
                        <div key={idx} className="py-4.5 flex items-center gap-4">
                          <OrderItemThumbnail
                            src={item.variant?.image || item.variant?.product?.image}
                            alt={item.productName}
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                              {item.productName}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-1 truncate">
                              Phân loại: <span className="font-medium text-neutral-700">{item.variantInfo || 'Tiêu chuẩn'}</span>
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Số lượng: <strong className="text-neutral-800">{item.quantity}</strong> × {item.unitPrice.toLocaleString('vi-VN')}đ
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-sm sm:text-base font-extrabold text-neutral-900">
                              {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-neutral-500 py-4">Không có sản phẩm nào trong đơn hàng.</p>
                  )}
                </div>
              </div>

              {/* Sidebar: Financial Breakdown & Shipping Details (Span 1) */}
              <div className="lg:col-span-1 space-y-6">
                {/* Shipping & Recipient Card */}
                <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6">
                  <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-700" />
                    Địa chỉ nhận hàng
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="font-bold text-neutral-900">
                      {verifiedOrder.customer?.fullName || 'Khách hàng'}
                    </p>
                    <p className="text-neutral-600 font-mono">
                      {verifiedOrder.shippingPhone || verifiedOrder.customer?.phone || 'Chưa có SĐT'}
                    </p>
                    <p className="text-neutral-600 leading-relaxed">
                      {verifiedOrder.shippingAddress || 'Chưa cập nhật địa chỉ'}
                    </p>
                    {verifiedOrder.note && (
                      <p className="text-neutral-500 italic pt-2 border-t border-neutral-100 text-xs">
                        Ghi chú: &ldquo;{verifiedOrder.note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Payment Method Card */}
                <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6">
                  <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-700" />
                    Hình thức thanh toán
                  </h4>
                  <div className="text-xs sm:text-sm space-y-2">
                    <p className="font-semibold text-neutral-900">
                      {verifiedOrder.paymentMethod === 'COD'
                        ? 'Thanh toán tiền mặt khi nhận hàng (COD)'
                        : verifiedOrder.paymentMethod === 'BANK_TRANSFER'
                        ? 'Chuyển khoản qua ngân hàng'
                        : verifiedOrder.paymentMethod}
                    </p>
                    <p className="text-neutral-500 text-xs">
                      {['paid', 'PAID'].includes(verifiedOrder.paymentStatus)
                        ? 'Khoản thanh toán đã được xác thực hoàn tất.'
                        : 'Vui lòng chuẩn bị đủ tiền khi Shipper liên hệ giao hàng.'}
                    </p>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-[0_12px_40px_rgba(0,0,0,0.06)] p-6">
                  <h4 className="text-sm font-bold text-neutral-900 mb-4">
                    Chi tiết thanh toán
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>Tạm tính hàng hóa</span>
                      <span className="font-semibold text-neutral-900">
                        {verifiedOrder.totalAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="flex justify-between text-neutral-600">
                      <span>Phí giao hàng</span>
                      <span className="font-semibold text-emerald-600">
                        {verifiedOrder.shippingFee && verifiedOrder.shippingFee > 0
                          ? `${verifiedOrder.shippingFee.toLocaleString('vi-VN')}đ`
                          : 'Miễn phí'}
                      </span>
                    </div>

                    {verifiedOrder.discountAmount && verifiedOrder.discountAmount > 0 ? (
                      <div className="flex justify-between text-neutral-600">
                        <span>Giảm giá khuyến mãi</span>
                        <span className="font-semibold text-rose-600">
                          -{verifiedOrder.discountAmount.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ) : null}

                    <div className="pt-3 border-t border-neutral-100 flex items-baseline justify-between">
                      <span className="font-bold text-neutral-900 text-sm">Tổng thanh toán</span>
                      <span className="text-xl sm:text-2xl font-extrabold text-neutral-900">
                        {verifiedOrder.totalAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
