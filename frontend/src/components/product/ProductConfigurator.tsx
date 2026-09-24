import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingCart, Zap, Gift, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { formatPurchasePrice } from '@/data';
import type { ProductVariant, PurchaseProduct } from '@/types/product';
import { CrossSellSection } from './CrossSellSection';

interface ProductConfiguratorProps {
  product: PurchaseProduct;
  selectedColorId: string;
  selectedStorageId: string;
  selectedVariant?: ProductVariant;
  quantity: number;
  maxQuantity: number;
  onColorChange: (colorId: string) => void;
  onStorageChange: (storageId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onPurchase: (action: 'cart' | 'buy-now') => void;
}

export function ProductConfigurator({
  product,
  selectedColorId,
  selectedStorageId,
  selectedVariant,
  quantity,
  maxQuantity,
  onColorChange,
  onStorageChange,
  onQuantityChange,
  onPurchase,
}: ProductConfiguratorProps) {
  const selectedColor = product.colors.find((color) => color.id === selectedColorId);
  const stock = selectedVariant ? selectedVariant.stock : 0;
  const isAvailable = stock > 0;

  let stockStatusLabel = 'Hết hàng';
  let stockStatusColor = 'text-red-600 bg-red-50';
  if (stock > 5) {
    stockStatusLabel = 'Còn hàng';
    stockStatusColor = 'text-green-700 bg-green-50';
  } else if (stock > 0 && stock <= 5) {
    stockStatusLabel = 'Sắp hết';
    stockStatusColor = 'text-orange-600 bg-orange-50';
  }

  const getStorageVariant = (storageId: string) => (
    product.variants.find((variant) => (
      variant.colorId === selectedColorId && variant.storageId === storageId
    ))
  );

  return (
    <section aria-label="Cấu hình sản phẩm" className="w-full">
      <header className="border-b border-neutral-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950 leading-tight">
          {product.name}
        </h1>
        {product.reviewCount ? (
          <div 
            className="mt-2 flex items-center gap-3 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="flex items-center text-yellow-500">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i} className={i < Math.round(product.ratingAverage || 0) ? 'text-yellow-500' : 'text-neutral-300'}>★</span>
              ))}
            </div>
            <span className="font-medium text-neutral-700">{product.ratingAverage}</span>
            <span className="text-neutral-500">({product.reviewCount} lượt đánh giá)</span>
          </div>
        ) : (
          <div 
            className="mt-2 flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity text-neutral-500"
            onClick={() => document.getElementById('product-reviews-section')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="text-neutral-300">☆</span>
            <span>Chưa có đánh giá</span>
          </div>
        )}

