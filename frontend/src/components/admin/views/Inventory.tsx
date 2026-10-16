import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, DollarSign, ArrowRightLeft, Minus, Plus, CheckSquare, Square, MoreVertical, ArrowDownUp, ChevronLeft, ChevronRight, FileDown, FileUp, ListFilter, Eye, History, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaUrl } from '@/utils/media';

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
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays <= 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const { token } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(4);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`);
      if (res.ok) setProducts(await res.json());
    } catch (error) {
      console.error('Lỗi tải dữ liệu kho:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const inventoryRows: InventoryRow[] = useMemo(() => {
    return products.flatMap(p =>
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
  }, [products]);

  const categories = useMemo(() => Array.from(new Set(inventoryRows.map(r => r.category))).sort(), [inventoryRows]);

  const totalValue = inventoryRows.reduce((s, r) => s + r.price * r.stock, 0);
  const inStockCount = inventoryRows.filter(r => r.stock > 10).length;
  const lowStockCount = inventoryRows.filter(r => r.stock > 0 && r.stock <= 10).length;
  const outOfStockCount = inventoryRows.filter(r => r.stock === 0).length;
  const totalVariants = inventoryRows.length;

  const inStockPercent = totalVariants ? (inStockCount / totalVariants) * 100 : 0;
  const lowStockPercent = totalVariants ? (lowStockCount / totalVariants) * 100 : 0;
  const outOfStockPercent = totalVariants ? (outOfStockCount / totalVariants) * 100 : 0;

  // 20 cột biểu đồ Spline Bar Chart tính toán từ SKU thực tế
  const chartBars = useMemo(() => {
    const sorted = [...inventoryRows].sort((a, b) => (b.price * b.stock) - (a.price * a.stock)).slice(0, 20);
    if (sorted.length === 0) return [];
    const maxValue = Math.max(...sorted.map(i => i.price * i.stock), 1);
    return sorted.map(item => {
      const val = item.price * item.stock;
      const ratio = Math.max(0.2, Math.min(1, val / maxValue));
      let barClass = 'bar-dim';
      if (ratio > 0.85) barClass = 'bar-peak';
      else if (ratio > 0.65) barClass = 'bar-bright';
      else if (ratio > 0.4) barClass = 'bar-mid';
      return {
        title: `${item.productName} (${item.variantLabel || item.sku}): ${formatCurrency(val)} - Tồn: ${item.stock}`,
        heightPercent: Math.round(ratio * 100),
        barClass
      };
    });
  }, [inventoryRows]);

  const handleStockChange = (variantId: string, productId: string, delta: number) => {
    let newStock = 0;
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

    if (updateTimeoutRef.current[variantId]) clearTimeout(updateTimeoutRef.current[variantId]);
    updateTimeoutRef.current[variantId] = setTimeout(async () => {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/variants/${variantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ stock: newStock })
        });
      } catch (error) {
        console.error('Lỗi cập nhật tồn kho:', error);
      }
    }, 500);
  };

  const processedRows = useMemo(() => {
    let result = [...inventoryRows];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r => 
        (r.productName || '').toLowerCase().includes(q) ||
        (r.sku || '').toLowerCase().includes(q) ||
        (r.variantLabel || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'in_stock') result = result.filter(r => r.stock > 10);
      else if (statusFilter === 'low_stock') result = result.filter(r => r.stock > 0 && r.stock <= 10);
      else if (statusFilter === 'out_of_stock') result = result.filter(r => r.stock === 0);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(r => r.category === categoryFilter);
    }

    result.sort((a, b) => {
      if (sortOption === 'stock_asc') return a.stock - b.stock;
      if (sortOption === 'stock_desc') return b.stock - a.stock;
      if (sortOption === 'value_desc') return (b.price * b.stock) - (a.price * a.stock);
      if (sortOption === 'name_asc') return a.productName.localeCompare(b.productName);
      if (sortOption === 'name_desc') return b.productName.localeCompare(a.productName);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return result;
  }, [inventoryRows, search, statusFilter, categoryFilter, sortOption]);

  const totalPages = Math.ceil(processedRows.length / limit) || 1;
  const paginatedRows = processedRows.slice((page - 1) * limit, page * limit);

  const paginationRange = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);
    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedRows.length && paginatedRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedRows.map(r => r.variantId));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col min-h-full gap-6 text-white w-full pb-16">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-1 pt-1 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Kho hàng</h1>
          <p className="text-xs text-zinc-400 mt-1">Kiểm soát tồn kho theo sản phẩm và biến thể.</p>
        </div>
        <button className="btn-neon-primary px-5 py-2.5 rounded-full text-sm flex items-center gap-2 font-semibold">
          <ArrowRightLeft className="w-4 h-4" /> Tạo phiếu Nhập/Xuất
        </button>
      </header>

      {/* 2 THẺ KPI LỚN: SPLINE 3D BAR CHART & GLOW CARD AMBER */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        
        {/* WIDGET 1: TỔNG GIÁ TRỊ TỒN KHO (100% SPLINE.ONE UI) */}
        <div className="spline-green-card px-9 py-7 flex flex-col justify-between min-h-[235px]">
          {/* Hàng trên: Số tiền phát sáng + VND (Không có dấu $) */}
          <div className="flex items-baseline justify-between gap-4">
            <div className="spline-value-text text-3xl sm:text-4xl font-bold tracking-tight">
              {formatCurrency(totalValue).replace('₫', '').trim()} <span className="text-2xl sm:text-3xl font-semibold text-emerald-100/95">VND</span>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-emerald-100 border border-white/15 backdrop-blur-md">
              {totalVariants} biến thể
            </span>
          </div>

          {/* Hàng giữa: Biểu đồ cột (Bar Chart) trải dài vừa khít chiều ngang */}
          <div className="h-20 flex items-end gap-2 my-4 pt-2">
            {chartBars.length > 0 ? (
              chartBars.map((bar, idx) => (
                <div 
                  key={idx} 
                  className={cn("spline-bar", bar.barClass)} 
                  style={{ height: `${bar.heightPercent}%` }} 
                  title={bar.title}
                />
              ))
            ) : (
              <div className="w-full text-center text-xs text-emerald-100/60 py-6">Chưa có dữ liệu tồn kho</div>
            )}
          </div>

          {/* Hàng dưới: Nhãn "Tổng giá trị tồn kho" */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-50/90 tracking-wide">
              Tổng giá trị tồn kho
            </span>
            <span className="text-xs text-emerald-100/75">
              Phân bổ theo {chartBars.length} nhóm SKU chủ lực
            </span>
          </div>
        </div>

        {/* WIDGET 2: TỔNG SẢN PHẨM / BIẾN THỂ (NEON RIM GLOW AMBER) */}
        <div className="glow-card-amber px-9 py-7 flex flex-col justify-between min-h-[235px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Tổng sản phẩm / biến thể</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1.5">
                {totalVariants} biến thể <span className="text-lg font-normal text-zinc-300">từ {products.length} sản phẩm</span>
              </h2>
            </div>
            <div className="w-11 h-11 rounded-2xl glass-btn-3d flex items-center justify-center text-amber-300">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Thanh Progress Bar phát sáng */}
          <div className="my-4 space-y-3">
            <div className="w-full h-3 rounded-full bg-black/60 p-0.5 border border-white/10 overflow-hidden flex">
              <div 
                className="h-full bg-[#2ee88a] rounded-l-full shadow-[0_0_12px_#2ee88a] transition-all duration-500" 
                style={{ width: `${inStockPercent}%` }} 
              />
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_14px_rgba(245,158,11,0.8)] transition-all duration-500" 
                style={{ width: `${lowStockPercent}%` }} 
              />
              <div 
                className="h-full bg-rose-500 rounded-r-full shadow-[0_0_12px_#ef4444] transition-all duration-500" 
                style={{ width: `${outOfStockPercent}%` }} 
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-zinc-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2ee88a] shadow-[0_0_8px_#2ee88a]"></span>
                  Còn hàng: <strong className="text-white">{inStockCount}</strong>
                </span>
                <span className="flex items-center gap-2 text-amber-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></span>
                  Sắp hết: <strong className="text-white">{lowStockCount}</strong>
                </span>
                <span className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Hết hàng: <strong className="text-white">{outOfStockCount}</strong>
                </span>
              </div>
              {lowStockCount > 0 && (
                <span className="text-amber-300/90 font-medium">Cần nhập bổ sung {lowStockCount} SKU</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/10">
            <span>Ngưỡng cảnh báo tồn kho thấp: &le; 10 sản phẩm/SKU</span>
            <button 
              onClick={() => setStatusFilter(statusFilter === 'low_stock' ? 'all' : 'low_stock')}
              className="text-amber-200 font-semibold hover:underline transition"
            >
              {statusFilter === 'low_stock' ? 'Xem tất cả SKU →' : 'Lọc SKU sắp hết →'}
            </button>
          </div>
        </div>

      </section>

      {/* THANH TÌM KIẾM & BỘ LỌC KHO HÀNG */}
      <section className="neon-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Tìm theo SKU, tên sản phẩm, biến thể..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black/45 border border-white/10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-400/60 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select 
              value={categoryFilter} 
              onChange={e => setCategoryFilter(e.target.value)}
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#06120d] text-white">Tất cả danh mục</option>
              {categories.map(c => <option key={c} value={c} className="bg-[#06120d] text-white">{c}</option>)}
            </select>
            <ArrowDownUp className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="all" className="bg-[#06120d] text-white">Tất cả trạng thái</option>
              <option value="in_stock" className="bg-[#06120d] text-white">Còn hàng</option>
              <option value="low_stock" className="bg-[#06120d] text-white">Sắp hết hàng</option>
              <option value="out_of_stock" className="bg-[#06120d] text-white">Hết hàng</option>
            </select>
            <ListFilter className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={sortOption} 
              onChange={e => setSortOption(e.target.value)}
              className="glass-btn-3d px-4 py-2.5 pr-8 rounded-xl text-xs font-medium text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="updated_desc" className="bg-[#06120d] text-white">Mới cập nhật</option>
              <option value="stock_asc" className="bg-[#06120d] text-white">Tồn kho thấp → cao</option>
              <option value="stock_desc" className="bg-[#06120d] text-white">Tồn kho cao → thấp</option>
              <option value="value_desc" className="bg-[#06120d] text-white">Giá trị tồn kho cao → thấp</option>
              <option value="name_asc" className="bg-[#06120d] text-white">Tên A → Z</option>
              <option value="name_desc" className="bg-[#06120d] text-white">Tên Z → A</option>
            </select>
            <ArrowDownUp className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* THANH THAO TÁC HÀNG LOẠT */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
            <section className="neon-action-bar px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-[#2ee88a] pr-3 border-r border-white/15">
                  Đã chọn {selectedIds.length} biến thể
                </span>
                <button className="glass-btn-3d px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 flex items-center gap-2 hover:text-white transition">
                  <FileDown className="w-3.5 h-3.5 text-emerald-300" />
                  Tạo phiếu nhập
                </button>
                <button className="glass-btn-3d px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-200 flex items-center gap-2 hover:text-white transition">
                  <FileUp className="w-3.5 h-3.5 text-amber-300" />
                  Tạo phiếu xuất
                </button>
              </div>
              <button 
                onClick={() => setSelectedIds([])}
                className="text-xs text-zinc-400 hover:text-white transition"
              >
                Bỏ chọn tất cả
              </button>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BẢNG DỮ LIỆU TỒN KHO CHI TIẾT */}
      <section className="neon-panel overflow-hidden flex flex-col w-full shadow-2xl shrink-0">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-black/50 backdrop-blur-md">
              <tr className="border-b border-white/10 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 pl-5 pr-2 w-10 text-center">
                  <input 
                    type="checkbox"
                    className="neon-checkbox cursor-pointer"
                    checked={selectedIds.length === paginatedRows.length && paginatedRows.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3.5 px-3">SẢN PHẨM & BIẾN THỂ</th>
                <th className="py-3.5 px-3">MÃ SKU</th>
                <th className="py-3.5 px-3">GIÁ BÁN</th>
                <th className="py-3.5 px-3 text-center">TỒN KHO</th>
                <th className="py-3.5 px-3">TRẠNG THÁI</th>
                <th className="py-3.5 px-3">GIÁ TRỊ TỒN</th>
                <th className="py-3.5 px-3">CẬP NHẬT CUỐI</th>
                <th className="py-3.5 pl-3 pr-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td colSpan={9} className="p-4">
                      <div className="h-12 bg-white/5 rounded-xl animate-pulse w-full"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-zinc-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    Không tìm thấy sản phẩm trong kho.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const isSelected = selectedIds.includes(row.variantId);
                  const isOut = row.stock === 0;
                  const isLow = row.stock > 0 && row.stock <= 10;
                  const displayImage = row.variantImage || row.productImage;
                  const value = row.price * row.stock;

                  return (
                    <tr 
                      key={row.variantId} 
                      className={cn(
                        "transition-colors group", 
                        isSelected ? "bg-emerald-500/[0.08]" : "hover:bg-white/[0.03]"
                      )} 
                      style={{ height: '76px' }}
                    >
                      <td className="py-4 pl-5 pr-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox"
                          className="neon-checkbox cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.variantId)}
                        />
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-[#0c2419] border border-emerald-400/25 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {displayImage ? (
                              <img src={resolveMediaUrl(displayImage) || displayImage} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-emerald-300/60" />
                            )}
                          </div>
                          <div className="flex flex-col max-w-[240px]">
                            <span className="font-semibold text-white truncate" title={row.productName}>{row.productName}</span>
                            <span className="text-xs text-zinc-400 truncate mt-0.5">{row.variantLabel || 'Mặc định'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 font-mono text-xs text-zinc-300">
                          {row.sku}
                        </span>
                      </td>
                      <td className="py-4 px-3 font-medium text-zinc-200 whitespace-nowrap">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleStockChange(row.variantId, row.productId, -1)} 
                            disabled={isOut}
                            className="w-7 h-7 rounded-lg glass-btn-3d text-zinc-300 hover:text-white flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <span className={cn(
                            "w-8 text-center font-bold text-[15px]",
                            isOut ? "text-rose-400" : isLow ? "text-amber-300" : "text-[#2ee88a]"
                          )}>
                            {row.stock}
                          </span>
                          <button 
                            onClick={() => handleStockChange(row.variantId, row.productId, 1)}
                            className="w-7 h-7 rounded-lg glass-btn-3d text-zinc-300 hover:text-white flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Hết hàng
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Sắp hết
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-[#2ee88a] border border-emerald-400/30 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2ee88a]"></span>
                            Còn hàng
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-3 font-bold text-[#2ee88a] whitespace-nowrap">
                        {formatCurrency(value)}
                      </td>
                      <td className="py-4 px-3 text-xs text-zinc-400 whitespace-nowrap">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className="py-4 pl-3 pr-5 text-right">
                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === row.variantId ? null : row.variantId); }}
                            className="w-8 h-8 rounded-lg glass-btn-3d inline-flex items-center justify-center text-zinc-300 hover:text-white transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeMenu === row.variantId && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0a1811] border border-emerald-400/30 shadow-[0_10px_30px_rgba(0,0,0,0.85)] z-50 overflow-hidden backdrop-blur-xl" onClick={e => e.stopPropagation()}>
                              <div className="py-1">
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] w-full text-left transition-colors"><Eye className="w-3.5 h-3.5" /> Xem chi tiết</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] w-full text-left transition-colors"><Edit3 className="w-3.5 h-3.5" /> Điều chỉnh tồn kho</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] w-full text-left transition-colors"><FileDown className="w-3.5 h-3.5" /> Tạo phiếu nhập</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] w-full text-left transition-colors"><FileUp className="w-3.5 h-3.5" /> Tạo phiếu xuất</button>
                                <div className="h-px bg-white/10 my-1"></div>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-xs text-white/90 hover:bg-emerald-500/15 hover:text-[#2ee88a] w-full text-left transition-colors"><History className="w-3.5 h-3.5" /> Xem lịch sử tồn kho</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PHÂN TRANG */}
        <div className="px-5 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 bg-black/40 shrink-0">
          <span>
            Hiển thị <strong className="text-white">{(page - 1) * limit + (paginatedRows.length > 0 ? 1 : 0)} – {(page - 1) * limit + paginatedRows.length}</strong> trên <strong className="text-white">{processedRows.length}</strong> biến thể
          </span>
          <div className="flex items-center gap-3">
            <span>Hiển thị:</span>
            <select 
              value={limit} 
              onChange={e => { setLimit(Number(e.target.value)); setPage(1); }}
              className="bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white focus:outline-none focus:border-emerald-400/50 cursor-pointer"
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
            </select>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition"
              >
                &lt;
              </button>
              {paginationRange[0] > 1 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      page === 1 ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                    )}
                  >
                    1
                  </button>
                  {paginationRange[0] > 2 && <span className="text-zinc-500 px-0.5">...</span>}
                </>
              )}
              {paginationRange.map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                    page === p ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                  )}
                >
                  {p}
                </button>
              ))}
              {paginationRange[paginationRange.length - 1] < totalPages && (
                <>
                  {paginationRange[paginationRange.length - 1] < totalPages - 1 && <span className="text-zinc-500 px-0.5">...</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      page === totalPages ? "btn-neon-primary font-bold text-xs" : "glass-btn-3d text-xs text-zinc-300 hover:text-white"
                    )}
                  >
                    {totalPages}
                  </button>
                </>
              )}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages || totalPages === 0}
                className="w-7 h-7 rounded-lg glass-btn-3d flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
