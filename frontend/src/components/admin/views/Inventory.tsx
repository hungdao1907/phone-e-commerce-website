import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Package, DollarSign, AlertTriangle, ArrowRightLeft, Minus, Plus, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

// --- TYPES ---
interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
  colorCode: string | null;
  image: string | null;
}

interface Product {
  id: string;
  name: string;
  image: string | null;
  category: { name: string } | null;
  variants: ProductVariant[];
  updatedAt: string;
}

// Flattened row for inventory display
interface InventoryRow {
  variantId: string;
  productId: string;
  productName: string;
  productImage: string | null;
  category: string;
  sku: string;
  price: number;
  stock: number;
  colorCode: string | null;
  variantLabel: string;
  variantImage: string | null;
  updatedAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "Hôm nay";
  if (diffDays === 2) return "Hôm qua";
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const { token } = useAuthStore();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3001/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Lỗi tải dữ liệu kho:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Flatten products -> inventory rows (one row per variant)
  const inventoryRows: InventoryRow[] = products.flatMap(p =>
    p.variants.map(v => ({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      productImage: p.image,
      category: p.category?.name || 'Chưa phân loại',
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      colorCode: v.colorCode,
      variantLabel: Object.values(v.attributes).join(' · '),
      variantImage: v.image,
      updatedAt: p.updatedAt
    }))
  );

  // Metrics
  const totalItems = inventoryRows.reduce((s, r) => s + r.stock, 0);
  const totalValue = inventoryRows.reduce((s, r) => s + r.price * r.stock, 0);
  const lowStockCount = inventoryRows.filter(r => r.stock > 0 && r.stock <= 10).length;
  const outOfStockCount = inventoryRows.filter(r => r.stock === 0).length;

