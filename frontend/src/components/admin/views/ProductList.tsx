import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, X, Package, RefreshCw, ChevronDown, ChevronRight, ArrowLeft, Image as ImageIcon, Zap, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { resolveMediaUrl } from '@/utils/media';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

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
  specifications: { key: string; value: string }[] | null;
  variants: ProductVariant[];
  updatedAt: string;
}

interface VariantFormRow {
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
    variants: ["Kích thước", "Màu sắc", "Dây đeo"],
    specifications: ["Màn hình", "Chất liệu", "Đường kính mặt", "Pin", "Kết nối", "Kháng nước"]
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
  "Kết nối": ["Wi-Fi", "Wi-Fi + 5G", "Wi-Fi + Cellular", "Bluetooth"],
  "Kích thước": ["40mm", "41mm", "44mm", "45mm", "49mm"]
};

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();

  // VIEW STATE: 'list' or 'form'
  const [view, setView] = useState<'list' | 'form'>('list');
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
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);

  // Input states for variant tags
  const [attrInputs, setAttrInputs] = useState<Record<string, string>>({});
  const [colorHexInput, setColorHexInput] = useState('#ffffff');

  // Dropdown search
  const [catSearch, setCatSearch] = useState('');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);

  // Fetch Data
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:3001/api/products');
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('Error fetching products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
    }
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  // Flatten Categories
  const flattenCategories = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    let result: { id: string; name: string; depth: number }[] = [];
    for (const cat of cats) {
      result.push({ id: cat.id, name: cat.name, depth });
      if (cat.children) {
        result = result.concat(flattenCategories(cat.children, depth + 1));
      }
    }
    return result;
  };
  const flatCats = flattenCategories(categories);
  const filteredCats = flatCats.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));

  // Category Configuration logic
  const currentCategoryConfigKey = useMemo(() => {
    if (!formData.categoryId) return 'default';
    const catName = flatCats.find(c => c.id === formData.categoryId)?.name.toLowerCase() || '';
    if (catName.includes('điện thoại') || catName.includes('iphone') || catName.includes('samsung')) return 'phone';
    if (catName.includes('laptop') || catName.includes('macbook')) return 'laptop';
    if (catName.includes('ipad') || catName.includes('máy tính bảng') || catName.includes('tablet')) return 'tablet';
    if (catName.includes('pc') || catName.includes('máy tính để bàn')) return 'pc';
    if (catName.includes('đồng hồ') || catName.includes('watch')) return 'watch';
    if (catName.includes('phụ kiện') || catName.includes('tai nghe')) return 'accessories';
    return 'default';
  }, [formData.categoryId, flatCats]);

  const currentConfig = CATEGORY_CONFIGS[currentCategoryConfigKey];

  // Pre-fill Specifications & Reset Variants based on Category
  useEffect(() => {
    if (view === 'form' && formData.categoryId && !editingProduct) {
      setSpecifications(currentConfig.specifications.map(key => ({ key, value: '' })));
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
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.imageUrl) {
        setVariantOptions(prev => {
          const newOpts = { ...prev };
          const attrArr = [...(newOpts[attrKey] || [])];
          if (attrArr[optIndex]) {
            attrArr[optIndex] = { ...attrArr[optIndex], image: data.imageUrl };
          }
          newOpts[attrKey] = attrArr;
          return newOpts;
        });
      }
    } catch (err) {
      console.error('Error uploading color image', err);
    } finally {
      setIsUploading(false);
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
      const res = await fetch(`${API_BASE_URL}/api/upload`, { method: 'POST', body: uploadData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh');
      
      const newImages = [...formData.images];
      newImages[slotIndex] = data.url || data.imageUrl;
      
      setFormData(prev => ({ 
        ...prev, 
        images: newImages,
        image: newImages[0] || prev.image
      }));
    } catch (error: any) {
      setErrorMsg(error.message);
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

  // Open Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', brand: '', image: '', images: ['', '', '', '', ''], categoryId: '', status: 'active' });
    setVariantOptions({});
    setVariantRows([]);
    setSpecifications([]);
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

    setSpecifications(product.specifications ? (product.specifications as any).map((s:any) => ({ key: s.key, value: s.value })) : []);

    const existingOptions: Record<string, Map<string, VariantOption>> = {};
    
    product.variants.forEach(v => {
      Object.entries(v.attributes).forEach(([attrKey, attrValue]) => {
        if (!existingOptions[attrKey]) {
          existingOptions[attrKey] = new Map();
        }
        if (!existingOptions[attrKey].has(attrValue) || (attrKey === 'Màu sắc' && v.image)) {
           existingOptions[attrKey].set(attrValue, {
             name: attrValue,
             price: attrKey === 'Dung lượng' ? v.price.toString() : undefined, // Keep price mapping for Dung lượng for backwards compatibility if needed
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
      sku: v.sku,
      price: v.price.toString(),
      salePrice: v.salePrice ? v.salePrice.toString() : '',
      stock: v.stock.toString(),
      attributes: v.attributes as Record<string, string>,
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
      setVariantRows([{ sku: formData.name ? generateSkuPart(formData.name.substring(0, 8)) : 'DEFAULT', price: '0', salePrice: '', stock: '0', attributes: {}, colorCode: '', image: '' }]);
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
          sku: existing?.sku || skuParts.join('-'),
          price: existing?.price || currentPriceMap.toString() || '0',
          salePrice: existing?.salePrice || '',
          stock: existing?.stock || '0',
          attributes: currentAttr,
          colorCode: existing?.colorCode || currentColor?.hex || '',
          image: existing?.image || currentColor?.image || ''
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

  // Submit Form
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (!formData.categoryId) throw new Error("Vui lòng chọn danh mục.");
      if (variantRows.length === 0) throw new Error("Vui lòng tạo ít nhất 1 biến thể sản phẩm.");

      const filteredImages = formData.images.filter(img => img);
      const finalImage = filteredImages.length > 0 ? filteredImages[0] : '';

      const variants = variantRows.map(v => ({
        sku: v.sku,
        price: Number(v.price),
        salePrice: null,
        stock: Number(v.stock),
        attributes: v.attributes,
        colorCode: v.colorCode || null,
        image: v.image || null
      }));

      const url = editingProduct ? `http://localhost:3001/api/products/${editingProduct.id}` : 'http://localhost:3001/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...formData, status: 'active', images: filteredImages, image: finalImage, specifications: specifications.filter(s => s.key), variants })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

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
      await fetch(`http://localhost:3001/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
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
                              <div key={c.id} onClick={() => { setFormData({...formData, categoryId: c.id}); setIsCatDropdownOpen(false); setCatSearch(''); }} className={cn("px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 flex items-center gap-2", formData.categoryId === c.id ? "bg-emerald-500/10 text-emerald-400" : "text-white/80")} style={{ paddingLeft: `${(c.depth * 12) + 12}px` }}>
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
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-24 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none" placeholder="Nhập mô tả chi tiết..." />
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
              <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">BIẾN THỂ</h3>
              
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

                {/* Generate Button */}
                <div className="pt-2">
                  <button type="button" onClick={handleGenerateVariants} className="h-10 px-4 rounded-xl font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-2 border border-emerald-500/20 text-sm w-full justify-center shadow-sm">
                    <Zap className="w-4 h-4 fill-emerald-400" /> Sinh biến thể tự động
                  </button>
                </div>

                {/* Variant Table */}
                {variantRows.length > 0 && (
                  <div className="mt-4 border border-white/10 rounded-xl overflow-x-auto bg-black/20">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-white/5 text-xs text-white/50 uppercase border-b border-white/10">
                        <tr>
                          <th className="px-4 py-3 font-medium">Variant</th>
                          <th className="px-4 py-3 font-medium">SKU</th>
                          <th className="px-4 py-3 font-medium">Giá bán (₫)</th>
                          <th className="px-4 py-3 font-medium w-24">Tồn kho</th>
                          <th className="px-2 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {variantRows.map((row, idx) => {
                          const variantName = Object.values(row.attributes).filter(Boolean).join(' / ') || 'Mặc định';
                          return (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 font-medium text-white/90">{variantName}</td>
                              <td className="px-4 py-2"><input type="text" value={row.sku} onChange={e => { const r = [...variantRows]; r[idx].sku = e.target.value; setVariantRows(r); }} className="w-full bg-transparent border-b border-transparent focus:border-emerald-500 px-1 outline-none text-white/80" placeholder="SKU" /></td>
                              <td className="px-4 py-2"><input type="number" value={row.price} onChange={e => { const r = [...variantRows]; r[idx].price = e.target.value; setVariantRows(r); }} className="w-24 bg-transparent border-b border-transparent focus:border-emerald-500 px-1 outline-none text-white/80" placeholder="0" /></td>
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">THÔNG SỐ KỸ THUẬT</h3>
                <button type="button" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3"/> Thêm</button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {specifications.map((spec, i) => (
                  <div key={i} className="flex flex-col gap-1.5 bg-black/20 p-2 rounded-xl border border-white/10 group">
                    <div className="flex items-center justify-between">
                      <input type="text" placeholder="Tên thông số..." value={spec.key} onChange={e => { const newS = [...specifications]; newS[i].key = e.target.value; setSpecifications(newS); }} className="w-full bg-transparent text-xs font-semibold text-emerald-400 focus:outline-none transition-colors" />
                      <button type="button" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))} className="p-1 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                    </div>
                    <input type="text" placeholder="Giá trị..." value={spec.value} onChange={e => { const newS = [...specifications]; newS[i].value = e.target.value; setSpecifications(newS); }} className="w-full h-8 bg-white/5 px-2 text-xs text-white focus:outline-none focus:bg-white/10 border border-transparent focus:border-emerald-500/30 rounded-lg transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // ===== RENDER LIST VIEW =====
  return (
    <div className="flex flex-col h-full gap-6 text-white w-full relative">
      {/* HEADER LIST */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Danh sách sản phẩm</h1>
          <p className="text-sm text-white/50 mt-1">Quản lý {products.length} sản phẩm.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" placeholder="Tìm tên, SKU..." value={search} onChange={e => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-white/30 transition-colors w-64 placeholder:text-white/30" />
          </div>
          <button onClick={handleOpenCreate} className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-black flex items-center gap-2 hover:opacity-90 transition-opacity text-sm font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <Plus className="w-4 h-4" /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl shadow-xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
          <div className="col-span-4 pl-2">Sản phẩm</div>
          <div className="col-span-2">Danh mục</div>
          <div className="col-span-2">Biến thể</div>
          <div className="col-span-2">Giá bán</div>
          <div className="col-span-2">Tồn kho</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div>
          ) : listFilteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-white/40">
              <Package className="w-10 h-10 text-white/15 mb-3" />
              <p>Chưa có sản phẩm nào</p>
            </div>
          ) : listFilteredProducts.map((product, index) => {
            const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
            const isLow = totalStock > 0 && totalStock <= 10;
            const isOut = totalStock === 0;
            const minP = product.variants.length > 0 ? Math.min(...product.variants.map(v => v.salePrice || v.price)) : 0;
            const maxP = product.variants.length > 0 ? Math.max(...product.variants.map(v => v.price)) : 0;
            
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group relative grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              >
                {/* Sản phẩm */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0 border border-white/5 flex items-center justify-center p-1">
                    {product.image ? <img src={resolveMediaUrl(product.image)} alt={product.name} className="w-full h-full object-contain drop-shadow-md" /> : <div className="text-[10px] text-white/20">No img</div>}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium text-white truncate flex items-center gap-2">
                      {product.name}
                      {product.status === 'draft' && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">Draft</span>}
                      {product.status === 'inactive' && <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">Ẩn</span>}
                    </span>
                    <span className="text-xs text-white/40 mt-0.5">{product.brand || 'No Brand'}</span>
                  </div>
                </div>

                {/* Danh mục */}
                <div className="col-span-2">
                  <span className="inline-flex px-2 py-1 rounded-md bg-white/5 text-xs text-white/70 border border-white/10">
                    {product.category?.name || '—'}
                  </span>
                </div>

                {/* Biến thể */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm font-medium bg-white/10 px-2 py-1 rounded-lg">{product.variants.length}</span>
                </div>

                {/* Giá bán */}
                <div className="col-span-2 text-sm">
                  {minP === maxP ? (
                    <span className="font-medium text-white/90">{formatCurrency(minP)}</span>
                  ) : (
                    <div className="flex flex-col">
                      <span className="font-medium text-emerald-400">{formatCurrency(minP)}</span>
                      <span className="text-xs text-white/40 line-through">{formatCurrency(maxP)}</span>
                    </div>
                  )}
                </div>

                {/* Tồn kho */}
                <div className="col-span-2 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className={cn("text-sm font-medium", isOut ? "text-red-400" : isLow ? "text-orange-400" : "text-white/90")}>
                      {totalStock} chiếc
                    </span>
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalStock / 100) * 100, 100)}%` }} transition={{ duration: 1 }}
                        className={cn("h-full rounded-full", isOut ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-emerald-500")} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); handleOpenEdit(product); }} className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-400/50 hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(product.id, product.name); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
