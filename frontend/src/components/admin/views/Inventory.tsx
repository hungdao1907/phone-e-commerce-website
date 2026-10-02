import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, DollarSign, ArrowRightLeft, Minus, Plus, CheckSquare, Square, MoreVertical, ArrowDownUp, ChevronLeft, ChevronRight, FileDown, FileUp, ListFilter, Eye, History, Edit3 } from 'lucide-react';
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
  const [limit, setLimit] = useState(10);
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
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.variantLabel.toLowerCase().includes(q)
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
    <div className="flex flex-col h-full gap-5 text-slate-900 w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Kho hàng</h1>
          <p className="text-sm text-slate-500 mt-1">Kiểm soát tồn kho theo sản phẩm và biến thể.</p>
        </div>
        <button className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-colors text-sm font-semibold shadow-sm">
          <ArrowRightLeft className="w-4 h-4" /> Tạo phiếu Nhập/Xuất
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-500"><DollarSign className="w-24 h-24" /></div>
          <p className="text-sm font-medium text-slate-500 mb-2">Tổng giá trị tồn kho</p>
          <p className="text-3xl lg:text-4xl font-bold tracking-tight text-emerald-600">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-center shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Tổng sản phẩm / biến thể</p>
              <p className="text-xl font-bold text-slate-900">{totalVariants} biến thể từ {products.length} sản phẩm</p>
            </div>
          </div>

          <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 mb-3">
            <div style={{ width: `${inStockPercent}%` }} className="bg-emerald-500 transition-all duration-500" />
            <div style={{ width: `${lowStockPercent}%` }} className="bg-amber-500 transition-all duration-500" />
            <div style={{ width: `${outOfStockPercent}%` }} className="bg-rose-500 transition-all duration-500" />
          </div>

          <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Còn hàng: {inStockCount}</span>
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-amber-500" /> Sắp hết: {lowStockCount}</span>
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2 h-2 rounded-full bg-rose-500" /> Hết hàng: {outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 p-3 rounded-2xl flex flex-col md:flex-row gap-3 shrink-0 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, biến thể..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="all">Tất cả danh mục</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ArrowDownUp className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="all">Tất cả trạng thái</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết hàng</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
            <ListFilter className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={sortOption} onChange={e => setSortOption(e.target.value)} className="h-10 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:bg-white appearance-none text-slate-700">
              <option value="updated_desc">Mới cập nhật</option>
              <option value="stock_asc">Tồn kho thấp → cao</option>
              <option value="stock_desc">Tồn kho cao → thấp</option>
              <option value="value_desc">Giá trị tồn kho cao → thấp</option>
              <option value="name_asc">Tên A → Z</option>
              <option value="name_desc">Tên Z → A</option>
            </select>
            <ArrowDownUp className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* BULK ACTION */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="shrink-0 overflow-hidden">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
              <span className="text-sm font-medium text-emerald-700">Đã chọn {selectedIds.length}</span>
              <div className="h-4 w-px bg-emerald-200 mx-2" />
              <button className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"><FileDown className="w-3.5 h-3.5" /> Tạo phiếu nhập</button>
              <button className="text-xs bg-white hover:bg-slate-50 text-slate-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"><FileUp className="w-3.5 h-3.5" /> Tạo phiếu xuất</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLE */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm min-h-0">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
              <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <div className="flex items-center justify-center cursor-pointer" onClick={toggleSelectAll}>
                    {selectedIds.length === paginatedRows.length && paginatedRows.length > 0 ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                  </div>
                </th>
                <th className="p-4">Sản phẩm & Biến thể</th>
                <th className="p-4">Mã SKU</th>
                <th className="p-4">Giá</th>
                <th className="p-4 w-32">Tồn kho</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Giá trị tồn</th>
                <th className="p-4">Cập nhật cuối</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={9} className="p-4">
                      <div className="h-12 bg-slate-100 rounded animate-pulse w-full"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
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
                    <tr key={row.variantId} className={cn("border-b border-slate-100 transition-colors group", isSelected ? "bg-emerald-50/70" : "hover:bg-slate-50/80")} style={{ height: '72px' }}>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center cursor-pointer" onClick={() => toggleSelectRow(row.variantId)}>
                          {isSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center p-1 shrink-0 relative overflow-hidden border border-slate-200">
                            {displayImage ? <img src={displayImage} alt="" className="w-full h-full object-contain" /> : <Package className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="flex flex-col max-w-[220px]">
                            <span className="font-semibold text-slate-900 truncate" title={row.productName}>{row.productName}</span>
                            <span className="text-xs text-slate-500 truncate mt-0.5">{row.variantLabel || 'Mặc định'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200 cursor-copy hover:bg-slate-200 transition-colors" title="Copy SKU">{row.sku}</span>
                      </td>
                      <td className="p-4 text-slate-700 whitespace-nowrap">
                        {formatCurrency(row.price)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleStockChange(row.variantId, row.productId, -1)} disabled={isOut}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-700"><Minus className="w-3 h-3" /></button>
                          <span className={cn("font-bold text-[15px] w-8 text-center", isOut ? "text-rose-600" : isLow ? "text-amber-600" : "text-slate-900")}>{row.stock}</span>
                          <button onClick={() => handleStockChange(row.variantId, row.productId, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center transition-colors text-slate-700"><Plus className="w-3 h-3" /></button>
                        </div>
                      </td>
                      <td className="p-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Hết hàng</span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Sắp hết</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Còn hàng</span>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(value)}
                      </td>
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(row.updatedAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === row.variantId ? null : row.variantId); }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenu === row.variantId && (
                            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-xl ring-1 ring-slate-200 z-50 overflow-hidden border border-slate-100" onClick={e => e.stopPropagation()}>
                              <div className="py-1">
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><Eye className="w-4 h-4 text-slate-400" /> Xem chi tiết</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><Edit3 className="w-4 h-4 text-slate-400" /> Điều chỉnh tồn kho</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><FileDown className="w-4 h-4 text-slate-400" /> Tạo phiếu nhập</button>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><FileUp className="w-4 h-4 text-slate-400" /> Tạo phiếu xuất</button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <button onClick={() => setActiveMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 w-full text-left transition-colors"><History className="w-4 h-4 text-slate-400" /> Xem lịch sử tồn kho</button>
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

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm shrink-0 bg-slate-50/50">
          <div className="text-slate-500">
            Hiển thị <span className="text-slate-900 font-medium">{(page - 1) * limit + (paginatedRows.length > 0 ? 1 : 0)}</span> – <span className="text-slate-900 font-medium">{(page - 1) * limit + paginatedRows.length}</span> trên <span className="text-slate-900 font-medium">{processedRows.length}</span> biến thể
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Hiển thị:</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500 text-slate-700 shadow-sm text-sm">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
              <div className="flex gap-1 px-2">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-medium text-slate-900 shadow-sm">{page}</span>
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
