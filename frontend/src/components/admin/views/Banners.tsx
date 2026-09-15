import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent, ReactNode, WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown, ArrowUp, CalendarClock, Check, ChevronDown, Clock, Edit3, Eye,
  Image as ImageIcon, Layers, LayoutTemplate, Link as LinkIcon, Loader2, Monitor,
  Plus, Search, SlidersHorizontal, Smartphone, Trash2, UploadCloud, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type BannerStatus = 'active' | 'scheduled' | 'expired' | 'disabled';
type DestinationType = 'none' | 'product' | 'brand' | 'category' | 'custom';
type Feedback = { tone: 'success' | 'error'; message: string } | null;

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProductOption { id: string; name: string; }
interface CategoryOption { id: string; name: string; slug: string; children?: CategoryOption[]; }
interface PositionOption { value: string; label: string; }
interface PositionGroup { label: string; options: readonly PositionOption[]; }

interface BannerFormState {
  title: string;
  image: string;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  destinationType: DestinationType;
  destinationValue: string;
  link: string;
}

const POSITION_GROUPS: readonly PositionGroup[] = [
  {
    label: 'Trang chủ',
    options: [
      { value: 'home_hero', label: 'Trang chủ · Hero Slider' },
      { value: 'home_promo', label: 'Trang chủ · Promotional Banner' },
    ],
  },
  {
    label: 'Smartphone',
    options: [
      { value: 'smartphone_hero', label: 'Smartphone · Hero Banner' },
      { value: 'iphone_hero', label: 'Smartphone · iPhone Hero' },
      { value: 'samsung_hero', label: 'Smartphone · Samsung Hero' },
      { value: 'xiaomi_hero', label: 'Smartphone · Xiaomi Hero' },
      { value: 'oppo_hero', label: 'Smartphone · OPPO Hero' },
    ],
  },
  {
    label: 'Danh mục khác',
    options: [
      { value: 'laptop_hero', label: 'Laptop · Hero Banner' },
      { value: 'tablet_hero', label: 'Tablet · Hero Banner' },
      { value: 'watch_hero', label: 'Watch · Hero Banner' },
    ],
  },
  {
    label: 'Vị trí cũ',
    options: [
      { value: 'homepage', label: 'Trang chủ (vị trí cũ)' },
      { value: 'category', label: 'Danh mục (vị trí cũ)' },
      { value: 'popup', label: 'Popup quảng cáo (vị trí cũ)' },
    ],
  },
] as const;

const BRAND_DESTINATIONS = [
  { value: 'iphone', label: 'iPhone', path: '/iphone' },
  { value: 'samsung', label: 'Samsung', path: '/samsung' },
  { value: 'xiaomi', label: 'Xiaomi', path: '/xiaomi' },
  { value: 'oppo', label: 'OPPO', path: '/oppo' },
] as const;

const STATUS_CONFIG: Record<BannerStatus, { label: string; className: string }> = {
  active: { label: 'Đang chạy', className: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  scheduled: { label: 'Sắp chạy', className: 'border-sky-300/25 bg-sky-400/10 text-sky-200' },
  expired: { label: 'Đã hết hạn', className: 'border-amber-300/25 bg-amber-400/10 text-amber-200' },
  disabled: { label: 'Đã tắt', className: 'border-white/10 bg-white/[0.05] text-white/45' },
};

const createEmptyForm = (): BannerFormState => ({
  title: '', image: '', position: 'home_hero', sortOrder: 0, isActive: true,
  startDate: '', endDate: '', destinationType: 'none', destinationValue: '', link: '',
});

const toImageUrl = resolveMediaUrl;

const toDateInputValue = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (value: string | null) => {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không xác định' : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

const getBannerStatus = (banner: Pick<Banner, 'isActive' | 'startDate' | 'endDate'>): BannerStatus => {
  if (!banner.isActive) return 'disabled';
  const now = Date.now();
  if (banner.startDate && new Date(banner.startDate).getTime() > now) return 'scheduled';
  if (banner.endDate && new Date(banner.endDate).getTime() < now) return 'expired';
  return 'active';
};

const getPositionLabel = (position: string) => {
  for (const group of POSITION_GROUPS) {
    const option = group.options.find((item) => item.value === position);
    if (option) return option.label;
  }
  return position;
};

const flattenCategories = (categories: CategoryOption[]): CategoryOption[] =>
  categories.flatMap((category) => [category, ...(category.children ? flattenCategories(category.children) : [])]);

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { message?: unknown };
    return typeof payload.message === 'string' ? payload.message : fallback;
  } catch { return fallback; }
};

const isValidCustomLink = (value: string) => value.startsWith('/') || /^https?:\/\//i.test(value);

