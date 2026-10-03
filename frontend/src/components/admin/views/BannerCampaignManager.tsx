import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  Plus, Trash2, Search, ChevronDown, X, Tag as TagIcon,
  Smartphone, Laptop, Tablet, Watch, PackageOpen, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  fetchMarketingTags,
  addBannerCampaignProduct,
  updateBannerCampaignProduct,
  deleteBannerCampaignProduct,
  fetchBannerProductsByCampaign,
  formatVND,
  resolveImageUrl,
  uploadBannerImage,
  type MarketingTag,
} from '@/services/bannerCampaign.api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CATEGORY_OPTIONS = [
  { slug: 'phone', label: 'Điện thoại', icon: Smartphone },
  { slug: 'tablet', label: 'Máy tính bảng', icon: Tablet },
  { slug: 'laptop', label: 'Laptop', icon: Laptop },
  { slug: 'watch', label: 'Đồng hồ', icon: Watch },
];

interface BannerCampaignManagerProps {
  campaigns: any[];
}

export function BannerCampaignManager({ campaigns }: BannerCampaignManagerProps) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => campaigns[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('phone');

  // Add product modal state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);

  // Inline edit state: which banner product is being edited
  const [editingBpId, setEditingBpId] = useState<string | null>(null);

  // Form for adding a product
  const [addForm, setAddForm] = useState<{
    productId: string;
    variantId: string;
    bannerImage: string;
    discountPercent: number;
    tagIds: string[];
  }>({ productId: '', variantId: '', bannerImage: '', discountPercent: 0, tagIds: [] });
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Fetch marketing tags (public, no token needed)
  const { data: allTags = [] } = useQuery<MarketingTag[]>({
    queryKey: ['marketingTags'],
    queryFn: fetchMarketingTags,
  });

  // Fetch banner products for selected campaign + category
  const { data: bannerProducts = [], isLoading: isLoadingBP } = useQuery({
    queryKey: ['bannerProducts', selectedCampaignId, selectedCategory],
    queryFn: () =>
      selectedCampaignId
        ? fetchBannerProductsByCampaign(selectedCampaignId, selectedCategory, token || '')
        : Promise.resolve([]),
    enabled: !!selectedCampaignId,
  });

  const addMutation = useMutation({
    mutationFn: (data: Parameters<typeof addBannerCampaignProduct>[1]) =>
      addBannerCampaignProduct(selectedCampaignId, data, token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerProducts', selectedCampaignId, selectedCategory] });
      setIsAddProductOpen(false);
      setAddForm({ productId: '', variantId: '', bannerImage: '', discountPercent: 0, tagIds: [] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ bpId, data }: { bpId: string; data: any }) =>
      updateBannerCampaignProduct(selectedCampaignId, bpId, data, token || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bannerProducts', selectedCampaignId, selectedCategory] });
      setEditingBpId(null);
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (bpId: string) => deleteBannerCampaignProduct(selectedCampaignId, bpId, token || ''),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['bannerProducts', selectedCampaignId, selectedCategory] }),
    onError: (err: Error) => alert(err.message),
  });

  // Load all products for product selector
  const openProductSelector = useCallback(async () => {
    setIsLoadingAllProducts(true);
    try {
      const res = await fetch(`${API_URL}/api/products`);
      if (res.ok) setAllProducts(await res.json());
    } catch { /* ignore */ } finally {
      setIsLoadingAllProducts(false);
    }
    if (campaigns.length > 0) {
      if (!selectedCampaignId) setSelectedCampaignId(campaigns[0].id);
    }
    setAddForm({ productId: '', variantId: '', bannerImage: '', discountPercent: 0, tagIds: [] });
    setIsAddProductOpen(true);
  }, [campaigns, selectedCampaignId]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditForm: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const url = await uploadBannerImage(file, token || '');
      if (isEditForm) {
        // We will handle edit state below
      } else {
        setAddForm(prev => ({ ...prev, bannerImage: url }));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = allProducts.find((p) => p.id === addForm.productId);
  const selectedVariant = selectedProduct?.variants?.find((v: any) => v.id === addForm.variantId);
  const basePrice = selectedVariant?.price || selectedProduct?.variants?.[0]?.price || 0;
  const salePrice = basePrice - Math.round(basePrice * addForm.discountPercent / 100);

  const MAX_PRODUCTS = 4;
  const canAdd = bannerProducts.length < MAX_PRODUCTS;

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-emerald-400" />
          Sản phẩm Banner theo Danh mục
        </h2>
        <p className="text-sm text-white/50">
          Mỗi chiến dịch có thể cấu hình tối đa 4 sản phẩm cho mỗi danh mục. Các sản phẩm này hiển thị trong Banner ở các trang Điện thoại, Laptop, Tablet, Đồng hồ.
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-white/40">
          <PackageOpen className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p>Chưa có chiến dịch nào. Hãy tạo một chiến dịch trước.</p>
        </div>
      ) : (
        <>
          {/* Campaign Selector */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1.5">Chiến dịch</label>
              <div className="relative">
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 pr-10"
                >
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.isActive ? '✅' : '⏸'}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex-1">
              <label className="block text-sm text-white/60 mb-1.5">Danh mục</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_OPTIONS.map(({ slug, label, icon: Icon }) => (
                  <button
                    key={slug}
                    onClick={() => setSelectedCategory(slug)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                      selectedCategory === slug
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Campaign info */}
          {selectedCampaign && (
            <div className="text-xs text-white/40 flex items-center gap-4">
              <span>
                📅 {new Date(selectedCampaign.startDate).toLocaleDateString('vi-VN')} —{' '}
                {new Date(selectedCampaign.endDate).toLocaleDateString('vi-VN')}
              </span>
              <span className={cn('font-semibold', selectedCampaign.isActive ? 'text-emerald-400' : 'text-red-400')}>
                {selectedCampaign.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
              </span>
            </div>
          )}

          {/* Banner Products List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/70">
                Sản phẩm Banner — {CATEGORY_OPTIONS.find((c) => c.slug === selectedCategory)?.label}
                <span className="ml-2 text-white/40 font-normal">({bannerProducts.length}/{MAX_PRODUCTS})</span>
              </h3>
              <button
                onClick={openProductSelector}
                disabled={!canAdd || !selectedCampaignId}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                  canAdd && selectedCampaignId
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                )}
              >
                <Plus className="w-4 h-4" />
                {canAdd ? 'Thêm sản phẩm' : 'Đã đủ 4 sản phẩm'}
              </button>
            </div>

            {isLoadingBP ? (
              <div className="flex items-center justify-center h-24 text-white/40">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/40 mr-2" />
                Đang tải...
              </div>
            ) : bannerProducts.length === 0 ? (
              <div className="bg-white/5 border border-dashed border-white/15 rounded-2xl p-8 text-center text-white/30">
                <PackageOpen className="w-8 h-8 mx-auto mb-2 text-white/15" />
                <p className="text-sm">Chưa có sản phẩm nào cho danh mục này.</p>
                <p className="text-xs mt-1">Nhấn "Thêm sản phẩm" để bắt đầu.</p>
              </div>
            ) : (
              bannerProducts.map((bp: any, idx: number) => {
                const price = bp.variant?.price || bp.product?.variants?.[0]?.price || 0;
                const saleP = price - Math.round(price * bp.discountPercent / 100);
                const imgUrl = resolveImageUrl(bp.bannerImage);
                const isEditing = editingBpId === bp.id;

                return (
                  <BannerProductRow
                    key={bp.id}
                    bp={bp}
                    idx={idx}
                    imgUrl={imgUrl}
                    originalPrice={price}
                    salePrice={saleP}
                    allTags={allTags}
                    isEditing={isEditing}
                    onEdit={() => setEditingBpId(isEditing ? null : bp.id)}
                    onSave={(data) => updateMutation.mutate({ bpId: bp.id, data })}
                    onDelete={() => {
                      if (confirm(`Xóa "${bp.product?.name}" khỏi Banner?`)) {
                        deleteMutation.mutate(bp.id);
                      }
                    }}
                    isSaving={updateMutation.isPending && editingBpId === bp.id}
                    isDeleting={deleteMutation.isPending}
                  />
                );
              })
            )}
          </div>

          {/* Max products notice */}
          {!canAdd && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Đã đạt tối đa 4 sản phẩm cho danh mục này. Xóa một sản phẩm để thêm sản phẩm mới.
            </div>
          )}
        </>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddProductOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddProductOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#1a1a1e] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">Thêm sản phẩm vào Banner</h2>
                  <p className="text-sm text-white/40 mt-0.5">
                    {CATEGORY_OPTIONS.find((c) => c.slug === selectedCategory)?.label} · {selectedCampaign?.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-5">
                {/* Product Picker */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Chọn sản phẩm</label>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tên sản phẩm..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                    {isLoadingAllProducts ? (
                      <div className="text-white/40 text-center py-4 text-sm">Đang tải sản phẩm...</div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-white/40 text-center py-4 text-sm">Không tìm thấy sản phẩm</div>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSelected = addForm.productId === p.id;
                        const imgUrl = resolveImageUrl(p.image || p.images?.[0]);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setAddForm((f) => ({ ...f, productId: p.id, variantId: '' }))}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                                : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70'
                            )}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt={p.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-white/10 rounded-lg shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{p.name}</p>
                              <p className="text-xs text-white/40">{p.brand}</p>
                            </div>
                            {isSelected && (
                              <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Variant Picker (if product selected + has variants) */}
                {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 1 && (
                  <div>
                    <label className="block text-sm text-white/60 mb-2">
                      Chọn biến thể (tuỳ chọn — để lấy đúng giá)
                    </label>
                    <select
                      value={addForm.variantId}
                      onChange={(e) => setAddForm((f) => ({ ...f, variantId: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30"
                    >
                      <option value="">-- Mặc định (giá thấp nhất) --</option>
                      {selectedProduct.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {Object.entries(v.attributes || {})
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(', ')} — {(v.salePrice || v.price || 0).toLocaleString('vi-VN')}₫
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Banner Image Upload */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Ảnh sản phẩm Banner
                  </label>
                  {!addForm.bannerImage ? (
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center relative hover:bg-white/5 transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/png, image/webp" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleBannerUpload(e, false)}
                        disabled={isUploadingBanner}
                      />
                      {isUploadingBanner ? (
                        <div className="flex flex-col items-center justify-center text-white/50">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2" />
                          <p className="text-sm">Đang tải lên...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/50">
                          <Plus className="w-8 h-8 mb-2 opacity-50" />
                          <p className="font-medium text-white/70">Upload ảnh đã cắt nền</p>
                          <p className="text-xs mt-1">PNG / WEBP • Nền trong suốt</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-white/20 rounded-xl p-4 bg-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-[url('/images/transparent-bg.png')] bg-repeat rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative bg-[#ccc]">
                          <img 
                            src={resolveImageUrl(addForm.bannerImage) || ''} 
                            alt="Banner Preview" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">Ảnh đã tải lên</p>
                          <p className="text-white/50 text-xs mt-1">Sẵn sàng sử dụng</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="relative">
                          <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium w-full transition-colors relative pointer-events-none">
                            {isUploadingBanner ? 'Đang tải...' : 'Thay ảnh'}
                          </button>
                          <input 
                            type="file" 
                            accept="image/png, image/webp" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleBannerUpload(e, false)}
                            disabled={isUploadingBanner}
                          />
                        </div>
                        <button 
                          onClick={() => setAddForm(prev => ({ ...prev, bannerImage: '' }))}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium w-full transition-colors"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Phần trăm giảm giá (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={addForm.discountPercent}
                      onChange={(e) =>
                        setAddForm((f) => ({ ...f, discountPercent: Math.min(100, Math.max(0, Number(e.target.value))) }))
                      }
                      className="w-28 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-white/30 text-center font-bold text-lg"
                    />
                    <span className="text-white/50 text-lg">%</span>
                    {addForm.productId && basePrice > 0 && (
                      <div className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm">
                        <span className="line-through text-white/40 mr-2">{formatVND(basePrice)}</span>
                        <span className="text-emerald-400 font-bold">{formatVND(Math.max(0, salePrice))}</span>
                        {addForm.discountPercent > 0 && (
                          <span className="ml-2 text-red-400 text-xs font-bold">-{addForm.discountPercent}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Marketing Tags */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Marketing Tags (chọn nhiều)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const isSelected = addForm.tagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            setAddForm((f) => ({
                              ...f,
                              tagIds: isSelected
                                ? f.tagIds.filter((id) => id !== tag.id)
                                : [...f.tagIds, tag.id],
                            }))
                          }
                          className={cn(
                            'px-3 py-1.5 rounded-full text-sm font-bold border transition-all',
                            isSelected
                              ? 'text-white border-transparent'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                          )}
                          style={isSelected ? { backgroundColor: tag.color || '#374151', borderColor: tag.color || '#374151' } : {}}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 flex items-center justify-between shrink-0">
                <button
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2.5 hover:bg-white/10 rounded-xl transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  disabled={!addForm.productId || !addForm.bannerImage || addMutation.isPending}
                  onClick={() => {
                    if (!addForm.productId || !addForm.bannerImage) {
                      alert('Vui lòng chọn sản phẩm và upload ảnh Banner.');
                      return;
                    }
                    addMutation.mutate({
                      productId: addForm.productId,
                      variantId: addForm.variantId || null,
                      categorySlug: selectedCategory,
                      bannerImage: addForm.bannerImage,
                      discountPercent: addForm.discountPercent,
                      tagIds: addForm.tagIds,
                    });
                  }}
                  className="px-5 py-2.5 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                >
                  {addMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Thêm vào Banner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── BannerProductRow: inline-edit row for each banner product ───────────────

interface BannerProductRowProps {
  bp: any;
  idx: number;
  imgUrl: string | null;
  originalPrice: number;
  salePrice: number;
  allTags: MarketingTag[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: any) => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

function BannerProductRow({
  bp, idx, imgUrl, originalPrice, salePrice, allTags,
  isEditing, onEdit, onSave, onDelete, isSaving, isDeleting,
}: BannerProductRowProps) {
  const { token } = useAuthStore();
  const [editDiscount, setEditDiscount] = useState(bp.discountPercent);
  const [editTagIds, setEditTagIds] = useState<string[]>(bp.tags?.map((t: any) => t.tag.id) || []);
  const [editBannerImage, setEditBannerImage] = useState<string>(bp.bannerImage || '');
  const [isUploading, setIsUploading] = useState(false);

  const previewSale = originalPrice - Math.round(originalPrice * editDiscount / 100);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadBannerImage(file, token || '');
      setEditBannerImage(url);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4">
        {/* Sort order indicator */}
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/50 shrink-0">
          {idx + 1}
        </div>

        {/* Product Image */}
        {imgUrl ? (
          <div className="w-14 h-14 bg-[url('/images/transparent-bg.png')] bg-repeat rounded-xl shrink-0 overflow-hidden relative bg-[#ccc] border border-white/10">
            <img src={imgUrl} alt={bp.product?.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 bg-white/5 rounded-xl shrink-0" />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{bp.product?.name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Tags */}
            {bp.tags?.map((t: any) => (
              <span
                key={t.tag.id}
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: t.tag.color || '#374151' }}
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* Price Info */}
        <div className="text-right shrink-0">
          {originalPrice > 0 && (
            <>
              <p className="text-xs text-white/40 line-through">{formatVND(originalPrice)}</p>
              <p className="text-sm font-bold text-emerald-400">{formatVND(Math.max(0, salePrice))}</p>
              {bp.discountPercent > 0 && (
                <p className="text-xs font-bold text-red-400">-{bp.discountPercent}%</p>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white text-sm"
          >
            {isEditing ? '✕' : '✏️'}
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-white/50 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inline Edit Panel */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-4 space-y-4">
              {/* Discount edit */}
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Giảm giá (%)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-white text-center font-bold outline-none focus:border-white/30"
                    />
                    <span className="text-white/50">%</span>
                  </div>
                </div>
                {originalPrice > 0 && (
                  <div className="text-sm">
                    <span className="line-through text-white/30 mr-2">{formatVND(originalPrice)}</span>
                    <span className="text-emerald-400 font-bold">{formatVND(Math.max(0, previewSale))}</span>
                  </div>
                )}
              </div>

              {/* Tags edit */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = editTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setEditTagIds((prev) =>
                            isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                          )
                        }
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-bold border transition-all',
                          isSelected ? 'text-white border-transparent' : 'bg-white/5 border-white/10 text-white/50'
                        )}
                        style={isSelected ? { backgroundColor: tag.color || '#374151', borderColor: tag.color || '#374151' } : {}}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Banner Image edit */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Ảnh sản phẩm Banner</label>
                <div className="border border-white/20 rounded-xl p-3 bg-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[url('/images/transparent-bg.png')] bg-repeat rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative bg-[#ccc]">
                      <img 
                        src={resolveImageUrl(editBannerImage) || ''} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors relative pointer-events-none">
                      {isUploading ? 'Đang tải...' : 'Thay ảnh'}
                    </button>
                    <input 
                      type="file" 
                      accept="image/png, image/webp" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleUpload}
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-2">
                <button onClick={onEdit} className="px-3 py-1.5 text-sm hover:bg-white/10 rounded-lg transition-colors">
                  Hủy
                </button>
                <button
                  onClick={() => onSave({ discountPercent: editDiscount, tagIds: editTagIds, bannerImage: editBannerImage })}
                  disabled={isSaving || isUploading}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : null}
                  Lưu
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
