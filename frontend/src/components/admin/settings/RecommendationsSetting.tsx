import React, { useState, useEffect } from 'react';
import { PackageSearch, Trash2, Pin } from 'lucide-react';

export function RecommendationsSetting() {
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const accessories = data.filter(p => p.categorySlug === 'phu-kien' || p.categorySlug === 'accessories');
          setRecommendations(accessories.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  const [isAdding, setIsAdding] = useState(false);

  const removeRec = (id: string) => {
    if(confirm('Gỡ sản phẩm này khỏi danh sách gợi ý?')) {
      setRecommendations(recommendations.filter(r => r.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sản phẩm Gợi ý (Recommendations)</h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình các sản phẩm được ghim để tự động gợi ý (Upsell/Cross-sell) trong Giỏ hàng.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <PackageSearch className="w-4 h-4" /> Chọn sản phẩm ghim
        </button>
      </div>

      {isAdding && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 flex items-center justify-center">
          <p className="text-slate-500 text-sm italic">Trong hệ thống thực tế, đây sẽ là một thanh tìm kiếm (Search Bar) hoặc dropdown để chọn sản phẩm từ Database.</p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-400 text-sm italic shadow-sm">
          Chưa có sản phẩm gợi ý nào. Hãy cập nhật thêm phụ kiện vào hệ thống.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center relative group hover:border-slate-300 transition-colors">
              <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-200">
                <Pin className="w-4 h-4" />
              </div>
              
              <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-xl p-2 mb-4">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>
              
              <h3 className="text-sm font-bold text-slate-900 mb-1">{item.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{item.category?.name || 'Phụ kiện'}</p>
              <p className="text-base font-bold text-emerald-600 mb-5">{item.price?.toLocaleString('vi-VN')}đ</p>
              
              <button 
                onClick={() => removeRec(item.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Gỡ ghim
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
