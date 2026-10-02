import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode, WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Columns3,
  Edit3,
  Eye,
  FolderTree,
  Link as LinkIcon,
  Loader2,
  PanelBottom,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type {
  FooterLink,
  FooterLinkFormState,
  FooterSection,
  FooterSectionFormState,
  FooterSectionType,
} from '@/types/footer';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

type FooterStatus = 'active' | 'disabled';
type Feedback = { tone: 'success' | 'error'; message: string } | null;

const createEmptyForm = (defaultType: FooterSectionType = 'column'): FooterSectionFormState => ({
  type: defaultType,
  title: '',
  copyrightText: '',
  sortOrder: 0,
  isActive: true,
  links: [],
});

export function FooterManagement() {
  const token = useAuthStore((state) => state.token);
  const authHeaders = useMemo<Record<string, string>>(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  // Data state
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FooterStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FooterSectionType>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [form, setForm] = useState<FooterSectionFormState>(() => createEmptyForm('column'));
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview & Delete states
  const [previewSection, setPreviewSection] = useState<FooterSection | null>(null);
  const [sectionPendingDelete, setSectionPendingDelete] = useState<FooterSection | null>(null);

  // Quick updating id
  const [updatingSectionId, setUpdatingSectionId] = useState<string | null>(null);

  // Feedback notification
  const [feedback, setFeedback] = useState<Feedback>(null);

  const modalFormRef = useRef<HTMLFormElement>(null);
  const mainListRef = useRef<HTMLDivElement>(null);

  // Wheel event handlers to ensure smooth scrolling inside the modal form and list
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

  // Auto hide feedback toast
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  // Lock body scroll when modal is open so wheel events target the modal cleanly
  useEffect(() => {
    if (isModalOpen || previewSection || sectionPendingDelete) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, previewSection, sectionPendingDelete]);

  // Handle escape key
  useEffect(() => {
    if (!isModalOpen && !previewSection && !sectionPendingDelete) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isSubmitting) return;
      setIsModalOpen(false);
      setPreviewSection(null);
      setSectionPendingDelete(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen, previewSection, sectionPendingDelete, isSubmitting]);

  // Fetch sections from API
  const fetchSections = async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const response = await fetch(`${API_BASE_URL}/api/footer/sections`, { headers: authHeaders });
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu Footer.');
      }
      const data = await response.json();
      setSections(data.sections || []);
    } catch (err: any) {
      setLoadError(err.message || 'Lỗi kết nối đến máy chủ.');
      setSections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSections();
  }, [token]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sections
      .filter((sec) => {
        const matchesQuery =
          !query ||
          (sec.title && sec.title.toLowerCase().includes(query)) ||
          (sec.copyrightText && sec.copyrightText.toLowerCase().includes(query)) ||
          sec.links.some(
            (l) => l.label.toLowerCase().includes(query) || l.url.toLowerCase().includes(query)
          );

        const status: FooterStatus = sec.isActive ? 'active' : 'disabled';
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        const matchesType = typeFilter === 'all' || sec.type === typeFilter;

        return matchesQuery && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        // Columns first, ordered by sortOrder; bottom bar last
        if (a.type !== b.type) {
          return a.type === 'column' ? -1 : 1;
        }
        return a.sortOrder - b.sortOrder;
      });
  }, [sections, search, statusFilter, typeFilter]);

  // Open Create Modal
  const openCreate = () => {
    setEditingSection(null);
    const existingColumns = sections.filter((s) => s.type === 'column');
    const nextSortOrder =
      existingColumns.length > 0
        ? Math.max(...existingColumns.map((s) => s.sortOrder)) + 1
        : 0;

    setForm({
      type: 'column',
      title: '',
      copyrightText: '',
      sortOrder: nextSortOrder,
      isActive: true,
      links: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEdit = (section: FooterSection) => {
    setEditingSection(section);
    setForm({
      type: section.type || 'column',
      title: section.title || '',
      copyrightText: section.copyrightText || '',
      sortOrder: section.sortOrder ?? 0,
      isActive: section.isActive ?? true,
      links: (section.links || []).map((link) => ({
        id: link.id,
        label: link.label,
        url: link.url,
        sortOrder: link.sortOrder ?? 0,
        isActive: link.isActive ?? true,
      })),
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Type Change in Form
  const handleTypeChange = (newType: FooterSectionType) => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      // If switching to column and sortOrder was reset, give next available order
      sortOrder:
        newType === 'column'
          ? prev.sortOrder
          : 0,
    }));
    setFormError('');
  };

  // Toggle quick active/disabled on card
  const handleToggleActive = async (section: FooterSection) => {
    if (updatingSectionId) return;
    setUpdatingSectionId(section.id);
    const nextValue = !section.isActive;

    try {
      const response = await fetch(`${API_BASE_URL}/api/footer/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...section, isActive: nextValue }),
      });
      if (response.ok) {
        const result = await response.json();
        if (result?.section) {
          setSections((prev) =>
            prev.map((item) => (item.id === section.id ? result.section : item))
          );
          setFeedback({
            tone: 'success',
            message: nextValue
              ? `Đã bật hiển thị "${section.title || section.copyrightText || 'mục footer'}".`
              : `Đã tắt "${section.title || section.copyrightText || 'mục footer'}".`,
          });
        }
      } else {
        const err = await response.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
        setFeedback({ tone: 'error', message: err.message || 'Không thể thay đổi trạng thái.' });
      }
    } catch {
      setFeedback({ tone: 'error', message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setUpdatingSectionId(null);
    }
  };

  // Move section order up / down (for columns)
  const moveSection = async (section: FooterSection, direction: 'up' | 'down') => {
    if (updatingSectionId || section.type !== 'column') return;
    const columns = sections
      .filter((s) => s.type === 'column')
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = columns.findIndex((s) => s.id === section.id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const targetSection = columns[targetIndex];
    setUpdatingSectionId(section.id);

    const currentOrder = section.sortOrder;
    const targetOrder =
      targetSection.sortOrder === currentOrder
        ? direction === 'up'
          ? currentOrder - 1
          : currentOrder + 1
        : targetSection.sortOrder;

    try {
      // Make 2 requests to swap
      const [res1, res2] = await Promise.all([
        fetch(`${API_BASE_URL}/api/footer/sections/${section.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ ...section, sortOrder: targetOrder }),
        }),
        fetch(`${API_BASE_URL}/api/footer/sections/${targetSection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({ ...targetSection, sortOrder: currentOrder }),
        }),
      ]);

      if (res1.ok && res2.ok) {
        const updated1 = await res1.json();
        const updated2 = await res2.json();
        setSections((prev) =>
          prev.map((item) => {
            if (item.id === section.id) return updated1.section;
            if (item.id === targetSection.id) return updated2.section;
            return item;
          })
        );
        setFeedback({ tone: 'success', message: 'Đã cập nhật thứ tự cột footer.' });
      } else {
        setFeedback({ tone: 'error', message: 'Không thể cập nhật thứ tự.' });
        void fetchSections(); // Refresh in case of partial failure
      }
    } catch {
      setFeedback({ tone: 'error', message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setUpdatingSectionId(null);
    }
  };

  // Form link management
  const addLinkRow = () => {
    setForm((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          id: `new-link-${Date.now()}-${prev.links.length + 1}`,
          label: '',
          url: '',
          sortOrder: prev.links.length,
          isActive: true,
        },
      ],
    }));
  };

  const removeLinkRow = (linkId: string) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
    }));
  };

  const updateLinkField = (
    linkId: string,
    field: keyof FooterLinkFormState,
    value: string | number | boolean
  ) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((link) =>
        link.id === linkId ? { ...link, [field]: value } : link
      ),
    }));
  };

  // Validate URL helper
  const isValidUrl = (url: string) => {
    const trimmed = url.trim();
    return (
      trimmed.startsWith('/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')
    );
  };

  // Form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Validate based on type
    if (form.type === 'column') {
      if (!form.title.trim()) {
        setFormError('Vui lòng nhập tên nhóm cho cột footer.');
        return;
      }
      if (form.sortOrder < 0 || !Number.isInteger(Number(form.sortOrder))) {
        setFormError('Thứ tự cột phải là số nguyên lớn hơn hoặc bằng 0.');
        return;
      }
    } else {
      // type === 'bottom'
      if (!form.copyrightText.trim()) {
        setFormError('Vui lòng nhập thông tin bản quyền (Copyright).');
        return;
      }
    }

    // 2. Validate links
    for (let i = 0; i < form.links.length; i++) {
      const link = form.links[i];
      if (!link.label.trim()) {
        setFormError(`Liên kết #${i + 1} chưa có tên hiển thị.`);
        return;
      }
      if (!link.url.trim()) {
        setFormError(`Liên kết "${link.label}" chưa có đường dẫn URL.`);
        return;
      }
      if (!isValidUrl(link.url)) {
        setFormError(
          `Đường dẫn "${link.url}" không hợp lệ. Vui lòng bắt đầu bằng / (nội bộ) hoặc https:// (ngoài).`
        );
        return;
      }
      if (link.sortOrder < 0 || !Number.isInteger(Number(link.sortOrder))) {
        setFormError(`Thứ tự của liên kết "${link.label}" phải là số nguyên >= 0.`);
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');

    // Construct normalized payload (clean without obsolete fields)
    let payload: FooterSection;

    if (form.type === 'column') {
      payload = {
        id: editingSection ? editingSection.id : `footer-col-${Date.now()}`,
        type: 'column',
        title: form.title.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        links: form.links.map((l, index) => ({
          id: l.id.startsWith('new-link-') ? `link-${Date.now()}-${index}` : l.id,
          label: l.label.trim(),
          url: l.url.trim(),
          sortOrder: Number(l.sortOrder) || index,
          isActive: l.isActive,
        })),
        updatedAt: new Date().toISOString(),
        createdAt: editingSection?.createdAt || new Date().toISOString(),
      };
    } else {
      payload = {
        id: editingSection ? editingSection.id : `footer-bottom-${Date.now()}`,
        type: 'bottom',
        copyrightText: form.copyrightText.trim(),
        sortOrder: 999,
        isActive: form.isActive,
        links: form.links.map((l, index) => ({
          id: l.id.startsWith('new-link-') ? `link-${Date.now()}-${index}` : l.id,
          label: l.label.trim(),
          url: l.url.trim(),
          sortOrder: Number(l.sortOrder) || index,
          isActive: l.isActive,
        })),
        updatedAt: new Date().toISOString(),
        createdAt: editingSection?.createdAt || new Date().toISOString(),
      };
    }

    try {
      // Avoid sending mock 'id' generated by client for creation
      const { id, createdAt, updatedAt, ...safePayload } = payload;
      const finalPayload = editingSection ? payload : safePayload;

      const url = editingSection
        ? `${API_BASE_URL}/api/footer/sections/${editingSection.id}`
        : `${API_BASE_URL}/api/footer/sections`;
      const method = editingSection ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(finalPayload),
      });

      if (res.ok) {
        const saved = await res.json();
        const savedSection = saved.section;
        if (editingSection) {
          setSections((prev) =>
            prev.map((item) => (item.id === editingSection.id ? savedSection : item))
          );
        } else {
          setSections((prev) => [...prev, savedSection]);
        }
        setFeedback({
          tone: 'success',
          message: editingSection
            ? `Đã cập nhật ${form.type === 'column' ? 'cột footer' : 'dãy dưới footer'}.`
            : `Đã thêm ${form.type === 'column' ? 'cột footer' : 'dãy dưới footer'} mới.`,
        });
        setIsModalOpen(false);
      } else {
        const err = await res.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
        setFormError(err.message || (res.status === 409 ? 'Dãy ngang dưới Footer đã tồn tại.' : 'Có lỗi xảy ra khi lưu.'));
      }
    } catch (err: any) {
      setFormError(err.message || 'Lỗi kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete section
  const handleDelete = async () => {
    if (!sectionPendingDelete) return;
    const sec = sectionPendingDelete;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/footer/sections/${sec.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (response.ok) {
        setSections((prev) => prev.filter((item) => item.id !== sec.id));
        setSectionPendingDelete(null);
        setFeedback({
          tone: 'success',
          message: `Đã xóa ${sec.type === 'column' ? `cột "${sec.title}"` : 'dãy dưới footer'}.`,
        });
      } else {
        const err = await response.json().catch(() => ({ message: 'Có lỗi xảy ra' }));
        setFeedback({ tone: 'error', message: err.message || 'Không thể xóa mục footer.' });
      }
    } catch {
      setFeedback({ tone: 'error', message: 'Lỗi kết nối đến máy chủ.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 text-slate-900">
      {/* ─── HEADER ─── */}
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Nội dung storefront
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Footer</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các cột danh mục và dãy liên kết bản quyền hiển thị ở chân trang website.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Thêm nội dung Footer
        </button>
      </header>

      {/* ─── CONTROLS BAR: SEARCH, TYPE FILTER & STATUS FILTER ─── */}
      <div className="relative z-30 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_200px_200px]">
        {/* Search */}
        <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/20">
          <Search className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Tìm theo tên nhóm, bản quyền hoặc liên kết..."
            aria-label="Tìm kiếm mục footer"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        {/* Type Filter */}
        <FooterFilterDropdown
          label="Loại"
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as 'all' | FooterSectionType)}
          options={[
            { value: 'all', label: 'Tất cả loại', sublabel: 'Cả cột và dãy dưới' },
            { value: 'column', label: 'Cột Footer', sublabel: 'Nhóm liên kết dọc' },
            { value: 'bottom', label: 'Dãy ngang dưới', sublabel: 'Bản quyền & link đáy' },
          ]}
        />

        {/* Status Filter */}
        <FooterFilterDropdown
          label="Trạng thái"
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as 'all' | FooterStatus)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái', sublabel: 'Xem mọi mục' },
            {
              value: 'active',
              label: 'Đang hiển thị',
              dotColor: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
              sublabel: 'Công khai trên storefront',
            },
            {
              value: 'disabled',
              label: 'Đã tắt',
              dotColor: 'bg-slate-400',
              sublabel: 'Tạm ẩn chân trang',
            },
          ]}
        />
      </div>

      {/* ─── MAIN LIST / EMPTY STATE ─── */}
      <div
        ref={mainListRef}
        onWheel={handleListWheel}
        data-lenis-prevent="true"
        className="min-h-0 flex-1 overflow-y-auto pr-1 custom-scrollbar overscroll-contain"
      >
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-slate-50"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 px-6 text-center">
            <p className="font-bold text-rose-800">Không thể tải nội dung Footer</p>
            <p className="mt-2 text-sm text-slate-500">{loadError}</p>
            <button
              type="button"
              onClick={() => void fetchSections()}
              className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        ) : sections.length === 0 ? (
          /* EMPTY STATE (No mock data, real clean UI) */
          <div className="flex min-h-[340px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
              <FolderTree className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">Chưa có nội dung Footer.</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Thêm cột footer hoặc dãy bản quyền ngang dưới cùng để quản lý các liên kết ở chân trang website.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Thêm nội dung đầu tiên
            </button>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-6 text-center">
            <Search className="h-9 w-9 text-slate-300" />
            <p className="mt-3 font-bold text-slate-700">Không tìm thấy nội dung footer phù hợp</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="mt-4 text-sm font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            {filteredSections.map((sec, index) => {
              const isColumn = sec.type === 'column';
              const columnList = filteredSections.filter((s) => s.type === 'column');
              const columnIndex = columnList.findIndex((s) => s.id === sec.id);
              const canMoveUp = isColumn && columnIndex > 0;
              const canMoveDown = isColumn && columnIndex < columnList.length - 1;

              return (
                <FooterSectionRow
                  key={sec.id}
                  section={sec}
                  index={index}
                  canMoveUp={canMoveUp}
                  canMoveDown={canMoveDown}
                  onPreview={() => setPreviewSection(sec)}
                  onEdit={() => openEdit(sec)}
                  onToggle={() => void handleToggleActive(sec)}
                  onDelete={() => setSectionPendingDelete(sec)}
                  onMove={(dir) => void moveSection(sec, dir)}
                  isUpdating={updatingSectionId === sec.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── TOAST FEEDBACK ─── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="status"
            className={`fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl ${
              feedback.tone === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {feedback.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CREATE / EDIT MODAL ─── */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalShell
            onClose={() => !isSubmitting && setIsModalOpen(false)}
            onWheel={handleModalWheel}
            maxWidth="max-w-4xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 shrink-0 z-10">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {form.type === 'column' ? 'Cột Footer' : 'Dãy ngang dưới Footer'}
                </span>
                <h2
                  id="footer-modal-title"
                  className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
                >
                  {form.type === 'column'
                    ? editingSection
                      ? 'Chỉnh Sửa Cột Footer'
                      : 'Thêm Cột Footer'
                    : editingSection
                    ? 'Chỉnh Sửa Dãy Dưới Footer'
                    : 'Thiết Lập Dãy Dưới Footer'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                aria-label="Đóng biểu mẫu footer"
                className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              id="footer-modal-form"
              ref={modalFormRef}
              onSubmit={handleSubmit}
              onWheel={handleModalWheel}
              role="dialog"
              aria-modal="true"
              aria-labelledby="footer-modal-title"
              data-lenis-prevent="true"
              className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar sm:px-8 sm:py-7 space-y-6 min-h-0 overscroll-contain"
            >
              {/* FIELD CHỌN LOẠI HIỂN THỊ (ĐẶT Ở ĐẦU FORM) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
                <label
                  htmlFor="footer-section-type"
                  className="block text-xs font-bold uppercase tracking-wider text-emerald-600"
                >
                  LOẠI HIỂN THỊ <span className="text-emerald-600">*</span>
                </label>
                  <FooterTypeDropdown
                    value={form.type}
                    onChange={(val) => handleTypeChange(val)}
                    disabledBottom={!editingSection && sections.some((s) => s.type === 'bottom')}
                  />
                <p className="text-[11px] text-slate-500">
                  {form.type === 'column'
                    ? 'Hiển thị thành một cột liên kết dọc ở khu vực chính của chân trang.'
                    : 'Hiển thị dòng bản quyền và các liên kết chính sách nằm ngang ở đáy chân trang.'}
                </p>
              </div>

              {/* SECTION 1: PHỤ THUỘC VÀO TYPE */}
              {form.type === 'column' ? (
                /* TYPE = COLUMN: THÔNG TIN NHÓM */
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <Columns3 className="h-4 w-4" />
                    <span>1. THÔNG TIN NHÓM</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="footer-section-title"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Tên nhóm <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        id="footer-section-title"
                        required
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="form-input mt-1.5"
                        placeholder="Hỗ trợ khách hàng, Chính sách, Về chúng tôi..."
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="footer-sort-order"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Thứ tự cột <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        id="footer-sort-order"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={form.sortOrder}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            sortOrder: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="form-input mt-1.5 font-mono"
                        placeholder="0"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Số nhỏ hơn được hiển thị trước.
                      </p>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Trạng thái
                      </span>
                      <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4">
                        <span className="text-xs font-medium text-slate-700">
                          {form.isActive ? 'Đang hiển thị' : 'Đã tắt / ẩn'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.isActive}
                          aria-label="Trạng thái nhóm footer"
                          onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                            form.isActive
                              ? 'border border-emerald-600 bg-emerald-600'
                              : 'border border-slate-300 bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              form.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TYPE = BOTTOM: THÔNG TIN DÃY DƯỚI */
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <PanelBottom className="h-4 w-4" />
                    <span>1. THÔNG TIN DÃY DƯỚI</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="footer-copyright-text"
                        className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                      >
                        Copyright <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        id="footer-copyright-text"
                        required
                        value={form.copyrightText}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, copyrightText: e.target.value }))
                        }
                        className="form-input mt-1.5"
                        placeholder="Copyright © 2026 HM Store. Bảo lưu mọi quyền."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Trạng thái
                      </span>
                      <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4">
                        <span className="text-xs font-medium text-slate-700">
                          {form.isActive ? 'Đang hiển thị' : 'Đã tắt / ẩn'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={form.isActive}
                          aria-label="Trạng thái dãy dưới footer"
                          onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                            form.isActive
                              ? 'border border-emerald-600 bg-emerald-600'
                              : 'border border-slate-300 bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              form.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. REUSABLE LINK EDITOR (DÙNG CHUNG CHO CẢ COLUMN VÀ BOTTOM) */}
              <FooterLinksEditor
                type={form.type}
                links={form.links}
                onAdd={addLinkRow}
                onChange={updateLinkField}
                onRemove={removeLinkRow}
              />

              {/* 3. XEM TRƯỚC (LIVE PREVIEW THEO TYPE) */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>3. XEM TRƯỚC</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Cập nhật thời gian thực
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  {form.type === 'column' ? (
                    /* Column Live Preview: Title + vertical links */
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                          {form.title.trim() ? (
                            form.title.trim()
                          ) : (
                            <span className="text-slate-400 italic">Tên nhóm</span>
                          )}
                        </h4>
                      </div>

                      <div className="mt-3.5 space-y-1.5 pl-3.5 border-l border-slate-200">
                        {form.links.filter((l) => l.isActive).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Chưa có liên kết nào được bật hiển thị.
                          </p>
                        ) : (
                          form.links
                            .filter((l) => l.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((link, idx) => (
                              <div
                                key={link.id || idx}
                                className="flex items-center justify-between py-1 text-xs text-slate-700 hover:text-slate-900 transition-colors"
                              >
                                <span className="font-medium">
                                  {link.label.trim() || (
                                    <span className="text-slate-400 italic">Link {idx + 1}</span>
                                  )}
                                </span>
                                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[220px]">
                                  {link.url.trim() || '/duong-dan'}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Bottom Live Preview: Copyright + horizontal links */
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-700">
                      <p className="text-slate-900 font-medium">
                        {form.copyrightText.trim() ? (
                          form.copyrightText.trim()
                        ) : (
                          <span className="text-slate-400 italic">Copyright © 2026 ...</span>
                        )}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
                        {form.links.filter((l) => l.isActive).length === 0 ? (
                          <span className="text-slate-400 italic">Chưa có liên kết ngang</span>
                        ) : (
                          form.links
                            .filter((l) => l.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((link, idx, arr) => (
                              <span key={link.id || idx} className="inline-flex items-center gap-2">
                                <span className="hover:text-slate-900 transition-colors">
                                  {link.label.trim() || `Link ${idx + 1}`}
                                </span>
                                {idx < arr.length - 1 && (
                                  <span className="text-slate-300" aria-hidden="true">
                                    |
                                  </span>
                                )}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium"
                >
                  {formError}
                </p>
              )}
            </form>

            {/* Modal Actions Footer */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:px-8 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="footer-modal-form"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white transition-all shadow-sm hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? 'Đang lưu...'
                  : editingSection
                  ? 'Lưu thay đổi'
                  : 'Thêm nội dung'}
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── PREVIEW MODAL ─── */}
      <AnimatePresence>
        {previewSection && (
          <ModalShell
            onClose={() => setPreviewSection(null)}
            maxWidth="max-w-xl"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="footer-preview-title"
              className="w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    {previewSection.type === 'column' ? 'Xem trước Cột Footer' : 'Xem trước Dãy Dưới Footer'}
                  </p>
                  <h2
                    id="footer-preview-title"
                    className="mt-1 text-lg font-bold text-slate-900"
                  >
                    {previewSection.title || previewSection.copyrightText || 'Footer Preview'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewSection(null)}
                  aria-label="Đóng preview"
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  {previewSection.type === 'column' ? (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                        {previewSection.title}
                      </h3>
                      <div className="mt-3 flex flex-col space-y-2">
                        {previewSection.links.filter((l) => l.isActive).length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Chưa có liên kết nào đang hiển thị.
                          </p>
                        ) : (
                          previewSection.links
                            .filter((l) => l.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((link) => (
                              <div
                                key={link.id}
                                className="flex items-center justify-between text-sm text-slate-700 hover:text-slate-900 transition-colors"
                              >
                                <span>{link.label}</span>
                                <span className="font-mono text-xs text-slate-400 truncate max-w-[200px]">
                                  {link.url}
                                </span>
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-700">
                      <p className="text-slate-900 font-medium">{previewSection.copyrightText}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600">
                        {previewSection.links.filter((l) => l.isActive).length === 0 ? (
                          <span className="text-slate-400 italic">Chưa có liên kết</span>
                        ) : (
                          previewSection.links
                            .filter((l) => l.isActive)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((link, idx, arr) => (
                              <span key={link.id} className="inline-flex items-center gap-2">
                                <span className="hover:text-slate-900 transition-colors">{link.label}</span>
                                {idx < arr.length - 1 && (
                                  <span className="text-slate-300" aria-hidden="true">
                                    |
                                  </span>
                                )}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-center text-xs text-slate-500">
                  Xem trước bố cục nội dung phục vụ kiểm tra quản trị Admin.
                </p>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {sectionPendingDelete && (
          <ModalShell
            onClose={() => !isSubmitting && setSectionPendingDelete(null)}
            maxWidth="max-w-md"
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-footer-title"
              className="w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="h-6 w-6" />
              </div>
              <h2 id="delete-footer-title" className="mt-4 text-lg font-bold text-slate-900">
                Xác nhận xóa nội dung Footer?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Bạn có chắc chắn muốn xóa{' '}
                <strong className="text-slate-900">
                  "{sectionPendingDelete.title || sectionPendingDelete.copyrightText}"
                </strong>{' '}
                cùng toàn bộ {sectionPendingDelete.links.length} liên kết bên trong?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSectionPendingDelete(null)}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleDelete()}
                  className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition-all shadow-sm cursor-pointer"
                >
                  {isSubmitting ? 'Đang xóa...' : 'Xóa nội dung'}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── REUSABLE LINK EDITOR (DÙNG CHUNG CHO CẢ COLUMN VÀ BOTTOM) ───
interface FooterLinksEditorProps {
  type: FooterSectionType;
  links: FooterLinkFormState[];
  onAdd: () => void;
  onChange: (
    linkId: string,
    field: keyof FooterLinkFormState,
    value: string | number | boolean
  ) => void;
  onRemove: (linkId: string) => void;
}

function FooterLinksEditor({
  type,
  links,
  onAdd,
  onChange,
  onRemove,
}: FooterLinksEditorProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/75 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            {type === 'column'
              ? '2. DANH SÁCH LIÊN KẾT (CỘT)'
              : '2. DANH SÁCH LIÊN KẾT NGANG'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {type === 'column'
              ? 'Thứ tự quyết định vị trí từ trên xuống dưới trong cột.'
              : 'Thứ tự quyết định vị trí từ trái sang phải ở dãy chân trang.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm liên kết
        </button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center shadow-sm">
          <LinkIcon className="mx-auto h-6 w-6 text-slate-400" />
          <p className="mt-2 text-xs text-slate-500">Chưa có liên kết nào.</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
          >
            + Thêm liên kết đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Desktop Table Header: # | Tên | URL | Thứ tự | Hiển thị | Xóa */}
          <div className="hidden sm:grid sm:grid-cols-[40px_minmax(0,1.2fr)_minmax(0,1.2fr)_75px_70px_40px] gap-2.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <span className="text-center">#</span>
            <span>Tên liên kết *</span>
            <span>URL *</span>
            <span className="text-center">Thứ tự *</span>
            <span className="text-center">Hiển thị</span>
            <span className="text-center">Xóa</span>
          </div>

          {links.map((link, lIdx) => (
            <div
              key={link.id}
              className="grid grid-cols-1 sm:grid-cols-[40px_minmax(0,1.2fr)_minmax(0,1.2fr)_75px_70px_40px] gap-2.5 items-center p-3 sm:p-2.5 rounded-xl border border-slate-200 bg-white transition-all focus-within:border-emerald-500 shadow-sm"
            >
              {/* Col: STT / # */}
              <div className="flex items-center justify-between sm:justify-center">
                <span className="text-xs font-mono font-bold text-emerald-600">
                  #{lIdx + 1}
                </span>
                {/* Mobile only controls */}
                <div className="flex items-center gap-3 sm:hidden">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                    <span>Hiển thị</span>
                    <input
                      type="checkbox"
                      checked={link.isActive}
                      onChange={(e) => onChange(link.id, 'isActive', e.target.checked)}
                      className="rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(link.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Xóa liên kết"
                    aria-label={`Xóa liên kết #${lIdx + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Col: Tên liên kết */}
              <div>
                <input
                  value={link.label}
                  onChange={(e) => onChange(link.id, 'label', e.target.value)}
                  placeholder="Tên liên kết (vd: Mua hàng, Bảo hành)"
                  className="form-input text-xs"
                  required
                />
              </div>

              {/* Col: URL */}
              <div>
                <input
                  value={link.url}
                  onChange={(e) => onChange(link.id, 'url', e.target.value)}
                  placeholder="URL (vd: /chinh-sach hoặc https://...)"
                  className="form-input text-xs font-mono"
                  required
                />
              </div>

              {/* Col: Thứ tự */}
              <div>
                <input
                  type="number"
                  min="0"
                  value={link.sortOrder}
                  onChange={(e) =>
                    onChange(
                      link.id,
                      'sortOrder',
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  placeholder="0"
                  title="Thứ tự hiển thị"
                  className="form-input text-xs text-center font-mono"
                />
              </div>

              {/* Col: Hiển thị */}
              <div className="hidden sm:flex items-center justify-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={link.isActive}
                  aria-label={`Hiển thị liên kết #${lIdx + 1}`}
                  onClick={() => onChange(link.id, 'isActive', !link.isActive)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors cursor-pointer focus:outline-none ${
                    link.isActive
                      ? 'bg-emerald-600'
                      : 'bg-slate-200'
                  }`}
                  title={link.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      link.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Col: Xóa */}
              <div className="hidden sm:flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onRemove(link.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa liên kết này"
                  aria-label={`Xóa liên kết #${lIdx + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-1">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              + Thêm liên kết
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SECTION ROW ITEM ───
function FooterSectionRow({
  section,
  index,
  canMoveUp,
  canMoveDown,
  onPreview,
  onEdit,
  onToggle,
  onDelete,
  onMove,
  isUpdating,
}: {
  section: FooterSection;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onMove: (direction: 'up' | 'down') => void;
  isUpdating?: boolean;
}) {
  const isColumn = section.type === 'column';
  const activeLinksCount = section.links.filter((l) => l.isActive).length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      className="group grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md lg:grid-cols-[230px_minmax(0,1fr)_auto] lg:items-center shadow-sm"
    >
      {/* Title & Badges */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              isColumn
                ? 'border-sky-200 bg-sky-50 text-sky-700'
                : 'border-purple-200 bg-purple-50 text-purple-700'
            }`}
          >
            {isColumn ? <Columns3 className="h-3 w-3" /> : <PanelBottom className="h-3 w-3" />}
            {isColumn ? 'Cột Footer' : 'Dãy ngang dưới'}
          </span>

          <h2 className="truncate text-base font-bold text-slate-900">
            {isColumn ? section.title : 'Bản quyền & Liên kết đáy'}
          </h2>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              section.isActive
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                section.isActive ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            {section.isActive ? 'Đang hiển thị' : 'Đã tắt'}
          </span>
          <span className="text-slate-400 font-mono">
            {section.links.length} liên kết ({activeLinksCount} bật)
          </span>
        </div>
      </div>

      {/* Content / Links preview */}
      <div className="min-w-0">
        {!isColumn && section.copyrightText && (
          <p className="text-xs font-mono text-slate-600 mb-2 truncate">
            {section.copyrightText}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {section.links.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Chưa có liên kết</span>
          ) : (
            section.links.slice(0, 5).map((l) => (
              <span
                key={l.id}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium border ${
                  l.isActive
                    ? 'border-slate-200 bg-slate-50 text-slate-700'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 line-through'
                }`}
              >
                <LinkIcon className="h-3 w-3 opacity-60 shrink-0" />
                <span className="truncate max-w-[130px]">{l.label}</span>
              </span>
            ))
          )}
          {section.links.length > 5 && (
            <span className="inline-flex items-center rounded-lg px-2 py-1 text-xs font-mono border border-emerald-200 bg-emerald-50 text-emerald-700">
              +{section.links.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {/* Sort Order Stepper (for column) */}
        {isColumn ? (
          <div className="mr-1 flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => onMove('up')}
              disabled={!canMoveUp || isUpdating}
              aria-label={`Đưa cột ${section.title} sang trái`}
              className="p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span
              className="min-w-9 border-x border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-slate-700 bg-white font-mono"
              title="Thứ tự cột (từ trái sang phải)"
            >
              #{section.sortOrder}
            </span>
            <button
              type="button"
              onClick={() => onMove('down')}
              disabled={!canMoveDown || isUpdating}
              aria-label={`Đưa cột ${section.title} sang phải`}
              className="p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-25 cursor-pointer"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="mr-1 inline-flex items-center rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-mono text-purple-700">
            Đáy trang
          </span>
        )}

        {/* Preview Button */}
        <button
          type="button"
          onClick={onPreview}
          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-sm cursor-pointer"
          aria-label={`Xem trước ${section.title || section.copyrightText}`}
          title="Xem trước"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Edit Button */}
        <button
          type="button"
          onClick={onEdit}
          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white hover:text-slate-900 shadow-sm cursor-pointer"
          aria-label={`Chỉnh sửa ${section.title || section.copyrightText}`}
          title="Sửa nội dung"
        >
          <Edit3 className="h-4 w-4" />
        </button>

        {/* Switch Toggle */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isUpdating}
          role="switch"
          aria-checked={section.isActive}
          aria-label={`${section.isActive ? 'Tắt' : 'Bật'} ${section.title || section.copyrightText}`}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
            isUpdating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          } ${
            section.isActive
              ? 'bg-emerald-600'
              : 'bg-slate-200'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
              section.isActive ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {isUpdating && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-t-transparent border-emerald-600 opacity-70" />
              </span>
            )}
          </span>
        </button>

        {/* Delete Button */}
        <button
          type="button"
          onClick={onDelete}
          className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 shadow-sm cursor-pointer"
          aria-label={`Xóa ${section.title || section.copyrightText}`}
          title="Xóa nội dung"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.article>
  );
}

// ─── FILTER DROPDOWN COMPONENT ───
function FooterFilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; dotColor?: string; sublabel?: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-sm"
      >
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-400 shrink-0">{label}:</span>
          <span className="text-slate-900 truncate">{selected.label}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  opt.value === value
                    ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.dotColor ? (
                    <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />
                  ) : null}
                  <span>{opt.label}</span>
                </div>
                {opt.value === value && <Check className="h-3.5 w-3.5 text-emerald-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MODAL SHELL (matches Banners) ───
function ModalShell({
  children,
  onClose,
  onWheel,
  maxWidth = 'max-w-3xl',
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  onWheel?: (e: WheelEvent<HTMLElement>) => void;
  maxWidth?: string;
  className?: string;
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      data-lenis-prevent-touch="true"
      className="admin-shell fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
    >
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm cursor-default"
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onWheel={onWheel}
        className={`relative z-10 flex w-full ${maxWidth} max-h-[88vh] flex-col rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden overscroll-contain ${className}`}
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
}

export default FooterManagement;

function FooterTypeDropdown({
  value,
  onChange,
  disabledBottom = false
}: {
  value: 'column' | 'bottom';
  onChange: (val: 'column' | 'bottom') => void;
  disabledBottom?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const options: Array<{
    value: 'column' | 'bottom';
    label: string;
    icon: ReactNode;
    disabled?: boolean;
  }> = [
    { value: 'column', label: 'Cột Footer', icon: <Columns3 className="w-4 h-4" />, disabled: false },
    { value: 'bottom', label: 'Dãy ngang dưới Footer', icon: <PanelBottom className="w-4 h-4" />, disabled: disabledBottom }
  ];

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition-all hover:bg-slate-50 hover:border-emerald-500 cursor-pointer focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <div className="text-slate-500">{selected.icon}</div>
          <span>{selected.label}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute top-full left-0 right-0 z-[100] mt-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  value === opt.value
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : opt.disabled 
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={value === opt.value ? 'text-emerald-600' : 'text-slate-400'}>
                    {opt.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{opt.label}</span>
                    {opt.disabled && (
                      <span className="text-[10px] text-amber-600">Đã tồn tại dãy ngang dưới (chỉ cho phép 1)</span>
                    )}
                  </div>
                </div>
                {value === opt.value && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}