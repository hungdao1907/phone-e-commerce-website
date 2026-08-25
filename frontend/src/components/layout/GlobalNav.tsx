import React, { useState, useRef } from 'react';
import { Search, ShoppingBag, Menu, X, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useLocation } from 'react-router-dom';

// Mega menu data for each nav item
const megaMenuData: Record<string, { title: string; links: string[] }[]> = {
  'Cửa Hàng': [
    { title: 'Mua Hàng', links: ['Mua Sắm Sản Phẩm Mới Nhất', 'Mac', 'iPad', 'iPhone', 'Apple Watch', 'AirPods', 'Phụ Kiện'] },
    { title: 'Liên Kết Nhanh', links: ['Tình Trạng Đơn Hàng', 'Apple Trade In', 'Tài Chính', 'Ưu Đãi Sinh Viên'] },
    { title: 'Cửa Hàng Đặc Biệt', links: ['Giáo Dục', 'Doanh Nghiệp'] },
  ],
  'LapTop': [
    { title: 'Dòng máy', links: ['MacBook Neo', 'Macbook Air', 'Macbook Pro', 'iMac', 'Mac Studio', 'Mac Mini'] },
    { title: 'Mức giá', links: ['Trên 50 triệu', 'Từ 40 đến 50 triệu', 'Từ 30 đến 40 triệu', 'Từ 20 đến 30 triệu', 'Dưới 20 triệu'] },
    { title: 'Sản phẩm HOT 🔥', links: ['MacBook Neo A18 Pro', 'Macbook Air M5 2026', 'MacBook Pro M5 2026', 'MacBook Pro M5 2025', 'MacBook Air M4 2025', 'MacBook Air M2 13 inch'] },
  ],
  'TabLet': [
    { title: 'Dòng máy', links: ['iPad (Apple)', 'Samsung Tab', 'Xiaomi'] },
    { title: 'Mức giá', links: ['Trên 25 triệu', 'Từ 20 đến 25 triệu', 'Từ 15 đến 20 triệu', 'Từ 10 đến 15 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'] },
    { title: 'Sản phẩm HOT 🔥', links: ['iPad Air M4', 'iPad Pro M5', 'iPad Air M3', 'iPad A16', 'iPad mini 7'] },
  ],
  'iPhone': [
    { title: 'Khám Phá iPhone', links: ['Khám phá iPhone', 'iPhone 17 Pro', 'iPhone 17', 'iPhone 16', 'iPhone 15'] },
    { title: 'Mua Sắm iPhone', links: ['Mua iPhone', 'Phụ kiện iPhone', 'Apple Trade In', 'Tài chính hỗ trợ'] },
    { title: 'Tìm Hiểu Thêm', links: ['Apple Intelligence', 'iOS 18', 'AppleCare+'] }
  ],
  'SmartPhone': [
    { title: 'Dòng máy', links: ['iPhone (Apple)', 'Samsung', 'Xiaomi', 'OPPO'] },
    { title: 'Mức giá điện thoại', links: ['Trên 20 triệu', 'Từ 10 đến 20 triệu', 'Dưới 10 triệu'] },
    { title: 'Điện thoại HOT 🔥', links: ['iPhone 17 Pro Max', 'iPhone 17 Pro', 'iPhone 17', 'iPhone Air', 'iPhone 17e', 'iPhone 16 Plus', 'iPhone 16', 'iPhone 15 Plus'] },
    { title: '\u00A0', links: ['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy A07', 'Galaxy A17 LTE', 'Galaxy A17 5G', 'Galaxy A37 5G', 'Galaxy A57 5G'] },
    { title: '\u00A0', links: ['Galaxy Z Fold7 | Z Flip7', 'Galaxy S26 Series', 'Xiaomi Redmi A7 Pro', 'Xiaomi Redmi 15C', 'Xiaomi Redmi 15 5G', 'Xiaomi Redmi Note 15', 'Xiaomi Redmi Note 15 Pro', 'Xiaomi POCO C85'] },
  ],
  'Watch': [
    { title: 'Watch mới', links: ['Apple Watch Series 11', 'Apple Watch SE 3 2025', 'Apple Watch Ultra 3 2025', 'Apple Watch Series 10'] },
    { title: 'Mức giá', links: ['Trên 25 triệu', 'Từ 20 đến 25 triệu', 'Từ 15 đến 20 triệu', 'Từ 10 đến 15 triệu', 'Từ 5 đến 10 triệu', 'Dưới 5 triệu'] },
    { title: 'Sản phẩm hot 🔥', links: ['Apple Watch Series 11 42mm GPS', 'Apple Watch SE 3 2025 40mm GPS', 'Apple Watch Ultra 3 49mm LTE', 'Apple Watch Series 10 42mm GPS', 'Apple Watch Series 10 46mm GPS'] },
  ],
  'Hỗ Trợ': [
    { title: 'Tìm Trợ Giúp', links: ['iPhone', 'Mac', 'iPad', 'Watch', 'AirPods', 'Bảo Hành'] },
    { title: 'Chủ Đề Hữu Ích', links: ['Mua AppleCare+', 'Tài Khoản Apple', 'Thanh Toán'] },
    { title: 'Liên Hệ', links: ['Nhận Hỗ Trợ', 'Cộng Đồng'] },
  ],
};

