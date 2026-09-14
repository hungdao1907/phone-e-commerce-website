import { Zap, ShoppingBag, Plus, Minus, Info } from 'lucide-react';
import type { PurchaseProduct, ProductVariant } from '@/types/product/productPurchase';

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

const formatPurchasePrice = (price: number) => {
  return price.toLocaleString('vi-VN') + 'đ';
};

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
  const isAvailable = Boolean(selectedVariant && selectedVariant.stock > 0);
  const total = (selectedVariant?.price ?? 0) * quantity;

  const getStorageVariant = (storageId: string) => {
    return product.variants.find(
      (v) => v.colorId === selectedColorId && v.storageId === storageId
    );
  };

  return (
    <section className="sticky top-24 min-w-0" aria-label="Tùy chọn cấu hình">
      <div className="border-b border-neutral-200 pb-8">
        {product.badge && (
          <span className="mb-4 inline-block rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-800">
            {product.badge}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">{product.name}</h1>
        <p className="mt-3 text-lg text-neutral-600">{product.tagline}</p>
        <div className="mt-6 flex items-center gap-4 text-sm font-medium text-neutral-950">
          <span className="flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1">
            <Info className="h-4 w-4 text-neutral-500" />
            Bảo hành {product.brand} chính hãng
          </span>
        </div>
      </div>

      <fieldset className="border-b border-neutral-200 py-8">
        <legend className="flex w-full items-baseline justify-between text-sm">
          <span>Màu sắc</span>
          <span className="font-medium text-neutral-500">{selectedColor?.name}</span>
        </legend>
        <div className="mt-5 flex flex-wrap gap-3">
          {product.colors.map((color) => {
            const isSelected = color.id === selectedColorId;

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onColorChange(color.id)}
                aria-label={'Chọn màu ' + color.name}
                aria-pressed={isSelected}
                className={'flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ' + (
                  isSelected
                    ? 'border-neutral-950 bg-white ring-2 ring-neutral-950 ring-offset-2'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                )}
              >
                <span className="h-7 w-7 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color.hex }} />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="border-b border-neutral-200 py-8">
        <legend className="text-sm font-semibold text-neutral-950">Dung lượng</legend>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {product.storageOptions.map((storage) => {
            const storageVariant = getStorageVariant(storage.id);
            const isSelected = storage.id === selectedStorageId;
            const isUnavailable = !storageVariant || storageVariant.stock === 0;

            return (
              <button
                key={storage.id}
                type="button"
                disabled={isUnavailable}
                aria-pressed={isSelected}
                onClick={() => onStorageChange(storage.id)}
                className={'rounded-2xl border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ' + (
                  isSelected
                    ? 'border-neutral-950 bg-neutral-950 text-white'
                    : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400'
                ) + (isUnavailable ? ' cursor-not-allowed opacity-40' : ' cursor-pointer')}
              >
                <span className="block text-sm font-semibold">{storage.label}</span>
                <span className={'mt-1 block text-xs ' + (isSelected ? 'text-white/65' : 'text-neutral-500')}>
                  {storageVariant ? (
                    <>
                      {storageVariant.originalPrice && storageVariant.originalPrice > storageVariant.price && (
                        <span className="line-through opacity-70 mr-2 text-[10px]">{formatPurchasePrice(storageVariant.originalPrice)}</span>
                      )}
                      {formatPurchasePrice(storageVariant.price)}
                    </>
                  ) : 'Không khả dụng'}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <section className="border-b border-neutral-200 py-8" aria-label="Số lượng">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Số lượng</h2>
            <p className="mt-1 text-xs text-neutral-500">Tối đa {maxQuantity} sản phẩm trong cấu hình này.</p>
          </div>
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1">
            <button
              type="button"
              aria-label="Giảm số lượng"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || !isAvailable}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums text-neutral-950" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity || !isAvailable}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl bg-[#f6f7f9] p-5 sm:p-6" aria-label="Tóm tắt cấu hình">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Cấu hình của bạn</p>
        <div className="mt-4 flex items-start justify-between gap-5">
          <div>
            <p className="font-semibold text-neutral-950">{product.name}</p>
            <p className="mt-1 text-sm text-neutral-600">
              {selectedColor?.name} · {product.storageOptions.find((storage) => storage.id === selectedStorageId)?.label}
            </p>
            <p className="mt-1 text-sm text-neutral-600">Số lượng: {quantity}</p>
          </div>
          <div className="shrink-0 text-right">
            {selectedVariant && selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price && (
              <p className="text-sm line-through text-neutral-400 font-medium">
                {formatPurchasePrice(selectedVariant.originalPrice * quantity)}
              </p>
            )}
            <p className="text-lg font-bold tracking-tight text-red-600">
              {selectedVariant ? formatPurchasePrice(total) : '—'}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onPurchase('cart')}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-black hover:shadow-lg disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        >
          <ShoppingBag className="h-4 w-4" />
          Thêm vào giỏ
        </button>
        <button
          type="button"
          disabled={!isAvailable}
          onClick={() => onPurchase('buy-now')}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-all duration-200 hover:border-neutral-950 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
        >
          <Zap className="h-4 w-4" />
          Mua ngay
        </button>
      </div>


      <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
        <span>Thông tin cấu hình minh bạch</span>
        <span>Hỗ trợ lựa chọn sản phẩm</span>
        <span>Thanh toán ở bước tiếp theo</span>
      </div>

    </section>
  );
}