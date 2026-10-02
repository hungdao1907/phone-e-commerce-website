import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Edit3, Image as ImageIcon, Loader2, Package, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  formatFeaturedProductPrice,
  getFeaturedProductImage,
  type HomeFeaturedProduct,
  type HomeFeaturedProductData,
} from '@/services/homeFeaturedProducts.api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Feedback = { tone: 'success' | 'error'; message: string } | null;

function productLabel(product: HomeFeaturedProductData) {
  const category = product.category?.name ? ` · ${product.category.name}` : '';
  return `${product.name}${category}`;
}

function getErrorMessage(payload: unknown, fallback: string) {
  return typeof payload === 'object' && payload && typeof (payload as { message?: unknown }).message === 'string'
    ? (payload as { message: string }).message
    : fallback;
}

function ProductThumbnail({ product, size = 'md' }: { product: HomeFeaturedProductData; size?: 'sm' | 'md' | 'lg' }) {
  const image = getFeaturedProductImage(product);
  const sizeClasses = size === 'sm' ? 'h-10 w-10 rounded-xl' : size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-14 w-14 rounded-2xl';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 ${sizeClasses}`}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className={`${iconSize} text-slate-400`} />}
    </div>
  );
}

export function HomeFeaturedProducts() {
  const { token } = useAuthStore();
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, [token]);
  const [featuredProducts, setFeaturedProducts] = useState<HomeFeaturedProduct[]>([]);
  const [products, setProducts] = useState<HomeFeaturedProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [editing, setEditing] = useState<HomeFeaturedProduct | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [sortOrder, setSortOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPositionDropdownOpen, setIsPositionDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const positionDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      const [featuredResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/home-featured-products/admin`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${API_BASE_URL}/api/products`),
      ]);
      const featuredPayload: unknown = await featuredResponse.json();
      if (!featuredResponse.ok) throw new Error(getErrorMessage(featuredPayload, 'Không thể tải sản phẩm nổi bật.'));
      const productsPayload: unknown = productsResponse.ok ? await productsResponse.json() : [];
      setFeaturedProducts(Array.isArray((featuredPayload as { featuredProducts?: unknown }).featuredProducts) ? (featuredPayload as { featuredProducts: HomeFeaturedProduct[] }).featuredProducts : []);
      setProducts(Array.isArray(productsPayload) ? productsPayload as HomeFeaturedProductData[] : []);
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể tải dữ liệu.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [token]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
        setIsPositionDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isDropdownOpen]);

  const featuredProductIds = useMemo(() => new Set(featuredProducts.map((item) => item.productId)), [featuredProducts]);
  const availableProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => product.status === 'active' && !featuredProductIds.has(product.id))
      .filter((product) => !query || product.name.toLowerCase().includes(query) || product.brand?.toLowerCase().includes(query) || product.category?.name?.toLowerCase().includes(query));
  }, [featuredProductIds, products, search]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === productId) || null;
  }, [products, productId]);

  const totalPositions = editing ? featuredProducts.length : featuredProducts.length + 1;

  const resetForm = () => {
    setProductId('');
    setSortOrder(String(featuredProducts.length + 1));
    setIsActive(true);
    setEditing(null);
    setSearch('');
    setIsDropdownOpen(false);
    setIsPositionDropdownOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (item: HomeFeaturedProduct) => {
    setEditing(item);
    setSortOrder(String(item.sortOrder));
    setIsActive(item.isActive);
    setIsCreateOpen(false);
    setIsDropdownOpen(false);
    setIsPositionDropdownOpen(false);
  };

  const closeForm = () => {
    setIsCreateOpen(false);
    resetForm();
  };

  const save = async () => {
    const numericSortOrder = Number(sortOrder);
    if (!Number.isInteger(numericSortOrder) || numericSortOrder < 1) {
      setFeedback({ tone: 'error', message: 'Vị trí hiển thị phải là số nguyên dương.' });
      return;
    }
    if (!editing && !productId) {
      setFeedback({ tone: 'error', message: 'Hãy chọn một sản phẩm đang hoạt động.' });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        editing ? `${API_BASE_URL}/api/home-featured-products/admin/${editing.id}` : `${API_BASE_URL}/api/home-featured-products/admin`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: authHeaders,
          body: JSON.stringify(editing ? { sortOrder: numericSortOrder, isActive } : { productId, sortOrder: numericSortOrder, isActive }),
        },
      );
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Không thể lưu sản phẩm nổi bật.'));
      setFeedback({ tone: 'success', message: editing ? 'Đã cập nhật sản phẩm nổi bật.' : 'Đã thêm sản phẩm nổi bật.' });
      closeForm();
      await load();
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể lưu sản phẩm nổi bật.' });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (item: HomeFeaturedProduct) => {
    if (!window.confirm(`Gỡ “${item.product.name}” khỏi sản phẩm nổi bật? Sản phẩm gốc sẽ không bị xóa.`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/home-featured-products/admin/${item.id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, 'Không thể gỡ sản phẩm nổi bật.'));
      setFeedback({ tone: 'success', message: 'Đã gỡ sản phẩm khỏi danh sách nổi bật.' });
      await load();
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể gỡ sản phẩm nổi bật.' });
    }
  };

  const formOpen = isCreateOpen || editing !== null;

  return (
    <section className="mx-auto max-w-6xl space-y-6 text-slate-900">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Trang chủ</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Sản phẩm nổi bật</h1>
          <p className="mt-2 text-sm text-slate-500">Chọn sản phẩm có sẵn để hiển thị trên trang chủ. Thao tác này không chỉnh sửa sản phẩm gốc.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm">
          <Plus className="h-4 w-4" /> Thêm sản phẩm nổi bật
        </button>
      </div>

      {feedback && <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>{feedback.message}</div>}

      {formOpen && (
        <div className="relative z-30 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Cập nhật hiển thị' : 'Thêm sản phẩm nổi bật'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {editing ? 'Sản phẩm được giữ cố định; chỉ thay đổi thứ tự và trạng thái.' : 'Chỉ sản phẩm đang hoạt động và chưa được chọn mới có thể thêm.'}
              </p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {editing ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base text-slate-900">{editing.product.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{productLabel(editing.product)} · <span className="text-emerald-700 font-semibold">{formatFeaturedProductPrice(editing.product)}</span></p>
              </div>
            </div>
          ) : (
            <div className={`mt-5 relative ${isDropdownOpen ? 'z-40' : 'z-20'}`} ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-800">Chọn sản phẩm</label>
                <span className="text-xs text-slate-400">{availableProducts.length} sản phẩm khả dụng</span>
              </div>

              {/* Custom Dropdown Trigger (Text Only) */}
              <div className="relative mt-2">
                {selectedProduct ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3.5 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">{selectedProduct.name}</p>
                        {selectedProduct.brand && (
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                            {selectedProduct.brand}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-emerald-700 font-semibold">
                        {formatFeaturedProductPrice(selectedProduct)}
                        {selectedProduct.category?.name && (
                          <span className="text-slate-400 font-normal"> · {selectedProduct.category.name}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
                      >
                        Đổi sản phẩm
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductId('')}
                        className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Bỏ chọn"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-white px-4 py-3.5 text-left text-sm transition ${
                      isDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-slate-400">Chọn sản phẩm để thêm vào nổi bật...</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                  </button>
                )}

                {/* Dropdown Menu Panel (Text Only) */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Box */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          ref={searchInputRef}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder="Tìm theo tên sản phẩm, thương hiệu hoặc danh mục..."
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Options List (Text Only) */}
                    <div className="max-h-72 overflow-y-auto p-2 divide-y divide-slate-100 space-y-1 custom-scrollbar">
                      {availableProducts.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <p className="text-sm font-medium">Không tìm thấy sản phẩm phù hợp</p>
                          <p className="text-xs text-slate-400/80 mt-1">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                      ) : (
                        availableProducts.map((product) => {
                          const isSelected = product.id === productId;
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setProductId(product.id);
                                setIsDropdownOpen(false);
                                setSearch('');
                              }}
                              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                                isSelected
                                  ? 'bg-emerald-50 border border-emerald-300 text-slate-900'
                                  : 'hover:bg-slate-50 border border-transparent text-slate-800'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-sm">{product.name}</p>
                                  {product.brand && (
                                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                                      {product.brand}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs">
                                  <span className="font-semibold text-emerald-700">{formatFeaturedProductPrice(product)}</span>
                                  {product.category?.name && (
                                    <span className="text-slate-400">· {product.category.name}</span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upgraded Position Dropdown & Active Checkbox */}
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,240px)_1fr]">
            <div ref={positionDropdownRef} className={`relative ${isPositionDropdownOpen ? 'z-30' : 'z-10'}`}>
              <label className="text-sm font-semibold text-slate-800">Vị trí hiển thị</label>
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${
                    isPositionDropdownOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 font-bold text-xs text-emerald-700 border border-emerald-200">
                      {sortOrder}
                    </span>
                    <span className="font-medium text-slate-800">
                      {Number(sortOrder) === 1 ? 'Vị trí 1 (Đầu tiên)' : Number(sortOrder) === totalPositions ? `Vị trí ${sortOrder} (Cuối cùng)` : `Vị trí ${sortOrder}`}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isPositionDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
                </button>

                {isPositionDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
                    {Array.from({ length: totalPositions }, (_, i) => i + 1).map((pos) => {
                      const isSelected = String(pos) === String(sortOrder);
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            setSortOrder(String(pos));
                            setIsPositionDropdownOpen(false);
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md font-bold text-[11px] ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {pos}
                            </span>
                            <span>
                              {pos === 1 ? 'Vị trí 1 — Đầu tiên' : pos === totalPositions ? `Vị trí ${pos} — Cuối cùng` : `Vị trí ${pos}`}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm transition hover:border-slate-300">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span className="font-medium text-slate-800">Hiển thị trên trang chủ</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving || (!editing && !productId)}
              onClick={() => void save()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editing ? 'Lưu thay đổi' : 'Thêm vào trang chủ'}
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-52 items-center justify-center text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            Đang tải danh sách...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300 mb-3" />
            <p className="font-semibold text-lg text-slate-800">Chưa có sản phẩm nổi bật.</p>
            <p className="mt-1 text-sm text-slate-500">Bấm "Thêm sản phẩm nổi bật" để đưa sản phẩm lên carousel trang chủ.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {featuredProducts.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-slate-50/70 sm:flex-nowrap">
                <ProductThumbnail product={item.product} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold text-base text-slate-900">{item.product.name}</h2>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                      {item.isActive ? 'Đang hiển thị' : 'Đã tắt'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{productLabel(item.product)} · <span className="text-emerald-700 font-semibold">{formatFeaturedProductPrice(item.product)}</span></p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                  Vị trí: <span className="font-bold text-emerald-700">{item.sortOrder}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(item)} className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 shadow-xs" aria-label={`Sửa ${item.product.name}`}>
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => void remove(item)} className="rounded-xl border border-red-200 bg-red-50/50 p-2.5 text-red-600 transition hover:bg-red-100/60" aria-label={`Gỡ ${item.product.name} khỏi nổi bật`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
