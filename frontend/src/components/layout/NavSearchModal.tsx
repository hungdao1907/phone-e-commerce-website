import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Tag,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductItem {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  images?: string[];
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    salePrice?: number | null;
    image?: string | null;
  }>;
}

const TRENDING_SEARCHES = [
  'iPhone 17 Pro Max',
  'MacBook Pro M5',
  'Xiaomi 17 Ultra',
  'iPad Pro M5',
  'Apple Watch Ultra 3',
  'Samsung Galaxy S26',
];

const QUICK_CATEGORIES = [
  { name: 'Điện Thoại', slug: 'phone/iphone', icon: Smartphone, color: 'text-blue-500 bg-blue-50' },
  { name: 'MacBook & Laptop', slug: 'laptop/macbook', icon: Laptop, color: 'text-purple-500 bg-purple-50' },
  { name: 'iPad & Tablet', slug: 'tablet/ipad', icon: Tablet, color: 'text-amber-500 bg-amber-50' },
  { name: 'Apple Watch', slug: 'watch/exploreWatch', icon: Watch, color: 'text-emerald-500 bg-emerald-50' },
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function NavSearchModal({ isOpen, onClose }: NavSearchModalProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load products on initial open or mount
  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/products`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data)) {
            setProducts(data);
          }
        }
      } catch (err) {
        console.error('Error fetching search products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter products matching search query
  const searchResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const normalizedQuery = removeVietnameseTones(trimmed);
    const words = normalizedQuery.split(/\s+/).filter(Boolean);

    return products
      .filter((p) => {
        const nameNorm = removeVietnameseTones(p.name || '');
        const brandNorm = removeVietnameseTones(p.brand || '');
        const catNorm = removeVietnameseTones(p.category?.name || '');

        // Match all keywords
        return words.every(
          (w) => nameNorm.includes(w) || brandNorm.includes(w) || catNorm.includes(w)
        );
      })
      .slice(0, 6);
  }, [products, query]);

  if (!isOpen) return null;

  const handleProductClick = (product: ProductItem) => {
    onClose();
    if (product.name.toLowerCase().includes('iphone 17 pro max')) {
      navigate('/phone/exploreIphone17promax');
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const getProductImage = (p: ProductItem): string => {
    const raw = p.image || (p.images && p.images[0]) || (p.variants && p.variants[0]?.image);
    if (!raw) return '/images/logo.png';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return raw.startsWith('/') ? `${apiUrl}${raw}` : `${apiUrl}/${raw}`;
  };

  const getProductPriceInfo = (p: ProductItem) => {
    if (!p.variants || p.variants.length === 0) return null;
    const prices = p.variants.map((v) => v.price).filter((pr) => typeof pr === 'number' && pr > 0);
    const salePrices = p.variants
      .map((v) => v.salePrice)
      .filter((pr): pr is number => typeof pr === 'number' && pr > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const minSalePrice = salePrices.length > 0 ? Math.min(...salePrices) : null;

    return { minPrice, minSalePrice };
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 top-[52px] bg-black/45 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Dropdown Container */}
      <div
        className="fixed left-0 right-0 top-[52px] z-50 bg-white/95 backdrop-blur-2xl border-b border-neutral-200/80 shadow-2xl transition-all duration-300 transform animate-in fade-in slide-in-from-top-3"
        role="dialog"
        aria-modal="true"
        aria-label="Khung tìm kiếm sản phẩm"
      >
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Main Search Input Bar */}
          <div className="relative flex items-center bg-neutral-100/90 hover:bg-neutral-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#22c55e]/40 focus-within:border-[#22c55e] border border-neutral-200/80 rounded-2xl px-4 py-3 transition-all duration-200 shadow-inner">
            <Search className="w-5 h-5 text-neutral-400 shrink-0 mr-3.5" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm iPhone, MacBook, iPad, Xiaomi, phụ kiện..."
              className="w-full bg-transparent text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 focus:outline-none font-medium"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors ml-2"
                aria-label="Xóa nội dung tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <div className="hidden sm:flex items-center gap-1.5 ml-3 pl-3 border-l border-neutral-200 text-[11px] font-semibold text-neutral-400">
              <kbd className="px-2 py-0.5 rounded bg-neutral-200/70 border border-neutral-300 text-neutral-600">
                ESC
              </kbd>
              <span>đóng</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="sm:hidden ml-2 p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200"
              aria-label="Đóng tìm kiếm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="mt-5 max-h-[65vh] overflow-y-auto pr-1">
            {/* 1. STATE: Query Typed -> Show Results */}
            {query.trim() ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                  <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    KẾT QUẢ TÌM KIẾM ({searchResults.length})
                  </span>
                  {isLoading && (
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tìm...
                    </span>
                  )}
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {searchResults.map((product) => {
                      const priceInfo = getProductPriceInfo(product);
                      const imgUrl = getProductImage(product);

                      return (
                        <div
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="group flex items-center gap-3.5 p-2.5 rounded-xl border border-neutral-100 hover:border-[#22c55e]/30 bg-white hover:bg-neutral-50/80 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
                        >
                          <div className="w-14 h-14 rounded-lg bg-neutral-100/60 p-1 flex items-center justify-center shrink-0 border border-neutral-200/50 group-hover:scale-105 transition-transform duration-200">
                            <img
                              src={imgUrl}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/logo.png';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {product.brand && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                                  {product.brand}
                                </span>
                              )}
                              {product.category?.name && (
                                <span className="text-[10px] text-neutral-400 truncate">
                                  {product.category.name}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-neutral-900 truncate group-hover:text-[#22c55e] transition-colors">
                              {product.name}
                            </h4>
                            {priceInfo && priceInfo.minPrice > 0 ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-emerald-600">
                                  {formatVND(priceInfo.minSalePrice || priceInfo.minPrice)}
                                </span>
                                {priceInfo.minSalePrice && priceInfo.minPrice > priceInfo.minSalePrice && (
                                  <span className="text-[11px] text-neutral-400 line-through">
                                    {formatVND(priceInfo.minPrice)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-neutral-400">Xem chi tiết</span>
                            )}
                          </div>

                          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-[#22c55e] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-neutral-500">
                    <p className="text-sm font-medium">
                      Không tìm thấy sản phẩm nào khớp với từ khóa{' '}
                      <span className="font-bold text-neutral-900">"{query}"</span>
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Hãy thử tìm theo tên dòng máy như "iPhone", "MacBook", "Xiaomi" hoặc "Watch"
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                      {TRENDING_SEARCHES.slice(0, 4).map((trend, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(trend)}
                          className="px-3 py-1 text-xs rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                        >
                          {trend}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 2. STATE: Empty Query -> Show Trending Searches & Quick Categories */
              <div className="space-y-6">
                {/* Trending searches */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-[#22c55e]" />
                    <span>TÌM KIẾM PHỔ BIẾN</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_SEARCHES.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(term)}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-emerald-50 text-xs font-medium text-neutral-700 hover:text-emerald-700 border border-neutral-200/60 hover:border-emerald-200 transition-all duration-200"
                      >
                        <Sparkles className="w-3 h-3 text-neutral-400 group-hover:text-emerald-600" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Categories */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                    <span>DANH MỤC NỔI BẬT</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <Link
                          key={idx}
                          to={`/${cat.slug}`}
                          onClick={onClose}
                          className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-white border border-neutral-200/70 hover:border-[#22c55e]/40 hover:shadow-md transition-all duration-200 group text-left"
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cat.color} group-hover:scale-110 transition-transform duration-200`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-neutral-900 group-hover:text-[#22c55e] transition-colors truncate">
                              {cat.name}
                            </p>
                            <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                              Khám phá <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
