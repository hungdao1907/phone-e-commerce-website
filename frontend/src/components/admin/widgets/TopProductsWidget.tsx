import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

const COLORS = ['#3ee08c', '#ff8040', '#33ccaa', '#5a8cff'];

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
      className="backdrop-blur-xl flex flex-col h-full overflow-hidden relative"
      style={{
        background: 'rgba(4, 22, 15, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '28px',
        boxShadow: '0 10px 40px -14px rgba(62, 224, 140, 0.25)'
      }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between shrink-0">
        <h3 className="text-[#eefaf3] font-semibold text-sm">Top sản phẩm</h3>
        <button className="text-[#eefaf3]/50 hover:text-[#eefaf3] transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#3ee08c]/20 border-t-[#3ee08c] rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-[#3ee08c]/15 border border-[#3ee08c]/30 text-[#3ee08c] text-xl flex items-center justify-center mb-3">
              📦
            </div>
            <p className="text-[#eefaf3]/60 text-xs">Chưa có dữ liệu đơn hàng thành công</p>
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
                className="py-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-[#eefaf3] truncate">{product.name}</p>
                  <p className="text-xs text-[#eefaf3]/55 shrink-0 ml-2">{product.sales} sold</p>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
                <p className="text-[11px] font-medium text-[#3ee08c] mt-1">{formatCurrency(product.revenue)}</p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
