import { useState, useRef } from 'react';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/useCartStore';
import { Link, useLocation } from 'react-router-dom';

// Mega menu data for each nav item
const megaMenuData: Record<string, { title: string; links: string[] }[]> = {
  'Cửa hàng': [
    { title: 'Mua Hàng', links: ['Mua Sắm Sản Phẩm Mới Nhất', 'MacBook', 'iPad', 'iPhone', 'Apple Watch', 'AirPods', 'Phụ Kiện'] },
    { title: 'Liên Kết Nhanh', links: ['Tình Trạng Đơn Hàng', 'Apple Trade In', 'Tài Chính', 'Ưu Đãi Sinh Viên'] },
    { title: 'Cửa Hàng Đặc Biệt', links: ['Giáo Dục', 'Doanh Nghiệp'] },
  ],
  'Laptop': [
    { title: 'Thương hiệu', links: ['MacBook (Apple)', 'Dell XPS & Alienware', 'ASUS ROG & ZenBook', 'HP Spectre & OMEN'] },
    { title: 'Dòng máy nổi bật', links: ['MacBook Pro 16 inch', 'MacBook Air 15 inch', 'Dell XPS 16 (2025)', 'ASUS ROG Zephyrus G16', 'HP Spectre x360'] },
    { title: 'Mức giá', links: ['Trên 50 triệu', 'Từ 40 đến 50 triệu', 'Từ 30 đến 40 triệu', 'Dưới 30 triệu'] },
  ],
  'Tablet': [
    { title: 'Dòng máy', links: ['iPad (Apple)', 'Samsung Tab', 'Xiaomi Pad'] },
    { title: 'Mức giá', links: ['Trên 25 triệu', 'Từ 20 đến 25 triệu', 'Từ 15 đến 20 triệu', 'Từ 10 đến 15 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'] },
    { title: 'Sản phẩm HOT 🔥', links: ['iPad Air M4', 'iPad Pro M5', 'iPad Air M3', 'iPad A16', 'iPad mini 7'] },
  ],
  'Smartphone': [
    { title: 'Khám Phá iPhone', links: ['Khám phá iPhone', 'iPhone 17 Pro', 'iPhone 17', 'iPhone 16', 'iPhone 15'] },
    { title: 'Mua Sắm iPhone', links: ['Mua iPhone', 'Phụ kiện iPhone', 'Apple Trade In', 'Tài chính hỗ trợ'] },
    { title: 'Tìm Hiểu Thêm', links: ['Apple Intelligence', 'iOS 18', 'AppleCare+'] },
    { title: 'Dòng máy', links: ['iPhone (Apple)', 'Samsung', 'Xiaomi', 'OPPO'] },
    { title: 'Mức giá điện thoại', links: ['Trên 20 triệu', 'Từ 10 đến 20 triệu', 'Dưới 10 triệu'] },
    { title: 'Điện thoại HOT 🔥', links: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone Air', 'iPhone 17e', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 15 Plus'] },
    { title: '\u00A0', links: ['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy A07', 'Galaxy A17 LTE', 'Galaxy A17 5G', 'Galaxy A37 5G', 'Galaxy A57 5G'] },
    { title: '\u00A0', links: ['Galaxy Z Fold7 | Z Flip7', 'Galaxy S26 Series', 'Xiaomi Redmi A7 Pro', 'Xiaomi Redmi 15C', 'Xiaomi Redmi 15 5G', 'Xiaomi Redmi Note 15', 'Xiaomi Redmi Note 15 Pro', 'Xiaomi POCO C85'] },
  ],
  'Watch': [
    { title: 'Watch mới', links: ['Khám phá Apple Watch', 'Apple Watch Series 11', 'Apple Watch SE 3 2025', 'Apple Watch Ultra 3 2025'] },
    { title: 'Mức giá', links: ['Trên 25 triệu', 'Từ 20 đến 25 triệu', 'Từ 15 đến 20 triệu', 'Từ 10 đến 15 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'] },
    { title: 'Sản phẩm hot 🔥', links: ['Apple Watch Series 11 42mm GPS', 'Apple Watch SE 3 2025 40mm GPS', 'Apple Watch Ultra 3 49mm LTE'] },
  ],
  'Hỗ trợ': [
    { title: 'Tìm Trợ Giúp', links: ['iPhone', 'Mac', 'iPad', 'Watch', 'AirPods', 'Bảo Hành'] },
    { title: 'Chủ Đề Hữu Ích', links: ['Mua AppleCare+', 'Tài Khoản Apple', 'Thanh Toán'] },
    { title: 'Liên Hệ', links: ['Nhận Hỗ Trợ', 'Cộng Đồng'] },
  ],
};

