import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export function CartRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Find accessory products or any products to recommend
          const accessories = data.filter(p => p.categorySlug === 'phu-kien' || p.categorySlug === 'accessories');
          // If no accessories, just don't show any, or we can just leave it empty
          setRecommendations(accessories.slice(0, 2));
        }
      })
      .catch(console.error);
  }, []);

  if (recommendations.length === 0) {
    return null; // Leave empty if no recommendations
  }

  return (
    <div className="py-5 px-5 border-b border-neutral-200/60 bg-neutral-50/50">
      <h4 className="text-sm font-bold text-neutral-900 mb-3">Có thể bạn sẽ cần</h4>
      <div className="flex flex-col gap-3">
        {recommendations.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/60">
            <Link to={`/product/${item.slug}`} className="w-12 h-12 rounded-lg bg-[#f5f7fb] overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.slug}`} className="text-xs font-bold text-neutral-900 truncate hover:text-blue-600 transition-colors block">{item.name}</Link>
              <p className="text-xs font-semibold text-neutral-500">{item.price?.toLocaleString('vi-VN')}đ</p>
            </div>
            <Link to={`/product/${item.slug}`} className="h-8 px-3 flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-lg text-xs font-bold transition-colors shrink-0">
              <Plus className="w-3 h-3" />
              Xem
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
