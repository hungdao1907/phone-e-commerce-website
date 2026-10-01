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
    <div className={`flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-black/40 ${sizeClasses}`}>
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className={`${iconSize} text-white/30`} />}
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
    <section className="mx-auto max-w-6xl space-y-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-400">Trang chủ</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sản phẩm nổi bật</h1>
          <p className="mt-2 text-sm text-white/55">Chọn sản phẩm có sẵn để hiển thị trên trang chủ. Thao tác này không chỉnh sửa sản phẩm gốc.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-2xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-lime-300">
          <Plus className="h-4 w-4" /> Thêm sản phẩm nổi bật
        </button>
      </div>

      {feedback && <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.tone === 'success' ? 'border-lime-300/30 bg-lime-400/10 text-lime-200' : 'border-red-300/30 bg-red-400/10 text-red-200'}`}>{feedback.message}</div>}

      {formOpen && (
        <div className="relative z-30 rounded-3xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{editing ? 'Cập nhật hiển thị' : 'Thêm sản phẩm nổi bật'}</h2>
              <p className="mt-1 text-sm text-white/50">
                {editing ? 'Sản phẩm được giữ cố định; chỉ thay đổi thứ tự và trạng thái.' : 'Chỉ sản phẩm đang hoạt động và chưa được chọn mới có thể thêm.'}
              </p>
            </div>
            <button type="button" onClick={closeForm} className="rounded-xl p-2 text-white/60 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
          </div>

          {editing ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base text-white">{editing.product.name}</p>
                <p className="mt-0.5 text-sm text-white/50">{productLabel(editing.product)} · <span className="text-lime-300 font-medium">{formatFeaturedProductPrice(editing.product)}</span></p>
              </div>
            </div>
          ) : (
            <div className={`mt-5 relative ${isDropdownOpen ? 'z-40' : 'z-20'}`} ref={dropdownRef}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/90">Chọn sản phẩm</label>
                <span className="text-xs text-white/40">{availableProducts.length} sản phẩm khả dụng</span>
              </div>

              {/* Custom Dropdown Trigger (Text Only) */}
              <div className="relative mt-2">
                {selectedProduct ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-lime-400/40 bg-lime-400/5 p-3.5 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-white">{selectedProduct.name}</p>
                        {selectedProduct.brand && (
                          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/70">
                            {selectedProduct.brand}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-lime-300 font-medium">
                        {formatFeaturedProductPrice(selectedProduct)}
                        {selectedProduct.category?.name && (
                          <span className="text-white/40 font-normal"> · {selectedProduct.category.name}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15 hover:text-white"
                      >
                        Đổi sản phẩm
                      </button>
                      <button
                        type="button"
                        onClick={() => setProductId('')}
                        className="rounded-xl p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
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
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-black/40 px-4 py-3.5 text-left text-sm transition ${
                      isDropdownOpen ? 'border-lime-400 ring-2 ring-lime-400/20' : 'border-white/15 hover:border-white/30'
                    }`}
                  >
                    <span className="text-white/50">Chọn sản phẩm để thêm vào nổi bật...</span>
                    <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-lime-400' : ''}`} />
                  </button>
                )}

                {/* Dropdown Menu Panel (Text Only) */}
                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/15 bg-neutral-900/95 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Box */}
                    <div className="p-3 border-b border-white/10">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                        <input
                          ref={searchInputRef}
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-9 pr-8 text-sm text-white placeholder-white/40 outline-none transition focus:border-lime-400 focus:ring-1 focus:ring-lime-400/20"
                          placeholder="Tìm theo tên sản phẩm, thương hiệu hoặc danh mục..."
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/40 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Options List (Text Only) */}
                    <div className="max-h-72 overflow-y-auto p-2 divide-y divide-white/5 space-y-1 scrollbar-thin scrollbar-thumb-white/10">
                      {availableProducts.length === 0 ? (
                        <div className="py-8 text-center text-white/40">
                          <p className="text-sm font-medium">Không tìm thấy sản phẩm phù hợp</p>
                          <p className="text-xs text-white/30 mt-1">Thử tìm kiếm với từ khóa khác</p>
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
                                  ? 'bg-lime-400/15 border border-lime-400/40 text-white'
                                  : 'hover:bg-white/10 hover:border-white/15 border border-transparent text-white/90'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-sm">{product.name}</p>
                                  {product.brand && (
                                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
                                      {product.brand}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2 text-xs">
                                  <span className="font-semibold text-lime-300">{formatFeaturedProductPrice(product)}</span>
                                  {product.category?.name && (
                                    <span className="text-white/40">· {product.category.name}</span>
                                  )}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400 text-black">
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
              <label className="text-sm font-semibold text-white/90">Vị trí hiển thị</label>
              <div className="relative mt-2">
                <button
                  type="button"
                  onClick={() => setIsPositionDropdownOpen(!isPositionDropdownOpen)}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl border bg-black/40 px-4 py-3 text-left text-sm transition ${
                    isPositionDropdownOpen ? 'border-lime-400 ring-2 ring-lime-400/20' : 'border-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime-400/20 font-bold text-xs text-lime-300">
                      {sortOrder}
                    </span>
                    <span className="font-medium text-white">
                      {Number(sortOrder) === 1 ? 'Vị trí 1 (Đầu tiên)' : Number(sortOrder) === totalPositions ? `Vị trí ${sortOrder} (Cuối cùng)` : `Vị trí ${sortOrder}`}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white/50 transition-transform duration-200 ${isPositionDropdownOpen ? 'rotate-180 text-lime-400' : ''}`} />
                </button>

                {isPositionDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900/98 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-white/10">
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
                              ? 'bg-lime-400/15 text-lime-300 font-semibold'
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md font-bold text-[11px] ${
                              isSelected ? 'bg-lime-400 text-black' : 'bg-white/10 text-white/70'
                            }`}>
                              {pos}
                            </span>
                            <span>
                              {pos === 1 ? 'Vị trí 1 — Đầu tiên' : pos === totalPositions ? `Vị trí ${pos} — Cuối cùng` : `Vị trí ${pos}`}
                            </span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-lime-400 stroke-[2.5]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm transition hover:border-white/20">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4 rounded accent-lime-400"
              />
              <span className="font-medium text-white/90">Hiển thị trên trang chủ</span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSaving || (!editing && !productId)}
              onClick={() => void save()}
              className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-lime-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editing ? 'Lưu thay đổi' : 'Thêm vào trang chủ'}
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl">
        {isLoading ? (
          <div className="flex min-h-52 items-center justify-center text-white/50">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-lime-400" />
            Đang tải danh sách...
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-white/20 mb-3" />
            <p className="font-semibold text-lg">Chưa có sản phẩm nổi bật.</p>
            <p className="mt-1 text-sm text-white/50">Bấm "Thêm sản phẩm nổi bật" để đưa sản phẩm lên carousel trang chủ.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {featuredProducts.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-white/[0.02] sm:flex-nowrap">
                <ProductThumbnail product={item.product} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-bold text-base">{item.product.name}</h2>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.isActive ? 'border-lime-300/30 bg-lime-400/10 text-lime-200' : 'border-white/10 bg-white/5 text-white/45'}`}>
                      {item.isActive ? 'Đang hiển thị' : 'Đã tắt'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/50">{productLabel(item.product)} · <span className="text-lime-300 font-medium">{formatFeaturedProductPrice(item.product)}</span></p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70">
                  Vị trí: <span className="font-bold text-lime-300">{item.sortOrder}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(item)} className="rounded-xl border border-white/10 p-2.5 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label={`Sửa ${item.product.name}`}>
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => void remove(item)} className="rounded-xl border border-red-300/20 p-2.5 text-red-300 transition hover:bg-red-400/10" aria-label={`Gỡ ${item.product.name} khỏi nổi bật`}>
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
