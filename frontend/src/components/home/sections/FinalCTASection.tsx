import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, ChevronRight, Loader2, Info, Sparkles } from 'lucide-react';
import { useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FinalCTAVisual,
  type UsageType,
  type PriorityType,
} from '@/components/home/FinalCTAVisual';

const EASING = [0.22, 1, 0.36, 1] as const;

interface FinderOption<T> {
  id: T;
  label: string;
}

const USAGE_OPTIONS: FinderOption<UsageType>[] = [
  { id: 'everyday', label: 'Mỗi ngày' },
  { id: 'work', label: 'Công việc' },
  { id: 'creative', label: 'Sáng tạo' },
  { id: 'gaming', label: 'Gaming' },
];

const PRIORITY_OPTIONS: FinderOption<PriorityType>[] = [
  { id: 'camera', label: 'Camera' },
  { id: 'performance', label: 'Hiệu năng' },
  { id: 'battery', label: 'Pin lâu' },
  { id: 'display', label: 'Màn hình' },
];

interface ProductSpecification {
  key?: string;
  value?: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  image?: string | null;
}

interface ProductItem {
  id: string;
  name: string;
  brand?: string;
  status?: string;
  image?: string;
  images?: string[];
  description?: string;
  specifications?: ProductSpecification[] | Record<string, any>;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: ProductVariant[];
}

