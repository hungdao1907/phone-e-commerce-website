import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
  brand?: string;
}

export function RelatedProducts({ currentProductId, categoryId, brand }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
        if (res.ok) {
          const data = await res.json();
          
          // Filter to only products in the same category (or parent category)
          const sameCategoryProducts = data.filter((p: any) => 
            p.id !== currentProductId &&
            p.status === 'active' &&
            (p.categoryId === categoryId || p.category?.parent?.id === categoryId || p.category?.slug === categoryId || (p.category && categoryId && p.category.slug.includes(categoryId)))
          );

          // Priority 1: Same category, SAME brand
          const sameBrand = sameCategoryProducts.filter((p: any) => p.brand === brand);
          
          // Priority 2: Same category, OTHER brands
          const otherBrands = sameCategoryProducts.filter((p: any) => p.brand !== brand);

          // Combine them, taking same brand first
          let combined = [...sameBrand];
          
          // If less than 4 same brand products, fill with other brands
          if (combined.length < 4) {
            const need = 4 - combined.length;
            combined = [...combined, ...otherBrands.slice(0, need)];
          }

          setProducts(combined.slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (categoryId) {
      fetchRelated();
    } else {
      setLoading(false);
    }
  }, [currentProductId, categoryId, brand]);

  if (loading || products.length === 0) return null;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 uppercase">Sản phẩm liên quan</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map((p) => {
          const defaultVariant = p.variants?.[0];
          const price = defaultVariant?.salePrice || defaultVariant?.price || p.price || 0;
          const imgUrl = p.image || 'https://via.placeholder.com/150';
          const resolvedImg = imgUrl.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${imgUrl}` : imgUrl;
          
          return (
            <Link 
              key={p.id} 
              to={`/product/${p.slug || p.id}`}
              className="border border-neutral-100 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
            >
              <div className="aspect-square bg-neutral-50 rounded-lg mb-3 flex items-center justify-center p-4 relative">
                <img 
                  src={resolvedImg} 
                  alt={p.name} 
                  className="object-contain h-full w-full group-hover:scale-105 transition-transform duration-300 mix-blend-multiply" 
                />
                {p.activeCampaign && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                    -{p.activeCampaign.discountType === 'percentage' ? p.activeCampaign.discountValue + '%' : 'Giảm sốc'}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{p.name}</h3>
              <p className="text-red-600 font-bold text-sm mt-auto">
                {price.toLocaleString('vi-VN')} ₫
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
