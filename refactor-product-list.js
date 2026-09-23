const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/components/admin/views/ProductList.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports at the top
const importsToAdd = `
import { AdminProductFilterSidebar } from './products/AdminProductFilterSidebar';
import { AdminProductCard } from './products/AdminProductCard';
import { VariantManagementModal } from './products/VariantManagementModal';
`;

if (!content.includes('AdminProductFilterSidebar')) {
    content = content.replace("import { cn } from '@/lib/utils';", "import { cn } from '@/lib/utils';\n" + importsToAdd);
}

// 2. Add new state variables for Admin List
const newStates = `
  // --- Admin List State ---
  const [listData, setListData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [listFilters, setListFilters] = useState<Record<string, string[]>>({});
  const [adminFilters, setAdminFilters] = useState<Record<string, any>>({});
  const [listCategory, setListCategory] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [listStock, setListStock] = useState('');
  const [listSort, setListSort] = useState('newest');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showVariantModalFor, setShowVariantModalFor] = useState<any>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(p => ({ ...p, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Admin Filters
  const fetchAdminFilters = async () => {
    try {
      const url = new URL(\`\${API_BASE_URL}/api/products/admin/filters\`);
      if (listCategory) url.searchParams.append('category', listCategory);
      const res = await fetch(url.toString(), { headers: { 'Authorization': \`Bearer \${token}\` } });
      if (res.ok) setAdminFilters(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Admin Products
  const fetchAdminProducts = async () => {
    try {
      setIsFetchingList(true);
      const url = new URL(\`\${API_BASE_URL}/api/products/admin/search\`);
      url.searchParams.append('page', pagination.page.toString());
      url.searchParams.append('limit', pagination.limit.toString());
      if (debouncedSearch) url.searchParams.append('search', debouncedSearch);
      if (listCategory) url.searchParams.append('category', listCategory);
      if (listStatus) url.searchParams.append('status', listStatus);
      if (listStock) url.searchParams.append('stock', listStock);
      if (listSort) url.searchParams.append('sort', listSort);
      
      Object.entries(listFilters).forEach(([key, values]) => {
        if (values.length > 0) {
          url.searchParams.append(key, values.join(','));
        }
      });

      const res = await fetch(url.toString(), { headers: { 'Authorization': \`Bearer \${token}\` } });
      if (res.ok) {
        const data = await res.json();
        setListData(data.data);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingList(false);
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchAdminFilters();
    }
  }, [listCategory, view]);

  useEffect(() => {
    if (view === 'list') {
      fetchAdminProducts();
    }
  }, [debouncedSearch, listCategory, listStatus, listStock, listSort, listFilters, pagination.page, view]);

  const handleFilterChange = (groupKey: string, value: string) => {
    setListFilters(prev => {
      const current = prev[groupKey] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [groupKey]: updated };
    });
    setPagination(p => ({ ...p, page: 1 }));
  };

  const clearAllFilters = () => {
    setListFilters({});
    setListCategory('');
    setListStatus('');
    setListStock('');
    setSearch('');
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProductIds.length === 0) return;
    const confirmMsg = action === 'delete' ? 'Bạn có chắc muốn xoá các sản phẩm đã chọn?' : \`Thay đổi trạng thái \${selectedProductIds.length} sản phẩm?\`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(\`\${API_BASE_URL}/api/products/admin/bulk-action\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
        body: JSON.stringify({ action, productIds: selectedProductIds })
      });
      if (res.ok) {
        setSelectedProductIds([]);
        fetchAdminProducts();
        if (action === 'delete') fetchAdminFilters();
      }
    } catch (e) {
      console.error(e);
    }
  };
`;

const stateInjectionPoint = "const { token } = useAuthStore();";
if (!content.includes('const [listData, setListData] = useState')) {
    content = content.replace(stateInjectionPoint, stateInjectionPoint + "\n" + newStates);
}

