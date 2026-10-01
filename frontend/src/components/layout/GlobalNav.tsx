import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { MorphIcon } from 'morphicons/react';
import { Menu, X, Search as SearchIcon } from 'lucide';
import {
  ShoppingBag,
  User,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Laptop,
  Tablet,
  Watch,
  Headphones,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { Link, useLocation } from 'react-router-dom';
import { NavSearchModal } from './NavSearchModal';

export const getCategoryPrefix = (slug: string) => {
  if (slug === 'ien-thoai' || slug === 'dien-thoai') return 'phone';
  if (slug === 'may-tinh-bang' || slug === 'tablet') return 'tablet';
  if (slug === 'ong-ho-thong-minh' || slug === 'dong-ho-thong-minh' || slug === 'watch') return 'watch';
  return slug;
};

export function GlobalNav() {
  const { mobileMenuOpen, toggleMobileMenu } = useAppStore();
  const [activeMenu, setActiveMenu] = useState<any | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const previousMenuRef = useRef<any | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const location = useLocation();
  const isIphonePage =
    location.pathname === '/iphone' ||
    location.pathname === '/exploreIphone17promax' ||
    location.pathname === '/phone/exploreIphone17promax';

  // Automatically close search and active menus on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setActiveMenu(null);
  }, [location.pathname]);

  const items = useCartStore((state: any) => state.items);
  const cartItemCount = items.reduce((total: number, item: any) => total + item.quantity, 0);

  // Fetch Categories from Database
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/categories`)
      .then(res => res.json())
      .then(data => {
         if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error(err));
  }, []);

  const { leftItems, rightItems, visibleItems, navItems } = useMemo(() => {
    const rootCats = categories.filter(c => c.parentId === null && c.isActive);
    rootCats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    const TARGET_SLUGS = ['dien-thoai', 'ien-thoai', 'may-tinh-bang', 'tablet', 'laptop', 'ong-ho-thong-minh', 'dong-ho-thong-minh', 'watch', 'phone'];

    const visible = [
      { id: 'store', name: 'Cửa Hàng', slug: '', isStatic: true },
      ...rootCats.filter(c => TARGET_SLUGS.includes(c.slug.toLowerCase())).map(c => ({
        ...c,
        slug: getCategoryPrefix(c.slug.toLowerCase())
      })),
      { id: 'support', name: 'Hỗ Trợ', slug: 'support', isStatic: true }
    ];

    const mid = Math.ceil(visible.length / 2);
    const left = visible.slice(0, mid);
    const right = visible.slice(mid);

    return { leftItems: left, rightItems: right, visibleItems: visible, navItems: visible };
  }, [categories]);

  const containerRef = useRef<HTMLDivElement>(null);

  if (activeMenu) {
    previousMenuRef.current = activeMenu;
  }
  const displayMenu = activeMenu || previousMenuRef.current;

  const handleMouseEnter = (item: any) => {
    if (isSearchOpen) return; // Do not open mega menu while searching
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveMenu(item);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };



  const getMegaMenuGroups = (item: any) => {
    if (!item) return [];
    if (item.isStatic) {
      if (item.name === 'Cửa Hàng') return [
        {
          title: 'MUA HÀNG',
          links: ['Sản Phẩm Mới Nhất', 'MacBook', 'iPad', 'iPhone', 'Apple Watch', 'Tất Cả Phụ Kiện'],
          slugs: ['/', 'laptop/macbook', 'tablet/ipad', 'phone/iphone', 'watch/apple-watch', null]
        }
      ];
      if (item.name === 'Hỗ Trợ') return [
        { title: 'Tìm Trợ Giúp', links: ['iPhone', 'Mac', 'iPad', 'Watch', 'Bảo Hành'] },
        { title: 'Liên Hệ', links: ['Nhận Hỗ Trợ', 'Cộng Đồng'] }
      ];
      return [];
    }

    const groups = [];
    const prefix = getCategoryPrefix(item.slug);
    
    if (prefix === 'phone') {
      groups.push({
        title: 'KHÁM PHÁ',
        links: ['iPhone 17 Pro Max'],
        slugs: ['phone/exploreIphone17promax']
      });
    } else if (prefix === 'watch') {
      groups.push({
        title: 'KHÁM PHÁ APPLE WATCH',
        links: ['Trang chủ Watch', 'Apple Watch Series 11', 'Apple Watch SE 3', 'Apple Watch Ultra 3'],
        slugs: ['watch/exploreWatch', 'watch/exploreSeries-11', 'watch/exploreSe-3', 'watch/exploreUltra-3']
      });
    }

    if (item.children && item.children.length > 0) {
      let filteredChildren = item.children.filter((c: any) => c.isActive);
      let title = 'THƯƠNG HIỆU / DÒNG MÁY';

      if (prefix === 'phone') {
        const excludedPhoneBrands = ['vivo', 'realme'];
        filteredChildren = filteredChildren.filter((c: any) => !excludedPhoneBrands.includes(c.name.toLowerCase()));
      } else if (prefix === 'laptop') {
        title = 'THƯƠNG HIỆU';
        const allowedLaptopBrands = ['MacBook', 'ASUS', 'Lenovo'];
        filteredChildren = filteredChildren.filter((c: any) => allowedLaptopBrands.includes(c.name));
      } else if (prefix === 'tablet') {
        title = 'THƯƠNG HIỆU';
        const allowedTabletBrands = ['iPad', 'Samsung Galaxy Tab', 'Xiaomi Pad'];
        filteredChildren = filteredChildren.filter((c: any) => allowedTabletBrands.includes(c.name));
      }

      groups.push({
        title,
        links: filteredChildren.map((c: any) => c.name),
        slugs: filteredChildren.map((c: any) => {
          // Force iPad slug mapping just in case db returns 'apple'
          if (prefix === 'tablet' && c.slug === 'apple') {
            return `${prefix}/ipad`;
          }
          if (prefix === 'watch') {
            if (c.name.toLowerCase().includes('samsung')) return 'watch/samsung';
            if (c.name.toLowerCase().includes('xiaomi')) return 'watch/xiaomi';
          }
          return `${prefix}/${c.slug}`;
        })
      });
    } else {
      // Fallback if no children
      groups.push({
        title: 'DÒNG MÁY',
        links: [`${item.name} Tiêu chuẩn`, `${item.name} Pro`, `${item.name} Series`],
        slugs: [null, null, null]
      });
    }

    return groups;
  };

  const getWatchImage = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('ultra')) return '/images/watch/watch-ultra-studio.png';
    if (n.includes('se 3') || n.includes('se3') || n.includes('watch se')) return '/images/watch/watch-se-studio.png';
    if (n.includes('series 11') || n.includes('series-11')) return '/images/watch/watch-series11-studio.png';
    if (n.includes('apple watch') || n.includes('trang chủ')) return '/images/watch/watch-series11-silver-studio.png';
    if (n.includes('samsung')) return '/images/watch/watch-titanium-gold.png';
    if (n.includes('xiaomi')) return '/images/watch/watch-titanium-slate.png';
    return '/images/watch/watch-series11-studio.png';
  };

  const AsusLogo = ({ className = "w-8 h-4", ...props }: any) => (
    <svg viewBox="0 0 120 28" fill="currentColor" className={className} {...props}>
      <path d="M15 2L3 26h6.5l2.2-4.8h11.6L25.5 26H32L20 2h-5zm.1 6.8l4.1 9.2h-8.2l4.1-9.2zM36 21.5c2.5 1.8 5.6 2.8 8.8 2.8 4.2 0 6.8-2 6.8-4.9 0-3.2-2.8-4.1-7.2-5-5.2-1.1-9.4-2.5-9.4-7.5C35 2.6 39.2 0 45.4 0c3.2 0 6.2.8 8.4 2.2l-2.4 4.5c-1.8-1.1-3.9-1.8-6.1-1.8-3.1 0-5.1 1.4-5.1 3.4 0 2.4 2.4 3.3 6.3 4.1 5.6 1.2 10.3 2.8 10.3 8.3 0 4.8-4.1 7.7-11 7.7-3.9 0-7.6-1.1-10.2-2.8l2.5-4.6zM60 2h6.8v14.2c0 4.8 2.6 7.4 7.2 7.4s7.2-2.6 7.2-7.4V2H88v14c0 8.6-5.8 12.4-14 12.4s-14-3.8-14-12.4V2zm32.8 19.5c2.5 1.8 5.6 2.8 8.8 2.8 4.2 0 6.8-2 6.8-4.9 0-3.2-2.8-4.1-7.2-5-5.2-1.1-9.4-2.5-9.4-7.5C91.8 2.6 96 0 102.2 0c3.2 0 6.2.8 8.4 2.2l-2.4 4.5c-1.8-1.1-3.9-1.8-6.1-1.8-3.1 0-5.1 1.4-5.1 3.4 0 2.4 2.4 3.3 6.3 4.1 5.6 1.2 10.3 2.8 10.3 8.3 0 4.8-4.1 7.7-11 7.7-3.9 0-7.6-1.1-10.2-2.8l2.5-4.6z"/>
    </svg>
  );

  const LenovoLogo = ({ className = "w-10 h-4", ...props }: any) => (
    <svg viewBox="0 0 120 28" fill="none" className={className} {...props}>
      <rect x="2" y="2" width="116" height="24" rx="4" fill="#E2231A" />
      <text x="60" y="15" dominantBaseline="middle" textAnchor="middle" fill="#FFFFFF" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="14">
        Lenovo
      </text>
    </svg>
  );

  const renderItemVisual = (link: string, categoryName: string = '', isFeatured: boolean = false) => {
    const n = (link + ' ' + categoryName).toLowerCase();
    const isWatchSection = n.includes('watch') || n.includes('đồng hồ');

    // 1. If in the Watch section or watch product, show actual watch thumbnail
    if (isWatchSection) {
      const imgSrc = getWatchImage(link);
      return (
        <img
          src={imgSrc}
          alt={link}
          className="w-8 h-8 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
        />
      );
    }

    // 2. Tech Brand Logos using Official Images
    if (n.includes('apple') || n.includes('iphone') || n.includes('ipad') || n.includes('macbook') || n.includes('mac')) {
      return (
        <img
          src="/images/brands/apple.png"
          alt="Apple"
          className="w-6 h-6 object-contain transition-transform duration-200 group-hover:scale-110"
        />
      );
    }

    if (n.includes('samsung') || n.includes('galaxy')) {
      return (
        <img
          src="/images/brands/samsung.png"
          alt="Samsung"
          className="w-10 h-5 object-contain transition-transform duration-200 group-hover:scale-105"
        />
      );
    }

    if (n.includes('xiaomi') || n.includes('redmi')) {
      return (
        <img
          src="/images/brands/xiaomi.png"
          alt="Xiaomi"
          className="w-7 h-7 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105"
        />
      );
    }

    if (n.includes('oppo')) {
      return (
        <img
          src="/images/brands/oppo.png"
          alt="OPPO"
          className="w-10 h-4 object-contain transition-transform duration-200 group-hover:scale-105"
        />
      );
    }

    if (n.includes('asus') || n.includes('rog')) {
      return (
        <AsusLogo
          className="w-8 h-4 text-neutral-800 transition-transform duration-200 group-hover:scale-105"
        />
      );
    }

    if (n.includes('lenovo')) {
      return (
        <LenovoLogo className="w-10 h-4 transition-transform duration-200 group-hover:scale-105" />
      );
    }

    // 3. Service / Utility feature icons
    if (n.includes('phụ kiện') || n.includes('tai nghe') || n.includes('airpods')) {
      return <Headphones className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors" />;
    }
    if (n.includes('bảo hành')) {
      return <ShieldCheck className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors" />;
    }
    if (n.includes('hỗ trợ') || n.includes('help') || n.includes('trợ giúp')) {
      return <HelpCircle className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors" />;
    }
    if (n.includes('cộng đồng') || n.includes('users') || n.includes('liên hệ')) {
      return <Users className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors" />;
    }
    if (n.includes('mới nhất') || n.includes('khám phá')) {
      return <Sparkles className="w-5 h-5 text-amber-500 transition-colors" />;
    }

    return <Smartphone className="w-5 h-5 text-neutral-700 group-hover:text-black transition-colors" />;
  };

  const checkIsActive = (item: any) => {
    if (!item) return false;
    if (item.isStatic) {
      if (item.id === 'store' && location.pathname === '/') return true;
      if (item.id === 'support' && location.pathname.includes('/support')) return true;
      return false;
    }
    const prefix = getCategoryPrefix(item.slug);
    return location.pathname.includes(`/${prefix}/`) ||
           location.pathname.includes(`/${prefix}`) ||
           (activeMenu?.id === item.id);
  };

  const renderNavLink = (item: any) => (
    <li key={item.id} className="h-full flex items-center" onMouseEnter={() => handleMouseEnter(item)}>
      <Link
        to={item.id === 'store' ? '/' : `/${item.slug}`}
        onClick={() => { setActiveMenu(null); setIsSearchOpen(false); }}
        className={`nav-glow-link h-full flex items-center relative transition-colors duration-300 text-[13px] ${
          checkIsActive(item) ? 'text-black font-semibold drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]' : 'inherit'
        }`}
      >
        {item.name}
        {/* Active underline glow */}
        <span
          className={`absolute bottom-0 left-0 h-[2px] bg-black rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(0,0,0,0.8),0_0_16px_rgba(0,0,0,0.4)] ${
            checkIsActive(item) ? 'w-full opacity-100' : 'w-0 opacity-0'
          }`}
        />
      </Link>
    </li>
  );

  return (
    <>
      <nav
        className={`${isIphonePage ? 'fixed w-full' : 'sticky'} top-0 z-50 text-xs font-medium transition-colors duration-300 ${
          activeMenu || isSearchOpen
            ? 'bg-white border-b border-neutral-200/60 text-[#1d1d1f]'
            : isIphonePage
              ? 'bg-transparent border-b border-transparent hover:bg-black/90 text-[#f5f5f7]'
              : 'bg-white/90 backdrop-blur-md border-b border-neutral-100 text-[#1d1d1f] shadow-sm'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-[1300px] mx-auto px-4 lg:px-8 h-[54px] flex items-center justify-between">
          {/* Desktop Left Nav Links (Split Left) */}
          <div className="hidden md:flex flex-1 items-center justify-end h-full">
            <ul className="flex items-center space-x-6 lg:space-x-8 h-full">
              {leftItems.map(renderNavLink)}
            </ul>
          </div>

          {/* Center Logo */}
          <div className="flex-shrink-0 flex items-center justify-center px-6 lg:px-10 h-full">
            <Link
              to="/"
              className="hover:opacity-80 transition-opacity flex items-center"
              onClick={() => { setActiveMenu(null); setIsSearchOpen(false); }}
            >
              <img src="/images/logo.png" alt="Logo" className="h-7 md:h-8 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Right Nav Links + Actions (Split Right) */}
          <div className="hidden md:flex flex-1 items-center justify-between h-full">
            <ul className="flex items-center space-x-6 lg:space-x-8 h-full">
              {rightItems.map(renderNavLink)}
            </ul>

            {/* Utility Icons on the far right */}
            <div className="flex items-center space-x-5 ml-6">
              <button
                onClick={() => {
                  setActiveMenu(null);
                  setIsSearchOpen((prev) => !prev);
                }}
                className={`nav-glow-link transition-colors flex items-center justify-center ${
                  isSearchOpen ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]' : 'hover:text-black'
                }`}
                aria-label="Tìm kiếm"
                aria-expanded={isSearchOpen}
              >
                <MorphIcon icon={isSearchOpen ? X : SearchIcon} size={18} strokeWidth={2} />
              </button>

              <div className="relative group">
                <Link
                  to={useAuthStore.getState().user ? "/profile" : "/login"}
                  className="nav-glow-link hover:text-black transition-colors block"
                  aria-label="Tài khoản"
                >
                  <User className="w-[18px] h-[18px]" />
                </Link>

                {useAuthStore.getState().user && (
                  <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="w-56 bg-white border border-neutral-100 rounded-2xl shadow-xl overflow-hidden">
                      <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50/80">
                        <p className="text-[13px] font-semibold text-neutral-900 truncate">
                          {useAuthStore.getState().user?.username}
                        </p>
                      </div>
                      <div className="py-2">
                        <Link to="/profile" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                          Hồ sơ của tôi
                        </Link>
                        {useAuthStore.getState().user?.role !== 'customer' && (
                          <Link to="/dashboard" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                            Vào Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            useAuthStore.getState().logout();
                            window.location.href = '/login';
                          }}
                          className="block w-full text-left px-5 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Right Controls (Visible only on mobile) */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={() => {
                setActiveMenu(null);
                setIsSearchOpen((prev) => !prev);
              }}
              className={`nav-glow-link transition-colors flex items-center justify-center ${
                isSearchOpen ? 'text-black drop-shadow-[0_0_8px_rgba(0,0,0,0.4)]' : 'hover:text-black'
              }`}
              aria-label="Tìm kiếm"
              aria-expanded={isSearchOpen}
            >
              <MorphIcon icon={isSearchOpen ? X : SearchIcon} size={18} strokeWidth={2} />
            </button>
            <div className="relative group">
              {useAuthStore((state) => state.user) ? (
                <Link 
                  to="/profile"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-full transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shrink-0 border border-neutral-200 shadow-sm overflow-hidden">
                    {useAuthStore((state) => state.user)?.avatar ? (
                      <img src={useAuthStore((state) => state.user)?.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <span className="text-[13px] font-bold text-neutral-700 max-w-[120px] truncate">
                    {useAuthStore((state) => state.user)?.fullName || useAuthStore((state) => state.user)?.username}
                  </span>
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="nav-glow-link hover:text-black transition-colors block p-1" 
                  aria-label="Tài khoản" 
                >
                  <User className="w-[18px] h-[18px]" />
                </Link>
              )}
              
              {useAuthStore((state) => state.user) && (
                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="w-56 bg-white border border-neutral-100 rounded-2xl shadow-xl overflow-hidden mt-1">
                    <div className="px-5 py-3 border-b border-neutral-100 bg-neutral-50/80">
                      <p className="text-[13px] font-semibold text-neutral-900 truncate">
                        {useAuthStore((state) => state.user)?.username}
                      </p>
                    </div>
                    <div className="py-2">
                      <Link to="/profile" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                        Hồ sơ của tôi
                      </Link>
                      {useAuthStore((state) => state.user)?.role !== 'customer' && (
                        <Link to="/dashboard" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black">
                          Vào Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          useAuthStore.getState().logout();
                          window.location.href = '/login';
                        }}
                        className="block w-full text-left px-5 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="hover:text-black transition-colors focus:outline-none flex items-center justify-center p-1"
              aria-label="Toggle Navigation"
              aria-expanded={mobileMenuOpen}
            >
              <MorphIcon icon={mobileMenuOpen ? X : Menu} size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Floating Compact Dropdown Popover */}
        <div
          className={`hidden md:block absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 bg-white/95 backdrop-blur-2xl border border-neutral-200/80 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.14),0_6px_20px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            activeMenu
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
          onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
        >
          {displayMenu && (
            <div className="p-6 max-w-[92vw]">
              <div className="flex items-start divide-x divide-neutral-100 gap-6">
                {getMegaMenuGroups(displayMenu).map((group, idx) => (
                  <div key={idx} className={idx > 0 ? 'pl-6' : ''}>
                    <div className="flex items-center gap-1.5 mb-3.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
                      <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                        {group.title}
                      </h4>
                    </div>
                    <div className="flex items-stretch gap-3">
                      {group.links.map((link: string, linkIdx: number) => {
                        const supportRoutes = displayMenu?.id === 'support'
                          ? [
                              ['phone/iphone', 'laptop/macbook', 'tablet/ipad', 'watch/apple-watch', null],
                              [null, null],
                            ][idx]
                          : undefined;
                        const targetSlug = group.slugs?.[linkIdx] ?? supportRoutes?.[linkIdx] ?? null;
                        const targetPath = targetSlug
                          ? (targetSlug.startsWith('/') ? targetSlug : `/${targetSlug}`)
                          : null;
                        const isFeatured = link.includes('17 Pro') || link.includes('Mới Nhất') || link.includes('Ultra');

                        return (
                          <div
                            key={linkIdx}
                            className={`group relative flex flex-col items-center justify-between p-4 w-[138px] rounded-2xl border transition-all duration-200 ${
                              isFeatured
                                ? 'bg-gradient-to-b from-neutral-900 to-neutral-950 text-white border-neutral-800 hover:border-neutral-700 hover:shadow-xl hover:-translate-y-1'
                                : 'bg-neutral-50/70 hover:bg-white text-neutral-800 border-neutral-200/60 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50 hover:-translate-y-1'
                            }`}
                          >
                            {targetPath && (
                              <Link
                                to={targetPath}
                                onClick={() => setActiveMenu(null)}
                                aria-label={link}
                                className="absolute inset-0 z-10 rounded-2xl"
                              />
                            )}
                            {isFeatured && (
                              <span className="absolute -top-2.5 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-rose-500 text-[9px] font-bold text-white uppercase tracking-wider rounded-full shadow-sm">
                                HOT 🔥
                              </span>
                            )}
                            <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center mb-2.5 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md overflow-hidden p-1.5">
                              {renderItemVisual(link, displayMenu.name, isFeatured)}
                            </div>
                            <div className="text-center w-full">
                              <span className={`text-[12.5px] font-semibold block truncate ${
                                isFeatured ? 'text-white' : 'text-neutral-900'
                              }`}>
                                {link}
                              </span>
                              {targetPath && (
                                <span className={`text-[10.5px] font-medium flex items-center justify-center gap-0.5 mt-1 transition-colors ${
                                isFeatured
                                  ? 'text-neutral-400 group-hover:text-neutral-200'
                                  : 'text-neutral-400 group-hover:text-black'
                              }`}>
                                Khám phá
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1d1d1f] border-t border-neutral-800 px-6 py-6 space-y-4 text-sm font-semibold text-neutral-200 max-h-[80vh] overflow-y-auto">
            {navItems.map(item => (
              <Link key={item.id} to={item.id === 'store' ? '/' : `/${item.slug}`} className="block py-2 hover:text-white" onClick={() => toggleMobileMenu()}>
                {item.name}
              </Link>
            ))}
          </div>
        )}
        {/* Search Modal Overlay */}
        <NavSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </nav>

      {/* Backdrop overlay for Mega Menu */}
      {activeMenu && !isSearchOpen && (
        <div
          className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-40 transition-opacity duration-300"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </>
  );
}
