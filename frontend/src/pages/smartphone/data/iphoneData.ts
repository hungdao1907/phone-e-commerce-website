import { Sparkles, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import type { BrandConfig, BrandHeroBanner, BrandProductGroupDefinition, BrandPillar } from '../types';

/* ─── Hero Banners ─── */
const IPHONE_HERO_BANNERS: BrandHeroBanner[] = [
  {
    id: 'ip17-pro-max',
    title: 'iPhone 17 Pro Max',
    shortTitle: '17 Pro Max',
    tagline: 'Chip A19 Pro • Camera 48MP Pro',
    badge: 'PRO MẠNH MẼ NHẤT',
    description: 'Màn hình lớn 6.9 inch, hệ thống camera chuyên nghiệp 48MP và sức mạnh xử lý vượt trội dành cho mọi khoảnh khắc sáng tạo.',
    price: 'Từ 37.990.000₫',
    originalPrice: '39.990.000₫',
    image: '/images/hero.png',
    alt: 'iPhone 17 Pro Max Banner',
    accentColor: '#6b7280',
    glowColor: 'rgba(107, 114, 128, 0.45)',
    ctaText: 'Đặt Trước iPhone 17 Pro Max',
    specs: [
      { label: 'Màn hình', value: '6.9" Super Retina XDR OLED' },
      { label: 'Vi xử lý', value: 'Apple A19 Pro (3nm)' },
      { label: 'Camera', value: '48MP Pro camera system' },
      { label: 'Pin', value: 'Thời lượng pin cả ngày' },
    ],
    highlightChips: ['A19 Pro', 'Camera Pro 48MP', 'Titanium Design', 'Apple Intelligence'],
  },
  {
    id: 'ip17-pro',
    title: 'iPhone 17 Pro',
    shortTitle: '17 Pro',
    tagline: 'Sức Mạnh Pro • Thiết Kế Tinh Gọn',
    badge: 'CHUYÊN NGHIỆP TINH GỌN',
    description: 'Trải nghiệm camera Pro, hiệu năng đỉnh cao và màn hình sắc nét trong thiết kế cân bằng hoàn hảo.',
    price: 'Từ 32.990.000₫',
    originalPrice: '34.990.000₫',
    image: '/images/midip.png',
    alt: 'iPhone 17 Pro Banner',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    ctaText: 'Đặt Trước iPhone 17 Pro',
    specs: [
      { label: 'Màn hình', value: '6.3" Super Retina XDR' },
      { label: 'Vi xử lý', value: 'Apple A19 Pro (3nm)' },
      { label: 'Camera', value: '48MP Pro camera system' },
      { label: 'Sạc', value: 'Sạc nhanh USB-C' },
    ],
    highlightChips: ['A19 Pro', '48MP Pro Camera', 'Titanium', 'USB-C Fast Charge'],
  },
  {
    id: 'ip17',
    title: 'iPhone 17',
    shortTitle: '17',
    tagline: 'Mới Mỗi Ngày • Đầy Sức Mạnh',
    badge: 'TRẢI NGHIỆM MỚI',
    description: 'Một chiếc iPhone linh hoạt cho ảnh đẹp, kết nối nhanh và những trải nghiệm quan trọng hằng ngày.',
    price: 'Từ 24.990.000₫',
    originalPrice: '26.990.000₫',
    image: '/images/leftip.png',
    alt: 'iPhone 17 Banner',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    ctaText: 'Đặt Trước iPhone 17',
    specs: [
      { label: 'Màn hình', value: '6.3" Super Retina XDR' },
      { label: 'Vi xử lý', value: 'Apple A19' },
      { label: 'Camera', value: '48MP Fusion camera' },
      { label: 'Pin', value: 'Pin dùng cả ngày' },
    ],
    highlightChips: ['A19 Chip', '48MP Fusion', 'Dynamic Island', 'Ceramic Shield'],
  },
];

/* ─── Product Group Definitions ─── */
const IPHONE_PRODUCT_GROUPS: BrandProductGroupDefinition[] = [
  {
    id: 'iphone-pro-series',
    series: 'iPhone Pro',
    label: 'DÒNG SẢN PHẨM CAO CẤP',
    title: 'iPhone Pro Series',
    description: 'Trải nghiệm đỉnh cao công nghệ Apple với chip A19 Pro, hệ thống camera chuyên nghiệp và thiết kế Titanium sang trọng.',
    badge: 'APPLE INTELLIGENCE',
    tagColor: 'text-neutral-700 bg-neutral-50 border-neutral-200/80',
    accentGradient: 'from-neutral-600 to-neutral-800',
  },
  {
    id: 'iphone-standard-series',
    series: 'iPhone',
    label: 'TRẢI NGHIỆM PHỔ THÔNG CAO CẤP',
    title: 'iPhone Series',
    description: 'iPhone cho mọi người — thiết kế đẹp, camera xuất sắc và hiệu năng mạnh mẽ ở mức giá hợp lý hơn.',
    badge: 'PHỔ BIẾN NHẤT',
    tagColor: 'text-blue-600 bg-blue-50 border-blue-200/80',
    accentGradient: 'from-blue-500 to-cyan-500',
  },
];

/* ─── Pillars ─── */
const IPHONE_PILLARS: BrandPillar[] = [
  {
    num: '01',
    icon: Sparkles,
    title: 'Apple Intelligence',
    copy: 'Sức mạnh AI cá nhân hóa\ncho mọi tác vụ hằng ngày.',
    accent: '#6366f1',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Quyền Riêng Tư',
    copy: 'Bảo mật dữ liệu tích hợp sâu\nvào mọi lớp phần cứng và phần mềm.',
    accent: '#2563eb',
  },
  {
    num: '03',
    icon: RefreshCw,
    title: 'Hệ Sinh Thái Apple',
    copy: 'iPhone, Mac, iPad, Apple Watch\nkết nối liền mạch tự nhiên.',
    accent: '#0891b2',
  },
  {
    num: '04',
    icon: Headphones,
    title: 'Hỗ Trợ Lâu Dài',
    copy: 'Cập nhật phần mềm nhiều năm\nvà dịch vụ AppleCare+ toàn diện.',
    accent: '#059669',
  },
];

/* ─── Brand Config ─── */
export const IPHONE_BRAND_CONFIG: BrandConfig = {
  id: 'iphone',
  brand: 'Apple',
  pageTitle: 'iPhone - Trải Nghiệm Apple Intelligence & Camera Pro | Cửa Hàng Công Nghệ',
  cssClass: 'iphone-catalog-page',

  accent: '#111827',
  accentSoft: '#D7DCE4',
  dark: '#101216',
  selectionColor: '#6366f1',

  gradientText: 'brand-gradient-iphone',
  gradientAI: 'brand-gradient-iphone-ai',

  heroBanners: IPHONE_HERO_BANNERS,

  featuredBadgeText: 'iPhone Thế Hệ Mới',
  featuredHeadlinePrefix: 'Khám Phá',
  featuredHeadlineHighlight: 'Trải Nghiệm Mới',
  featuredDescription: 'Trải nghiệm công nghệ di động tinh tế nhất với dòng sản phẩm iPhone 17 Series mang đậm dấu ấn Apple Intelligence.',

  allProductsHeadlinePrefix: 'Tìm iPhone',
  allProductsHeadlineHighlight: 'Dành Cho Bạn',
  allProductsDescription: 'Khám phá trọn bộ sưu tập iPhone — từ sức mạnh Pro đỉnh cao đến trải nghiệm phổ thông cao cấp.',
  productGroups: IPHONE_PRODUCT_GROUPS,

  whyBrandEyebrow: 'Vì Sao Chọn iPhone?',
  whyBrandHeadline: 'Công nghệ phục vụ',
  whyBrandSubheadline: 'cách bạn sống.',
  whyBrandDescription: 'Từ Apple Intelligence đến quyền riêng tư và hệ sinh thái kết nối, mọi trải nghiệm được thiết kế để trở nên tự nhiên hơn.',
  whyBrandWatermark: 'iPHONE',
  pillars: IPHONE_PILLARS,

  ctaEyebrow: 'Sẵn Sàng Khám Phá?',
  ctaHeadline: 'iPhone tiếp theo',
  ctaSubheadline: 'đang chờ bạn.',
  ctaDescription: 'Khám phá iPhone Pro và iPhone để tìm thiết bị phù hợp với cách bạn sống.',
  ctaPrimaryText: 'Chọn iPhone',
  ctaSecondaryText: 'Xem tất cả sản phẩm',
  ctaImages: [
    { src: '/images/leftip.png', alt: 'iPhone 17', position: 'left' },
    { src: '/images/midip.png', alt: 'iPhone 17 Pro', position: 'center' },
    { src: '/images/rightip.png', alt: 'iPhone 17 Pro Max', position: 'right' },
  ],

  consultTitle: 'Bạn Cần Tư Vấn Chọn Chiếc iPhone Phù Hợp?',
  consultDescription: 'Đội ngũ chuyên gia luôn sẵn sàng hỗ trợ bạn so sánh cấu hình và lựa chọn sản phẩm tối ưu nhất.',
};
