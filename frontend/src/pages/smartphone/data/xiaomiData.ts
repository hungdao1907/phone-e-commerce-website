import { Camera, Zap, RefreshCw, Sparkles } from 'lucide-react';
import type { BrandConfig, BrandProductGroupDefinition, BrandPillar } from '../types';

/* ─── Product Group Definitions ─── */
const XIAOMI_PRODUCT_GROUPS: BrandProductGroupDefinition[] = [
  {
    id: 'xiaomi-flagship-series',
    series: 'Xiaomi Flagship',
    label: 'DÒNG SẢN PHẨM CAO CẤP',
    title: 'Xiaomi Flagship Series',
    description: 'Đỉnh cao công nghệ Xiaomi với chip Snapdragon 8 Elite, camera hợp tác Leica và thiết kế premium.',
    badge: 'LEICA × XIAOMI',
    tagColor: 'text-orange-600 bg-orange-50 border-orange-200/80',
    accentGradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'redmi-note-series',
    series: 'Redmi Note',
    label: 'HIỆU NĂNG VƯỢT TẦM GIÁ',
    title: 'Redmi Note Series',
    description: 'Hiệu năng cao, camera sắc nét và sạc nhanh HyperCharge — sự lựa chọn thông minh cho mọi người.',
    badge: 'PHỔ BIẾN NHẤT',
    tagColor: 'text-sky-600 bg-sky-50 border-sky-200/80',
    accentGradient: 'from-sky-500 to-blue-500',
  },
];

/* ─── Pillars ─── */
const XIAOMI_PILLARS: BrandPillar[] = [
  {
    num: '01',
    icon: Camera,
    title: 'Leica Optics',
    copy: 'Hệ thấu kính quang học Leica\nmang chất màu điện ảnh huyền thoại.',
    accent: '#f97316',
  },
  {
    num: '02',
    icon: Zap,
    title: 'HyperCharge Siêu Tốc',
    copy: 'Công nghệ sạc nhanh dẫn đầu\nđầy pin chỉ trong tích tắc.',
    accent: '#eab308',
  },
  {
    num: '03',
    icon: RefreshCw,
    title: 'Xiaomi HyperOS 2',
    copy: 'Hệ điều hành mượt mà kết nối\nliền mạch Smartphone, Pad, Watch & Auto.',
    accent: '#06b6d4',
  },
  {
    num: '04',
    icon: Sparkles,
    title: 'Vật Liệu Cao Cấp',
    copy: 'Khung nhôm nguyên khối, gốm nano\nvà kính cường lực Xiaomi Shield Glass.',
    accent: '#8b5cf6',
  },
];

/* ─── Brand Config ─── */
export const XIAOMI_BRAND_CONFIG: BrandConfig = {
  id: 'xiaomi',
  brand: 'Xiaomi',
  pageTitle: 'Xiaomi - Nhiếp Ảnh Leica & Hiệu Năng Đỉnh Cao | Cửa Hàng Công Nghệ',
  cssClass: 'xiaomi-catalog-page',

  accent: '#FF6900',
  accentSoft: '#FFE4D6',
  dark: '#141210',
  selectionColor: '#FF6900',

  gradientText: 'brand-gradient-xiaomi',
  gradientAI: 'brand-gradient-xiaomi-ai',
  featuredBadgeText: 'Xiaomi Flagship Thế Hệ Mới',
  featuredHeadlinePrefix: 'Đột Phá',
  featuredHeadlineHighlight: 'Nhiếp Ảnh Leica',
  featuredDescription: 'Trải nghiệm đỉnh cao công nghệ di động hợp tác cùng Leica — chất ảnh chân thực, hiệu năng Snapdragon 8 Elite vượt giới hạn.',

  allProductsHeadlinePrefix: 'Khám Phá Toàn Bộ',
  allProductsHeadlineHighlight: 'Dòng Máy Xiaomi',
  allProductsDescription: 'Từ flagship cao cấp hợp tác Leica đến dòng Redmi Note quốc dân — luôn có một chiếc Xiaomi hoàn hảo dành cho bạn.',
  productGroups: XIAOMI_PRODUCT_GROUPS,

  whyBrandEyebrow: 'Vì Sao Chọn Xiaomi?',
  whyBrandHeadline: 'Công nghệ tiên phong',
  whyBrandSubheadline: 'cho mọi người.',
  whyBrandDescription: 'Kết hợp nhiếp ảnh Leica huyền thoại, tốc độ sạc HyperCharge dẫn đầu và hệ sinh thái Xiaomi HyperOS thông minh toàn diện.',
  whyBrandWatermark: 'XIAOMI',
  pillars: XIAOMI_PILLARS,

  ctaEyebrow: 'Sẵn Sàng Trải Nghiệm?',
  ctaHeadline: 'Xiaomi tiếp theo',
  ctaSubheadline: 'đang chờ đón bạn.',
  ctaDescription: 'Khám phá thế hệ smartphone mới với công nghệ Leica đỉnh cao và hiệu năng bứt phá.',
  ctaPrimaryText: 'Chọn Xiaomi',
  ctaSecondaryText: 'Xem tất cả sản phẩm',
  ctaImages: [
    { src: '/images/xiaomi.png', alt: 'Xiaomi 15 Ultra', position: 'left' },
    { src: '/images/xiaomi.png', alt: 'Xiaomi 15', position: 'center' },
    { src: '/images/xiaomi.png', alt: 'Redmi Note 15 Pro+', position: 'right' },
  ],

  consultTitle: 'Cần Hỗ Trợ Chọn Điện Thoại Xiaomi?',
  consultDescription: 'Chuyên viên tư vấn luôn sẵn sàng giải đáp thắc mắc về cấu hình, camera Leica và các chương trình ưu đãi mới nhất.',
};