const navItems = ['Cửa hàng', 'Laptop', 'Tablet', 'Smartphone', 'Watch', 'Hỗ trợ'];

const getNavLinkPath = (link: string): string => {
  if (link === 'MacBook (Apple)' || link.includes('MacBook') || link === 'Mac') return '/laptop/apple';
  if (link.includes('Dell')) return '/laptop/dell';
  if (link.includes('ASUS') || link.includes('ROG') || link.includes('ZenBook')) return '/laptop/asus';
  if (link.includes('HP') || link.includes('Spectre') || link.includes('OMEN') || link.includes('Envy')) return '/laptop/hp';
  if (link === 'iPad (Apple)') return '/tablet/apple';
  if (link === 'Samsung Tab') return '/tablet/samsung';
  if (link === 'Xiaomi Pad') return '/tablet/xiaomi';
  if (link.includes('iPhone')) return '/iphone';
  if (link.includes('Xiaomi')) return '/xiaomi';
  if (link.includes('OPPO')) return '/oppo';
  if (link === 'Khám phá Apple Watch') return '/watch';
  if (link.includes('Series 11')) return '/watch/series-11';
  if (link.includes('SE 3')) return '/watch/se-3';
  if (link.includes('Ultra 3')) return '/watch/ultra-3';
  if (link.includes('Watch')) return '/watch';
  if (link === 'Samsung' || link.includes('Galaxy')) return '/samsung';
  return '/';
};

