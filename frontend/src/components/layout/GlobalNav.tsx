import { useState, useEffect } from 'react';
import { Search, ShoppingBag, User, Menu, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';

// Mega menu data for each nav item
const megaMenuData: Record<string, { title: string; links: string[] }[]> = {
  'Cửa hàng': [
    { title: 'Mua Hàng', links: ['Mua Sắm Sản Phẩm Mới Nhất', 'Mac', 'iPad', 'iPhone', 'Apple Watch', 'AirPods', 'Phụ Kiện'] },
    { title: 'Liên Kết Nhanh', links: ['Tình Trạng Đơn Hàng', 'Apple Trade In', 'Tài Chính', 'Ưu Đãi Sinh Viên'] },
    { title: 'Cửa Hàng Đặc Biệt', links: ['Giáo Dục', 'Doanh Nghiệp'] },
  ],
  'Laptop': [
    { title: 'Dòng máy', links: ['MacBook Neo', 'Macbook Air', 'Macbook Pro', 'iMac', 'Mac Studio', 'Mac Mini'] },
    { title: 'Mức giá', links: ['Trên 50 triệu', 'Từ 40 đến 50 triệu', 'Từ 30 đến 40 triệu', 'Từ 20 đến 30 triệu', 'Dưới 20 triệu'] },
    { title: 'Sản phẩm HOT 🔥', links: ['MacBook Neo A18 Pro', 'Macbook Air M5 2026', 'MacBook Pro M5 2026', 'MacBook Pro M5 2025', 'MacBook Air M4 2025', 'MacBook Air M2 13 inch'] },
  ],
  'Tablet': [
    { title: 'Dòng máy', links: ['iPad (Apple)', 'Samsung Tab', 'Xiaomi'] },
    { title: 'Mức giá', links: ['Trên 25 triệu', 'Từ 20 đến 25 triệu', 'Từ 15 đến 20 triệu', 'Từ 10 đến 15 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'] },
    { title: 'Sản phẩm HOT 🔥', links: ['iPad Air M4', 'iPad Pro M5', 'iPad Air M3', 'iPad A16', 'iPad mini 7'] },
  ],
  'iPhone': [
    { title: 'Khám Phá iPhone', links: ['Khám phá iPhone', 'iPhone 17 Pro', 'iPhone 17', 'iPhone 16', 'iPhone 15'] },
    { title: 'Mua Sắm iPhone', links: ['Mua iPhone', 'Phụ kiện iPhone', 'Apple Trade In', 'Tài chính hỗ trợ'] },
    { title: 'Tìm Hiểu Thêm', links: ['Apple Intelligence', 'iOS 18', 'AppleCare+'] },
  ],
  'Smartphone': [
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

const navItems = ['Cửa hàng', 'Laptop', 'Tablet', 'iPhone', 'Smartphone', 'Watch', 'Hỗ trợ'];

const getNavLinkPath = (link: string): string => {
  if (link === 'Khám phá iPhone') return '/iphone';
  if (link === 'Khám phá Apple Watch') return '/watch';
  if (link.includes('Series 11')) return '/watch/series-11';
  if (link.includes('SE 3')) return '/watch/se-3';
  if (link.includes('Ultra 3')) return '/watch/ultra-3';
  if (link.includes('Watch')) return '/watch';
  return '/';
};

export function GlobalNav() {
  const { mobileMenuOpen, toggleMobileMenu } = useAppStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isNearTop, setIsNearTop] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { pathname } = useLocation();
  const isWatchRoute = pathname.startsWith('/watch');
  const usesDarkHomeTreatment = (pathname === '/' || isWatchRoute) && !activeMenu;

  const isItemActive = (item: string) => {
    if (activeMenu === item) return true;
    if (!activeMenu) {
      if (item === 'Watch' && isWatchRoute) return true;
      if (item === 'iPhone' && pathname.startsWith('/iphone')) return true;
    }
    return false;
  };

  // Track mouse proximity to top edge of browser window (e.g. within 65px)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 65) {
        setIsNearTop(true);
      } else {
        setIsNearTop(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMouseEnter = (item: string) => {
    setActiveMenu(item);
  };

  const handleCloseMenu = () => {
    setActiveMenu(null);
  };

  // Nav is visible when mouse is near top, user hovers nav, mega menu is open, or on mobile drawer open
  const isNavVisible = isNearTop || isHovered || activeMenu !== null || mobileMenuOpen;

  return (
    <>
      {/* Top Proximity Hover Sensor Strip */}
      <div
        className="fixed top-0 left-0 right-0 h-4 z-[51] pointer-events-auto"
        onMouseEnter={() => setIsNearTop(true)}
      />

      <nav
        className={`fixed top-0 left-0 right-0 z-50 text-xs font-medium transition-all duration-300 ease-out ${
          isNavVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto shadow-md'
            : '-translate-y-full opacity-0 pointer-events-none'
        } ${
          activeMenu
            ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/60'
            : pathname === '/' || isWatchRoute
            ? 'border-b border-white/[0.06] bg-[#050806]/80 text-white backdrop-blur-md'
            : 'border-b border-neutral-200/40 bg-white/80 text-[#1d1d1f] backdrop-blur-md'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleCloseMenu();
        }}
      >
        <div className="max-w-[1024px] mx-auto px-4 h-[44px] flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleCloseMenu}>
            <img src="/images/logo.png" alt="Logo cửa hàng" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop Nav Links */}
          <ul className={`hidden items-center space-x-7 md:flex ${usesDarkHomeTreatment ? 'text-white/75' : 'text-[#1d1d1f]'}`}>
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onMouseEnter={() => handleMouseEnter(item)}
                  className={`nav-glow-link relative flex items-center gap-1 pb-1 transition-all duration-300 ${
                    activeMenu === item || isItemActive(item)
                      ? 'text-[#22c55e]'
                      : usesDarkHomeTreatment
                      ? 'text-white/75 hover:text-white'
                      : 'text-[#1d1d1f]'
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
          <div className={`flex items-center space-x-5 ${usesDarkHomeTreatment ? 'text-white/75' : 'text-[#1d1d1f]'}`}>
            <Link to="/" className="nav-glow-link hover:text-[#22c55e] transition-colors" aria-label="Tìm kiếm" onClick={handleCloseMenu}>
              <Search className="w-4 h-4" />
            </Link>
            <Link to="/login" className="nav-glow-link hover:text-[#22c55e] transition-colors" aria-label="Đăng nhập" onClick={handleCloseMenu}>
              <User className="w-4 h-4" />
            </Link>
            <Link to="/" className="nav-glow-link hover:text-[#22c55e] transition-colors" aria-label="Giỏ hàng" onClick={handleCloseMenu}>
              <ShoppingBag className="w-4 h-4" />
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
          className={`hidden md:block absolute left-0 right-0 top-[44px] bg-white/95 backdrop-blur-xl border-b border-neutral-200/60 overflow-hidden transition-all duration-500 ease-in-out ${
            activeMenu ? 'max-h-[400px] opacity-100 shadow-xl' : 'max-h-0 opacity-0'
          }`}
        >
          {activeMenu && megaMenuData[activeMenu] && (
            <div className="max-w-[1024px] mx-auto px-4 py-10">
              <div className="flex flex-wrap gap-x-12 gap-y-10">
                {megaMenuData[activeMenu].map((col, idx) => (
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
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1d1d1f] border-t border-neutral-800 px-6 py-6 space-y-4 text-sm text-neutral-200">
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Cửa hàng</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Mac</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>iPad</Link>
            <Link to="/iphone" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>iPhone</Link>
            <Link to="/watch" className="block py-1 hover:text-white font-semibold text-white" onClick={toggleMobileMenu}>Khám phá Apple Watch</Link>
            <Link to="/watch/series-11" className="block py-1 pl-4 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch Series 11</Link>
            <Link to="/watch/se-3" className="block py-1 pl-4 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch SE 3</Link>
            <Link to="/watch/ultra-3" className="block py-1 pl-4 text-xs text-neutral-400 hover:text-white" onClick={toggleMobileMenu}>Apple Watch Ultra 3</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>AirPods</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>TV & Nhà</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Giải Trí</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Phụ Kiện</Link>
            <Link to="/" className="block py-1 hover:text-white" onClick={toggleMobileMenu}>Hỗ trợ</Link>
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
