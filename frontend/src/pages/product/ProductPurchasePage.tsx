import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductConfigurator, ProductGallery, ProductSpecifications } from './components';
import { getPurchaseProductBySlug } from './data';
import type { ProductVariant } from './types';
import { useCartStore } from '../../store/useCartStore';
import './product-purchase.css';


export function ProductPurchasePage() {
  const { slug } = useParams<{ slug: string }>();
  const product = useMemo(() => getPurchaseProductBySlug(slug), [slug]);
  const navigate = useNavigate();
  const addCartItem = useCartStore((state) => state.addItem);
  const initialVariant = product?.variants.find((variant) => variant.stock > 0) ?? product?.variants[0];
  const catalogHref = product?.category === 'tablet'
    ? product.brand === 'iPad'
      ? '/tablet/apple#tablet-all-products'
      : product.brand === 'Galaxy Tab'
        ? '/tablet/samsung#tablet-all-products'
        : '/tablet/xiaomi#tablet-all-products'
    : product?.brand === 'Apple'
      ? '/iphone#iphone-all-products'
      : product?.brand === 'Xiaomi'
        ? '/xiaomi#xiaomi-all-products'
        : product?.brand === 'OPPO'
          ? '/oppo#oppo-all-products'
          : '/samsung#samsung-all-products';

  const [selectedColorId, setSelectedColorId] = useState(initialVariant?.colorId ?? '');
  const [selectedStorageId, setSelectedStorageId] = useState(initialVariant?.storageId ?? '');
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = useMemo<ProductVariant | undefined>(() => (
    product?.variants.find((variant) => (
      variant.colorId === selectedColorId && variant.storageId === selectedStorageId
    ))
  ), [product, selectedColorId, selectedStorageId]);

  const galleryImages = useMemo(() => {
    if (!product) return [];

    const selectedColor = product.colors.find((color) => color.id === selectedColorId);
    return selectedVariant?.images ?? selectedColor?.images ?? product.galleryImages ?? [product.defaultImage];
  }, [product, selectedColorId, selectedVariant]);

  useEffect(() => {
    if (!product) {
      document.title = 'Sản phẩm không khả dụng';
      return;
    }

    const defaultVariant = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
    setSelectedColorId(defaultVariant?.colorId ?? '');
    setSelectedStorageId(defaultVariant?.storageId ?? '');
    setQuantity(1);
    document.title = product.name + ' | Cửa Hàng Công Nghệ';
    window.scrollTo(0, 0);
  }, [product]);

  useEffect(() => {
    const allowedQuantity = Math.max(1, Math.min(selectedVariant?.stock ?? 1, 5));
    setQuantity((currentQuantity) => Math.min(Math.max(currentQuantity, 1), allowedQuantity));
  }, [selectedVariant?.id, selectedVariant?.stock]);

  const handlePurchase = (action: 'cart' | 'buy-now') => {
    if (!product || !selectedVariant || selectedVariant.stock === 0) return;

    const selectedColor = product.colors.find((color) => color.id === selectedColorId);
    const selectedStorage = product.storageOptions.find((storage) => storage.id === selectedStorageId);

    addCartItem({
      productId: product.id,
      productSlug: product.slug,
      brand: product.brand,
      name: product.name,
      image: galleryImages[0] ?? product.defaultImage,
      variantId: selectedVariant.id,
      sku: selectedVariant.sku,
      colorName: selectedColor?.name ?? '',
      storageLabel: selectedStorage?.label ?? '',
      price: selectedVariant.price,
      originalPrice: selectedVariant.originalPrice,
      stock: selectedVariant.stock,
      quantity,
    });

    navigate(action === 'buy-now' ? '/cart?checkout=1' : '/cart');
  };
  if (!product) {
    return (
      <main className="product-purchase-page min-h-[100svh] bg-white px-4 pb-20 pt-28 text-neutral-950 sm:px-6">
        <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-[#f6f7f9] p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">Samsung</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Sản phẩm chưa khả dụng</h1>
          <p className="mt-3 text-neutral-600">
            Sản phẩm này chưa có dữ liệu cấu hình để mua trực tuyến.
          </p>
          <Link
            to={catalogHref}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại sản phẩm Samsung
          </Link>
        </section>
      </main>
    );
  }

  const maxQuantity = Math.max(1, Math.min(selectedVariant?.stock ?? 1, 5));

  return (
    <main className="product-purchase-page min-h-screen bg-white pb-20 pt-20 text-neutral-950 sm:pt-24">
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <Link
          to={catalogHref}
          className="inline-flex items-center gap-2 rounded-full px-1 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {product.category === 'tablet' ? product.brand : 'Galaxy'}
        </Link>

        <div className="mt-7 grid items-start gap-12 lg:mt-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(400px,0.82fr)] lg:gap-16 xl:gap-20">
          <div className="min-w-0">
            <ProductGallery
              images={galleryImages}
              productName={product.name}
            />
            <ProductSpecifications
              productName={product.name}
              specifications={product.specifications}
            />
          </div>

          <ProductConfigurator
            product={product}
            selectedColorId={selectedColorId}
            selectedStorageId={selectedStorageId}
            selectedVariant={selectedVariant}
            quantity={quantity}
            maxQuantity={maxQuantity}
            onColorChange={setSelectedColorId}
            onStorageChange={setSelectedStorageId}
            onQuantityChange={setQuantity}
            onPurchase={handlePurchase}
          />
        </div>
      </div>
    </main>
  );
}

export default ProductPurchasePage;