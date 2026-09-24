import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { MorphIcon } from 'morphicons/react';
import { Menu, X, Search as SearchIcon } from 'lucide';
import { ShoppingBag, User, ChevronDown } from 'lucide-react';
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

  const [activeMoreCategory, setActiveMoreCategory] = useState<any | null>(null);

  const { visibleItems, overflowItems, navItems } = useMemo(() => {
    const rootCats = categories.filter(c => c.parentId === null && c.isActive);
    rootCats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    
    const TARGET_SLUGS = ['dien-thoai', 'ien-thoai', 'may-tinh-bang', 'tablet', 'laptop', 'ong-ho-thong-minh', 'dong-ho-thong-minh', 'watch', 'phone'];

    const allCats = [
      { id: 'store', name: 'Cửa Hàng', slug: '', isStatic: true },
      ...rootCats,
      { id: 'support', name: 'Hỗ Trợ', slug: 'support', isStatic: true }
    ];

    const visible = [
      { id: 'store', name: 'Cửa Hàng', slug: '', isStatic: true },
      ...rootCats.filter(c => TARGET_SLUGS.includes(c.slug.toLowerCase())),
      { id: 'support', name: 'Hỗ Trợ', slug: 'support', isStatic: true }
    ];

    const overflow = rootCats.filter(c => !TARGET_SLUGS.includes(c.slug.toLowerCase()));

    return { visibleItems: visible, overflowItems: overflow, navItems: allCats };
  }, [categories]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeMoreCategory && overflowItems.length > 0) {
      setActiveMoreCategory(overflowItems[0]);
    }
  }, [overflowItems, activeMoreCategory]);

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
        { title: 'Mua Hàng', links: ['Sản Phẩm Mới Nhất', 'Mac', 'iPad', 'iPhone', 'Apple Watch', 'Phụ Kiện'] },
        { title: 'Liên Kết Nhanh', links: ['Tình Trạng Đơn Hàng', 'Apple Trade In', 'Ưu Đãi Sinh Viên'] },
        { title: 'Cửa Hàng Đặc Biệt', links: ['Giáo Dục', 'Doanh Nghiệp'] }
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
          if (prefix === 'watch') {
            return `${prefix}/explore${c.slug.charAt(0).toUpperCase() + c.slug.slice(1)}`;
          }
          // Force iPad slug mapping just in case db returns 'apple'
          if (prefix === 'tablet' && c.slug === 'apple') {
            return `${prefix}/ipad`;
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

    // Mock Groups
    groups.push({
      title: 'MỨC GIÁ',
      links: ['Trên 20 triệu', 'Từ 10 đến 20 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'],
      slugs: []
    });

    groups.push({
      title: 'SẢN PHẨM HOT 🔥',
      links: [`${item.name} Pro Max`, `${item.name} Mới nhất`, `Sản phẩm ${item.name} bán chạy`],
      slugs: []
    });

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

  return (
    <>
      <nav
        className={`${isIphonePage ? 'fixed w-full' : 'sticky'} top-0 z-50 text-xs font-medium transition-colors duration-300 ${
          activeMenu || isSearchOpen
            ? 'bg-white border-b border-neutral-200/60 text-[#1d1d1f]'
            : isIphonePage
              ? 'bg-transparent border-b border-transparent hover:bg-black/90 text-[#f5f5f7]'
              : 'bg-white/80 backdrop-blur-md border-b border-neutral-100 text-[#1d1d1f] shadow-sm'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-[1300px] mx-auto px-4 lg:px-8 h-[52px] flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0" onClick={() => { setActiveMenu(null); setIsSearchOpen(false); }}>
            <img src="/images/logo.png" alt="Logo" className="h-7 w-auto object-contain" />
          </Link>



          {/* Desktop Nav Links */}
          <div ref={containerRef} className="flex-1 mx-6 lg:mx-12 h-full flex justify-center min-w-0">
            <ul className="hidden md:flex items-center space-x-7 h-full">
              {visibleItems.map((item) => (
                <li key={item.id} className="h-full flex items-center" onMouseEnter={() => handleMouseEnter(item)}>
                  <Link
                    to={item.id === 'store' ? '/' : `/${item.slug}`}
                    onClick={() => { setActiveMenu(null); setIsSearchOpen(false); }}
                    className={`nav-glow-link h-full flex items-center relative transition-colors duration-300 ${
                      checkIsActive(item) ? 'text-[#22c55e]' : 'inherit'
                    }`}
                  >
                    {item.name}
                    {/* Active underline glow */}
                    <span
                      className={`absolute bottom-0 left-0 h-[2px] bg-[#22c55e] rounded-full transition-all duration-300 shadow-[0_0_8px_#22c55e,0_0_16px_#22c55e40] ${
                        checkIsActive(item) ? 'w-full opacity-100' : 'w-0 opacity-0'
                      }`}
                    />
                  </Link>
                </li>
              ))}
              
              {overflowItems.length > 0 && (
                <li className="relative h-full flex items-center group" onMouseEnter={() => { handleMouseEnter({ id: 'more', name: 'Xem thêm' }); if(overflowItems.length > 0) setActiveMoreCategory(overflowItems[0]); }}>
                  <button className="flex items-center gap-1 font-medium hover:text-[#22c55e] transition-colors h-full">
                    Xem thêm <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Icons & Mobile Toggle */}
          <div className="flex-shrink-0 flex items-center space-x-5">
            <button
              onClick={() => {
                setActiveMenu(null);
                setIsSearchOpen((prev) => !prev);
              }}
              className={`nav-glow-link transition-colors flex items-center justify-center ${
                isSearchOpen ? 'text-[#22c55e]' : 'hover:text-[#22c55e]'
              }`}
              aria-label="Tìm kiếm"
              aria-expanded={isSearchOpen}
            >
              <MorphIcon icon={isSearchOpen ? X : SearchIcon} size={18} strokeWidth={2} />
            </button>
            
            <div className="relative group">
              <Link 
                to={useAuthStore.getState().user ? "/profile" : "/login"} 
                className="nav-glow-link hover:text-[#22c55e] transition-colors block" 
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
                      <Link to="/profile" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#22c55e]">
                        Hồ sơ của tôi
                      </Link>
                      {useAuthStore.getState().user?.role !== 'customer' && (
                        <Link to="/dashboard" className="block px-5 py-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-[#22c55e]">
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
              className="md:hidden hover:text-[#22c55e] transition-colors focus:outline-none flex items-center justify-center p-1"
              aria-label="Toggle Navigation"
              aria-expanded={mobileMenuOpen}
            >
              <MorphIcon icon={mobileMenuOpen ? X : Menu} size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <div
          className={`hidden md:block absolute left-0 right-0 top-[52px] bg-white overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            activeMenu ? 'max-h-[500px] border-b border-neutral-200/60 opacity-100 shadow-xl' : 'max-h-0 border-transparent opacity-0'
          }`}
          onMouseEnter={() => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }}
        >
          <div 
            className={`max-w-[1300px] mx-auto px-4 lg:px-8 py-10 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
              activeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
            }`}
          >
            {displayMenu?.id === 'more' ? (
              <div className="flex gap-10">
                {/* Column 1: Categories */}
                <div className="w-64 flex-shrink-0 border-r border-neutral-200 pr-4">
                  <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5">DANH MỤC KHÁC</h4>
                  <ul className="space-y-3">
                    {overflowItems.map((cat: any) => (
                      <li key={cat.id}>
                        <div
                          className={`cursor-pointer block transition-colors duration-200 py-1 ${activeMoreCategory?.id === cat.id ? 'text-[#22c55e] font-bold' : 'text-sm font-semibold text-[#1d1d1f] hover:text-[#22c55e]'}`}
                          onMouseEnter={() => setActiveMoreCategory(cat)}
                          onClick={() => { setActiveMenu(null); window.location.href = `/${cat.slug}`; }}
                        >
                          {cat.name}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Column 2,3,4: Data for hovered category */}
                <div className="flex-1 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-10 gap-y-10">
                  {activeMoreCategory && getMegaMenuGroups(activeMoreCategory).map((group, idx) => (
                    <div key={idx}>
                      <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5">{group.title}</h4>
                      <ul className={`transition-all ${group.title === 'THƯƠNG HIỆU' ? 'space-y-4' : 'space-y-3'}`}>
                        {group.links.map((link: string, linkIdx: number) => {
                           const targetSlug = group.slugs && group.slugs[linkIdx] ? `/${group.slugs[linkIdx]}` : '/';
                           return (
                            <li key={linkIdx}>
                              <Link
                                to={targetSlug}
                                onClick={() => setActiveMenu(null)}
                                className={`block transition-colors duration-200 hover:text-[#22c55e] text-sm font-semibold text-[#1d1d1f]`}
                              >
                                {link}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (displayMenu && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-10 gap-y-10">
                {getMegaMenuGroups(displayMenu).map((group, idx) => (
                  <div key={idx}>
                    <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5">{group.title}</h4>
                    <ul className={`transition-all ${group.title === 'THƯƠNG HIỆU' ? 'space-y-4' : 'space-y-3'}`}>
                      {group.links.map((link: string, linkIdx: number) => {
                         const targetSlug = group.slugs && group.slugs[linkIdx] ? `/${group.slugs[linkIdx]}` : '/';
                         return (
                          <li key={linkIdx}>
                            <Link
                              to={targetSlug}
                              onClick={() => setActiveMenu(null)}
                              className={`block transition-colors duration-200 hover:text-[#22c55e] ${linkIdx === 0 && idx === 0 && displayMenu.isStatic
                                ? 'text-2xl font-bold text-[#1d1d1f] mb-2'
                                : 'text-sm font-semibold text-[#1d1d1f]'
                                }`}
                            >
                              {link}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
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
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setActiveMenu(null)}
        />
      )}
    </>
  );
}
