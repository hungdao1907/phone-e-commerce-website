import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

const COLORS = ['#DDEB9D', '#ACD99C', '#E0CD39', '#15919B'];

export function TopProductsWidget() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/dashboard/top-products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(err => console.error('Failed to fetch top products:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const maxRevenue = products.length > 0 ? products[0].revenue : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5 }}
      className="bg-white border border-slate-200/80 shadow-sm rounded-2xl flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 border-b border-slate-100">
        <h3 className="text-slate-900 font-semibold text-sm">Top sản phẩm</h3>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Chưa có dữ liệu đơn hàng thành công
          </div>
        ) : (
          products.map((product, i) => {
            const percentage = (product.revenue / maxRevenue) * 100;
            return (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="py-3 border-b border-slate-50 last:border-b-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-800 truncate">{product.name}</p>
                  <p className="text-xs text-slate-400 shrink-0 ml-2">{product.sales} sold</p>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{formatCurrency(product.revenue)}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
