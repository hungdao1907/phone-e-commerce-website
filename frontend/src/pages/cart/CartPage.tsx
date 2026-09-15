import { useState, useEffect } from 'react';
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/authStore';

const formatPurchasePrice = (price: number) => {
  return price.toLocaleString('vi-VN') + 'đ';
};

export function CartPage() {
  const [searchParams] = useSearchParams();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const checkoutRequested = searchParams.get('checkout') === '1';
  const [checkoutNotice, setCheckoutNotice] = useState(checkoutRequested);

  const { user, token } = useAuthStore();
  const [profileData, setProfileData] = useState<{address?: string, phone?: string}>({});

  useEffect(() => {
    if (checkoutNotice && token) {
      fetch('http://localhost:3001/api/customers/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProfileData(data))
      .catch(console.error);
    }
  }, [checkoutNotice, token]);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const originalSubtotal = items.reduce(
    (total, item) => total + (item.originalPrice ?? item.price) * item.quantity,
    0,
  );
  const savings = Math.max(0, originalSubtotal - subtotal);

  if (items.length === 0) {
    return (
      <main className="min-h-[70svh] bg-white px-4 pb-20 pt-28 text-neutral-950 sm:px-6 sm:pt-32">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-neutral-200 bg-[#f6f7f9] px-6 py-14 text-center sm:px-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-neutral-950 shadow-sm">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Giỏ hàng đang trống</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">
            Hãy chọn cấu hình phù hợp để thêm sản phẩm vào giỏ hàng.
          </p>
          <Link
            to="/phone/samsung#samsung-all-products"
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Khám phá cửa hàng
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-20 pt-24 text-neutral-950 sm:pt-28">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Cửa hàng</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Giỏ hàng</h1>
            <p className="mt-2 text-sm text-neutral-600">{itemCount} sản phẩm đã chọn</p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-sm font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-950 hover:underline"
          >
            Xóa toàn bộ
          </button>
        </div>

        {checkoutRequested ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Kiểm tra lại cấu hình trước khi chuyển sang bước thanh toán.
          </div>
        ) : null}

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
          <section aria-label="Sản phẩm trong giỏ" className="divide-y divide-neutral-200 border-y border-neutral-200">
            {items.map((item) => {
              const maximumQuantity = Math.max(1, Math.min(item.stock, 5));
              const lineTotal = item.price * item.quantity;

              return (
                <article key={item.id} className="grid grid-cols-[104px_minmax(0,1fr)] gap-5 py-6 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-7">
                  <Link
                    to={'/product/' + item.productSlug}
                    aria-label={'Xem ' + item.name}
                    className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#f5f7fb] p-3"
                  >
                    <img src={item.image} alt="" className="h-full w-full object-contain" />
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{item.brand}</p>
                        <Link
                          to={'/product/' + item.productSlug}
                          className="mt-1 block text-lg font-semibold tracking-tight text-neutral-950 transition-colors hover:text-neutral-600"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-1 text-sm text-neutral-600">{item.colorName} · {item.storageLabel}</p>
                      </div>
                      <button
                        type="button"
                        aria-label={'Xóa ' + item.name + ' khỏi giỏ hàng'}
                        onClick={() => removeItem(item.id)}
                        className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
                      <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1">
                        <button
                          type="button"
                          aria-label={'Giảm số lượng ' + item.name}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={'Tăng số lượng ' + item.name}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= maximumQuantity}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold tracking-tight text-neutral-950">{formatPurchasePrice(lineTotal)}</p>
                        {item.originalPrice ? (
                          <p className="mt-0.5 text-xs text-neutral-400 line-through">
                            {formatPurchasePrice(item.originalPrice * item.quantity)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="rounded-[1.5rem] border border-neutral-200 bg-[#f6f7f9] p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold tracking-tight">Tóm tắt đơn hàng</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 text-neutral-600">
                <dt>Tạm tính</dt>
                <dd className="font-medium text-neutral-950">{formatPurchasePrice(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 text-neutral-600">
                <dt>Vận chuyển</dt>
                <dd className="font-medium text-emerald-700">Miễn phí</dd>
              </div>
              {savings > 0 ? (
                <div className="flex items-center justify-between gap-4 text-neutral-600">
                  <dt>Tiết kiệm</dt>
                  <dd className="font-medium text-emerald-700">-{formatPurchasePrice(savings)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-5 border-t border-neutral-200 pt-5">
              <div className="flex items-end justify-between gap-4">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-bold tracking-tight">{formatPurchasePrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-right text-xs text-neutral-500">Đã bao gồm VAT</p>
            </div>

            <button
              type="button"
              onClick={() => setCheckoutNotice(true)}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              Tiếp tục thanh toán
            </button>
            {checkoutNotice ? (
              <div className="mt-4 p-4 border rounded-xl bg-white space-y-3">
                <h3 className="font-bold">Thông tin giao hàng</h3>
                <input 
                  type="text" 
                  defaultValue={profileData.address || ''}
                  placeholder="Địa chỉ giao hàng" 
                  className="w-full p-2 border rounded-md text-sm text-neutral-900 placeholder:text-neutral-400"
                  id="checkout-address"
                />
                <input 
                  type="text" 
                  defaultValue={profileData.phone || ''}
                  placeholder="Số điện thoại" 
                  className="w-full p-2 border rounded-md text-sm text-neutral-900 placeholder:text-neutral-400"
                  id="checkout-phone"
                />
                <button 
                  onClick={async () => {
                    const address = (document.getElementById('checkout-address') as HTMLInputElement).value;
                    const phone = (document.getElementById('checkout-phone') as HTMLInputElement).value;
                    if (!address || !phone) return alert('Vui lòng nhập đủ thông tin');
                    
                    if (!token || !user) {
                      alert('Vui lòng đăng nhập để thanh toán');
                      window.location.href = '/login';
                      return;
                    }

                    const orderPayload = {
                      customerId: user.id,
                      items: items.map(i => ({
                        productId: i.productId || i.id,
                        variantId: i.variantId || null,
                        quantity: i.quantity
                      })),
                      paymentMethod: 'COD',
                      shippingAddress: address,
                      shippingPhone: phone,
                      shippingFee: 0,
                      note: 'Đơn hàng từ Storefront',
                      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                    };

                    try {
                      const res = await fetch('http://localhost:3001/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(orderPayload)
                      });
                      if (res.ok) {
                        alert('Đặt hàng thành công!');
                        clearCart();
                        window.location.href = '/profile';
                      } else {
                        alert('Lỗi đặt hàng');
                      }
                    } catch (e) { console.error(e); }
                  }}
                  className="w-full bg-blue-600 text-white p-2 rounded-md font-bold text-sm hover:bg-blue-700"
                >Xác nhận Đặt Hàng</button>
              </div>
            ) : null}            <Link
              to="/phone/samsung#samsung-all-products"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition-colors hover:border-neutral-950"
            >
              Tiếp tục mua sắm
            </Link>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Giá và tồn kho sẽ được xác thực lại ở bước thanh toán.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default CartPage;