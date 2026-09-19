import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';

interface CrossSellSectionProps {
  currentProductId: string;
  brand?: string;
  categoryId?: string;
}

export function CrossSellSection({ currentProductId, brand, categoryId }: CrossSellSectionProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addCartItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
        if (res.ok) {
          const data = await res.json();
          // Filter by brand or category, excluding current product
          const related = data.filter((p: any) => 
            p.id !== currentProductId &&
            (p.brand === brand || p.categoryId === categoryId || p.category?.parent?.id === categoryId)
          ).slice(0, 4); // Limit to 4 items for 2x2 grid
          
          setProducts(related);
        }
      } catch (err) {
        console.error('Error fetching cross-sell products:', err);
      } finally {
        setLoading(false);
      }
    };
    if (brand || categoryId) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [currentProductId, brand, categoryId]);

  if (loading || products.length === 0) return null;

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Quick add default variant
    const defaultVariant = product.variants?.[0];
    const basePrice = defaultVariant?.price || product.price || 0;
    
    addCartItem({
      productId: product.id,
      productSlug: product.slug || product.id,
      brand: product.brand || '',
      name: product.name,
      image: product.image || 'https://via.placeholder.com/150',
      variantId: defaultVariant?.id || 'default',
      sku: defaultVariant?.sku || product.id,
      colorName: defaultVariant?.attributes?.['Màu sắc'] || 'Mặc định',
      storageLabel: defaultVariant?.attributes?.['Dung lượng'] || 'Tiêu chuẩn',
      price: basePrice,
      originalPrice: basePrice,
      stock: defaultVariant?.stock || 10,
      quantity: 1,
    });
    
    alert('Đã thêm ' + product.name + ' vào giỏ hàng!');
  };

  return (
    <section className="mt-6 pt-6 border-t border-neutral-200">
      <div className="mb-4">
        <h2 className="text-sm font-bold uppercase tracking-tight text-neutral-900">Mua Kèm Giá Sốc</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => {
          const price = p.variants?.[0]?.price || p.price || 0;
          return (
            <Link 
              key={p.id} 
              to={`/product/${p.slug || p.id}`}
              className="flex flex-col group border border-neutral-200 rounded-xl p-2 hover:border-blue-400 transition-all bg-white"
            >
              <div className="aspect-square bg-neutral-50 rounded-lg mb-2 p-2 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={p.image || 'https://via.placeholder.com/150'} 
                  alt={p.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {p.activeCampaign && (
                  <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                    -{p.activeCampaign.discountType === 'percentage' ? p.activeCampaign.discountValue + '%' : 'Giảm sốc'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-[11px] text-neutral-900 line-clamp-2 min-h-[32px] mb-1 group-hover:text-blue-600 transition-colors">
                {p.name}
              </h3>
              <p className="text-red-600 font-bold text-xs mb-2">
                {price.toLocaleString('vi-VN')} ₫
              </p>
              
              <div className="mt-auto">
                <button 
                  onClick={(e) => handleAddToCart(e, p)}
                  className="w-full flex items-center justify-center gap-1 rounded-lg bg-blue-50 border border-transparent px-2 py-1.5 text-[10px] font-bold text-blue-700 hover:border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Thêm
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
