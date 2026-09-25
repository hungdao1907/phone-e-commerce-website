import React, { useEffect, useState } from 'react';
import { Heart, Trash2, ShoppingCart } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/useWishlistStore';
import { Link } from 'react-router-dom';

export function WishlistTab() {
  const { token } = useAuthStore();
  const { syncWithBackend } = useWishlistStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error('Lỗi khi tải wishlist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [token]);

  const handleRemove = async (productId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(items.filter(item => item.productId !== productId));
        syncWithBackend(token);
      }
    } catch (error) {
      console.error('Lỗi khi xóa khỏi wishlist:', error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Đang tải...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-xl font-bold text-neutral-900 mb-6">Sản phẩm yêu thích</h2>
        <EmptyState 
          icon={Heart} 
          title="Chưa có sản phẩm yêu thích" 
          description="Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Khám phá ngay các sản phẩm nổi bật."
          actionLabel="Khám phá sản phẩm"
          onAction={() => window.location.href = '/'}
        />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getMappedSlug = (slug?: string) => {
    if (!slug) return '';
    const normalized = slug.toLowerCase();
    if (normalized === 'dien-thoai' || normalized === 'ien-thoai' || normalized === 'phone') return 'phone';
    if (normalized === 'may-tinh-bang' || normalized === 'tablet') return 'tablet';
    if (normalized === 'dong-ho' || normalized === 'watch') return 'watch';
    if (normalized === 'macbook' || normalized === 'mac' || normalized === 'laptop') return 'laptop';
    return normalized;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
        Sản phẩm yêu thích <span className="text-sm font-normal text-neutral-500">({items.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const product = item.product;
          if (!product) return null;
          
          const defaultVariant = product.variants?.[0];
          const price = defaultVariant?.price || 0;
          const originalPrice = defaultVariant?.salePrice; // fallback to salePrice logic
          const categorySlug = getMappedSlug(product.category?.slug);
          const productUrl = `/${categorySlug}/${product.id}`; // Default logic for store URL routing

          const imageUrl = product.image?.startsWith('/uploads') 
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${product.image}`
            : (product.image || 'https://via.placeholder.com/300');

          return (
            <div key={item.id} className="group relative bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-500/30 transition-all">
              <Link to={productUrl} className="block aspect-square bg-[#f5f5f7] relative overflow-hidden p-6">
                <img 
                  src={imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
              
              <div className="p-4">
                <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1 line-clamp-1">
                  {product.brand || product.category?.name || 'Sản phẩm'}
                </div>
                <Link to={productUrl} className="font-semibold text-neutral-900 line-clamp-2 hover:text-emerald-600 transition-colors h-10 mb-2">
                  {product.name}
                </Link>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold text-red-600">{formatPrice(price)}</span>
                  {originalPrice && originalPrice > price && (
                    <span className="text-xs text-neutral-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link 
                    to={productUrl}
                    className="flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-black text-white py-2 px-4 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Mua ngay
                  </Link>
                  <button 
                    onClick={() => handleRemove(product.id)}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