const navItems = ['Cửa Hàng', 'LapTop', 'TabLet', 'iPhone', 'SmartPhone', 'Watch', 'Hỗ Trợ'];

export function GlobalNav() {
  const { mobileMenuOpen, toggleMobileMenu } = useAppStore();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const previousMenuRef = useRef<string | null>(null);
  
  const location = useLocation();
  const isIphonePage = location.pathname === '/iphone';

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

  return (
    <>
      <nav
        className={`${isIphonePage ? 'fixed w-full' : 'sticky'} top-0 z-50 text-xs font-medium transition-colors duration-300 ${
          activeMenu
            ? 'bg-white border-b border-neutral-200/60 text-[#1d1d1f]'
            : isIphonePage
              ? 'bg-transparent border-b border-transparent hover:bg-black/90 text-[#f5f5f7]'
              : 'bg-transparent border-b border-transparent hover:bg-white/95 text-[#1d1d1f]'
        }`}
        onMouseLeave={handleCloseMenu}
      >
        <div className="max-w-[1024px] mx-auto px-4 h-[44px] flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity" onClick={handleCloseMenu}>
            <img src="/images/logo.png" alt="H&M Logo" className="h-7 w-auto object-contain" />
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center space-x-7">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onMouseEnter={() => handleMouseEnter(item)}
                  className={`nav-glow-link flex items-center gap-1 transition-all duration-300 relative pb-1 ${
                    activeMenu === item ? 'text-[#22c55e]' : 'inherit'
                  }`}
                >
                  {item}
                  {/* Active underline glow */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#22c55e] rounded-full transition-all duration-300 shadow-[0_0_8px_#22c55e,0_0_16px_#22c55e40] ${activeMenu === item ? 'w-full opacity-100' : 'w-0 opacity-0'
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

        <div
          className={`hidden md:block absolute left-0 right-0 top-[44px] bg-white overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
            activeMenu ? 'max-h-[450px] border-b border-neutral-200/60 opacity-100 shadow-xl' : 'max-h-0 border-transparent opacity-0'
          }`}
        >
          <div 
            className={`max-w-[1024px] mx-auto px-4 py-10 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
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
                            to={link === 'Khám phá iPhone' ? '/iphone' : '/'}
                            onClick={handleCloseMenu}
                            className={`block transition-colors duration-200 hover:text-[#22c55e] ${linkIdx === 0 && idx === 0
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
            <Link to="/" className="block py-1 hover:text-white">Cửa Hàng</Link>
            <Link to="/" className="block py-1 hover:text-white">Mac</Link>
            <Link to="/" className="block py-1 hover:text-white">iPad</Link>
            <Link to="/" className="block py-1 hover:text-white">iPhone</Link>
            <Link to="/" className="block py-1 hover:text-white">Watch</Link>
            <Link to="/" className="block py-1 hover:text-white">AirPods</Link>
            <Link to="/" className="block py-1 hover:text-white">TV & Nhà</Link>
            <Link to="/" className="block py-1 hover:text-white">Giải Trí</Link>
            <Link to="/" className="block py-1 hover:text-white">Phụ Kiện</Link>
            <Link to="/" className="block py-1 hover:text-white">Hỗ Trợ</Link>
          </div>
        )}
      </nav>

      {/* Backdrop overlay when mega menu is open */}
      {activeMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={handleCloseMenu}
        />
      )}
    </>
  );
}