export function GlobalNav() {
  const { mobileMenuOpen, toggleMobileMenu } = useAppStore();
  const cartItemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const { pathname } = useLocation();
  const isWatchRoute = pathname.startsWith('/watch');
  const isTabletRoute = pathname.startsWith('/tablet');
  const isLaptopRoute = pathname.startsWith('/laptop');
  const isSmartphoneRoute = pathname.startsWith('/samsung') || pathname.startsWith('/iphone') || pathname.startsWith('/xiaomi') || pathname.startsWith('/oppo') || pathname.startsWith('/product');
  const isSamsungDetailRoute = pathname.startsWith('/samsung/') && pathname.split('/').filter(Boolean).length >= 2;
  const isIphonePage = pathname === '/iphone';

  const isItemActive = (item: string) => {
    if (activeMenu === item) return true;
    if (!activeMenu) {
      if (item === 'Laptop' && isLaptopRoute) return true;
      if (item === 'Watch' && isWatchRoute) return true;
      if (item === 'Tablet' && isTabletRoute) return true;
      if (item === 'Smartphone' && isSmartphoneRoute) return true;
    }
    return false;
  };

  const previousMenuRef = useRef<string | null>(null);
  if (activeMenu) {
    previousMenuRef.current = activeMenu;
  }
  const displayMenu = activeMenu || previousMenuRef.current;

  const handleMouseEnter = (item: string) => {
    setActiveMenu(item);
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  // Do not render GlobalNav on Samsung series detail pages
  if (isSamsungDetailRoute) {
    return null;
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 text-xs font-medium transition-all duration-300 ease-out translate-y-0 opacity-100 pointer-events-auto shadow-sm ${
          activeMenu
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/60 text-black'
            : isIphonePage
              ? 'bg-transparent border-b border-transparent hover:bg-black/90 text-[#f5f5f7] hover:backdrop-blur-md'
              : 'border-b border-neutral-200/50 bg-white/85 text-black backdrop-blur-md hover:bg-white/95'
        }`}
        onMouseLeave={handleCloseMenu}
      >
        <div className="max-w-[1024px] mx-auto px-4 h-[44px] flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleCloseMenu}>
            <img src="/images/logo.png" alt="Logo cửa hàng" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden items-center space-x-7 md:flex">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onMouseEnter={() => handleMouseEnter(item)}
                  className={`nav-glow-link relative flex items-center gap-1 pb-1 transition-all duration-300 ${
                    activeMenu === item || isItemActive(item)
                      ? 'text-[#22c55e]'
                      : 'hover:text-[#22c55e]'
                  }`}
                >
                  {item}
                  {/* Active underline glow */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#22c55e] rounded-full transition-all duration-300 shadow-[0_0_8px_#22c55e,0_0_16px_#22c55e40] ${
                      isItemActive(item) ? 'w-full opacity-100' : 'w-0 opacity-0'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          {/* Icons & Mobile Toggle */}
          <div className="flex items-center space-x-5">
            <Link to="/" className="nav-glow-link hover:text-[#22c55e] transition-colors" aria-label="Tìm kiếm" onClick={handleCloseMenu}>
              <Search className="w-4 h-4" />
            </Link>
            
            {/* User Dropdown */}
            <div className="relative group">
              <Link 
                to={useAuthStore.getState().user ? "/profile" : "/login"} 
                className="nav-glow-link hover:text-[#22c55e] transition-colors" 
                aria-label="Tài khoản" 
                onClick={handleCloseMenu}
              >
                <User className="w-4 h-4" />
              </Link>
              
              {/* Dropdown Menu on Hover */}
              {useAuthStore.getState().user && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden z-50 text-black">
                  <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {useAuthStore.getState().user?.username}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#22c55e]">
                      Hồ sơ của tôi
                    </Link>
                    {useAuthStore.getState().user?.role !== 'customer' && (
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-[#22c55e]">
                        Vào Dashboard
                      </Link>
                    )}
                    <button 
                      onClick={() => {
                        useAuthStore.getState().logout();
                        window.location.href = '/login';
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link to="/cart" className="nav-glow-link relative hover:text-[#22c55e] transition-colors" aria-label={"Giỏ hàng" + (cartItemCount ? " (" + cartItemCount + ")" : "")} onClick={handleCloseMenu}>
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 ? (
                <span className="absolute -right-2.5 -top-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-semibold text-white">
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </span>
              ) : null}
            </Link>
            <button
              onClick={toggleMobileMenu}
              className="md:hidden hover:text-[#22c55e] transition-colors focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <div
          className={`hidden md:block absolute left-0 right-0 top-[44px] bg-white/95 backdrop-blur-xl overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            activeMenu ? 'max-h-[450px] border-b border-neutral-200/60 opacity-100 shadow-xl' : 'max-h-0 border-transparent opacity-0'
          }`}
        >
          <div 
            className={`max-w-[1024px] mx-auto px-4 py-10 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] transform text-black ${
              activeMenu ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'
            }`}
          >
            {displayMenu && megaMenuData[displayMenu] && (
              <div className="flex flex-wrap gap-x-12 gap-y-10">
                {megaMenuData[displayMenu].map((col, idx) => (
                  <div key={idx}>
                    <h4 className="text-[11px] text-neutral-400 uppercase tracking-wider mb-4">{col.title}</h4>
                    <ul className="space-y-2.5">
                      {col.links.map((link, linkIdx) => (
                        <li key={linkIdx}>
                          <Link
                            to={getNavLinkPath(link)}
                            onClick={handleCloseMenu}
                            className={`block transition-colors duration-200 hover:text-[#22c55e] ${
                              linkIdx === 0 && idx === 0
                                ? 'text-2xl font-semibold text-[#1d1d1f]'
                                : 'text-sm font-medium text-[#1d1d1f]'
                            }`}
                          >
                            {link}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1d1d1f] border-t border-neutral-800 px-6 py-6 space-y-4 text-sm text-neutral-200">
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Cửa hàng</Link>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Laptop</p>
            <Link to="/laptop/apple" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>MacBook</Link>
            <Link to="/laptop/dell" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Dell XPS & Alienware</Link>
            <Link to="/laptop/asus" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>ASUS ROG & ZenBook</Link>
            <Link to="/laptop/hp" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>HP Spectre & OMEN</Link>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Tablet</p>
            <Link to="/tablet/apple" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>iPad</Link>
            <Link to="/tablet/samsung" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Galaxy Tab</Link>
            <Link to="/tablet/xiaomi" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Xiaomi Pad</Link>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Smartphone</p>
            <Link to="/iphone" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>iPhone</Link>
            <Link to="/samsung" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Samsung Galaxy</Link>
            <Link to="/xiaomi" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Xiaomi</Link>
            <Link to="/oppo" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>OPPO</Link>

            <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Watch</p>
            <Link to="/watch" className="block py-1 pl-3 hover:text-white" onClick={toggleMobileMenu}>Khám phá Apple Watch</Link>
            <Link to="/watch/series-11" className="block py-1 pl-5 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch Series 11</Link>
            <Link to="/watch/se-3" className="block py-1 pl-5 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch SE 3</Link>
            <Link to="/watch/ultra-3" className="block py-1 pl-5 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch Ultra 3</Link>

            <div className="border-t border-neutral-800 pt-3">
              <Link to="/cart" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Giỏ hàng</Link>
              <Link to="/login" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Tài khoản</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Backdrop overlay when mega menu is open */}
      {activeMenu && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCloseMenu}
        />
      )}
    </>
  );
}
