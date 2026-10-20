import { createLatestRequest } from '@/lib/latest-request';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, Package, RefreshCw, ChevronDown, ChevronRight, ArrowLeft, Image as ImageIcon, Zap, Upload, LayoutGrid, List, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

import { AdminProductFilterSidebar } from './products/AdminProductFilterSidebar';
import { AdminProductCard } from './products/AdminProductCard';
import { VariantManagementModal } from './products/VariantManagementModal';
import { ProductImportModal } from './products/ProductImportModal';
import { RichTextEditor } from '../editors/RichTextEditor';
import { SpecificationGroupEditor, SpecGroup } from '../editors/SpecificationGroupEditor';

import { useAuthStore } from '@/store/authStore';
import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// --- TYPES ---
interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  attributes: Record<string, string>;
  colorCode: string | null;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  slug?: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  brand: string | null;
  image: string | null;
  images: string[];
  categoryId: string | null;
  category: { id: string; name: string } | null;
  status: string;
  specifications: any[] | null;
  variants: ProductVariant[];
  updatedAt: string;
}

interface VariantFormRow {
  id?: string;
  sku: string;
  price: string;
  salePrice: string;
  stock: string;
  attributes: Record<string, string>;
  colorCode: string;
  image: string;
}

type VariantOption = { name: string; price?: string; hex?: string; image?: string };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const IMAGE_SLOTS = [
  'Ảnh chính',
  'Ảnh mặt trước',
  'Ảnh mặt sau',
  'Ảnh mặt phải',
  'Ảnh mặt trái'
];

const CATEGORY_CONFIGS: Record<string, { variants: string[], specifications: string[] }> = {
  phone: {
    variants: ["Dung lượng", "Màu sắc"],
    specifications: ["Màn hình", "Chip", "RAM", "Camera Trước", "Camera Sau", "Pin", "Hệ điều hành", "SIM", "Kết nối"]
  },
  laptop: {
    variants: ["Phiên bản", "Màu sắc"],
    specifications: ["Màn hình", "CPU", "GPU", "RAM", "SSD", "Pin", "Hệ điều hành", "Kích thước", "Trọng lượng", "Cổng kết nối"]
  },
  tablet: {
    variants: ["Dung lượng", "Màu sắc", "Kết nối"],
    specifications: ["Màn hình", "Chip", "RAM", "Lưu trữ", "Camera", "Pin", "Hệ điều hành", "Kết nối"]
  },
  pc: {
    variants: ["Phiên bản", "Màu sắc"],
    specifications: ["CPU", "Mainboard", "RAM", "Ổ cứng", "VGA", "Nguồn", "Tản nhiệt", "Vỏ Case"]
  },
  watch: {
    variants: ["Màu sắc", "Kích thước", "Kết nối", "Chất liệu"],
    specifications: ["Màn hình", "Chip", "Pin", "Chống nước", "Tương thích", "Tính năng sức khỏe"]
  },
  accessories: {
    variants: ["Loại", "Màu sắc"],
    specifications: ["Thương hiệu", "Màu sắc", "Tương thích", "Tính năng"]
  },
  default: {
    variants: ["Phiên bản", "Màu sắc"],
    specifications: ["Thông số 1", "Thông số 2", "Thông số 3", "Thông số 4"]
  }
};

// Keep the product form aligned with the category families currently exposed by GlobalNav.
// Values are stable category slugs, never translated display labels or route text.
const NAVBAR_CATEGORY_FAMILY_BY_SLUG: Record<string, keyof typeof CATEGORY_CONFIGS> = {
  'dien-thoai': 'phone', 'ien-thoai': 'phone', phone: 'phone',
  iphone: 'phone', samsung: 'phone', xiaomi: 'phone', oppo: 'phone',
  'may-tinh-bang': 'tablet', tablet: 'tablet',
  ipad: 'tablet', 'samsung-galaxy-tab': 'tablet', 'xiaomi-pad': 'tablet',
  laptop: 'laptop', macbook: 'laptop', asus: 'laptop', 'lenovo-6xfo': 'laptop',
  'dong-ho-thong-minh': 'watch', 'ong-ho-thong-minh': 'watch', watch: 'watch',
  'apple-watch': 'watch', 'samsung-watch': 'watch', 'xiaomi-watch': 'watch',
};

const PREDEFINED_COLORS = [
  { name: 'Đen', hex: '#1c1c1e' },
  { name: 'Trắng', hex: '#f5f5f0' },
  { name: 'Xanh', hex: '#20283e' },
  { name: 'Đỏ', hex: '#c82333' },
  { name: 'Vàng', hex: '#e3c6a4' },
  { name: 'Hồng', hex: '#e8d1cf' },
  { name: 'Titan', hex: '#878681' },
  { name: 'Bạc', hex: '#e3e4e5' },
];

