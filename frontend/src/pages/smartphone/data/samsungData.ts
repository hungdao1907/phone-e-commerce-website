import { Sparkles, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import type { BrandConfig, BrandHeroBanner, BrandProductGroupDefinition, BrandPillar } from '../types';

/* ─── Hero Banners ─── */
const SAMSUNG_HERO_BANNERS: BrandHeroBanner[] = [
  {
    id: 's26-ultra',
    title: 'Galaxy S26 Ultra',
    shortTitle: 'S26 Ultra',
    tagline: 'Quyền Năng Galaxy AI • Khung Titan Thế Hệ Mới',
    badge: 'FLAGSHIP ĐỈNH CAO',
    description: 'Trải nghiệm đỉnh cao công nghệ với S Pen tích hợp, cảm biến 200MP Quad-Tele và vi xử lý Snapdragon 8 Elite tối ưu cho Galaxy AI.',
    price: 'Từ 31.990.000₫',
    originalPrice: '33.990.000₫',
    image: '/images/samsung/samsung-banner-s26-ultra.png?v=2',
    alt: 'Samsung Galaxy S26 Ultra with S-Pen Banner',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.45)',
    ctaText: 'Đặt Trước S26 Ultra',
    specs: [
      { label: 'Màn hình', value: '6.9" Dynamic AMOLED 2X 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Hệ thống Camera', value: '200MP + 50MP + 50MP + 12MP' },
      { label: 'Pin & Sạc', value: '5.000 mAh • Sạc siêu nhanh 45W' },
    ],
    highlightChips: ['S Pen Tích Hợp', 'Galaxy AI 2.0', 'Khung Titan Siêu Bền', 'Zoom Chuẩn Điện Ảnh'],
  },
  {
    id: 's26-plus',
    title: 'Galaxy S26+',
    shortTitle: 'S26+',
    tagline: 'Màn Hình Lớn Hơn • Trải Nghiệm Hoàn Mỹ',
    badge: 'MÀN HÌNH RỘNG & PIN KHỦNG',
    description: 'Không gian hiển thị rộng rãi 6.7 inch độ phân giải QHD+, hệ thống tản nhiệt buồng hơi lớn hơn và pin 4.900 mAh cân trọn mọi tác vụ.',
    price: 'Từ 26.990.000₫',
    originalPrice: '28.490.000₫',
    image: '/images/samsung/samsung-banner-s26-plus.png?v=2',
    alt: 'Samsung Galaxy S26 Plus Banner',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    ctaText: 'Đặt Trước S26+',
    specs: [
      { label: 'Màn hình', value: '6.7" Dynamic AMOLED 2X QHD+' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Hệ thống Camera', value: '50MP + 12MP + 10MP AI' },
      { label: 'Pin & Sạc', value: '4.900 mAh • Sạc nhanh 45W' },
    ],
    highlightChips: ['Màn Hình QHD+ 6.7"', 'Pin Khủng 4.900 mAh', 'Tản Nhiệt Buồng Hơi Lớn', 'Sạc Nhanh 45W'],
  },
  {
    id: 's26',
    title: 'Galaxy S26',
    shortTitle: 'S26',
    tagline: 'Thiết Kế Gọn Gàng • Hiệu Năng Bứt Phá',
    badge: 'NHỎ GỌN & MẠNH MẼ',
    description: 'Kích thước nhỏ gọn 6.2 inch hoàn hảo trong lòng bàn tay, cụm 3 camera 50MP AI bắt nét sắc sảo và khung nhôm Armor Aluminum siêu nhẹ.',
    price: 'Từ 22.990.000₫',
    originalPrice: '24.490.000₫',
    image: '/images/samsung/samsung-banner-s26.png?v=2',
    alt: 'Samsung Galaxy S26 Dual Phone Banner',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    ctaText: 'Đặt Trước S26',
    specs: [
      { label: 'Màn hình', value: '6.2" Dynamic AMOLED 2X 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite for Galaxy' },
      { label: 'Hệ thống Camera', value: '50MP + 12MP + 10MP AI' },
      { label: 'Trọng lượng & Pin', value: '167g • 4.000 mAh' },
    ],
    highlightChips: ['Gọn Nhẹ 167g', 'Armor Aluminum 2.0', 'Galaxy AI 2.0', 'Màn Hình 2600 nits'],
  },
];

/* ─── Product Group Definitions ─── */
const SAMSUNG_PRODUCT_GROUPS: BrandProductGroupDefinition[] = [
  {
    id: 'galaxy-s-series',
    series: 'Galaxy S',
    label: 'DÒNG SẢN PHẨM CAO CẤP',
    title: 'Galaxy S Series',
    description: 'Biểu tượng công nghệ với hiệu năng Snapdragon 8 Elite đỉnh cao, hệ thống camera AI đột phá và thiết kế nguyên khối sang trọng.',
    badge: 'KỶ NGUYÊN GALAXY AI',
    tagColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
    accentGradient: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'galaxy-z-series',
    series: 'Galaxy Z',
    label: 'THIẾT KẾ GẬP MỞ TƯƠNG LAI',
    title: 'Galaxy Z Series',
    description: 'Định hình phong cách sống hiện đại với màn hình gập biến hóa linh hoạt, đa nhiệm đột phá và trải nghiệm Flex Mode độc bản.',
    badge: 'CÔNG NGHỆ GẬP TIÊN PHONG',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    accentGradient: 'from-emerald-600 to-teal-600',
  },
];

/* ─── Pillars ─── */
const SAMSUNG_PILLARS: BrandPillar[] = [
  {
    num: '01',
    icon: Sparkles,
    title: 'Galaxy AI',
    copy: 'Thông minh hơn trong tìm kiếm, sáng tạo\nvà những tác vụ hằng ngày.',
    accent: '#6366f1',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Samsung Knox',
    copy: 'Bảo vệ dữ liệu với nhiều lớp bảo mật\nđược tích hợp trong hệ sinh thái Galaxy.',
    accent: '#2563eb',
  },
  {
    num: '03',
    icon: RefreshCw,
    title: 'Galaxy Ecosystem',
    copy: 'Điện thoại, Watch, Buds và các thiết bị Galaxy\nkết nối thành một trải nghiệm liền mạch.',
    accent: '#0891b2',
  },
  {
    num: '04',
    icon: Headphones,
    title: 'Hỗ Trợ & Dịch Vụ',
    copy: 'Đồng hành từ lúc lựa chọn thiết bị\nđến quá trình sử dụng lâu dài.',
    accent: '#059669',
  },
];

/* ─── Brand Config ─── */
export const SAMSUNG_BRAND_CONFIG: BrandConfig = {
  id: 'samsung',
  brand: 'Samsung',
  pageTitle: 'Samsung Galaxy - Quyền Năng Sáng Tạo & Trải Nghiệm AI Đỉnh Cao | Cửa Hàng Công Nghệ',
  cssClass: 'samsung-catalog-page',

  accent: '#2563eb',
  accentSoft: '#dbeafe',
  dark: '#000000',
  selectionColor: '#2563eb',

  gradientText: 'brand-gradient-samsung',
  gradientAI: 'brand-gradient-samsung-ai',

  heroBanners: SAMSUNG_HERO_BANNERS,

  featuredBadgeText: 'Galaxy Thế Hệ Mới',
  featuredHeadlinePrefix: 'Khám Phá',
  featuredHeadlineHighlight: 'Quyền Năng Mới',
  featuredDescription: 'Trải nghiệm công nghệ di động đỉnh cao với dòng sản phẩm Galaxy S26 Series mang đậm dấu ấn đột phá của Galaxy AI.',

  allProductsHeadlinePrefix: 'Tìm Galaxy',
  allProductsHeadlineHighlight: 'Dành Cho Bạn',
  allProductsDescription: 'Khám phá trọn bộ sưu tập Galaxy — từ quyền năng đỉnh cao của Galaxy S đến phong cách gập mở đột phá của Galaxy Z.',
  productGroups: SAMSUNG_PRODUCT_GROUPS,

  whyBrandEyebrow: 'Vì Sao Chọn Galaxy?',
  whyBrandHeadline: 'Công nghệ phục vụ',
  whyBrandSubheadline: 'cách bạn sống.',
  whyBrandDescription: 'Từ Galaxy AI đến bảo mật và hệ sinh thái kết nối, mọi trải nghiệm được thiết kế để trở nên liền mạch hơn.',
  whyBrandWatermark: 'GALAXY',
  pillars: SAMSUNG_PILLARS,

  ctaEyebrow: 'Sẵn Sàng Khám Phá?',
  ctaHeadline: 'Galaxy tiếp theo',
  ctaSubheadline: 'đang chờ bạn.',
  ctaDescription: 'Khám phá Galaxy S và Galaxy Z để tìm thiết bị phù hợp với cách bạn sống.',
  ctaPrimaryText: 'Chọn Galaxy',
  ctaSecondaryText: 'Xem tất cả sản phẩm',
  ctaImages: [
    { src: '/images/samsung/samsung-z-fold8.jpg', alt: 'Samsung Galaxy Z Fold8', position: 'left' },
    { src: '/images/samsung/samsung-card-s26-ultra.jpg', alt: 'Samsung Galaxy S26 Ultra', position: 'center' },
    { src: '/images/samsung/samsung-z-flip8.jpg', alt: 'Samsung Galaxy Z Flip8', position: 'right' },
  ],

  consultTitle: 'Bạn Cần Tư Vấn Chọn Chiếc Galaxy Phù Hợp?',
  consultDescription: 'Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ bạn so sánh cấu hình và lựa chọn thiết bị tối ưu nhất.',
};