interface ScoredProduct {
  product: ProductItem;
  score: number;
  priceFormatted: string;
  originalPriceFormatted?: string;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getProductImage(p: ProductItem): string {
  const raw = p.image || (p.images && p.images[0]) || (p.variants && p.variants[0]?.image);
  if (!raw) return '/images/logo.png';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return raw.startsWith('/') ? `${apiUrl}${raw}` : `${apiUrl}/${raw}`;
}

// Comprehensive Multi-Brand & Multi-Category Deterministic Scoring Engine
function scoreProduct(
  product: ProductItem,
  usage: UsageType,
  priority: PriorityType
): ScoredProduct {
  let score = 0;

  const nameLower = (product.name || '').toLowerCase();
  const brandLower = (product.brand || '').toLowerCase();
  const catLower = (product.category?.name || product.category?.slug || '').toLowerCase();
  const descLower = (product.description || '').toLowerCase();

  // Parse specifications text safely without throwing
  let specsText = '';
  if (Array.isArray(product.specifications)) {
    specsText = product.specifications
      .map((s) => `${s.key || ''}: ${s.value || ''}`)
      .join(' ')
      .toLowerCase();
  } else if (product.specifications && typeof product.specifications === 'object') {
    try {
      specsText = JSON.stringify(product.specifications).toLowerCase();
    } catch {
      specsText = '';
    }
  }

  const combinedMeta = `${nameLower} ${brandLower} ${catLower} ${descLower} ${specsText}`;

  // 1. USE CASE SCORING (Covers Phones, Tablets, Laptops across Apple, Samsung, Xiaomi, ASUS, Lenovo, etc.)
  switch (usage) {
    case 'gaming':
      // Dedicated Gaming devices & high performance hardware
      if (
        combinedMeta.includes('rog') ||
        combinedMeta.includes('legion') ||
        combinedMeta.includes('gaming') ||
        combinedMeta.includes('rtx') ||
        combinedMeta.includes('radeon') ||
        combinedMeta.includes('snapdragon 8') ||
        combinedMeta.includes('dimensity 9') ||
        combinedMeta.includes('144hz') ||
        combinedMeta.includes('165hz') ||
        combinedMeta.includes('240hz')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('ultra') ||
        combinedMeta.includes('pro max') ||
        combinedMeta.includes('m5') ||
        combinedMeta.includes('m4') ||
        combinedMeta.includes('m3') ||
        combinedMeta.includes('120hz') ||
        combinedMeta.includes('16gb') ||
        combinedMeta.includes('32gb')
      ) {
        score += 6;
      } else if (
        combinedMeta.includes('laptop') ||
        combinedMeta.includes('pro') ||
        combinedMeta.includes('plus')
      ) {
        score += 4;
      } else {
        score += 1;
      }
      break;

    case 'work':
      // Laptops (MacBook, ThinkPad, Zenbook, Vivobook), Tablets (iPad, Tab S, Pad), and Productivity Phones (Fold, Ultra, Pro Max)
      if (
        catLower.includes('laptop') ||
        combinedMeta.includes('macbook') ||
        combinedMeta.includes('thinkpad') ||
        combinedMeta.includes('zenbook') ||
        combinedMeta.includes('vivobook') ||
        combinedMeta.includes('dell') ||
        combinedMeta.includes('hp')
      ) {
        score += 8;
      } else if (
        catLower.includes('tablet') ||
        catLower.includes('may-tinh-bang') ||
        combinedMeta.includes('ipad') ||
        combinedMeta.includes('tab s') ||
        combinedMeta.includes('xiaomi pad') ||
        combinedMeta.includes('fold')
      ) {
        score += 7;
      } else if (
        combinedMeta.includes('pro max') ||
        combinedMeta.includes('ultra') ||
        combinedMeta.includes('plus') ||
        combinedMeta.includes('pro')
      ) {
        score += 5;
      } else {
        score += 2;
      }
      break;

    case 'creative':
      // High-resolution creative screens, stylus support, pro cameras, graphic laptops & pro tablets
      if (
        combinedMeta.includes('pro max') ||
        combinedMeta.includes('ultra') ||
        combinedMeta.includes('macbook pro') ||
        combinedMeta.includes('ipad pro') ||
        combinedMeta.includes('tab s9 ultra') ||
        combinedMeta.includes('tab s10 ultra') ||
        combinedMeta.includes('proart') ||
        combinedMeta.includes('zenbook oled')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('oled') ||
        combinedMeta.includes('liquid retina') ||
        combinedMeta.includes('xdr') ||
        combinedMeta.includes('amoled') ||
        combinedMeta.includes('leica') ||
        combinedMeta.includes('200mp') ||
        combinedMeta.includes('108mp') ||
        combinedMeta.includes('50mp') ||
        combinedMeta.includes('s-pen') ||
        combinedMeta.includes('pencil')
      ) {
        score += 6;
      } else if (combinedMeta.includes('pro') || combinedMeta.includes('48mp') || catLower.includes('tablet')) {
        score += 4;
      } else {
        score += 1;
      }
      break;

    case 'everyday':
    default:
      // Lightweight, balanced, elegant phones, tablets, and slim laptops across all brands
      if (
        combinedMeta.includes('air') ||
        combinedMeta.includes('slim') ||
        combinedMeta.includes('standard') ||
        nameLower.includes('iphone 16') ||
        nameLower.includes('iphone 17') ||
        nameLower.includes('galaxy s24') ||
        nameLower.includes('galaxy s25') ||
        nameLower.includes('galaxy s26') ||
        nameLower.includes('xiaomi 14') ||
        nameLower.includes('xiaomi 15') ||
        nameLower.includes('xiaomi 17') ||
        nameLower.includes('redmi')
      ) {
        score += 7;
      } else if (
        !combinedMeta.includes('max') &&
        !combinedMeta.includes('ultra') &&
        !combinedMeta.includes('gaming')
      ) {
        score += 5;
      } else {
        score += 3;
      }
      break;
  }

  // 2. PRIORITY SCORING (Evaluates real camera, processor, battery, and display specs across all brands)
  switch (priority) {
    case 'camera':
      if (
        combinedMeta.includes('200mp') ||
        combinedMeta.includes('108mp') ||
        combinedMeta.includes('ultra') ||
        combinedMeta.includes('pro max') ||
        combinedMeta.includes('leica') ||
        combinedMeta.includes('hasselblad') ||
        combinedMeta.includes('zeiss') ||
        combinedMeta.includes('periscope') ||
        combinedMeta.includes('50mp')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('48mp') ||
        combinedMeta.includes('pro') ||
        combinedMeta.includes('camera') ||
        combinedMeta.includes('fusion')
      ) {
        score += 5;
      } else if (catLower.includes('phone') || catLower.includes('dien-thoai')) {
        score += 3;
      }
      break;

    case 'performance':
      if (
        combinedMeta.includes('m5') ||
        combinedMeta.includes('m4') ||
        combinedMeta.includes('m3') ||
        combinedMeta.includes('snapdragon 8') ||
        combinedMeta.includes('dimensity 9') ||
        combinedMeta.includes('a19') ||
        combinedMeta.includes('a18') ||
        combinedMeta.includes('a17') ||
        combinedMeta.includes('rtx') ||
        combinedMeta.includes('core ultra') ||
        combinedMeta.includes('i9') ||
        combinedMeta.includes('i7') ||
        combinedMeta.includes('ryzen 9') ||
        combinedMeta.includes('ryzen 7') ||
        combinedMeta.includes('32gb') ||
        combinedMeta.includes('1tb')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('pro') ||
        combinedMeta.includes('max') ||
        combinedMeta.includes('16gb') ||
        combinedMeta.includes('12gb') ||
        combinedMeta.includes('512gb')
      ) {
        score += 5;
      } else {
        score += 2;
      }
      break;

    case 'battery':
      if (
        combinedMeta.includes('6000') ||
        combinedMeta.includes('5500') ||
        combinedMeta.includes('5000') ||
        combinedMeta.includes('macbook') ||
        combinedMeta.includes('ultra') ||
        combinedMeta.includes('plus') ||
        combinedMeta.includes('max') ||
        combinedMeta.includes('70wh') ||
        combinedMeta.includes('99wh')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('4500') ||
        combinedMeta.includes('4800') ||
        combinedMeta.includes('laptop') ||
        combinedMeta.includes('tablet')
      ) {
        score += 5;
      } else {
        score += 2;
      }
      break;

    case 'display':
      if (
        combinedMeta.includes('amoled 2x') ||
        combinedMeta.includes('super retina xdr') ||
        combinedMeta.includes('liquid retina') ||
        combinedMeta.includes('oled') ||
        combinedMeta.includes('120hz') ||
        combinedMeta.includes('144hz') ||
        combinedMeta.includes('165hz') ||
        combinedMeta.includes('promotion') ||
        combinedMeta.includes('2k') ||
        combinedMeta.includes('3k') ||
        combinedMeta.includes('4k')
      ) {
        score += 8;
      } else if (
        combinedMeta.includes('amoled') ||
        combinedMeta.includes('retina') ||
        combinedMeta.includes('super retina') ||
        combinedMeta.includes('90hz') ||
        catLower.includes('laptop') ||
        catLower.includes('tablet')
      ) {
        score += 5;
      } else {
        score += 2;
      }
      break;
  }

  // Calculate Price formatting from variants
  let minPrice = 0;
  let minSalePrice: number | null = null;

  if (product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v) => v.price).filter((pr) => typeof pr === 'number' && pr > 0);
    const salePrices = product.variants
      .map((v) => v.salePrice)
      .filter((pr): pr is number => typeof pr === 'number' && pr > 0);

    minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;
  }

  const effectivePrice = minSalePrice || minPrice;
  const priceFormatted = effectivePrice > 0 ? formatVND(effectivePrice) : 'Liên hệ';
  const originalPriceFormatted =
    minSalePrice && minPrice > minSalePrice ? formatVND(minPrice) : undefined;

  return {
    product,
    score,
    priceFormatted,
    originalPriceFormatted,
  };
}

export function FinalCTASection() {
  const shouldReduceMotion = useReducedMotion() === true;
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [selectedUsage, setSelectedUsage] = useState<UsageType | null>('everyday');
  const [selectedPriority, setSelectedPriority] = useState<PriorityType | null>('performance');
  const [showResult, setShowResult] = useState(false);
  const [sweepTrigger, setSweepTrigger] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Recommendation State (up to 10 product labels)
  const [recommendedProducts, setRecommendedProducts] = useState<ScoredProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const selectedUsageLabel = useMemo(() => {
    return USAGE_OPTIONS.find((opt) => opt.id === selectedUsage)?.label || '';
  }, [selectedUsage]);

  const selectedPriorityLabel = useMemo(() => {
    return PRIORITY_OPTIONS.find((opt) => opt.id === selectedPriority)?.label || '';
  }, [selectedPriority]);

  // Subtle pointer parallax handler (desktop only)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouseOffset({ x, y });
    },
    [shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // Clear previous recommendation immediately when user changes selection
  const handleSelectUsage = (id: UsageType) => {
    setSelectedUsage(id);
    if (showResult) {
      setShowResult(false);
      setRecommendedProducts([]);
    }
  };

  const handleSelectPriority = (id: PriorityType) => {
    setSelectedPriority(id);
    if (showResult) {
      setShowResult(false);
      setRecommendedProducts([]);
    }
  };

  // Trigger recommendation on user CTA button click - loads all brands/categories and ranks top 10
  const handleFindClick = async () => {
    if (!selectedUsage || !selectedPriority || isLoading) return;

    setSweepTrigger((prev) => prev + 1);
    setIsLoading(true);
    setHasError(false);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/products`);
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }

      const products: ProductItem[] = await res.json();
      if (!Array.isArray(products)) {
        throw new Error('Invalid products response');
      }

      // Filter active products across all brands & categories, and rank by deterministic scoring
      const scored = products
        .filter((p) => p.status !== 'inactive')
        .map((p) => scoreProduct(p, selectedUsage, selectedPriority))
        .filter((p) => p.score > 0);

      // Sort descending by score
      scored.sort((a, b) => b.score - a.score);

      // Pick up to 10 matching products as requested
      setRecommendedProducts(scored.slice(0, 10));
      setShowResult(true);
    } catch (error) {
      console.error('Error fetching recommendation products:', error);
      setHasError(true);
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Back button handler to return to the selection finder
  const handleReset = () => {
    setShowResult(false);
    setRecommendedProducts([]);
  };

  const handleProductNavigate = (product: ProductItem) => {
    if (product.name.toLowerCase().includes('iphone 17 pro max')) {
      navigate('/phone/exploreIphone17promax');
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const isReady = selectedUsage !== null && selectedPriority !== null;

  // Choreographed Entry Animation Variants for the whole Panel
  const panelVariants: Variants = {
    initial: { opacity: shouldReduceMotion ? 1 : 0, scale: shouldReduceMotion ? 1 : 0.985, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.8, ease: EASING },
    },
  };

  return (
    <section className="final-cta-section" aria-labelledby="final-cta-heading">
      <div className="final-cta-section__outer-container">
        {/* Dark Graphite Cinematic Closing Panel */}
        <motion.div
          ref={panelRef}
          className="final-cta-panel"
          variants={panelVariants}
          initial="initial"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Subtle Ambient Vignette & Noise Texture */}
          <div className="final-cta-panel__ambient-grid" aria-hidden="true" />
          <div className="final-cta-panel__glow-spot" aria-hidden="true" />

          <div className="final-cta-panel__grid">
            {/* Left Column: Switch between Finder Form and Recommendation Results */}
            <div className="final-cta-panel__content min-h-[500px] lg:min-h-[530px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {!showResult ? (
                  /* Initial State: Heading, Paragraph, Chips, & CTA Button */
                  <motion.div
                    key="finder-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35, ease: EASING }}
                    className="h-full flex flex-col justify-between"
                  >
                    {/* Eyebrow */}
                    <div className="final-cta-panel__eyebrow-box">
                      <span className="final-cta-panel__eyebrow-line" aria-hidden="true" />
                      <p className="final-cta-panel__eyebrow">TÌM LỰA CHỌN DÀNH CHO BẠN</p>
                    </div>

                    {/* Headline */}
                    <h2 id="final-cta-heading" className="final-cta-panel__title">
                      Không cần biết mọi thông số.<br />
                      Chỉ cần biết bạn cần gì.
                    </h2>

                    {/* Description */}
                    <p className="final-cta-panel__description">
                      Khám phá các dòng điện thoại, máy tính bảng và laptop từ mọi thương hiệu
                      hàng đầu được tối ưu chính xác cho nhu cầu và phong cách của bạn.
                    </p>

                    {/* Guided Choice Controls */}
                    <div className="final-cta-finder">
                      {/* Group 1: Usage */}
                      <div className="final-cta-finder__group">
                        <label className="final-cta-finder__label">
                          BẠN ĐANG TÌM THIẾT BỊ CHO
                        </label>
                        <div className="final-cta-finder__chips" role="group" aria-label="Nhu cầu sử dụng">
                          {USAGE_OPTIONS.map((option) => {
                            const isSelected = selectedUsage === option.id;
                            return (
                              <motion.button
                                key={option.id}
                                type="button"
                                className={`final-cta-chip ${isSelected ? 'final-cta-chip--selected' : ''}`}
                                onClick={() => handleSelectUsage(option.id)}
                                aria-pressed={isSelected}
                                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                transition={{ duration: 0.16 }}
                              >
                                {isSelected && (
                                  <motion.span
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.18 }}
                                    className="final-cta-chip__icon-wrapper"
                                  >
                                    <Check className="final-cta-chip__check-icon" strokeWidth={2.5} aria-hidden="true" />
                                  </motion.span>
                                )}
                                <span>{option.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Group 2: Priority */}
                      <div className="final-cta-finder__group">
                        <label className="final-cta-finder__label">
                          ĐIỀU BẠN QUAN TÂM NHẤT
                        </label>
                        <div className="final-cta-finder__chips" role="group" aria-label="Ưu tiên quan tâm">
                          {PRIORITY_OPTIONS.map((option) => {
                            const isSelected = selectedPriority === option.id;
                            return (
                              <motion.button
                                key={option.id}
                                type="button"
                                className={`final-cta-chip ${isSelected ? 'final-cta-chip--selected' : ''}`}
                                onClick={() => handleSelectPriority(option.id)}
                                aria-pressed={isSelected}
                                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                transition={{ duration: 0.16 }}
                              >
                                {isSelected && (
                                  <motion.span
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.18 }}
                                    className="final-cta-chip__icon-wrapper"
                                  >
                                    <Check className="final-cta-chip__check-icon" strokeWidth={2.5} aria-hidden="true" />
                                  </motion.span>
                                )}
                                <span>{option.label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Primary CTA Button */}
                      <div className="final-cta-panel__actions">
                        <motion.button
                          type="button"
                          className={`final-cta-btn ${isReady ? 'final-cta-btn--ready' : ''}`}
                          onClick={handleFindClick}
                          disabled={!isReady || isLoading}
                          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                          whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              <span>Đang tìm kiếm toàn bộ danh mục...</span>
                            </>
                          ) : (
                            <>
                              <span>Tìm lựa chọn phù hợp</span>
                              <ArrowRight className="final-cta-btn__icon" strokeWidth={2} aria-hidden="true" />
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Results State: Back button + Up to 10 Interactive Product Recommendation Labels */
                  <motion.div
                    key="recommendation-results"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: EASING }}
                    className="h-full flex flex-col justify-between"
                  >
                    {/* Top-left Return Button & Selection Tags */}
                    <div className="flex items-center justify-between gap-4 mb-3 shrink-0">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-medium border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                        <span>Quay lại tìm kiếm</span>
                      </button>

                      <div className="text-[11px] font-mono text-white/40 hidden sm:block">
                        {selectedUsageLabel} · {selectedPriorityLabel}
                      </div>
                    </div>

                    {/* Header Title */}
                    <div className="mb-3 shrink-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#38bdf8]">
                          {recommendedProducts.length} Thiết bị phù hợp nhất cho bạn
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        Danh sách sản phẩm đề xuất (Điện thoại, Tablet, Laptop)
                      </h3>
                    </div>

                    {/* Results Content: Grid of up to 10 Product Labels */}
                    {hasError ? (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2 my-auto">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>Không thể tải sản phẩm lúc này. Vui lòng thử lại.</span>
                      </div>
                    ) : recommendedProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                        {recommendedProducts.map(({ product, priceFormatted }, idx) => {
                          const imgUrl = getProductImage(product);
                          return (
                            <motion.div
                              key={product.id}
                              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: idx * 0.03, ease: EASING }}
                              onClick={() => handleProductNavigate(product)}
                              className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-[#38bdf8]/40 transition-all duration-200 cursor-pointer text-left"
                            >
                              {/* Product Thumbnail */}
                              <div className="w-10 h-10 rounded-lg bg-white/[0.06] p-1 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-200">
                                <img
                                  src={imgUrl}
                                  alt={product.name}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/logo.png';
                                  }}
                                />
                              </div>

                              {/* Info: Name & Brand / Category */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  {product.brand && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#38bdf8] truncate">
                                      {product.brand}
                                    </span>
                                  )}
                                  {product.category?.name && (
                                    <span className="text-[9px] text-white/40 truncate">
                                      • {product.category.name}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#38bdf8] transition-colors">
                                  {product.name}
                                </h4>
                              </div>

                              {/* Price & Action Icon */}
                              <div className="shrink-0 flex items-center gap-1 pl-1">
                                <span className="text-[11px] font-bold text-emerald-400">
                                  {priceFormatted}
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-[#38bdf8] group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-white/70 text-xs bg-white/[0.03] rounded-2xl border border-white/5 my-auto">
                        <p className="font-medium text-white/90">Chưa tìm thấy sản phẩm phù hợp với lựa chọn này.</p>
                        <p className="mt-1 text-white/50">Bạn có thể quay lại và thử một tiêu chí khác.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Abstract Luminous Reactive Visual */}
            <div className="final-cta-panel__visual-col">
              <FinalCTAVisual
                usage={selectedUsage}
                priority={selectedPriority}
                sweepTrigger={sweepTrigger}
                mouseOffset={mouseOffset}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