const PREDEFINED_OPTIONS: Record<string, string[]> = {
  "Dung lượng": ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
  "Phiên bản": ["M3 - 8GB - 256GB", "M3 - 16GB - 512GB", "M3 Pro - 18GB - 512GB", "M3 Max - 36GB - 1TB", "M4 - 16GB - 256GB", "M4 Pro - 24GB - 512GB"],
  "RAM": ["4GB", "8GB", "16GB", "32GB", "64GB"],
  "SSD": ["128GB", "256GB", "512GB", "1TB", "2TB"],
  "CPU": ["Core i3", "Core i5", "Core i7", "Core i9", "M1", "M2", "M3", "M4"],
  "VGA": ["RTX 3060", "RTX 4060", "RTX 4070", "RTX 4080", "RTX 4090"],
  "Kết nối": ["GPS", "Bluetooth", "LTE", "GPS + Cellular", "Wi-Fi"],
  "Kích thước": ["40mm", "41mm", "42mm", "44mm", "45mm", "46mm", "47mm", "49mm"],
  "Chất liệu": ["Nhôm", "Nhôm Armor", "Titan", "Thép không gỉ", "Hợp kim nhôm"]
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();
  const [view, setView] = useState<'list' | 'form'>('list');

  // --- Admin List State ---
  const [listData, setListData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [listFilters, setListFilters] = useState<Record<string, string[]>>({});
  const [adminFilters, setAdminFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('product-list-view-mode') as 'grid' | 'list') || 'grid');

  useEffect(() => {
    localStorage.setItem('product-list-view-mode', viewMode);
  }, [viewMode]);
  const [listCategory, setListCategory] = useState('');
  const [listStatus, setListStatus] = useState('');
  const [listStock, setListStock] = useState('');
  const [listSort, setListSort] = useState('newest');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isFetchingList, setIsFetchingList] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showVariantModalFor, setShowVariantModalFor] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination(p => ({ ...p, page: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const filtersRequest = useRef(createLatestRequest());
  const productsRequest = useRef(createLatestRequest());

  // Fetch Admin Filters
  const fetchAdminFilters = async () => {
    const request = filtersRequest.current.start();
    try {
      const url = new URL(`${API_BASE_URL}/api/products/admin/filters`);
      if (listCategory) url.searchParams.append('category', listCategory);
      const res = await fetch(url.toString(), { signal: request.signal, headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (request.isCurrent()) setAdminFilters(data);
      }
    } catch (e) {
      if (request.isCurrent()) console.error(e);
    }
  };

  // Fetch Admin Products
  const fetchAdminProducts = async () => {
    const request = productsRequest.current.start();
    try {
      setIsFetchingList(true);
      const url = new URL(`${API_BASE_URL}/api/products/admin/search`);
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

      const res = await fetch(url.toString(), { signal: request.signal, headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (!request.isCurrent()) return;
        setListData(data.data);
        setPagination(data.pagination);
      }
    } catch (e) {
      if (request.isCurrent()) console.error(e);
    } finally {
      if (request.isCurrent()) setIsFetchingList(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/export`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error('Lỗi khi export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Không thể export dữ liệu.');
    }
  };

  useEffect(() => {
    if (view === 'list') {
      fetchAdminFilters();
    }
    return () => filtersRequest.current.cancel();
  }, [listCategory, view, token]);

  useEffect(() => {
    if (view === 'list') {
      fetchAdminProducts();
    }
    return () => productsRequest.current.cancel();
  }, [debouncedSearch, listCategory, listStatus, listStock, listSort, listFilters, pagination.page, view, token]);

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
    const confirmMsg = action === 'delete' ? 'Bạn có chắc muốn xoá các sản phẩm đã chọn?' : `Thay đổi trạng thái ${selectedProductIds.length} sản phẩm?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/admin/bulk-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, productIds: selectedProductIds })
      });
      if (res.ok) {
        setSelectedProductIds([]);
        fetchAdminProducts();
        if (action === 'delete') fetchAdminFilters();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Lỗi khi thực hiện thao tác.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ.');
    }
  };


  // VIEW STATE: 'list' or 'form'
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    image: '',
    images: ['', '', '', '', ''] as string[],
    categoryId: '',
    status: 'active'
  });

  // Dynamic Variant Options state
  const [variantOptions, setVariantOptions] = useState<Record<string, VariantOption[]>>({});
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [specImages, setSpecImages] = useState<string[]>([]);

  // Input states for variant tags
  const [attrInputs, setAttrInputs] = useState<Record<string, string>>({});
  const [colorHexInput, setColorHexInput] = useState('#ffffff');

  // Dropdown search
  const [catSearch, setCatSearch] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  const catalogRequest = useRef(createLatestRequest());
  const categoriesRequest = useRef(createLatestRequest());

  // Fetch Data
  const fetchProducts = async () => {
    const request = catalogRequest.current.start();
    try {
      setIsLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`, { signal: request.signal });
      if (res.ok) {
        const data = await res.json();
        if (request.isCurrent()) setProducts(data);
      }
    } catch (err) {
      if (request.isCurrent()) console.error('Error fetching products', err);
    } finally {
      if (request.isCurrent()) setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const request = categoriesRequest.current.start();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`, { signal: request.signal });
      if (res.ok) {
        const data = await res.json();
        if (request.isCurrent()) setCategories(data);
      }
    } catch (error) {
      if (request.isCurrent()) console.error('Lỗi tải danh mục:', error);
    }
  };

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
    return () => {
      catalogRequest.current.cancel();
      categoriesRequest.current.cancel();
    };
  }, []);

  // Flatten Categories
  const flattenCategories = (cats: Category[], depth = 0): { id: string; name: string; slug: string; depth: number }[] => {
    let result: { id: string; name: string; slug: string; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, slug: (cat as any).slug || '', depth });
      if (cat.children) {
        if (cat.children && Array.isArray(cat.children) && cat.children.length > 0) {
          result = result.concat(flattenCategories(cat.children, depth + 1));
        }
      }
    }
    return result;
  };
  const flatCats = flattenCategories(categories || []);
  const selectableFormCategories = flatCats.filter((category) => (
    Boolean(category?.slug && NAVBAR_CATEGORY_FAMILY_BY_SLUG[category.slug.toLowerCase()])
  ));
  const filteredCats = selectableFormCategories.filter((category) => (
    Boolean(category?.name && category.name.toLowerCase().includes((catSearch || '').toLowerCase()))
  ));

  // Category Configuration logic
  const currentCategoryConfigKey = useMemo(() => {
    if (!formData.categoryId) return 'default';
    const cat = flatCats.find(c => c.id === formData.categoryId);
    const catName = cat?.name.toLowerCase() || '';
    const catSlug = cat?.slug.toLowerCase() || '';
    const navbarFamily = NAVBAR_CATEGORY_FAMILY_BY_SLUG[catSlug];
    if (navbarFamily) return navbarFamily;
    if (catSlug === 'apple-watch' || catSlug === 'samsung-watch' || catSlug === 'xiaomi-watch' || catSlug.includes('watch') || catSlug.includes('dong-ho') || catSlug.includes('ong-ho') || catName.includes('đồng hồ') || catName.includes('watch')) return 'watch';
    if (catName.includes('điện thoại') || catName.includes('iphone') || catName.includes('samsung') || catSlug.includes('phone') || catSlug.includes('iphone')) return 'phone';
    if (catName.includes('laptop') || catName.includes('macbook') || catSlug.includes('laptop') || catSlug.includes('macbook')) return 'laptop';
    if (catName.includes('ipad') || catName.includes('máy tính bảng') || catName.includes('tablet') || catSlug.includes('tablet') || catSlug.includes('ipad')) return 'tablet';
    if (catName.includes('pc') || catName.includes('máy tính để bàn') || catSlug.includes('pc')) return 'pc';
    if (catName.includes('phụ kiện') || catName.includes('tai nghe') || catSlug.includes('phu-kien')) return 'accessories';
    return 'default';
  }, [formData.categoryId, flatCats]);

  const currentConfig = CATEGORY_CONFIGS[currentCategoryConfigKey];

  // Select category with intelligent brand suggestion
  const handleSelectCategory = (catId: string) => {
    const cat = flatCats.find(c => c.id === catId);
    const catSlug = cat?.slug.toLowerCase() || '';
    let autoBrand = formData.brand;
    if (catSlug === 'apple-watch' || catSlug === 'iphone' || catSlug === 'ipad' || catSlug === 'macbook') {
      if (!formData.brand || formData.brand.toLowerCase() !== 'apple') autoBrand = 'Apple';
    } else if (catSlug === 'samsung-watch' || catSlug.includes('samsung')) {
      if (!formData.brand || formData.brand.toLowerCase() !== 'samsung') autoBrand = 'Samsung';
    } else if (catSlug === 'xiaomi-watch' || catSlug.includes('xiaomi')) {
      if (!formData.brand || formData.brand.toLowerCase() !== 'xiaomi') autoBrand = 'Xiaomi';
    }
    setFormData(prev => ({ ...prev, categoryId: catId, brand: autoBrand }));
    setIsCatDropdownOpen(false);
    setCatSearch('');
  };

  // Pre-fill Specifications & Reset Variants based on Category
  useEffect(() => {
    if (view === 'form' && formData.categoryId && !editingProduct) {
      setSpecGroups([{
        title: 'Thông số chung',
        items: currentConfig.specifications.map(key => ({ label: key, value: '' }))
      }]);
      // Initialize variantOptions with empty arrays for current config
      const initialOpts: Record<string, VariantOption[]> = {};
      currentConfig.variants.forEach(v => {
        initialOpts[v] = variantOptions[v] || []; // preserve if already exist
      });
      setVariantOptions(initialOpts);
    }
  }, [formData.categoryId, currentConfig]);


  const handleUploadColorImage = async (e: React.ChangeEvent<HTMLInputElement>, attrKey: string, optIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setErrorMsg('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh vượt quá 5MB');
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh màu');
      const uploadedUrl = data.url || data.imageUrl;
      if (uploadedUrl) {
        setVariantOptions(prev => {
          const newOpts = { ...prev };
          const attrArr = [...(newOpts[attrKey] || [])];
          if (attrArr[optIndex]) {
            attrArr[optIndex] = { ...attrArr[optIndex], image: uploadedUrl };
            
            // Auto update image in variantRows that match this color
            if (attrKey === 'Màu sắc') {
              setVariantRows(currentRows => currentRows.map(row => {
                if (row.attributes['Màu sắc'] === attrArr[optIndex].name) {
                  return { ...row, image: uploadedUrl };
                }
                return row;
              }));
            }
          }
          newOpts[attrKey] = attrArr;
          return newOpts;
        });
      }
    } catch (err: any) {
      console.error('Error uploading color image', err);
      setErrorMsg(err.message || 'Lỗi khi tải ảnh màu');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleUploadVariantRowImage = async (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Ảnh vượt quá 5MB');
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh biến thể');
      const uploadedUrl = data.url || data.imageUrl;
      if (uploadedUrl) {
        setVariantRows(prev => {
          const next = [...prev];
          if (next[rowIndex]) {
            next[rowIndex] = { ...next[rowIndex], image: uploadedUrl };
          }
          return next;
        });
      }
    } catch (err: any) {
      console.error('Error uploading variant row image', err);
      setErrorMsg(err.message || 'Lỗi khi tải ảnh biến thể');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload Main Images
  const handleUploadGallerySlot = async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');

    try {
      if (file.size > 5 * 1024 * 1024) throw new Error(`Ảnh vượt quá 5MB`);
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh');
      
      const uploadedUrl = data.url || data.imageUrl;
      const newImages = [...formData.images];
      newImages[slotIndex] = uploadedUrl;
      
      setFormData(prev => ({ 
        ...prev, 
        images: newImages,
        image: newImages[0] || prev.image
      }));
    } catch (error: any) {
      setErrorMsg(error.message || 'Lỗi tải ảnh');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeGallerySlot = (slotIndex: number) => {
    const newImages = [...formData.images];
    newImages[slotIndex] = '';
    setFormData({
      ...formData,
      images: newImages,
      image: newImages[0] || ''
    });
  };

  const handleUploadSpecImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMsg('');
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) throw new Error(`Ảnh "${file.name}" vượt quá 5MB`);
        const uploadData = new FormData();
        uploadData.append('image', file);
        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          body: uploadData
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Lỗi khi tải ảnh thông số');
        }
        
        const data = await res.json();
        const uploadedUrl = data.url || data.imageUrl;
        if (uploadedUrl) {
          newUrls.push(uploadedUrl);
        }
      }
      setSpecImages(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      console.error('Error uploading spec images', err);
      setErrorMsg(err.message || 'Lỗi khi tải ảnh thông số');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeSpecImage = (index: number) => {
    setSpecImages(prev => prev.filter((_, i) => i !== index));
  };

  // Open Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', brand: '', image: '', images: ['', '', '', '', ''], categoryId: '', status: 'active' });
    setVariantOptions({});
    setVariantRows([]);
    setSpecGroups([]);
    setSpecImages([]);
    setErrorMsg('');
    setView('form');
  };

  // Open Edit
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      brand: product.brand || '',
      image: product.image || '',
      images: Array(5).fill('').map((_, i) => product.images?.[i] || ''),
      categoryId: product.categoryId || '',
      status: product.status
    });

    // Parse specifications: support both old flat format and new grouped format
    if (product.specifications) {
      const specs = (Array.isArray(product.specifications) ? product.specifications : []) as any[];
      const imageSpecs = specs.filter(s => s.type === 'specImage');
      setSpecImages(imageSpecs.map(s => s.url || '').filter(Boolean));

      const realGroups = specs.filter(s => s.type !== 'specImage');
      
      // Check if it's already in the nested format (has title or items array)
      const isNested = realGroups.some(g => g.title !== undefined || Array.isArray(g.items));
      
      if (isNested) {
        const parsedGroups = realGroups.map((g: any) => {
          let title = g.title;
          if (title === undefined) title = g.key || '';
          const items = Array.isArray(g.items) 
            ? g.items.map((i: any) => ({ label: i.label || i.key || '', value: i.value || '' }))
            : (g.label || g.key ? [{ label: g.label || g.key || '', value: g.value || '' }] : []);
          return { title, items };
        });
        
        // Filter out completely empty groups
        setSpecGroups(parsedGroups.filter(g => g.title || g.items.length > 0));
      } else if (realGroups.length > 0) {
        // Fallback: It's completely flat
        const items = realGroups.map((s: any) => ({ label: s.key || s.label || '', value: s.value || '' }));
        setSpecGroups([{ title: 'Thông số chung', items }]);
      } else {
        setSpecGroups([]);
      }
    } else {
      setSpecGroups([]);
      setSpecImages([]);
    }

    const existingOptions: Record<string, Map<string, VariantOption>> = {};
    
    product.variants.forEach(v => {
      Object.entries(v.attributes || {}).forEach(([attrKey, attrValue]) => {
        if (!existingOptions[attrKey]) {
          existingOptions[attrKey] = new Map();
        }
        if (!existingOptions[attrKey].has(attrValue) || (attrKey === 'Màu sắc' && v.image)) {
           existingOptions[attrKey].set(attrValue, {
             name: attrValue,
             price: attrKey === 'Dung lượng' ? v.price.toString() : undefined,
             hex: attrKey === 'Màu sắc' ? (v.colorCode || '#ffffff') : undefined,
             image: attrKey === 'Màu sắc' ? (v.image || '') : undefined
           });
        }
      });
    });

    const newVariantOptions: Record<string, VariantOption[]> = {};
    Object.keys(existingOptions).forEach(key => {
      newVariantOptions[key] = Array.from(existingOptions[key].values());
    });
    setVariantOptions(newVariantOptions);

    setVariantRows(product.variants.map(v => ({
      id: v.id,
      sku: v.sku,
      price: v.price.toString(),
      salePrice: v.salePrice ? v.salePrice.toString() : '',
      stock: v.stock.toString(),
      attributes: (v.attributes || {}) as Record<string, string>,
      colorCode: v.colorCode || '',
      image: v.image || ''
    })));

    setErrorMsg('');
    setView('form');
  };

  // Auto Generate Variants (Cartesian Product)
  const generateSkuPart = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleGenerateVariants = () => {
    const keys = currentConfig.variants;
    const baseSku = formData.name ? generateSkuPart(formData.name.substring(0, 4)) : 'SKU';
    
    // Check if any variant options exist
    const hasAnyOption = keys.some(key => variantOptions[key] && variantOptions[key].length > 0);
    
    if (!hasAnyOption) {
      const defaultExisting = variantRows[0];
      setVariantRows([{
        id: defaultExisting?.id,
        sku: defaultExisting?.sku || (formData.name ? generateSkuPart(formData.name.substring(0, 8)) : 'DEFAULT'),
        price: defaultExisting?.price || '0',
        salePrice: defaultExisting?.salePrice || '',
        stock: defaultExisting?.stock || '0',
        attributes: {},
        colorCode: '',
        image: ''
      }]);
      return;
    }

    const generateCombinations = (
      keysList: string[], 
      currentAttr: Record<string, string>, 
      currentColor: VariantOption | null, 
      currentPriceMap: number
    ): VariantFormRow[] => {
      if (keysList.length === 0) {
        const existing = variantRows.find(v => {
          for (const k in currentAttr) {
            if (v.attributes[k] !== currentAttr[k]) return false;
          }
          return true;
        });

        const skuParts = [baseSku, ...Object.values(currentAttr).map(generateSkuPart)];

        return [{
          id: existing?.id,
          sku: existing?.sku || skuParts.join('-'),
          price: existing?.price || (currentPriceMap ? currentPriceMap.toString() : '0'),
          salePrice: existing?.salePrice || '',
          stock: existing?.stock || '0',
          attributes: currentAttr,
          colorCode: currentColor?.hex || existing?.colorCode || '',
          image: currentColor?.image || existing?.image || ''
        }];
      }

      const key = keysList[0];
      const options = variantOptions[key] || [];
      
      if (options.length === 0) {
        return generateCombinations(keysList.slice(1), currentAttr, currentColor, currentPriceMap);
      }

      let combos: VariantFormRow[] = [];
      for (const opt of options) {
        const nextColor = key === 'Màu sắc' ? opt : currentColor;
        const nextPrice = (key !== 'Màu sắc') && opt.price ? Number(opt.price) : currentPriceMap;
        combos = combos.concat(generateCombinations(keysList.slice(1), { ...currentAttr, [key]: opt.name }, nextColor, nextPrice));
      }
      return combos;
    };

    const newVariants = generateCombinations(keys, {}, null, 0);
    setVariantRows(newVariants);
  };

  const handleAddManualVariant = () => {
    const baseSku = formData.name ? generateSkuPart(formData.name.substring(0, 4)) : 'SKU';
    const newSku = `${baseSku}-${Date.now().toString().slice(-4)}`;
    setVariantRows(prev => [
      ...prev,
      {
        sku: newSku,
        price: '0',
        salePrice: '',
        stock: '0',
        attributes: {},
        colorCode: '',
        image: ''
      }
    ]);
  };

  // Submit Form
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (!formData.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm.");
      if (!formData.categoryId) throw new Error("Vui lòng chọn danh mục.");
      if (variantRows.length === 0) throw new Error("Sản phẩm cần ít nhất 1 biến thể.");

      // Check variant uniqueness and fields
      const skuSet = new Set<string>();
      for (let i = 0; i < variantRows.length; i++) {
        const v = variantRows[i];
        const trimmedSku = v.sku.trim();
        if (!trimmedSku) throw new Error(`Vui lòng nhập SKU cho biến thể dòng ${i + 1}.`);
        if (skuSet.has(trimmedSku)) throw new Error(`Mã SKU "${trimmedSku}" bị trùng lặp.`);
        skuSet.add(trimmedSku);

        const price = Number(v.price);
        if (isNaN(price) || price < 0) throw new Error(`Giá bán của biến thể "${trimmedSku}" không hợp lệ.`);
        if (v.salePrice && v.salePrice.trim() !== '') {
          const sp = Number(v.salePrice);
          if (isNaN(sp) || sp < 0) throw new Error(`Giá khuyến mãi của biến thể "${trimmedSku}" không hợp lệ.`);
          if (sp > price) throw new Error(`Giá khuyến mãi của biến thể "${trimmedSku}" không được lớn hơn giá bán.`);
        }
        const stock = parseInt(v.stock, 10);
        if (isNaN(stock) || stock < 0) throw new Error(`Tồn kho của biến thể "${trimmedSku}" không hợp lệ.`);
      }

      const filteredImages = formData.images.filter(img => img);
      const finalImage = filteredImages.length > 0 ? filteredImages[0] : '';

      const variants = variantRows.map(v => {
        const normalizedAttrs: Record<string, string> = {};
        Object.entries(v.attributes || {}).forEach(([k, val]) => {
          if (k && val !== undefined && val !== null && String(val).trim()) {
            normalizedAttrs[k.trim()] = String(val).trim();
          }
        });

        return {
          id: v.id,
          sku: v.sku.trim(),
          price: Number(v.price),
          salePrice: v.salePrice && v.salePrice.trim() !== '' ? Number(v.salePrice) : null,
          stock: Math.max(0, parseInt(v.stock, 10) || 0),
          attributes: normalizedAttrs,
          colorCode: v.colorCode ? v.colorCode.trim() : null,
          image: v.image || null
        };
      });

      const url = editingProduct ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${editingProduct.id}` : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const finalSpecs = specGroups.filter(g => g.title || g.items.some(i => i.label));
      let specsToSave: any[] = finalSpecs;
      if (specImages.length > 0) {
        specsToSave = [...finalSpecs, ...specImages.map(url => ({ type: 'specImage', url }))];
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          description: formData.description.trim() || null,
          status: formData.status || 'active',
          images: filteredImages,
          image: finalImage,
          specifications: specsToSave,
          variants
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu sản phẩm');

      await fetchProducts();
      setView('list');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Xóa sản phẩm "${name}" và toàn bộ biến thể?`)) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setProducts(products.filter(p => p.id !== id));
    } catch { alert('Lỗi khi xóa'); }
  };

  const listFilteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.variants.some(v => v.sku.toLowerCase().includes(search.toLowerCase())));

  // ===== RENDER FORM VIEW =====
  if (view === 'form') {
    return (
      <div className="flex flex-col h-full gap-4 text-white w-full relative">
        {/* HEADER */}
        <div className="flex items-center justify-between shrink-0 bg-[#1c1c1e] p-4 rounded-2xl border border-white/10">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-lg">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</span>
          </button>
          <div className="flex items-center gap-3">
            <button disabled={isSubmitting} onClick={() => handleSubmit()} className="px-5 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-black hover:bg-emerald-400 transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]">
              {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
            </button>
          </div>
        </div>

        {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm shrink-0">{errorMsg}</div>}

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
            
            {/* THÔNG TIN CƠ BẢN */}
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">THÔNG TIN CƠ BẢN</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Tên sản phẩm *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-emerald-500" placeholder="VD: iPhone 15 Pro Max" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Danh mục *</label>
                    <div className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors" onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}>
                      <span className={formData.categoryId ? "text-white" : "text-white/40"}>{formData.categoryId ? flatCats.find(c => c.id === formData.categoryId)?.name : "-- Chọn --"}</span>
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    </div>
                    <AnimatePresence>
                      {isCatDropdownOpen && (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute z-50 top-full left-0 right-0 mt-2 bg-[#2a2a2c] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-64 flex flex-col">
                          <div className="p-2 border-b border-white/10 shrink-0 sticky top-0 bg-[#2a2a2c] z-10">
                            <input autoFocus type="text" placeholder="Tìm..." value={catSearch} onChange={e => setCatSearch(e.target.value)} onClick={e => e.stopPropagation()} className="w-full h-9 bg-black/30 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-emerald-500" />
                          </div>
                          <div className="overflow-y-auto custom-scrollbar p-1">
                            {filteredCats.map(c => (
                              <div key={c.id} onClick={() => handleSelectCategory(c.id)} className={cn("px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2", formData.categoryId === c.id ? "bg-emerald-500/10 text-emerald-400" : "text-white/80")} style={{ paddingLeft: `${(c.depth * 12) + 12}px` }}>
                                {c.depth > 0 && <ChevronRight className="w-3 h-3 text-white/30" />} {c.name}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Thương hiệu</label>
                    <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-emerald-500" placeholder="VD: Apple, Samsung..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Mô tả sản phẩm</label>
                  <RichTextEditor
                    content={formData.description}
                    onChange={(html) => setFormData({...formData, description: html})}
                    placeholder="Nhập mô tả chi tiết..."
                  />
                </div>
              </div>
            </div>

            {/* HÌNH ẢNH SẢN PHẨM */}
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">HÌNH ẢNH SẢN PHẨM</h3>
              
              {isUploading && <div className="text-xs text-emerald-400 animate-pulse mb-3">Đang tải ảnh lên...</div>}

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                {IMAGE_SLOTS.map((label, index) => {
                  const hasImage = !!formData.images[index];
                  const isMain = index === 0;
                  return (
                    <div key={index} className="flex flex-col gap-2">
                      <div className={cn("relative aspect-square rounded-xl border overflow-hidden group flex flex-col items-center justify-center transition-colors", hasImage ? (isMain ? "border-emerald-500/50 bg-black/20" : "border-white/10 bg-black/20") : "border-dashed border-white/20 hover:border-emerald-500/50 bg-black/20 cursor-pointer")}>
                        {hasImage ? (
                          <>
                            <img src={resolveMediaUrl(formData.images[index])} alt={label} className="w-full h-full object-contain p-2" />
                            <button type="button" onClick={() => removeGallerySlot(index)} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all shadow-md"><X className="w-3 h-3" /></button>
                          </>
                        ) : (
                          <label className="absolute inset-0 flex flex-col items-center justify-center text-white/30 cursor-pointer group-hover:text-emerald-400 transition-colors">
                            <Upload className="w-5 h-5 mb-1 opacity-70" />
                            <span className="text-[10px]">Tải ảnh</span>
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadGallerySlot(e, index)} disabled={isUploading} />
                          </label>
                        )}
                      </div>
                      <div className="text-center">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-block", isMain ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-white/50 bg-white/5")}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BIẾN THỂ (VARIANTS) */}
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">BIẾN THỂ</h3>
                <span className="text-xs text-emerald-400 font-medium">({variantRows.length} biến thể)</span>
              </div>
              
              <div className="space-y-6">
                {/* Dynamic Variant tags based on Category */}
                {currentConfig.variants.map(attrKey => {
                  const opts = variantOptions[attrKey] || [];
                  const isColor = attrKey === 'Màu sắc';
                  
                  return (
                    <div key={attrKey} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <label className="block text-xs font-medium text-emerald-400 mb-2">{attrKey}</label>
                      <div className="flex flex-wrap items-start gap-3">
                        {opts.map((opt, i) => (
                          <div key={i} className={cn("flex flex-col gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl", isColor ? "min-w-[100px]" : "")}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                {isColor && <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: opt.hex }} />}
                                <span className="text-sm font-medium text-white/90">{opt.name}</span>
                              </div>
                              <button onClick={() => {
                                const newOpts = { ...variantOptions };
                                newOpts[attrKey] = opts.filter((_, idx) => idx !== i);
                                setVariantOptions(newOpts);
                              }} className="text-white/40 hover:text-white/90 transition-colors p-0.5 rounded-md hover:bg-white/10"><X className="w-3.5 h-3.5"/></button>
                            </div>
                            
                            {!isColor && (
                              <input type="number" placeholder="Giá..." value={opt.price || ''} onChange={e => { 
                                const newOpts = { ...variantOptions };
                                newOpts[attrKey][i].price = e.target.value;
                                setVariantOptions(newOpts);
                              }} className="w-full bg-transparent text-xs outline-none text-emerald-400 placeholder:text-white/30 border-b border-white/10 focus:border-emerald-400 pb-1" />
                            )}

                            {isColor && (
                              <label className="flex items-center justify-center gap-1.5 text-[11px] text-white/60 hover:text-emerald-400 cursor-pointer w-full mt-1 border border-dashed border-white/20 hover:border-emerald-500/50 rounded-lg p-1.5 transition-colors bg-black/20">
                                {opt.image ? (
                                  <img src={resolveMediaUrl(opt.image)} className="w-full h-8 object-contain rounded-sm" alt="color variant" />
                                ) : (
                                  <><Upload className="w-3 h-3" /> Tải ảnh</>
                                )}
                                <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadColorImage(e, attrKey, i)} disabled={isUploading} />
                              </label>
                            )}
                          </div>
                        ))}
                        
                        <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2 h-auto">
                          {isColor && (
                            <input type="color" value={colorHexInput} onChange={e => setColorHexInput(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0 shrink-0" />
                          )}
                          <input type="text" value={attrInputs[attrKey] || ''} onChange={e => setAttrInputs({...attrInputs, [attrKey]: e.target.value})} 
                            onKeyDown={e => { 
                              if (e.key === 'Enter') { 
                                e.preventDefault(); 
                                const val = attrInputs[attrKey];
                                if (val && !opts.find(o => o.name === val)) { 
                                  const newOpts = { ...variantOptions };
                                  newOpts[attrKey] = [...opts, { name: val, hex: isColor ? colorHexInput : undefined }];
                                  setVariantOptions(newOpts);
                                  setAttrInputs({...attrInputs, [attrKey]: ''}); 
                                } 
                              } 
                            }} 
                            placeholder={`Thêm ${attrKey}...`} className="w-28 bg-transparent text-sm focus:outline-none placeholder:text-white/30" />
                        </div>
                      </div>
                      
                      {/* Predefined options */}
                      {isColor ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {PREDEFINED_COLORS.map(col => (
                            <button key={col.name} type="button" onClick={() => {
                              if (!opts.find(c => c.name === col.name)) {
                                const newOpts = { ...variantOptions };
                                newOpts[attrKey] = [...opts, col];
                                setVariantOptions(newOpts);
                              }
                            }} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/70 transition-colors border border-transparent hover:border-emerald-500/30">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: col.hex }} />
                              {col.name}
                            </button>
                          ))}
                        </div>
                      ) : PREDEFINED_OPTIONS[attrKey] ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {PREDEFINED_OPTIONS[attrKey].map(optName => (
                            <button key={optName} type="button" onClick={() => {
                              if (!opts.find(c => c.name === optName)) {
                                const newOpts = { ...variantOptions };
                                newOpts[attrKey] = [...opts, { name: optName }];
                                setVariantOptions(newOpts);
                              }
                            }} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/70 transition-colors border border-transparent hover:border-emerald-500/30">
                              + {optName}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}

                {/* Generate and Add Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  <button type="button" onClick={handleGenerateVariants} className="h-10 px-4 rounded-xl font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-2 border border-emerald-500/20 text-sm flex-1 justify-center shadow-sm">
                    <Zap className="w-4 h-4 fill-emerald-400" /> Sinh biến thể tự động
                  </button>
                  <button type="button" onClick={handleAddManualVariant} className="h-10 px-4 rounded-xl font-medium bg-white/5 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2 border border-white/10 text-sm justify-center">
                    <Plus className="w-4 h-4" /> Thêm biến thể
                  </button>
                </div>

                {/* Variant Table */}
                {variantRows.length > 0 && (
                  <div className="mt-4 border border-white/10 rounded-xl overflow-x-auto bg-black/20">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-white/5 text-xs text-white/50 uppercase border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 font-medium">Variant</th>
                          <th className="px-4 py-3 font-medium">SKU *</th>
                          <th className="px-4 py-3 font-medium">Giá bán (₫) *</th>
                          <th className="px-4 py-3 font-medium">Giá KM (₫)</th>
                          <th className="px-4 py-3 font-medium w-24">Tồn kho *</th>
                          <th className="px-2 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {variantRows.map((row, idx) => {
                          const variantName = Object.values(row.attributes || {}).filter(Boolean).join(' / ') || 'Mặc định';
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-medium text-white/90">
                                <div className="flex items-center gap-2">
                                  <label className="relative w-7 h-7 rounded border border-white/20 hover:border-emerald-500 overflow-hidden cursor-pointer flex items-center justify-center shrink-0 bg-black/40 group/vimg" title="Nhấn để đổi ảnh biến thể">
                                    {row.image ? (
                                      <img src={resolveMediaUrl(row.image)} alt="v" className="w-full h-full object-cover" />
                                    ) : row.colorCode ? (
                                      <span className="w-full h-full" style={{ backgroundColor: row.colorCode }} />
                                    ) : (
                                      <Upload className="w-3.5 h-3.5 text-white/40 group-hover/vimg:text-emerald-400" />
                                    )}
                                    <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadVariantRowImage(e, idx)} disabled={isUploading} />
                                  </label>
                                  <span>{variantName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2"><input type="text" value={row.sku} onChange={e => { const r = [...variantRows]; r[idx].sku = e.target.value; setVariantRows(r); }} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 px-1 outline-none text-white/80" placeholder="SKU" /></td>
                              <td className="px-4 py-2"><input type="number" value={row.price} onChange={e => { const r = [...variantRows]; r[idx].price = e.target.value; setVariantRows(r); }} className="w-24 bg-transparent border-b border-transparent focus:border-emerald-500 px-1 outline-none text-white/80" placeholder="0" /></td>
                              <td className="px-4 py-2"><input type="number" value={row.salePrice || ''} onChange={e => { const r = [...variantRows]; r[idx].salePrice = e.target.value; setVariantRows(r); }} className="w-24 bg-transparent border-b border-transparent focus:border-emerald-500 px-1 outline-none text-emerald-400 placeholder:text-white/30" placeholder="Trống" /></td>
                              <td className="px-4 py-2"><input type="number" value={row.stock} onChange={e => { const r = [...variantRows]; r[idx].stock = e.target.value; setVariantRows(r); }} className="w-16 h-8 bg-white/5 border border-white/10 rounded px-2 outline-none focus:border-emerald-500" placeholder="0" /></td>
                              <td className="px-2 py-2 text-right"><button type="button" onClick={() => setVariantRows(variantRows.filter((_, i) => i !== idx))} className="p-1.5 text-white/30 hover:text-red-400 rounded"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 space-y-6 sticky top-4 self-start">
            {/* THÔNG SỐ KỸ THUẬT */}
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">THÔNG SỐ KỸ THUẬT</h3>
              <div className="mb-6 bg-black/20 p-4 rounded-xl border border-white/10">
                <label className="block text-xs font-medium text-white/50 mb-3">Ảnh minh họa (Bên trái)</label>
                <div className="flex items-start gap-4 flex-wrap">
                  {specImages.map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 group flex-shrink-0 bg-white/5">
                      <img src={resolveMediaUrl(img)} alt="Spec" className="w-full h-full object-contain" />
                      <button type="button" onClick={() => removeSpecImage(idx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {specImages.length < 5 && (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-white/20 hover:border-emerald-500/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 flex-shrink-0">
                      <Upload className="w-5 h-5 text-white/40 mb-1" />
                      <span className="text-[10px] text-white/40 text-center px-1">Thêm ảnh</span>
                      <input type="file" className="hidden" accept="image/*" multiple onChange={handleUploadSpecImages} disabled={isUploading} />
                    </label>
                  )}
                  <div className="flex-1 text-xs text-white/40 leading-relaxed">
                    Ảnh sẽ hiển thị ở khoảng trống bên trái của phần thông số trên giao diện người dùng. (Tỷ lệ dọc khuyên dùng).
                  </div>
                </div>
              </div>
              <SpecificationGroupEditor
                groups={specGroups}
                onChange={setSpecGroups}
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // ===== RENDER LIST VIEW =====
  return (
    <div className="flex flex-col h-full gap-5 text-white w-full relative">
      {/* HEADER */}
      <section className="header-glow-green px-7 py-5 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl glass-btn-3d flex items-center justify-center text-emerald-300 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">Sản phẩm</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-[#2ee88a] border border-emerald-400/30">
                {pagination.total} mặt hàng
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Quản lý danh mục sản phẩm, biến thể SKU và cảnh báo tồn kho</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Bulk Actions */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2 glass-btn-3d px-3 py-1.5 rounded-xl border border-emerald-500/30 mr-1">
              <span className="text-xs text-[#2ee88a] font-medium">Đã chọn {selectedProductIds.length}</span>
              <div className="h-4 w-px bg-emerald-500/20 mx-1"></div>
              <button onClick={() => handleBulkAction('activate')} className="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2 py-1 rounded transition-colors font-medium">Hiện</button>
              <button onClick={() => handleBulkAction('deactivate')} className="text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-1 rounded transition-colors font-medium">Ẩn</button>
              <button onClick={() => handleBulkAction('delete')} className="text-[10px] bg-red-500/20 text-red-300 hover:bg-red-500/30 px-2 py-1 rounded transition-colors font-medium">Xoá</button>
            </div>
          )}

          {/* Search */}
          <div className="relative flex-1 sm:w-56 md:w-60">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm tên, SKU..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/45 border border-white/10 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-400/60 transition" 
            />
          </div>

          {/* Sort */}
          <div className="relative">
            <select 
              value={listSort} 
              onChange={e => setListSort(e.target.value)}
              className="glass-btn-3d px-4 py-2 pr-9 rounded-xl text-sm text-zinc-200 outline-none appearance-none cursor-pointer"
            >
              <option value="newest" className="bg-[#06120d] text-white">Mới nhất</option>
              <option value="price_asc" className="bg-[#06120d] text-white">Giá tăng dần</option>
              <option value="price_desc" className="bg-[#06120d] text-white">Giá giảm dần</option>
              <option value="name_asc" className="bg-[#06120d] text-white">Tên A-Z</option>
              <option value="name_desc" className="bg-[#06120d] text-white">Tên Z-A</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-black/50 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Chuyển sang dạng lưới"
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                viewMode === 'grid' ? "bg-emerald-500/25 text-[#2ee88a] border border-emerald-400/30 shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Chuyển sang dạng danh sách"
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                viewMode === 'list' ? "bg-emerald-500/25 text-[#2ee88a] border border-emerald-400/30 shadow-sm" : "text-zinc-400 hover:text-white"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Export */}
          <button onClick={handleExport} className="glass-btn-3d px-4 py-2 rounded-xl text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-300" /> Export
          </button>

          {/* Import */}
          <button onClick={() => setIsImportModalOpen(true)} className="glass-btn-3d px-4 py-2 rounded-xl text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-300" /> Import
          </button>

          {/* Add New */}
          <button onClick={handleOpenCreate} className="btn-neon-primary px-5 py-2 rounded-xl text-sm flex items-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Thêm mới
          </button>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col lg:flex-row gap-5 min-h-0 relative items-start">
        {/* SIDEBAR */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0">
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

        {/* PRODUCT GRID / LIST PANEL */}
        <div className="flex-1 w-full neon-panel p-6 flex flex-col justify-between min-h-[500px] overflow-hidden relative">
          
          {/* Header of Product Panel */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 shrink-0">
            <label className="flex items-center gap-3 text-sm text-zinc-300 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="neon-checkbox cursor-pointer"
                checked={listData.length > 0 && selectedProductIds.length === listData.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProductIds(listData.map(p => p.id));
                  } else {
                    setSelectedProductIds([]);
                  }
                }}
              />
              <span>Chọn tất cả trang này</span>
            </label>
            <div className="flex items-center gap-3">
              {isFetchingList && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin"/> Đang tải...
                </div>
              )}
              <span className="text-xs text-zinc-400">
                Hiển thị <strong className="text-white">{listData.length}</strong> trên <strong className="text-white">{pagination.total}</strong> kết quả
              </span>
            </div>
          </div>

          {/* Cards or Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-6 pr-1">
            {listData.length === 0 && !isFetchingList ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-zinc-400">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Package className="w-8 h-8 text-emerald-300/40" />
                </div>
                <p className="text-sm font-medium">Không tìm thấy sản phẩm nào</p>
                <p className="text-xs text-zinc-500 mt-1">Hãy thử thay đổi từ khóa hoặc bộ lọc</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 p-1">
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
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="w-full overflow-x-auto p-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider border-b border-white/10">
                      <th className="p-3 w-10"></th>
                      <th className="p-3 min-w-[250px]">Sản phẩm</th>
                      <th className="p-3">Danh mục</th>
                      <th className="p-3">Giá</th>
                      <th className="p-3 text-center">Tồn kho</th>
                      <th className="p-3 text-center">Biến thể</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 w-12 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
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
                        viewMode="list"
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-5 mt-3 border-t border-white/10 shrink-0 px-2">
              <span className="text-xs text-zinc-400">
                Trang <strong className="text-white">{pagination.page}</strong> / {pagination.totalPages}
              </span>

              <div className="flex items-center gap-2">
                <button 
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  className="glass-btn-3d px-3.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  Trước
                </button>
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none">
                  {Array.from({ length: pagination.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                      className={cn(
                        "w-8 h-8 rounded-xl text-xs flex items-center justify-center transition-all",
                        pagination.page === i + 1 
                          ? "btn-neon-primary font-bold" 
                          : "glass-btn-3d text-zinc-300 hover:text-white"
                      )}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  className="glass-btn-3d px-3.5 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
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

      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setIsImportModalOpen(false);
          fetchAdminProducts();
          fetchAdminFilters();
        }}
        token={token || ''}
      />
    </div>
  );
}
