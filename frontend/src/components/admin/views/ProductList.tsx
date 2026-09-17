import React, { useState, useEffect } from 'react';
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const PREDEFINED_CAPACITIES = ['128GB', '256GB', '512GB', '1TB'];
const PREDEFINED_COLORS = [
  { name: 'Đen', hex: '#1c1c1e' },
  { name: 'Trắng', hex: '#f5f5f0' },
  { name: 'Xanh', hex: '#20283e' },
  { name: 'Đỏ', hex: '#c82333' },
  { name: 'Vàng', hex: '#e3c6a4' },
  { name: 'Hồng', hex: '#e8d1cf' },
  { name: 'Titan', hex: '#878681' }
];
const IMAGE_SLOTS = [
  'Ảnh chính',
  'Ảnh mặt trước',
  'Ảnh mặt sau',
  'Ảnh mặt phải',
  'Ảnh mặt trái'
];
const DEFAULT_SPECS = [
  { key: 'Màn hình', value: '' },
  { key: 'Chip', value: '' },
  { key: 'RAM', value: '' },
  { key: 'Camera', value: '' },
  { key: 'Pin', value: '' },
  { key: 'Hệ điều hành', value: '' }
];

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

  const [capacities, setCapacities] = useState<{ name: string, price: string }[]>([]);
  const [colors, setColors] = useState<{ name: string, hex: string, image?: string }[]>([]);
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([]);
  const [specifications, setSpecifications] = useState<{ key: string; value: string }[]>([]);

  // Input states for variant tags
  const [capInput, setCapInput] = useState('');
  const [colInput, setColInput] = useState('');
  const [colHexInput, setColHexInput] = useState('#ffffff');

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

  const handleUploadColorImage = async (e: React.ChangeEvent<HTMLInputElement>, colorIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const res = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.imageUrl) {
        const newColors = [...colors];
        newColors[colorIndex].image = data.imageUrl;
        setColors(newColors);
      }
    } catch (err) {
      console.error('Error uploading color image', err);
    } finally {
      setIsUploading(false);
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

  // Pre-fill Specifications based on Category
  useEffect(() => {
    if (view === 'form' && formData.categoryId && specifications.length === 0 && !editingProduct) {
      const catName = flatCats.find(c => c.id === formData.categoryId)?.name.toLowerCase() || '';
      if (catName.includes('điện thoại') || catName.includes('iphone') || catName.includes('samsung')) {
        setSpecifications([
          { key: 'Màn hình', value: '' }, { key: 'Chip', value: '' }, { key: 'RAM', value: '' },
          { key: 'Bộ nhớ', value: '' }, { key: 'Camera', value: '' }, { key: 'Pin', value: '' }, { key: 'Hệ điều hành', value: '' }
        ]);
      } else if (catName.includes('laptop') || catName.includes('macbook')) {
        setSpecifications([
          { key: 'CPU', value: '' }, { key: 'GPU', value: '' }, { key: 'RAM', value: '' },
          { key: 'SSD', value: '' }, { key: 'Màn hình', value: '' }, { key: 'Pin', value: '' }, { key: 'Trọng lượng', value: '' }
        ]);
      }
    }
  }, [formData.categoryId]);

  // Upload Images
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
    setCapacities([]);
    setColors([]);
    setVariantRows([]);
    setSpecifications(DEFAULT_SPECS.map(s => ({ ...s })));
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

    const existingCaps = new Map<string, string>();
    const existingCols = new Map<string, { hex: string, image: string }>();
    product.variants.forEach(v => {
      if (v.attributes['Dung lượng']) existingCaps.set(v.attributes['Dung lượng'], v.price.toString());
      if (v.attributes['Màu sắc']) {
        if (!existingCols.has(v.attributes['Màu sắc']) || v.image) {
          existingCols.set(v.attributes['Màu sắc'], { hex: v.colorCode || '#ffffff', image: v.image || '' });
        }
      }
    });
    setCapacities(Array.from(existingCaps.entries()).map(([name, price]) => ({ name, price })));
    setColors(Array.from(existingCols.entries()).map(([name, data]) => ({ name, hex: data.hex, image: data.image })));

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

  // Auto Generate Variants
  const generateSkuPart = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  };

  const handleGenerateVariants = () => {
    if (capacities.length === 0 && colors.length === 0) {
      setVariantRows([{ sku: formData.name ? generateSkuPart(formData.name.substring(0, 8)) : 'DEFAULT', price: '0', salePrice: '', stock: '0', attributes: {}, colorCode: '', image: '' }]);
      return;
    }

    const caps = capacities.length > 0 ? capacities : [{ name: '', price: '0' }];
    const cols = colors.length > 0 ? colors : [{ name: '', hex: '', image: '' }];

    const newVariants: VariantFormRow[] = [];
    const baseSku = formData.name ? generateSkuPart(formData.name.substring(0, 4)) : 'SKU';

    caps.forEach(cap => {
      cols.forEach(col => {
        const existing = variantRows.find(v => 
          (cap.name === '' || v.attributes['Dung lượng'] === cap.name) &&
          (col.name === '' || v.attributes['Màu sắc'] === col.name)
        );

        const skuParts = [baseSku];
        if (cap.name) skuParts.push(generateSkuPart(cap.name));
        if (col.name) skuParts.push(generateSkuPart(col.name));

        newVariants.push({
          sku: existing?.sku || skuParts.join('-'),
          price: existing?.price || cap.price || '0',
          salePrice: existing?.salePrice || '',
          stock: existing?.stock || '0',
          attributes: {
            ...(cap.name ? { 'Dung lượng': cap.name } : {}),
            ...(col.name ? { 'Màu sắc': col.name } : {})
          },
          colorCode: existing?.colorCode || col.hex || '', 
          image: existing?.image || col.image || ''
        });
      });
    });
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
              
              <div className="space-y-4">
                {/* Variant tags */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Dung lượng</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {capacities.map((cap, i) => (
                        <div key={i} className="inline-flex items-center gap-2 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/90">
                          <span className="font-medium">{cap.name}</span>
                          <span className="text-white/20">|</span>
                          <input type="number" placeholder="Giá..." value={cap.price} onChange={e => { const c = [...capacities]; c[i].price = e.target.value; setCapacities(c); }} className="w-20 bg-transparent text-xs outline-none text-emerald-400 placeholder:text-white/30" />
                          <button onClick={() => setCapacities(capacities.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-white ml-1"><X className="w-3 h-3"/></button>
                        </div>
                      ))}
                      <input type="text" value={capInput} onChange={e => setCapInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (capInput && !capacities.find(c => c.name === capInput)) { setCapacities([...capacities, { name: capInput, price: '' }]); setCapInput(''); } } }} placeholder="Nhập & Enter..." className="w-32 h-8 bg-black/20 border border-white/10 rounded-lg px-3 text-xs focus:outline-none focus:border-emerald-500" />
                    </div>
                    {/* Bản mẫu Dung lượng */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {PREDEFINED_CAPACITIES.map(cap => (
                        <button key={cap} type="button" onClick={() => !capacities.find(c => c.name === cap) && setCapacities([...capacities, { name: cap, price: '' }])} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/50 transition-colors border border-transparent hover:border-emerald-500/30">+{cap}</button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">Màu sắc</label>
                    <div className="flex flex-wrap items-start gap-3">
                      {colors.map((col, i) => (
                        <div key={i} className="flex flex-col gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl min-w-[100px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: col.hex }} />
                              <span className="text-sm font-medium text-white/90">{col.name}</span>
                            </div>
                            <button onClick={() => setColors(colors.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-white/90 transition-colors p-0.5 rounded-md hover:bg-white/10"><X className="w-3.5 h-3.5"/></button>
                          </div>
                          <label className="flex items-center justify-center gap-1.5 text-[11px] text-white/60 hover:text-emerald-400 cursor-pointer w-full mt-1 border border-dashed border-white/20 hover:border-emerald-500/50 rounded-lg p-1.5 transition-colors bg-black/20">
                            {col.image ? (
                              <img src={col.image} className="w-full h-8 object-contain rounded-sm" alt="color variant" />
                            ) : (
                              <><Upload className="w-3 h-3" /> Tải ảnh</>
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadColorImage(e, i)} disabled={isUploading} />
                          </label>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-xl px-3 py-2 h-[76px]">
                        <input type="color" value={colHexInput} onChange={e => setColHexInput(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                        <input type="text" value={colInput} onChange={e => setColInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (colInput && !colors.find(c => c.name === colInput)) { setColors([...colors, { name: colInput, hex: colHexInput }]); setColInput(''); } } }} placeholder="Tên màu mới..." className="w-24 bg-transparent text-sm focus:outline-none placeholder:text-white/30" />
                      </div>
                    </div>
                    {/* Bảng màu mẫu */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PREDEFINED_COLORS.map(col => (
                        <button key={col.name} type="button" onClick={() => !colors.find(c => c.name === col.name) && setColors([...colors, col])} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 text-white/70 transition-colors border border-transparent hover:border-emerald-500/30">
                          <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: col.hex }} />
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button type="button" onClick={handleGenerateVariants} className="h-10 px-4 rounded-xl font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-2 border border-emerald-500/20 text-sm">
                  <Zap className="w-4 h-4 fill-emerald-400" /> Sinh biến thể tự động
                </button>

                {/* Variant Table */}
                {variantRows.length > 0 && (
                  <div className="mt-4 border border-white/10 rounded-xl overflow-hidden bg-black/20">
                    <table className="w-full text-sm text-left">
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
                          const variantName = [row.attributes['Dung lượng'], row.attributes['Màu sắc']].filter(Boolean).join(' / ') || 'Mặc định';
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
            <div className="bg-[#1c1c1e] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">THÔNG SỐ KỸ THUẬT</h3>
                <button type="button" onClick={() => setSpecifications([...specifications, { key: '', value: '' }])} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1"><Plus className="w-3 h-3"/> Thêm</button>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {specifications.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/10 group">
                    <input type="text" placeholder="Tên (RAM)" value={spec.key} onChange={e => { const newS = [...specifications]; newS[i].key = e.target.value; setSpecifications(newS); }} className="w-full h-8 bg-transparent px-2 text-xs font-semibold text-white/70 focus:text-white focus:outline-none focus:bg-white/5 rounded transition-colors" />
                    <span className="text-white/20">|</span>
                    <input type="text" placeholder="Giá trị..." value={spec.value} onChange={e => { const newS = [...specifications]; newS[i].value = e.target.value; setSpecifications(newS); }} className="flex-1 h-8 bg-transparent px-2 text-xs text-white focus:outline-none focus:bg-white/5 rounded transition-colors" />
                    <button type="button" onClick={() => setSpecifications(specifications.filter((_, idx) => idx !== i))} className="p-1.5 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
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
      <div className="flex-1 overflow-hidden flex flex-col bg-white/5 border border-white/10 rounded-2xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-xs font-semibold text-white/50 uppercase tracking-wider shrink-0">
          <div className="col-span-4 pl-2">Sản phẩm</div>
          <div className="col-span-2">Danh mục</div>
          <div className="col-span-2">Biến thể</div>
          <div className="col-span-2">Giá bán</div>
          <div className="col-span-2">Tồn kho</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" /></div>
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
                    <button onClick={e => { e.stopPropagation(); handleOpenEdit(product); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(product.id, product.name); }} className="p-1.5 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