// 3. Replace the list view JSX
const listStartIdx = content.indexOf('// ===== RENDER LIST VIEW =====');
if (listStartIdx !== -1) {
    const listReplacement = `// ===== RENDER LIST VIEW =====
  return (
    <div className="flex flex-col h-full gap-4 text-white w-full relative">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-[#1c1c1e] p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Sản phẩm</h1>
          <p className="text-xs text-white/50 mt-1">Quản lý {pagination.total} sản phẩm</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Bulk Actions */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 mr-2">
              <span className="text-xs text-emerald-400 font-medium">Đã chọn {selectedProductIds.length}</span>
              <div className="h-4 w-px bg-emerald-500/20 mx-1"></div>
              <button onClick={() => handleBulkAction('activate')} className="text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-2 py-1 rounded transition-colors">Hiện</button>
              <button onClick={() => handleBulkAction('deactivate')} className="text-[10px] bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-2 py-1 rounded transition-colors">Ẩn</button>
              <button onClick={() => handleBulkAction('delete')} className="text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded transition-colors">Xoá</button>
            </div>
          )}

          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input 
              type="text" 
              placeholder="Tìm tên, SKU..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-black/20 border border-white/10 text-sm outline-none focus:border-emerald-500 transition-colors placeholder:text-white/30" 
            />
          </div>

          <div className="relative">
            <select 
              value={listSort} 
              onChange={e => setListSort(e.target.value)}
              className="h-10 pl-3 pr-8 rounded-xl bg-black/20 border border-white/10 text-sm outline-none focus:border-emerald-500 appearance-none text-white/80"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>

          <button onClick={handleOpenCreate} className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold shadow-[0_0_15px_rgba(52,211,153,0.3)] whitespace-nowrap">
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* SIDEBAR */}
        <div className="hidden lg:block w-64 shrink-0 overflow-y-auto custom-scrollbar pb-4 pr-1">
          <AdminProductFilterSidebar 
            categories={flatCats}
            currentCategory={listCategory}
            onCategoryChange={c => { setListCategory(c); setPagination(p => ({...p, page: 1})); }}
            filters={adminFilters}
            selectedFilters={listFilters}
            onFilterChange={handleFilterChange}
            statusFilter={listStatus}
            onStatusChange={s => { setListStatus(s); setPagination(p => ({...p, page: 1})); }}
            stockFilter={listStock}
            onStockChange={s => { setListStock(s); setPagination(p => ({...p, page: 1})); }}
            isLoading={isFetchingList && Object.keys(adminFilters).length === 0}
            onClearFilters={clearAllFilters}
          />
        </div>

        {/* GRID VIEW */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1c1c1e]/50 border border-white/5 rounded-2xl p-4 overflow-hidden">
          
          <div className="flex items-center justify-between mb-4 text-xs font-semibold text-white/50 px-2 shrink-0">
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  className="rounded border-white/20 bg-transparent text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                  checked={listData.length > 0 && selectedProductIds.length === listData.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProductIds(listData.map(p => p.id));
                    } else {
                      setSelectedProductIds([]);
                    }
                  }}
                />
                Chọn tất cả trang này
              </label>
              {isFetchingList && <div className="ml-4 flex items-center gap-2 text-emerald-400"><RefreshCw className="w-3 h-3 animate-spin"/> Đang tải...</div>}
            </div>
            <div>{listData.length} kết quả</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
            {listData.length === 0 && !isFetchingList ? (
              <div className="h-full flex flex-col items-center justify-center text-white/40">
                <Package className="w-12 h-12 mb-3 opacity-20" />
                <p>Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-2">
                {listData.map((product) => (
                  <AdminProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProductIds.includes(product.id)}
                    onSelect={() => {
                      setSelectedProductIds(prev => 
                        prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id]
                      );
                    }}
                    onEdit={() => handleOpenEdit(product)}
                    onDelete={() => {
                      setSelectedProductIds([product.id]);
                      setTimeout(() => handleBulkAction('delete'), 0);
                    }}
                    onManageVariants={() => setShowVariantModalFor(product)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between shrink-0 px-2">
              <div className="text-xs text-white/40">
                Trang {pagination.page} / {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                      className={\`w-8 h-8 shrink-0 rounded-lg text-sm flex items-center justify-center transition-colors \${pagination.page === i + 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'hover:bg-white/10 text-white/60'}\`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {showVariantModalFor && (
        <VariantManagementModal 
          product={showVariantModalFor} 
          onClose={() => setShowVariantModalFor(null)} 
          onSaved={() => {
            setShowVariantModalFor(null);
            fetchAdminProducts();
          }} 
        />
      )}
    </div>
  );
}
`;
    content = content.substring(0, listStartIdx) + listReplacement;
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully refactored ProductList.tsx');
