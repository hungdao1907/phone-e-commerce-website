import { Sparkles, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';
import type { BrandConfig, BrandProductGroupDefinition, BrandPillar } from '../../../types/smartphone/types/index';

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