        <div className="mt-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedVariant?.id ?? 'unavailable'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-3xl font-bold tracking-tight text-red-600">
                {selectedVariant ? formatPurchasePrice(selectedVariant.price) : 'Chưa có cấu hình'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </header>

      <fieldset className="border-b border-neutral-200 py-6">
        <legend className="text-sm font-semibold text-neutral-950">
          Dung lượng: <span className="font-normal ml-1">{product.storageOptions.find(s => s.id === selectedStorageId)?.label}</span>
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {product.storageOptions.map((storage) => {
            const storageVariant = getStorageVariant(storage.id);
            const isSelected = storage.id === selectedStorageId;
            const isUnavailable = !storageVariant;

            return (
              <button
                key={storage.id}
                type="button"
                disabled={isUnavailable}
                aria-pressed={isSelected}
                onClick={() => onStorageChange(storage.id)}
                className={'rounded-xl border p-2 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' + (
                  isSelected
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                ) + (isUnavailable ? ' cursor-not-allowed opacity-40' : ' cursor-pointer')}
              >
                <span className="block text-sm font-bold">{storage.label}</span>
                <span className={'mt-0.5 block text-[11px] ' + (isSelected ? 'text-red-600 font-medium' : 'text-neutral-500')}>
                  {storageVariant ? formatPurchasePrice(storageVariant.price) : 'Không khả dụng'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-b border-neutral-200 py-6">
        <legend className="flex w-full items-center justify-between text-sm font-semibold text-neutral-950">
          <span>Màu sắc: <span className="font-normal ml-1">{selectedColor?.name}</span></span>
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {product.colors.map((color) => {
            const isSelected = color.id === selectedColorId;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorChange(color.id)}
                aria-label={'Chọn màu ' + color.name}
                aria-pressed={isSelected}
                className={'flex flex-row items-center justify-between pl-3 pr-3 h-16 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ' + (
                  isSelected
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                )}
              >
                {/* Ảnh thiết bị bên trái */}
                <div className="h-full w-12 flex items-center justify-center shrink-0 p-0.5">
                  {color.images && color.images[0] ? (
                    <img src={color.images[0]} alt={color.name} className="h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="text-[10px] text-neutral-400">No Image</div>
                  )}
                </div>

                {/* Hình tròn màu và tên bên phải */}
                <div className="flex-1 flex flex-col items-center justify-center ml-2 pl-1 relative z-10">
                  <div
                    className={'h-6 w-6 rounded-full border shadow-sm mb-1.5 shrink-0 ' + (isSelected ? 'border-red-200' : 'border-neutral-200')}
                    style={{ backgroundColor: color.hex }}
                  />
                  <span className="text-[11px] font-medium text-center whitespace-nowrap leading-tight">{color.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Promotion Demo Section */}
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 overflow-hidden">
        <div className="bg-red-100/80 px-4 py-2.5 border-b border-red-200 flex items-center gap-2">
          <Gift className="w-4 h-4 text-red-600" />
          <span className="text-sm font-bold text-red-700 uppercase">Khuyến mãi đặc biệt</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold mt-0.5">1</span>
            <span>Giảm ngay 2.000.000đ khi thanh toán online qua thẻ tín dụng.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold mt-0.5">2</span>
            <span>Thu cũ đổi mới trợ giá lên đến 3.000.000đ.</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-neutral-700">
            <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold mt-0.5">3</span>
            <span>Trả góp 0% lãi suất đến 24 tháng qua thẻ tín dụng.</span>
          </div>
          <button className="text-sm text-blue-600 font-medium hover:underline mt-1">Xem chi tiết chương trình →</button>
        </div>
      </div>

      <section className="mt-6 py-6 border-t border-neutral-200" aria-label="Tùy chọn mua hàng">
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${stockStatusColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {stockStatusLabel} {isAvailable && <span className="font-normal opacity-80">({stock} sản phẩm)</span>}
          </span>

          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white p-1">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !isAvailable}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity || !isAvailable}
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => onPurchase('cart')}
            className="flex flex-col items-center justify-center min-h-[3.5rem] rounded-xl border-2 border-red-600 bg-white text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:border-neutral-300 disabled:text-neutral-400 disabled:bg-neutral-100"
          >
            <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Thêm vào giỏ</span>
          </button>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => onPurchase('buy-now')}
            className="flex flex-col items-center justify-center min-h-[3.5rem] rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:bg-neutral-300 disabled:text-neutral-500 shadow-sm shadow-red-200"
          >
            <span className="flex items-center gap-2 uppercase">Mua ngay</span>
            <span className="text-[10px] font-normal opacity-90 hidden sm:block">Giao tận nơi hoặc nhận tại cửa hàng</span>
          </button>
        </div>
      </section>

      {/* Shipping Information */}
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 w-5 h-5 text-blue-600 shrink-0" />
          <div className="flex-1">
            <h3 className="text-[13px] font-bold text-neutral-900 uppercase">Thông tin vận chuyển</h3>
            <p className="mt-1 text-sm font-medium text-neutral-700">Giao hàng tại <span className="font-bold">Hồ Chí Minh</span></p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100/50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
              <Zap className="w-3.5 h-3.5 fill-current" />
              Giao nhanh trong vòng 2 giờ
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-neutral-200 pt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Nhận hàng tại cửa hàng
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Theo dõi trạng thái đơn hàng
          </div>
        </div>
      </div>

      {/* Benefits Demo Section */}
      <div className="mt-4 grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span className="leading-tight">Cam kết chính hãng 100%</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
          <span className="leading-tight">Bảo hành 12 tháng</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <RotateCcw className="w-5 h-5 text-green-600 shrink-0" />
          <span className="leading-tight">1 đổi 1 trong 30 ngày</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <Truck className="w-5 h-5 text-green-600 shrink-0" />
          <span className="leading-tight">Giao hàng siêu tốc 2h</span>
        </div>
      </div>

      <CrossSellSection
        currentProductId={product.id}
        brand={product.brand}
        categoryId={product.categoryId}
      />

    </section>
  );
}