export function Banners() {
  const { token } = useAuthStore();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [bannerPendingDelete, setBannerPendingDelete] = useState<Banner | null>(null);
  const [form, setForm] = useState<BannerFormState>(createEmptyForm);
  const [formError, setFormError] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [updatingBannerId, setUpdatingBannerId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | BannerStatus>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'running' | 'upcoming' | 'expired'>('all');

  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);
  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const modalFormRef = useRef<HTMLFormElement>(null);
  const mainListRef = useRef<HTMLDivElement>(null);

  const handleModalWheel = (e: WheelEvent<HTMLElement>) => {
    if (!modalFormRef.current) return;
    const target = e.target as HTMLElement;
    const nested = target.closest('.overflow-y-auto');
    if (nested && nested !== modalFormRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = nested;
      const canScrollUp = scrollTop > 0 && e.deltaY < 0;
      const canScrollDown = scrollTop + clientHeight < scrollHeight && e.deltaY > 0;
      if (canScrollUp || canScrollDown) return;
    }
    modalFormRef.current.scrollTop += e.deltaY;
  };

  const handleListWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!mainListRef.current) return;
    mainListRef.current.scrollTop += e.deltaY;
  };

  const fetchBanners = async () => {
    try {
      setIsLoading(true); setLoadError('');
      const response = await fetch(`${API_BASE_URL}/api/banners`, { headers: authHeaders });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể tải danh sách banner.'));
      setBanners((await response.json()) as Banner[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách banner.');
    } finally { setIsLoading(false); }
  };

  const fetchDestinationData = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/products`), fetch(`${API_BASE_URL}/api/categories`),
      ]);
      if (productsResponse.ok) setProducts((await productsResponse.json()) as ProductOption[]);
      if (categoriesResponse.ok) setCategories((await categoriesResponse.json()) as CategoryOption[]);
    } catch {
      // Optional suggestions do not block Banner CRUD.
    }
  };

  useEffect(() => { void fetchBanners(); void fetchDestinationData(); }, [token]);

  useEffect(() => {
    if (!isModalOpen && !previewBanner && !bannerPendingDelete) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isSubmitting) return;
      setIsModalOpen(false); setPreviewBanner(null); setBannerPendingDelete(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bannerPendingDelete, isModalOpen, isSubmitting, previewBanner]);

  const visibleBanners = useMemo(() => {
    const query = search.trim().toLowerCase();
    return banners.filter((banner) => {
      const status = getBannerStatus(banner);
      const searchMatch = !query || [banner.title, banner.position, banner.link ?? ''].some((value) => value.toLowerCase().includes(query));
      const positionMatch = positionFilter === 'all' || banner.position === positionFilter;
      const statusMatch = statusFilter === 'all' || status === statusFilter;
      const timeMatch = timeFilter === 'all'
        || (timeFilter === 'running' && status === 'active')
        || (timeFilter === 'upcoming' && status === 'scheduled')
        || (timeFilter === 'expired' && status === 'expired');
      return searchMatch && positionMatch && statusMatch && timeMatch;
    });
  }, [banners, positionFilter, search, statusFilter, timeFilter]);

  const knownPositions = useMemo(() => {
    const options = POSITION_GROUPS.flatMap((group) => group.options);
    const unknown = banners.map((banner) => banner.position)
      .filter((position, index, all) => !options.some((option) => option.value === position) && all.indexOf(position) === index)
      .map((position) => ({ value: position, label: position }));
    return [...options, ...unknown];
  }, [banners]);

  const positionFilterOptions = useMemo<FilterOptionItem[]>(() => {
    const list: FilterOptionItem[] = [
      {
        value: 'all',
        label: 'Tất cả vị trí',
        shortLabel: 'Tất cả',
        icon: <Layers className="h-3.5 w-3.5 text-lime-400" />,
      },
    ];

    POSITION_GROUPS.forEach((group) => {
      group.options.forEach((opt) => {
        list.push({
          value: opt.value,
          label: opt.label,
          shortLabel: opt.label.replace(/^.*·\s*/, ''),
          group: group.label,
        });
      });
    });

    const knownValues = new Set(list.map((item) => item.value));
    banners.forEach((b) => {
      if (!knownValues.has(b.position)) {
        knownValues.add(b.position);
        list.push({
          value: b.position,
          label: b.position,
          shortLabel: b.position,
          group: 'Khác',
        });
      }
    });

    return list;
  }, [banners]);

  const statusFilterOptions = useMemo<FilterOptionItem[]>(() => [
    {
      value: 'all',
      label: 'Tất cả trạng thái',
      shortLabel: 'Tất cả',
      icon: <SlidersHorizontal className="h-3.5 w-3.5 text-white/50" />,
      sublabel: 'Xem mọi trạng thái',
    },
    {
      value: 'active',
      label: 'Đang chạy',
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      sublabel: 'Đang hiển thị công khai',
    },
    {
      value: 'scheduled',
      label: 'Sắp chạy',
      dotColor: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      sublabel: 'Theo lịch hẹn giờ',
    },
    {
      value: 'expired',
      label: 'Đã hết hạn',
      dotColor: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
      sublabel: 'Đã qua ngày kết thúc',
    },
    {
      value: 'disabled',
      label: 'Đã tắt',
      dotColor: 'bg-neutral-500',
      sublabel: 'Tạm ẩn thủ công',
    },
  ], []);

  const timeFilterOptions = useMemo<FilterOptionItem[]>(() => [
    {
      value: 'all',
      label: 'Tất cả thời gian',
      shortLabel: 'Tất cả',
      icon: <Clock className="h-3.5 w-3.5 text-white/50" />,
      sublabel: 'Mọi khung thời gian',
    },
    {
      value: 'running',
      label: 'Đang chạy',
      dotColor: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
      sublabel: 'Trong hạn hiệu lực',
    },
    {
      value: 'upcoming',
      label: 'Sắp chạy',
      dotColor: 'bg-sky-400 shadow-[0_0_8px_#38bdf8]',
      sublabel: 'Chưa đến ngày bắt đầu',
    },
    {
      value: 'expired',
      label: 'Đã hết hạn',
      dotColor: 'bg-rose-400 shadow-[0_0_8px_#f43f5e]',
      sublabel: 'Đã quá hạn hiển thị',
    },
  ], []);

  const openCreate = () => {
    setEditingBanner(null); setForm(createEmptyForm()); setFormError('');
    setProductSearch(''); setPreviewMode('desktop'); setIsModalOpen(true);
  };

  const inferDestination = (link: string | null): Pick<BannerFormState, 'destinationType' | 'destinationValue' | 'link'> => {
    if (!link) return { destinationType: 'none', destinationValue: '', link: '' };
    const brand = BRAND_DESTINATIONS.find((item) => item.path === link);
    if (brand) return { destinationType: 'brand', destinationValue: brand.value, link: '' };
    if (link.startsWith('/product/')) return { destinationType: 'product', destinationValue: link.replace('/product/', ''), link: '' };
    return { destinationType: 'custom', destinationValue: '', link };
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({ title: banner.title, image: banner.image, position: banner.position, sortOrder: banner.sortOrder,
      isActive: banner.isActive, startDate: toDateInputValue(banner.startDate), endDate: toDateInputValue(banner.endDate), ...inferDestination(banner.link) });
    setFormError(''); setProductSearch(''); setPreviewMode('desktop'); setIsModalOpen(true);
  };

  const getFinalLink = () => {
    if (form.destinationType === 'none') return '';
    if (form.destinationType === 'brand') return BRAND_DESTINATIONS.find((brand) => brand.value === form.destinationValue)?.path ?? '';
    if (form.destinationType === 'product') return form.destinationValue ? `/product/${form.destinationValue}` : '';
    return form.link.trim();
  };

  const uploadImage = async (file: File) => {
    if (!file.type.startsWith('image/')) { setFormError('Chỉ có thể tải lên tệp hình ảnh.'); return; }
    if (file.size > MAX_IMAGE_SIZE) { setFormError('Ảnh vượt quá dung lượng 5MB cho phép.'); return; }
    setIsUploading(true); setFormError('');
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const response = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: uploadData });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể tải ảnh lên.'));
      const data = (await response.json()) as { url?: unknown; imageUrl?: unknown };
      const imageUrl = (typeof data.url === 'string' && data.url)
        ? data.url
        : (typeof data.imageUrl === 'string' && data.imageUrl) ? data.imageUrl : null;
      if (!imageUrl) throw new Error('Server không trả về đường dẫn ảnh.');
      setForm((current) => ({ ...current, image: imageUrl }));
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể tải ảnh lên.');
    } finally { setIsUploading(false); }
  };

  const handleImageInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadImage(file);
    event.target.value = '';
  };

  const handleImageDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadImage(file);
  };

  const updateBanner = async (id: string, payload: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/api/banners/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders }, body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể cập nhật banner.'));
    return (await response.json()) as { banner: Banner };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const finalLink = getFinalLink();
    const startDate = form.startDate ? new Date(form.startDate) : null;
    const endDate = form.endDate ? new Date(form.endDate) : null;
    if (!form.title.trim() || !form.image || !form.position) {
      setFormError('Vui lòng hoàn tất tiêu đề, hình ảnh và vị trí hiển thị.'); return;
    }
    if (form.destinationType !== 'none' && !finalLink) {
      setFormError('Vui lòng chọn đích đến hoặc nhập URL tùy chỉnh.'); return;
    }
    if (finalLink && !isValidCustomLink(finalLink)) {
      setFormError('Đường dẫn phải bắt đầu bằng "/" hoặc là URL http(s) hợp lệ.'); return;
    }
    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      setFormError('Thời gian chạy không hợp lệ.'); return;
    }
    if (startDate && endDate && endDate <= startDate) {
      setFormError('Thời gian kết thúc phải sau thời gian bắt đầu.'); return;
    }

    setIsSubmitting(true); setFormError('');
    try {
      const isEditing = Boolean(editingBanner);
      const response = await fetch(isEditing ? `${API_BASE_URL}/api/banners/${editingBanner?.id}` : `${API_BASE_URL}/api/banners`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ title: form.title.trim(), image: form.image, link: finalLink || null, position: form.position,
          sortOrder: form.sortOrder, isActive: form.isActive, startDate: form.startDate || null, endDate: form.endDate || null }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể lưu banner.'));
      setIsModalOpen(false);
      setFeedback({ tone: 'success', message: isEditing ? 'Đã lưu thay đổi banner.' : 'Đã tạo banner mới.' });
      await fetchBanners();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu banner.');
    } finally { setIsSubmitting(false); }
  };

  const handleToggleBanner = async (banner: Banner) => {
    if (updatingBannerId === banner.id) return;

    const previousBanners = banners;
    const nextValue = !banner.isActive;

    setUpdatingBannerId(banner.id);

    // Optimistic update
    setBanners((current) =>
      current.map((item) =>
        item.id === banner.id ? { ...item, isActive: nextValue } : item
      )
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${banner.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ isActive: nextValue }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Không thể cập nhật trạng thái banner.'));
      }

      const result = (await response.json()) as { banner: Banner; message: string };
      setBanners((current) =>
        current.map((item) =>
          item.id === banner.id ? result.banner : item
        )
      );
      setFeedback({ tone: 'success', message: result.message || (nextValue ? 'Đã bật banner.' : 'Đã tắt banner.') });
    } catch (error) {
      setBanners(previousBanners);
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái banner.' });
    } finally {
      setUpdatingBannerId(null);
    }
  };

  const moveBanner = async (banner: Banner, direction: 'up' | 'down') => {
    if (updatingBannerId) return;
    setUpdatingBannerId(banner.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${banner.id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ direction }),
      });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể đổi thứ tự banner.'));
      await fetchBanners();
      setFeedback({ tone: 'success', message: 'Đã cập nhật thứ tự banner.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể cập nhật thứ tự.' });
    } finally {
      setUpdatingBannerId(null);
    }
  };

  const deleteBanner = async () => {
    if (!bannerPendingDelete) return;
    const banner = bannerPendingDelete;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/banners/${banner.id}`, { method: 'DELETE', headers: authHeaders });
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Không thể xóa banner.'));
      setBanners((current) => current.filter((item) => item.id !== banner.id));
      setBannerPendingDelete(null); setFeedback({ tone: 'success', message: 'Đã xóa banner.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error instanceof Error ? error.message : 'Không thể xóa banner.' });
    } finally { setIsSubmitting(false); }
  };

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 6);
  const finalLink = getFinalLink();

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 text-white">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-lime-400">Nội dung storefront</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Banner</h1>
          <p className="mt-1 text-sm text-white/50">Quản lý và cập nhật hình ảnh quảng cáo trên website.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-black shadow-[0_12px_28px_rgba(163,230,53,0.2)] transition-all hover:bg-lime-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-lime-300 cursor-pointer">
          <Plus className="h-4 w-4" aria-hidden="true" /> Thêm Banner Mới
        </button>
      </header>

      <div className="relative z-30 grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 backdrop-blur-md sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_180px_180px]">
        <label className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3.5 transition-all focus-within:border-lime-400 focus-within:ring-1 focus-within:ring-lime-400/30">
          <Search className="h-4 w-4 text-white/40 shrink-0" aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            placeholder="Tìm banner, vị trí hoặc đường dẫn..."
            aria-label="Tìm kiếm banner"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>
        <FilterDropdown
          label="Vị trí"
          value={positionFilter}
          onChange={setPositionFilter}
          options={positionFilterOptions}
          icon={<Layers className="h-3.5 w-3.5" />}
          menuWidth="w-72 sm:w-80"
          align="left"
        />
        <FilterDropdown
          label="Trạng thái"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as 'all' | BannerStatus)}
          options={statusFilterOptions}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          menuWidth="w-56"
          align="right"
        />
        <FilterDropdown
          label="Thời gian"
          value={timeFilter}
          onChange={(value) => setTimeFilter(value as typeof timeFilter)}
          options={timeFilterOptions}
          icon={<Clock className="h-3.5 w-3.5" />}
          menuWidth="w-60"
          align="right"
        />
      </div>

      <div ref={mainListRef} onWheel={handleListWheel} className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading ? <div className="space-y-3">{[0, 1, 2].map((index) => <div key={index} className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/[0.035]" />)}</div>
          : loadError ? <LoadError message={loadError} onRetry={() => void fetchBanners()} />
          : banners.length === 0 ? <EmptyState onCreate={openCreate} />
          : visibleBanners.length === 0 ? <NoMatches onReset={() => { setSearch(''); setPositionFilter('all'); setStatusFilter('all'); setTimeFilter('all'); }} />
          : <div className="space-y-3 pb-8">{visibleBanners.map((banner, index) => {
            const group = banners.filter((item) => item.position === banner.position).sort((first, second) => first.sortOrder - second.sortOrder || first.createdAt.localeCompare(second.createdAt));
            const itemIndex = group.findIndex((item) => item.id === banner.id);
            return <BannerRow key={banner.id} banner={banner} index={index} canMoveUp={itemIndex > 0} canMoveDown={itemIndex < group.length - 1}
              onPreview={() => setPreviewBanner(banner)} onEdit={() => openEdit(banner)} onToggle={() => void handleToggleBanner(banner)} onDelete={() => setBannerPendingDelete(banner)} onMove={(direction) => void moveBanner(banner, direction)} isUpdating={updatingBannerId === banner.id} />;
          })}</div>}
      </div>

      <AnimatePresence>{feedback && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} role="status" className={`fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${feedback.tone === 'success' ? 'border-lime-400/30 bg-lime-400/15 text-lime-100' : 'border-red-400/30 bg-red-500/15 text-red-100'}`}>{feedback.message}</motion.div>}</AnimatePresence>

      {/* Main Create / Edit Banner Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalShell
            onClose={() => !isSubmitting && setIsModalOpen(false)}
            onWheel={handleModalWheel}
            maxWidth="max-w-3xl"
          >
            {/* Modal Top Header (Pinned at Top) */}
            <div className="flex items-center justify-between border-b border-white/10 bg-neutral-900/95 px-6 py-4 sm:px-8 shrink-0 z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-lime-400/15 text-lime-400 border border-lime-400/30">
                  Banner Management
                </span>
                <h2 id="banner-form-title" className="mt-1 text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                  {editingBanner ? 'Chỉnh Sửa Banner' : 'Thêm Banner Mới'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Đóng biểu mẫu banner"
                className="rounded-xl p-2.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body (Direct scroll container - 100% native mouse wheel support) */}
            <form
              id="banner-modal-form"
              ref={modalFormRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="banner-form-title"
              onSubmit={handleSubmit}
              onWheel={handleModalWheel}
              className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar sm:px-8 sm:py-7 space-y-6 min-h-0"
            >
              {/* Section 1: Thông tin cơ bản & Hình ảnh */}
              <FormSection title="1. Thông tin cơ bản & Hình ảnh" description="Tiêu đề quản trị, vị trí hiển thị và tệp ảnh banner tải lên.">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel htmlFor="banner-title" label="Tiêu đề nội bộ" required hint="Dùng để nhận diện trong trang quản trị Admin." />
                      <input
                        id="banner-title"
                        required
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        className="form-input mt-1.5"
                        placeholder="Ví dụ: Galaxy S26 Ultra Launching Banner"
                      />
                    </div>

                    <div>
                      <FieldLabel htmlFor="banner-position" label="Vị trí hiển thị trên website" required hint="Khu vực storefront sẽ hiển thị banner này." />
                      <PositionDropdown
                        value={form.position}
                        onChange={(newPosition) => setForm((current) => ({ ...current, position: newPosition }))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="banner-image" label="Tải ảnh banner lên" required hint="Khuyến nghị tỉ lệ 16:6, 21:9 hoặc 16:9 · tối đa 5MB." />
                    <label
                      htmlFor="banner-image"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImageDrop}
                      className="group relative mt-2 flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-black/40 transition-all duration-200 hover:border-lime-400/80 hover:bg-black/60"
                    >
                      {form.image ? (
                        <>
                          <img
                            src={toImageUrl(form.image)}
                            alt="Xem trước ảnh banner đã tải lên"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="rounded-xl border border-white/30 bg-black/70 px-4 py-2 text-xs font-bold text-white shadow-lg">
                              Thay đổi hình ảnh khác
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2.5 px-6 text-center text-white/50">
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-lime-400" />
                          ) : (
                            <UploadCloud className="h-8 w-8 text-lime-400/80 group-hover:scale-110 transition-transform" />
                          )}
                          <div>
                            <span className="text-sm font-bold text-white block">
                              Kéo thả hoặc click để chọn ảnh tải lên
                            </span>
                            <span className="text-xs text-white/40 block mt-0.5">
                              Hỗ trợ PNG, JPG, WEBP (tối đa 5MB)
                            </span>
                          </div>
                        </div>
                      )}
                      <input
                        id="banner-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageInput}
                        className="sr-only"
                        disabled={isUploading}
                      />
                    </label>

                    {form.image && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs text-lime-400 font-medium truncate max-w-md">
                          ✓ Đã tải lên ảnh thành công
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, image: '' }))}
                          className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          Xóa ảnh này
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Integrated Live Preview Box */}
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/50 p-4 sm:p-5 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-lime-400" />
                        <span className="text-sm font-bold text-white">Xem trước hiển thị (Live Preview)</span>
                      </div>
                      <div className="flex rounded-xl border border-white/10 bg-black/40 p-1">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('desktop')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            previewMode === 'desktop' ? 'bg-lime-400 text-black shadow-sm' : 'text-white/50 hover:text-white'
                          }`}
                        >
                          <Monitor className="h-3.5 w-3.5" />
                          <span>Desktop</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('mobile')}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            previewMode === 'mobile' ? 'bg-lime-400 text-black shadow-sm' : 'text-white/50 hover:text-white'
                          }`}
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Mobile</span>
                        </button>
                      </div>
                    </div>

                    {/* Simulated Banner Container */}
                    <div className="mt-4 flex justify-center">
                      <div
                        className={`relative overflow-hidden rounded-xl border border-white/15 bg-black/70 shadow-inner transition-all duration-300 ${
                          previewMode === 'desktop' ? 'aspect-[21/9] sm:aspect-[16/6] w-full max-w-xl' : 'aspect-[9/16] w-48'
                        }`}
                      >
                        {form.image ? (
                          <img
                            src={toImageUrl(form.image)}
                            alt="Preview banner"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/30 p-4 text-center">
                            <ImageIcon className="h-9 w-9 text-white/20" />
                            <span className="text-xs font-medium">Chưa có ảnh banner</span>
                          </div>
                        )}

                        {/* Banner Location & Title Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-md mb-0.5 border border-white/10">
                            {getPositionLabel(form.position)}
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm">
                            {form.title || 'Tiêu đề banner'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Section 2: Đích đến khi click */}
              <FormSection title="2. Đích đến khi click (Navigation Link)" description="Chọn trang storefront điều hướng đến khi người dùng click vào banner.">
                <FieldLabel htmlFor="destination-type" label="Kiểu điều hướng" />
                <FormSelect
                  id="destination-type"
                  value={form.destinationType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      destinationType: event.target.value as DestinationType,
                      destinationValue: '',
                      link: '',
                    }))
                  }
                  className="mt-1.5"
                >
                  <option value="none">Không điều hướng</option>
                  <option value="brand">Trang thương hiệu (iPhone, Samsung, Xiaomi, OPPO)</option>
                  <option value="product">Trang chi tiết sản phẩm</option>
                  <option value="category">Danh mục sản phẩm</option>
                  <option value="custom">URL tùy chỉnh</option>
                </FormSelect>

                {form.destinationType === 'brand' && (
                  <div className="mt-4">
                    <FieldLabel htmlFor="destination-brand" label="Thương hiệu đích" />
                    <FormSelect
                      id="destination-brand"
                      value={form.destinationValue}
                      onChange={(event) => setForm((current) => ({ ...current, destinationValue: event.target.value }))}
                      className="mt-1.5"
                    >
                      <option value="">Chọn thương hiệu</option>
                      {BRAND_DESTINATIONS.map((brand) => (
                        <option key={brand.value} value={brand.value}>
                          {brand.label} ({brand.path})
                        </option>
                      ))}
                    </FormSelect>
                  </div>
                )}

                {form.destinationType === 'product' && (
                  <div className="mt-4">
                    <FieldLabel htmlFor="destination-product-search" label="Chọn sản phẩm đích" />
                    <div className="relative mt-1.5">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        id="destination-product-search"
                        value={productSearch}
                        onChange={(event) => setProductSearch(event.target.value)}
                        className="form-input pl-10"
                        placeholder="Tìm kiếm sản phẩm theo tên..."
                      />
                    </div>
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-2 custom-scrollbar">
                      {filteredProducts.length ? (
                        filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, destinationValue: product.id }))}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                              form.destinationValue === product.id
                                ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                                : 'text-white/75 hover:bg-white/10'
                            }`}
                          >
                            <span className="truncate">{product.name}</span>
                            {form.destinationValue === product.id && <Check className="ml-3 h-4 w-4 shrink-0 text-lime-400" />}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-white/40">Không tìm thấy sản phẩm phù hợp.</p>
                      )}
                    </div>
                  </div>
                )}

                {form.destinationType === 'category' && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <FieldLabel htmlFor="destination-category" label="Danh mục sản phẩm" />
                      <FormSelect
                        id="destination-category"
                        value={form.destinationValue}
                        onChange={(event) => setForm((current) => ({ ...current, destinationValue: event.target.value }))}
                        className="mt-1.5"
                      >
                        <option value="">Chọn danh mục</option>
                        {flatCategories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </FormSelect>
                    </div>
                    <div>
                      <FieldLabel htmlFor="destination-category-link" label="Đường dẫn tùy chỉnh danh mục" />
                      <input
                        id="destination-category-link"
                        value={form.link}
                        onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                        className="form-input mt-1.5"
                        placeholder="/category/smartphone"
                      />
                    </div>
                  </div>
                )}

                {form.destinationType === 'custom' && (
                  <div className="mt-4">
                    <FieldLabel htmlFor="destination-link" label="Đường dẫn URL" hint="Bắt đầu bằng / hoặc https://" />
                    <input
                      id="destination-link"
                      value={form.link}
                      onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))}
                      className="form-input mt-1.5"
                      placeholder="/khuyen-mai hoặc https://..."
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 text-xs sm:text-sm">
                  <LinkIcon className="h-4 w-4 shrink-0 text-lime-400" />
                  <span className="shrink-0 text-white/50">Đường dẫn click:</span>
                  <span className="min-w-0 truncate font-mono font-bold text-white">
                    {finalLink || 'Không điều hướng'}
                  </span>
                </div>
              </FormSection>

              {/* Section 3: Hiển thị & Thứ tự */}
              <FormSection title="3. Trạng thái & Lịch chạy" description="Cài đặt hiển thị, số thứ tự ưu tiên và thời gian bắt đầu/kết thúc.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Switch */}
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/35 p-4">
                    <div>
                      <p className="text-sm font-bold text-white">Hiển thị banner</p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {form.isActive ? 'Đang kích hoạt trên web' : 'Đang tắt / ẩn'}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.isActive}
                      aria-label="Hiển thị banner"
                      onClick={() => setForm((current) => ({ ...current, isActive: !current.isActive }))}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                        form.isActive ? 'border border-lime-400/80 bg-lime-400' : 'border border-white/20 bg-white/10'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                          form.isActive ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sort Order Input */}
                  <div className="rounded-xl border border-white/10 bg-black/35 p-4 flex flex-col justify-between">
                    <FieldLabel htmlFor="banner-sort-order" label="Thứ tự hiển thị" hint="Số nhỏ hơn được ưu tiên trước." />
                    <input
                      id="banner-sort-order"
                      type="number"
                      min="0"
                      step="1"
                      value={form.sortOrder}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, sortOrder: Math.max(0, Number(event.target.value) || 0) }))
                      }
                      className="form-input mt-1.5"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Lịch chạy */}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="banner-start-date" label="Bắt đầu chạy" hint="Để trống nếu không giới hạn." />
                    <input
                      id="banner-start-date"
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                      className="form-input mt-1.5"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="banner-end-date" label="Kết thúc" hint="Để trống nếu chạy liên tục." />
                    <input
                      id="banner-end-date"
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                      className="form-input mt-1.5"
                    />
                  </div>
                </div>
              </FormSection>

              {formError && (
                <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3 text-sm text-red-200 font-medium">
                  {formError}
                </p>
              )}
            </form>

            {/* Modal Bottom Footer (Pinned at Bottom) */}
            <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-neutral-900/95 px-6 py-4 sm:px-8 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white/75 border border-white/15 bg-white/5 hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                form="banner-modal-form"
                disabled={isSubmitting || isUploading}
                className="inline-flex items-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-300 px-6 py-2.5 text-sm font-bold text-black transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Đang lưu...' : editingBanner ? 'Lưu Thay Đổi' : 'Thêm Banner Mới'}
              </button>
            </footer>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Storefront Full Preview Modal */}
      <AnimatePresence>
        {previewBanner && (
          <ModalShell onClose={() => setPreviewBanner(null)} maxWidth="max-w-4xl" className="max-h-[90vh]">
            <div role="dialog" aria-modal="true" aria-labelledby="banner-preview-title" className="w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/15 bg-neutral-950 p-0 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lime-400">Storefront preview</p>
                  <h2 id="banner-preview-title" className="mt-1 text-lg font-bold text-white">{previewBanner.title}</h2>
                </div>
                <button type="button" onClick={() => setPreviewBanner(null)} aria-label="Đóng preview banner" className="rounded-xl p-2 text-white/55 hover:bg-white/10 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="relative aspect-[16/6] overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <img src={toImageUrl(previewBanner.image)} alt={previewBanner.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                    <p className="text-xs font-semibold text-lime-300">{getPositionLabel(previewBanner.position)}</p>
                    <p className="mt-1 text-sm text-white/75">{previewBanner.link || 'Không điều hướng'}</p>
                  </div>
                </div>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {bannerPendingDelete && (
          <ModalShell onClose={() => !isSubmitting && setBannerPendingDelete(null)} maxWidth="max-w-md" className="max-h-[90vh]">
            <div role="alertdialog" aria-modal="true" aria-labelledby="delete-banner-title" className="w-full rounded-2xl sm:rounded-3xl border border-white/15 bg-neutral-950 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-400 border border-red-500/20">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 id="delete-banner-title" className="mt-4 text-xl font-bold text-white">Xóa banner này?</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Banner <span className="font-semibold text-white">{bannerPendingDelete.title}</span> sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" disabled={isSubmitting} onClick={() => setBannerPendingDelete(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white border border-white/10 cursor-pointer">
                  Hủy Bỏ
                </button>
                <button type="button" disabled={isSubmitting} onClick={() => void deleteBanner()} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-400 disabled:opacity-50 cursor-pointer">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xóa Banner
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldLabel({ htmlFor, label, required, hint }: { htmlFor: string; label: string; required?: boolean; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs sm:text-sm font-bold text-white/90 mb-1">
      {label}
      {required && <span className="ml-1 text-lime-400 font-bold">*</span>}
      {hint && <span className="mt-0.5 block text-xs font-normal text-white/45 leading-normal">{hint}</span>}
    </label>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md transition-all duration-200 hover:border-white/15">
      <div className="mb-4 pb-3 border-b border-white/5">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="mt-0.5 text-xs text-white/50 leading-relaxed">{description}</p>
      </div>
      {children}
    </section>
  );
}

function PositionDropdown({
  value,
  onChange,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectedInfo = useMemo(() => {
    for (const group of POSITION_GROUPS) {
      const match = group.options.find((opt) => opt.value === value);
      if (match) {
        return { label: match.label, group: group.label };
      }
    }
    return { label: value, group: 'Tùy chỉnh' };
  }, [value]);

  const getGroupBadge = (groupLabel: string) => {
    switch (groupLabel) {
      case 'Trang chủ':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/20 shrink-0">
            <LayoutTemplate className="h-3 w-3" /> Trang chủ
          </span>
        );
      case 'Smartphone':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold text-lime-400 border border-lime-400/20 shrink-0">
            <Smartphone className="h-3 w-3" /> Smartphone
          </span>
        );
      case 'Danh mục khác':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold text-sky-300 border border-sky-400/20 shrink-0">
            <Monitor className="h-3 w-3" /> Danh mục
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/60 border border-white/10 shrink-0">
            <CalendarClock className="h-3 w-3" /> Khác
          </span>
        );
    }
  };

  const getGroupIcon = (groupLabel: string) => {
    switch (groupLabel) {
      case 'Trang chủ':
        return <LayoutTemplate className="h-3.5 w-3.5 text-amber-400" />;
      case 'Smartphone':
        return <Smartphone className="h-3.5 w-3.5 text-lime-400" />;
      case 'Danh mục khác':
        return <Monitor className="h-3.5 w-3.5 text-sky-400" />;
      default:
        return <CalendarClock className="h-3.5 w-3.5 text-neutral-400" />;
    }
  };

  const allOptions = useMemo(() => POSITION_GROUPS.flatMap((g) => g.options), []);

  const handleTriggerWheel = (e: React.WheelEvent) => {
    if (isOpen) return;
    e.stopPropagation();
    const currentIndex = allOptions.findIndex((opt) => opt.value === value);
    if (currentIndex === -1) return;

    if (e.deltaY > 0 && currentIndex < allOptions.length - 1) {
      onChange(allOptions[currentIndex + 1].value);
    } else if (e.deltaY < 0 && currentIndex > 0) {
      onChange(allOptions[currentIndex - 1].value);
    }
  };

  const handleMenuWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.scrollTop += e.deltaY;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id="banner-position"
        onClick={() => setIsOpen((prev) => !prev)}
        onWheel={handleTriggerWheel}
        title="Click để chọn hoặc lăn chuột để thay đổi nhanh vị trí"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'border-lime-400/90 bg-neutral-900 shadow-[0_0_20px_rgba(163,230,53,0.18)] ring-1 ring-lime-400/40'
            : 'border-white/15 bg-black/40 hover:border-white/30 hover:bg-black/60'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {getGroupBadge(selectedInfo.group)}
          <span className="truncate font-semibold text-white">{selectedInfo.label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180 text-lime-400' : 'text-white/40 group-hover:text-white'
          }`}
        />
      </button>

      {/* Dropdown Menu Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onWheel={handleMenuWheel}
            className="absolute left-0 right-0 top-full z-[80] mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-neutral-900/95 p-2 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl custom-scrollbar"
            role="listbox"
          >
            {POSITION_GROUPS.map((group, groupIdx) => (
              <div key={group.label} className={groupIdx > 0 ? 'mt-2 pt-2 border-t border-white/10' : ''}>
                <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-white/40">
                  {getGroupIcon(group.label)}
                  <span>{group.label}</span>
                </div>
                <div className="mt-1 space-y-1">
                  {group.options.map((opt) => {
                    const isSelected = opt.value === value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`group/opt flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'bg-lime-400/15 text-lime-300 font-bold border border-lime-400/30 shadow-sm'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                              isSelected ? 'bg-lime-400 shadow-[0_0_8px_#a3e635]' : 'bg-white/20 group-hover/opt:bg-white/50'
                            }`}
                          />
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-lime-400 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormSelect({ id, value, onChange, required, children, className = '' }: { id?: string; value: string; onChange: (e: ChangeEvent<HTMLSelectElement>) => void; required?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="form-input appearance-none pr-10 cursor-pointer text-sm font-medium"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  );
}

interface FilterOptionItem {
  value: string;
  label: string;
  shortLabel?: string;
  group?: string;
  dotColor?: string;
  icon?: ReactNode;
  sublabel?: string;
  badge?: string;
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
  icon,
  className = '',
  menuWidth = 'w-64',
  align = 'left',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOptionItem[];
  icon?: ReactNode;
  className?: string;
  menuWidth?: string;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handleScroll = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      window.addEventListener('scroll', handleScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || { value, label: value };
  }, [options, value]);

  const isFiltered = value !== 'all';

  // Mouse wheel cycling when hovered on the trigger button
  const handleTriggerWheel = (e: React.WheelEvent) => {
    if (!isOpen) {
      e.preventDefault();
      e.stopPropagation();
      const currentIndex = options.findIndex((opt) => opt.value === value);
      if (currentIndex === -1) return;
      if (e.deltaY > 0) {
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex].value);
      } else if (e.deltaY < 0) {
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex].value);
      }
    }
  };

  // Group options if any option has group
  const groupedOptions = useMemo(() => {
    const hasGroups = options.some((opt) => opt.group);
    if (!hasGroups) return null;

    const map = new Map<string, FilterOptionItem[]>();
    const ungrouped: FilterOptionItem[] = [];

    options.forEach((opt) => {
      if (opt.group) {
        if (!map.has(opt.group)) map.set(opt.group, []);
        map.get(opt.group)!.push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { ungrouped, groups: Array.from(map.entries()) };
  }, [options]);

  const renderOptionItem = (opt: FilterOptionItem) => {
    const isSelected = opt.value === value;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => {
          onChange(opt.value);
          setIsOpen(false);
        }}
        className={`group/opt flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs sm:text-[13px] transition-all duration-150 cursor-pointer ${
          isSelected
            ? 'bg-lime-400/15 text-lime-300 font-bold border border-lime-400/30 shadow-sm'
            : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
        role="option"
        aria-selected={isSelected}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {opt.dotColor ? (
            <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dotColor}`} />
          ) : (
            opt.icon && (
              <span className={`shrink-0 ${isSelected ? 'text-lime-400' : 'text-white/40 group-hover/opt:text-white/70'}`}>
                {opt.icon}
              </span>
            )
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{opt.label}</div>
            {opt.sublabel && (
              <div className="text-[10px] text-white/40 group-hover/opt:text-white/60 truncate font-normal">
                {opt.sublabel}
              </div>
            )}
          </div>
        </div>
        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-lime-400 ml-1" />}
      </button>
    );
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative ${isOpen ? 'z-50' : 'z-10'} ${className}`}
      onWheel={handleTriggerWheel}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Cuộn chuột để đổi lựa chọn nhanh"
        className={`group relative flex h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200 cursor-pointer select-none ${
          isOpen
            ? 'border-lime-400 bg-neutral-900 shadow-[0_0_20px_rgba(163,230,53,0.18)] ring-1 ring-lime-400/40 text-white'
            : isFiltered
              ? 'border-lime-400/60 bg-lime-400/[0.08] hover:border-lime-400/80 hover:bg-lime-400/[0.12] ring-1 ring-lime-400/20'
              : 'border-white/10 bg-black/40 hover:border-white/25 hover:bg-black/60 text-white/80'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption.dotColor ? (
            <span className={`h-2 w-2 rounded-full shrink-0 ${selectedOption.dotColor}`} />
          ) : (
            icon && (
              <span className={`shrink-0 transition-colors ${isFiltered ? 'text-lime-400' : 'text-white/40 group-hover:text-white/60'}`}>
                {icon}
              </span>
            )
          )}
          <div className="flex items-center gap-1.5 min-w-0 truncate text-xs sm:text-[13px]">
            <span className="text-white/45 font-medium shrink-0">{label}:</span>
            <span className={`truncate font-semibold ${isFiltered ? 'text-lime-300' : 'text-white/90'}`}>
              {selectedOption.shortLabel || selectedOption.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isFiltered && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange('all');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onChange('all');
                }
              }}
              className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              title="Xóa bộ lọc này"
              aria-label="Xóa bộ lọc"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-lime-400' : 'text-white/40 group-hover:text-white'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={`absolute top-full z-[100] mt-2 ${align === 'right' ? 'right-0' : 'left-0'} ${menuWidth} max-h-72 overflow-y-auto rounded-2xl border border-white/20 bg-neutral-900 p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.98)] custom-scrollbar`}
            role="listbox"
          >
            {groupedOptions ? (
              <>
                {groupedOptions.ungrouped.length > 0 && (
                  <div className="space-y-0.5 pb-1 border-b border-white/10 mb-1">
                    {groupedOptions.ungrouped.map((opt) => renderOptionItem(opt))}
                  </div>
                )}
                {groupedOptions.groups.map(([groupName, groupOpts], gIdx) => (
                  <div key={groupName} className={gIdx > 0 ? 'mt-2 pt-1 border-t border-white/10' : ''}>
                    <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white/40">
                      {groupName}
                    </div>
                    <div className="space-y-0.5 mt-0.5">
                      {groupOpts.map((opt) => renderOptionItem(opt))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="space-y-0.5">
                {options.map((opt) => renderOptionItem(opt))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModalShell({ children, onClose, onWheel, maxWidth = 'max-w-3xl', className = '' }: { children: ReactNode; onClose: () => void; onWheel?: (e: WheelEvent<HTMLElement>) => void; maxWidth?: string; className?: string }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-default"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onWheel={onWheel}
        className={`relative z-10 flex w-full ${maxWidth} max-h-[88vh] flex-col rounded-2xl sm:rounded-3xl border border-white/20 bg-neutral-950 shadow-[0_32px_120px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden ${className}`}
      >
        {children}
      </motion.div>
    </div>,
    document.body,
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/20 px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
        <LayoutTemplate className="h-6 w-6 text-lime-400" />
      </div>
      <h2 className="mt-5 text-lg font-bold text-white">Chưa có banner nào</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/50">
        Tạo banner đầu tiên để bắt đầu hiển thị nội dung quảng cáo trên storefront.
      </p>
      <button type="button" onClick={onCreate} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-lime-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-lime-300 transition-colors cursor-pointer">
        <Plus className="h-4 w-4" /> Tạo Banner Mới
      </button>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-red-400/20 bg-red-400/10 px-6 text-center">
      <p className="font-bold text-red-200">Không thể tải danh sách banner</p>
      <p className="mt-2 text-sm text-white/50">{message}</p>
      <button type="button" onClick={onRetry} className="mt-5 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer">
        Thử lại
      </button>
    </div>
  );
}

function NoMatches({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-black/20 px-6 text-center">
      <Search className="h-9 w-9 text-white/20" />
      <p className="mt-3 font-bold text-white/80">Không tìm thấy banner phù hợp</p>
      <button type="button" onClick={onReset} className="mt-4 text-sm font-bold text-lime-400 hover:text-lime-300 cursor-pointer">
        Xóa bộ lọc
      </button>
    </div>
  );
}

function BannerRow({ banner, index, canMoveUp, canMoveDown, onPreview, onEdit, onToggle, onDelete, onMove, isUpdating }: { banner: Banner; index: number; canMoveUp: boolean; canMoveDown: boolean; onPreview: () => void; onEdit: () => void; onToggle: () => void; onDelete: () => void; onMove: (direction: 'up' | 'down') => void; isUpdating?: boolean }) {
  const status = getBannerStatus(banner);
  const statusConfig = STATUS_CONFIG[status];
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="group grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-400/30 hover:bg-white/[0.045] lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-center"
    >
      <div className="relative aspect-[16/6] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <img src={toImageUrl(banner.image)} alt={banner.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-base font-bold text-white">{banner.title}</h2>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusConfig.className}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusConfig.label}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/50">
          <span className="font-semibold text-lime-300">{getPositionLabel(banner.position)}</span>
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="h-3.5 w-3.5" />
            {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[260px] truncate font-mono">{banner.link || 'Không điều hướng'}</span>
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <div className="mr-1 flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <button type="button" onClick={() => onMove('up')} disabled={!canMoveUp || isUpdating} aria-label="Đưa banner lên trước" className="p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer">
            <ArrowUp className="h-4 w-4" />
          </button>
          <span className="min-w-9 border-x border-white/10 px-2 py-1.5 text-center text-xs font-bold text-white/80">#{banner.sortOrder}</span>
          <button type="button" onClick={() => onMove('down')} disabled={!canMoveDown || isUpdating} aria-label="Đưa banner xuống sau" className="p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer">
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={onPreview} className="icon-action" aria-label={`Preview ${banner.title}`}>
          <Eye className="h-4 w-4" />
        </button>
        <button type="button" onClick={onEdit} className="icon-action" aria-label={`Chỉnh sửa ${banner.title}`}>
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          role="switch"
          aria-checked={banner.isActive}
          aria-label={`${banner.isActive ? 'Tắt' : 'Bật'} banner ${banner.title}`}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
            isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${
            banner.isActive ? 'border border-lime-400/80 bg-lime-400' : 'border border-white/20 bg-white/10'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
              banner.isActive ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
            }`}
          >
            {isUpdating && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-current opacity-70" />
              </span>
            )}
          </span>
        </button>
        <button type="button" onClick={onDelete} className="icon-action hover:!border-red-400/40 hover:!bg-red-500/20 hover:!text-red-200" aria-label={`Xóa ${banner.title}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

export default Banners;