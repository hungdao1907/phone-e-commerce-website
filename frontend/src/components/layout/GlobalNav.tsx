import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { MorphIcon } from 'morphicons/react';
import { Menu, X, Search as SearchIcon } from 'lucide';
import { ShoppingBag, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { Link, useLocation } from 'react-router-dom';
import { NavSearchModal } from './NavSearchModal';

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
      ...rootCats.filter(c => TARGET_SLUGS.includes(c.slug.toLowerCase())),
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

  const getCategoryPrefix = (slug: string) => {
    if (slug === 'ien-thoai' || slug === 'dien-thoai') return 'phone';
    if (slug === 'may-tinh-bang' || slug === 'tablet') return 'tablet';
    if (slug === 'ong-ho-thong-minh' || slug === 'watch') return 'watch';
    return slug;
  };

  const getMegaMenuGroups = (item: any) => {
    if (!item) return [];
    if (item.isStatic) {
      if (item.name === 'Cửa Hàng') return [
        {
          title: 'MUA HÀNG',
          links: ['Sản Phẩm Mới Nhất', 'MacBook', 'iPad', 'iPhone', 'Apple Watch', 'Tất Cả Phụ Kiện'],
          slugs: ['', 'laptop/macbook', 'tablet/ipad', 'phone/iphone', 'watch/apple-watch', '']
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
        slugs: []
      });
    }

    return groups;
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

            <Link
              to={useAuthStore.getState().user ? "/profile" : "/login"}
              className="nav-glow-link hover:text-black transition-colors block"
              aria-label="Tài khoản"
            >
              <User className="w-[18px] h-[18px]" />
            </Link>

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
          className={`hidden md:block absolute left-1/2 -translate-x-1/2 top-[calc(100%+8px)] z-50 bg-white/95 backdrop-blur-2xl border border-neutral-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${
            activeMenu
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
          }`}
          onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
        >
          {displayMenu && (
            <div className="p-6">
              <div className="flex items-start divide-x divide-neutral-100 gap-6">
                {getMegaMenuGroups(displayMenu).map((group, idx) => (
                  <div key={idx} className={idx > 0 ? 'pl-6' : ''}>
                    <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                      {group.title}
                    </h4>
                    <ul className="space-y-1 min-w-[150px]">
                      {group.links.map((link: string, linkIdx: number) => {
                        const targetSlug = group.slugs && group.slugs[linkIdx] ? `/${group.slugs[linkIdx]}` : '/';
                        return (
                          <li key={linkIdx}>
                            <Link
                              to={targetSlug}
                              onClick={() => setActiveMenu(null)}
                              className="group flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium text-neutral-700 hover:text-black hover:bg-neutral-100/80 transition-all duration-150"
                            >
                              <span className="truncate">{link}</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400 group-hover:text-black shrink-0 ml-2" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
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
