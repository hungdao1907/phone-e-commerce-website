import React from 'react';
import { Apple, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-neutral-300 text-xs text-neutral-500 pt-8 pb-12 mt-16">
      <div className="max-w-[1024px] mx-auto px-4 md:px-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 border-b border-neutral-300 pb-4 text-neutral-600">
          <Apple className="w-4 h-4" />
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Cửa Hàng Trực Tuyến của Apple</span>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-semibold text-[#1d1d1f]">Mua Sắm và Tìm Hiểu</h4>
            <ul className="space-y-1.5">
              <li><Link to="/" className="hover:underline">Cửa Hàng</Link></li>
              <li><Link to="/" className="hover:underline">Mac</Link></li>
              <li><Link to="/" className="hover:underline">iPad</Link></li>
              <li><Link to="/" className="hover:underline">iPhone</Link></li>
              <li><Link to="/" className="hover:underline">Watch</Link></li>
              <li><Link to="/" className="hover:underline">AirPods</Link></li>
              <li><Link to="/" className="hover:underline">TV & Nhà</Link></li>
              <li><Link to="/" className="hover:underline">AirTag</Link></li>
              <li><Link to="/" className="hover:underline">Phụ Kiện</Link></li>
              <li><Link to="/" className="hover:underline">Thẻ Quà Tặng</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Tài Khoản</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Quản Lý Tài Khoản Apple Của Bạn</Link></li>
                <li><Link to="/" className="hover:underline">Tài Khoản Apple Store</Link></li>
                <li><Link to="/" className="hover:underline">iCloud.com</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Giải trí</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Apple One</Link></li>
                <li><Link to="/" className="hover:underline">Apple TV+</Link></li>
                <li><Link to="/" className="hover:underline">Apple Music</Link></li>
                <li><Link to="/" className="hover:underline">Apple Arcade</Link></li>
                <li><Link to="/" className="hover:underline">Apple Podcasts</Link></li>
                <li><Link to="/" className="hover:underline">Apple Books</Link></li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-[#1d1d1f]">Apple Store</h4>
            <ul className="space-y-1.5">
              <li><Link to="/" className="hover:underline">Ứng Dụng Apple Store</Link></li>
              <li><Link to="/" className="hover:underline">Tài Chính</Link></li>
              <li><Link to="/" className="hover:underline">Apple Trade In</Link></li>
              <li><Link to="/" className="hover:underline">Trạng Thái Đơn Hàng</Link></li>
              <li><Link to="/" className="hover:underline">Hỗ Trợ Mua Hàng</Link></li>
            </ul>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Dành Cho Doanh Nghiệp</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Apple và Doanh Nghiệp</Link></li>
                <li><Link to="/" className="hover:underline">Mua Sắm Cho Doanh Nghiệp</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Cho Giáo Dục</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Apple và Giáo Dục</Link></li>
                <li><Link to="/" className="hover:underline">Mua Hàng Cho Bậc Đại Học</Link></li>
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Giá Trị Cốt Lõi Của Apple</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Trợ Năng</Link></li>
                <li><Link to="/" className="hover:underline">Môi Trường</Link></li>
                <li><Link to="/" className="hover:underline">Quyền Riêng Tư</Link></li>
                <li><Link to="/" className="hover:underline">Chuỗi Cung Ứng</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-[#1d1d1f]">Về Apple</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="hover:underline">Newsroom</Link></li>
                <li><Link to="/" className="hover:underline">Lãnh Đạo Của Apple</Link></li>
                <li><Link to="/" className="hover:underline">Nhà Đầu Tư</Link></li>
                <li><Link to="/" className="hover:underline">Đạo Đức & Quy Tắc</Link></li>
                <li><Link to="/" className="hover:underline">Sự Kiện</Link></li>
                <li><Link to="/" className="hover:underline">Liên Hệ Apple</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Links */}
        <div className="pt-6 border-t border-neutral-300 flex flex-col md:flex-row items-center justify-between gap-4 text-[#6e6e73]">
          <p>Copyright © 2024 Apple Inc. Bảo lưu mọi quyền.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/" className="hover:underline">Chính Sách Quyền Riêng Tư</Link>
            <span className="text-neutral-300">|</span>
            <Link to="/" className="hover:underline">Điều Khoản Sử Dụng</Link>
            <span className="text-neutral-300">|</span>
            <Link to="/" className="hover:underline">Bán Hàng và Hoàn Tiền</Link>
            <span className="text-neutral-300">|</span>
            <Link to="/" className="hover:underline">Pháp Lý</Link>
            <span className="text-neutral-300">|</span>
            <Link to="/" className="hover:underline">Sơ Đồ Trang Web</Link>
          </div>
          <Link to="/" className="hover:underline font-medium text-[#1d1d1f]">Việt Nam</Link>
        </div>
      </div>
    </footer>
  );
}