  const handleStockChange = (variantId: string, productId: string, delta: number) => {
    let newStock = 0;
    
    // Optimistic UI update
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        variants: p.variants.map(v => {
          if (v.id !== variantId) return v;
          newStock = Math.max(0, v.stock + delta);
          return { ...v, stock: newStock };
        })
      };
    }));

    // Debounced API call
    if (updateTimeoutRef.current[variantId]) {
      clearTimeout(updateTimeoutRef.current[variantId]);
    }

    updateTimeoutRef.current[variantId] = setTimeout(async () => {
      try {
        await fetch(`http://localhost:3001/api/products/variants/${variantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ stock: newStock })
        });
      } catch (error) {
        console.error('Lỗi cập nhật tồn kho:', error);
      }
    }, 500);
  };

  const filteredRows = inventoryRows.filter(r =>
    r.productName.toLowerCase().includes(search.toLowerCase()) ||
    r.sku.toLowerCase().includes(search.toLowerCase()) ||
    r.variantLabel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6 text-white w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Kho hàng</h1>
          <p className="text-sm text-white/50 mt-1">Kiểm soát {inventoryRows.length} biến thể từ {products.length} sản phẩm.</p>
        </div>
        <button className="h-10 px-5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)]">
          <ArrowRightLeft className="w-4 h-4" /> Tạo phiếu Nhập/Xuất
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Package className="w-16 h-16" /></div>
          <span className="text-white/50 text-sm font-medium mb-2">Tổng sản phẩm hiện có</span>
          <span className="text-3xl font-bold text-white tracking-tight">{totalItems}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-400"><DollarSign className="w-16 h-16" /></div>
          <span className="text-emerald-400/70 text-sm font-medium mb-2">Giá trị kho ước tính</span>
          <span className="text-3xl font-bold text-emerald-400 tracking-tight">{formatCurrency(totalValue)}</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className={cn("border p-5 rounded-2xl flex flex-col relative overflow-hidden group", outOfStockCount > 0 ? "bg-red-500/10 border-red-500/30" : lowStockCount > 0 ? "bg-orange-500/10 border-orange-500/30" : "bg-white/5 border-white/10")}
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle className={cn("w-16 h-16", outOfStockCount > 0 ? "text-red-400" : lowStockCount > 0 ? "text-orange-400" : "text-white/40")} />
          </div>
          <span className={cn("text-sm font-medium mb-2", outOfStockCount > 0 ? "text-red-400/80" : lowStockCount > 0 ? "text-orange-400/80" : "text-white/50")}>Cần chú ý</span>
          <div className="flex items-center gap-3">
            {outOfStockCount > 0 && <span className="text-2xl font-bold text-red-400 flex items-center gap-1.5">{outOfStockCount} <span className="text-sm font-normal text-red-400/70">hết hàng</span></span>}
            {lowStockCount > 0 && <span className="text-2xl font-bold text-orange-400 flex items-center gap-1.5">{lowStockCount} <span className="text-sm font-normal text-orange-400/70">sắp hết</span></span>}
            {outOfStockCount === 0 && lowStockCount === 0 && <span className="text-xl font-medium text-white/70">Kho ổn định</span>}
          </div>
        </motion.div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input type="text" placeholder="Tìm theo SKU, tên, biến thể..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors placeholder:text-white/30" />
        </div>
        <button className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-colors text-sm font-medium">
          <Filter className="w-4 h-4" /> Lọc trạng thái
        </button>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
          <div className="col-span-4 pl-2">Sản phẩm & Biến thể</div>
          <div className="col-span-2">Mã SKU</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2">Tồn kho (Cập nhật nhanh)</div>
          <div className="col-span-2 text-right pr-2">Cập nhật cuối</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
          ) : filteredRows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-white/40">Không có dữ liệu</div>
          ) : (
            <AnimatePresence>
              {filteredRows.map((row, index) => {
                const isLow = row.stock > 0 && row.stock <= 10;
                const isOut = row.stock === 0;
                const displayImage = row.variantImage || row.productImage;

                return (
                  <motion.div key={row.variantId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="group grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    {/* Sản phẩm & Biến thể */}
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="relative w-12 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center p-1">
                        {displayImage ? <img src={displayImage} alt={row.productName} className="w-full h-full object-contain drop-shadow-md" /> : <div className="text-[10px] text-white/20">No img</div>}
                        {row.colorCode && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#1c1c1e]" style={{ backgroundColor: row.colorCode }} />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium text-white truncate">{row.productName}</span>
                        <span className="text-xs text-white/50 truncate mt-0.5">{row.variantLabel || row.category}</span>
                      </div>
                    </div>

                    {/* SKU */}
                    <div className="col-span-2">
                      <span className="font-mono text-xs text-white/50 bg-black/40 px-2 py-1 rounded border border-white/5">{row.sku}</span>
                    </div>

                    {/* Trạng thái */}
                    <div className="col-span-2 flex items-center">
                      {isOut ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Hết hàng</span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" /> Sắp hết</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/80 text-xs font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" /> Còn hàng</span>
                      )}
                    </div>

                    {/* Tồn kho Quick Edit */}
                    <div className="col-span-2 flex items-center gap-2">
                      <button onClick={() => handleStockChange(row.variantId, row.productId, -1)} disabled={row.stock === 0}
                        className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><Minus className="w-3.5 h-3.5" /></button>
                      <div className="w-12 h-8 flex items-center justify-center font-bold text-lg bg-black/20 border border-white/5 rounded">
                        <motion.span key={row.stock} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className={cn(isOut ? "text-red-400" : isLow ? "text-orange-400" : "text-white")}>{row.stock}</motion.span>
                      </div>
                      <button onClick={() => handleStockChange(row.variantId, row.productId, 1)}
                        className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Cập nhật cuối */}
                    <div className="col-span-2 flex items-center justify-end pr-2 gap-3">
                      <span className="text-xs font-medium text-white/70">{formatDate(row.updatedAt)}</span>
                      <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"><History className="w-4 h-4" /></button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
