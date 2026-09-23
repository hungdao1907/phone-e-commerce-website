import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductConfigurator, ProductGallery, ProductSpecifications, ProductDescription } from '@/components/product';
import { CrossSellSection } from '@/components/product/CrossSellSection';
import { ProductReviews } from '@/components/product/ProductReviews';
import type { ProductVariant } from '@/types/product';
import { useCartStore } from '../../store/useCartStore';
import { useAppStore } from '../../store/useAppStore';
import { SMARTPHONE_PRODUCTS } from '../smartphone/data/mockSmartphoneProducts';

export function ProductPurchasePage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const addCartItem = useCartStore((state) => state.addItem);
  const { setCartDrawerOpen } = useAppStore();

  useEffect(() => {
    if (!slug) return;
    const fetchProduct = async () => {
      try {
        let dbProduct = null;
        
        // Check if slug is a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        
        if (isUUID) {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${slug}`);
          if (res.ok) dbProduct = await res.json();
        } else {
          // It's a mock product slug!
          const mockProduct = SMARTPHONE_PRODUCTS.find(p => p.slug === slug || p.id === slug);
          if (mockProduct) {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/sync-mock`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(mockProduct)
            });
            if (res.ok) dbProduct = await res.json();
          } else {
            // Try fetching by ID anyway just in case
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${slug}`);
            if (res.ok) dbProduct = await res.json();
          }
        }

        if (dbProduct) {
          
          const uniqueColors = new Map();
          dbProduct.variants?.forEach((v: any) => {
            const colorName = v.attributes?.['Màu sắc'] || 'Màu mặc định';
            if (!uniqueColors.has(colorName)) {
              uniqueColors.set(colorName, {
                id: `color-${colorName}`,
                name: colorName,
                hex: v.colorCode ? (v.colorCode.startsWith('#') ? v.colorCode : `#${v.colorCode}`) : '#CCCCCC',
                images: (v.image ? [v.image] : [dbProduct.image]).filter(Boolean).map((img: string) => img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img)
              });
            }
          });
          const colors = Array.from(uniqueColors.values());
          if (colors.length === 0) colors.push({ id: 'default-color', name: 'Mặc định', hex: '#CCCCCC', images: [dbProduct.image].filter(Boolean).map((img: string) => img.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${img}` : img) });

          const uniqueStorages = new Map();
          dbProduct.variants?.forEach((v: any) => {
            const storageLabel = v.attributes?.['Dung lượng'] || 'Tiêu chuẩn';
            if (!uniqueStorages.has(storageLabel)) {
              const basePrice = v.price || dbProduct.price || 0;
              uniqueStorages.set(storageLabel, {
                id: `storage-${storageLabel}`,
                label: storageLabel,
                price: basePrice,
                originalPrice: basePrice,
                stockByColor: colors.map(() => v.stock || 0)
              });
            }
          });
          let storageOptions = Array.from(uniqueStorages.values());
          if (storageOptions.length === 0) {
            const basePrice = dbProduct.price || 0;
            storageOptions = [{ id: 'default-storage', label: 'Tiêu chuẩn', price: basePrice, originalPrice: basePrice, stockByColor: colors.map(() => 0) }];
          }

          const variants = dbProduct.variants?.map((v: any) => {
            const colorName = v.attributes?.['Màu sắc'] || 'Màu mặc định';
            const storageLabel = v.attributes?.['Dung lượng'] || 'Tiêu chuẩn';
            const basePrice = v.price || dbProduct.price || 0;
            return {
              id: v.id,
              sku: v.sku || dbProduct.id,
              colorId: `color-${colorName}`,
              storageId: `storage-${storageLabel}`,
              price: basePrice,
              originalPrice: basePrice,
              stock: v.stock || 0
            };
          }) || [];

          if (variants.length === 0) {
            const basePrice = dbProduct.price || 0;
            variants.push({ id: 'default-variant', sku: dbProduct.id, colorId: colors[0].id, storageId: storageOptions[0].id, price: basePrice, originalPrice: basePrice, stock: 0 });
          }
          
          let parsedSpecs = [];
          if (Array.isArray(dbProduct.specifications)) {
            parsedSpecs = dbProduct.specifications.map((s: any) => ({
              label: s.name || s.label || 'Thông tin',
              value: s.value || 'N/A'
            }));
          }

          const resolveImageUrl = (url: string) => {
            if (!url) return undefined;
            if (url.startsWith('/uploads')) return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${url}`;
            return url;
          };

          const mappedProduct = {
            id: dbProduct.id,
            slug: dbProduct.id,
            brand: dbProduct.category?.name || 'Samsung',
            parentCategoryName: dbProduct.category?.parent?.name,
            parentCategorySlug: dbProduct.category?.parent?.slug,
            categoryName: dbProduct.category?.name,
            categorySlug: dbProduct.category?.slug,
            name: dbProduct.name,
            tagline: dbProduct.description || 'Sản phẩm chính hãng',
            description: dbProduct.description,
            badge: 'Mới',
            defaultImage: resolveImageUrl(dbProduct.image) || 'https://via.placeholder.com/300',
            galleryImages: [dbProduct.image, ...(dbProduct.images || [])].filter(Boolean).map(resolveImageUrl),
            colors,
            storageOptions,
            specifications: parsedSpecs.length > 0 ? parsedSpecs : [{ label: 'Đang cập nhật', value: 'Chưa có thông số' }],
            variants
          };
          setProduct(mappedProduct);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const initialVariant = product?.variants?.[0];
  const catalogHref = '/samsung#samsung-all-products';

  const [selectedColorId, setSelectedColorId] = useState('');
  const [selectedStorageId, setSelectedStorageId] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (initialVariant) {
      setSelectedColorId(initialVariant.colorId);
      setSelectedStorageId(initialVariant.storageId);
    }
  }, [initialVariant]);

  const selectedVariant = useMemo<ProductVariant | undefined>(() => (
    product?.variants?.find((variant: any) => (
      variant.colorId === selectedColorId && variant.storageId === selectedStorageId
    ))
  ), [product, selectedColorId, selectedStorageId]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const selectedColor = product.colors.find((c: any) => c.id === selectedColorId);
    if (selectedColor && selectedColor.images && selectedColor.images.length > 0) {
      const allImages = [...selectedColor.images, ...(product.galleryImages ?? [product.defaultImage])];
      return Array.from(new Set(allImages));
    }
    return product.galleryImages ?? [product.defaultImage];
  }, [product, selectedColorId]);

  useEffect(() => {
    if (!product) {
      document.title = 'Sản phẩm không khả dụng';
      return;
    }

    const defaultVariant = product.variants.find((variant: any) => variant.stock > 0) ?? product.variants[0];
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

    const selectedColor = product.colors.find((color: any) => color.id === selectedColorId);
    const selectedStorage = product.storageOptions.find((storage: any) => storage.id === selectedStorageId);

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

    if (action === 'buy-now') {
      navigate('/checkout');
    } else {
      setCartDrawerOpen(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-neutral-200 border-t-[#22c55e] rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="product-purchase-page min-h-[100svh] bg-white px-4 pb-20 pt-28 text-neutral-950 sm:px-6">
        <section className="mx-auto max-w-xl rounded-3xl border border-neutral-200 bg-[#f6f7f9] p-8 text-center sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">AppleWeb</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Sản phẩm chưa khả dụng</h1>
          <p className="mt-3 text-neutral-600">
            Sản phẩm này chưa có dữ liệu cấu hình để mua trực tuyến.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại cửa hàng
          </Link>
        </section>
      </main>
    );
  }

  const maxQuantity = Math.max(1, Math.min(selectedVariant?.stock ?? 1, 5));

  // Helper to map DB slugs to frontend routes
  const getMappedSlug = (slug?: string) => {
    if (!slug) return '';
    const normalized = slug.toLowerCase();
    if (normalized === 'dien-thoai' || normalized === 'ien-thoai') return 'phone';
    if (normalized === 'may-tinh-bang') return 'tablet';
    if (normalized === 'dong-ho') return 'watch';
    if (normalized === 'macbook' || normalized === 'mac') return 'laptop';
    return normalized;
  };

  const parentSlug = getMappedSlug(product.parentCategorySlug);
  const childSlug = getMappedSlug(product.categorySlug);

  return (
    <main className="product-purchase-page min-h-screen bg-neutral-50/50 pb-20 pt-6 text-neutral-950 sm:pt-8">
      <div className="mx-auto w-full max-w-[1300px] px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-neutral-500 mb-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide font-medium">
          <Link to="/" className="hover:text-[#22c55e] transition-colors">Trang chủ</Link>
          {product.parentCategoryName && (
            <>
              <span className="text-neutral-300">/</span>
              {/* No generic parent category page, so we just show it as text */}
              <span className="text-neutral-500">{product.parentCategoryName}</span>
            </>
          )}
          {product.categoryName && (
            <>
              <span className="text-neutral-300">/</span>
              {parentSlug ? (
                <Link to={`/${parentSlug}/${childSlug}`} className="hover:text-[#22c55e] transition-colors">{product.categoryName}</Link>
              ) : (
                <span className="text-neutral-500">{product.categoryName}</span>
              )}
            </>
          )}
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900 truncate">{product.name}</span>
        </nav>

        {/* HERO SECTION */}
        <div className="grid items-start gap-8 lg:grid-cols-[60%_40%] lg:gap-12 mb-12">
          {/* LEFT COLUMN: Gallery & Details */}
          <div className="min-w-0 flex flex-col gap-8">
            <ProductGallery
              productId={product.id}
              images={galleryImages}
              productName={product.name}
            />
            
            {/* Description */}
            <ProductDescription description={product.description} />
            
            {/* Specifications */}
            <ProductSpecifications
              productName={product.name}
              specifications={product.specifications}
            />
          </div>

          {/* RIGHT COLUMN: Configurator & Purchase */}
          <div className="lg:sticky lg:top-24 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
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
        
        {/* FULL WIDTH SECTIONS */}
        <div className="flex flex-col gap-8 w-full mx-auto mt-4">
          
          {/* Reviews Section */}
          <ProductReviews />
          
          {/* Related Products Demo */}
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
            <h2 className="text-xl font-bold text-neutral-900 mb-6 uppercase">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="aspect-square bg-neutral-50 rounded-lg mb-3 flex items-center justify-center p-4">
                    <img src={galleryImages[0] || 'https://via.placeholder.com/150'} alt="Related" className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{product.name}</h3>
                  <p className="text-red-600 font-bold text-sm">20.000.000 ₫</p>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </main>
  );
}

export default ProductPurchasePage;