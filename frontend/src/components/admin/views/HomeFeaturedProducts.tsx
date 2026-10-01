import { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Image as ImageIcon, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
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

function ProductThumbnail({ product }: { product: HomeFeaturedProductData }) {
  const image = getFeaturedProductImage(product);
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-white/30" />}
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

  const featuredProductIds = useMemo(() => new Set(featuredProducts.map((item) => item.productId)), [featuredProducts]);
  const availableProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => product.status === 'active' && !featuredProductIds.has(product.id))
      .filter((product) => !query || product.name.toLowerCase().includes(query) || product.brand?.toLowerCase().includes(query));
  }, [featuredProductIds, products, search]);

  const resetForm = () => {
    setProductId('');
    setSortOrder(String(featuredProducts.length + 1));
    setIsActive(true);
    setEditing(null);
    setSearch('');
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
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{editing ? 'Cập nhật hiển thị' : 'Thêm sản phẩm nổi bật'}</h2><p className="mt-1 text-sm text-white/50">{editing ? 'Sản phẩm được giữ cố định; chỉ thay đổi thứ tự và trạng thái.' : 'Chỉ sản phẩm đang hoạt động và chưa được chọn mới có thể thêm.'}</p></div><button type="button" onClick={closeForm} className="rounded-xl p-2 text-white/60 hover:bg-white/10"><X className="h-5 w-5" /></button></div>
          {editing ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"><ProductThumbnail product={editing.product} /><div><p className="font-semibold">{editing.product.name}</p><p className="text-sm text-white/50">{productLabel(editing.product)}</p></div></div>
          ) : (
            <div className="mt-5"><label className="text-sm font-semibold">Chọn sản phẩm</label><div className="relative mt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-lime-400" placeholder="Tìm theo tên hoặc thương hiệu" /></div><select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-lime-400"><option value="">Chọn sản phẩm</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{productLabel(product)} · {formatFeaturedProductPrice(product)}</option>)}</select></div>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,180px)_1fr]"><div><label className="text-sm font-semibold">Vị trí hiển thị</label><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-lime-400">{Array.from({ length: editing ? featuredProducts.length : featuredProducts.length + 1 }, (_, i) => i + 1).map((pos) => <option key={pos} value={pos}>{pos}{pos === 1 ? ' — Đầu tiên' : pos === (editing ? featuredProducts.length : featuredProducts.length + 1) ? ' — Cuối cùng' : ''}</option>)}</select></div><label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-lime-400" /> Hiển thị trên trang chủ</label></div>
          <div className="mt-5 flex justify-end"><button type="button" disabled={isSaving} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-lime-400 px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? 'Lưu thay đổi' : 'Thêm vào trang chủ'}</button></div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/25 backdrop-blur-xl">
        {isLoading ? <div className="flex min-h-52 items-center justify-center text-white/50"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Đang tải…</div> : featuredProducts.length === 0 ? <div className="p-10 text-center"><p className="font-semibold">Chưa có sản phẩm nổi bật.</p><p className="mt-2 text-sm text-white/50">Thêm một sản phẩm để hiển thị trong carousel trang chủ.</p></div> : <div className="divide-y divide-white/10">{featuredProducts.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap"><ProductThumbnail product={item.product} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-bold">{item.product.name}</h2><span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${item.isActive ? 'border-lime-300/30 bg-lime-400/10 text-lime-200' : 'border-white/10 bg-white/5 text-white/45'}`}>{item.isActive ? 'Đang hiển thị' : 'Đã tắt'}</span></div><p className="mt-1 text-sm text-white/50">{productLabel(item.product)} · {formatFeaturedProductPrice(item.product)}</p></div><p className="text-sm text-white/50">Vị trí: <span className="font-semibold text-white">{item.sortOrder}</span></p><div className="flex gap-2"><button type="button" onClick={() => openEdit(item)} className="rounded-xl border border-white/10 p-2.5 text-white/70 hover:bg-white/10" aria-label={`Sửa ${item.product.name}`}><Edit3 className="h-4 w-4" /></button><button type="button" onClick={() => void remove(item)} className="rounded-xl border border-red-300/20 p-2.5 text-red-300 hover:bg-red-400/10" aria-label={`Gỡ ${item.product.name} khỏi nổi bật`}><Trash2 className="h-4 w-4" /></button></div></article>)}</div>}
      </div>
    </section>
  );
}
