import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import { CheckoutProgress } from '../../components/checkout/CheckoutProgress';

export function OrderSuccessPage() {
  const location = useLocation();
  const orderId = location.state?.orderId;

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] py-8 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-[800px] mx-auto">
        <CheckoutProgress currentStep="complete" />

        <div className="mt-12 bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200/60 shadow-sm text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-3">
            Đặt hàng thành công!
          </h1>
          <p className="text-neutral-500 max-w-md mx-auto mb-8 leading-relaxed">
            Cảm ơn bạn đã mua sắm tại cửa hàng. Đơn hàng của bạn đã được ghi nhận và đang trong quá trình xử lý.
          </p>

          <div className="inline-flex items-center justify-center gap-3 bg-neutral-50 border border-neutral-200 px-6 py-3 rounded-2xl mb-10">
            <Package className="w-5 h-5 text-neutral-400" />
            <div className="text-left">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-0.5">Mã đơn hàng</p>
              <p className="text-sm font-mono font-bold text-neutral-900">{orderId}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={`/profile/orders/${orderId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 bg-black text-white font-bold rounded-full hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
            >
              Xem chi tiết đơn hàng <ChevronRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 bg-white border-2 border-neutral-200 text-neutral-900 font-bold rounded-full hover:border-black transition-colors active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
