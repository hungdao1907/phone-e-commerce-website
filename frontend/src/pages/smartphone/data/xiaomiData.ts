import { Camera, Zap, RefreshCw, Sparkles } from 'lucide-react';
import type { BrandConfig, BrandHeroBanner, BrandProductGroupDefinition, BrandPillar } from '../types';

/* ─── Hero Banners ─── */
const XIAOMI_HERO_BANNERS: BrandHeroBanner[] = [
  {
    id: 'x15-ultra',
    title: 'Xiaomi 15 Ultra',
    shortTitle: '15 Ultra',
    tagline: 'Leica Quad Camera • Snapdragon 8 Elite',
    badge: 'ĐỈNH CAO NHIẾP ẢNH',
    description: 'Hệ thống 4 camera Leica siêu quang học, cảm biến 1 inch thế hệ mới và vi xử lý Snapdragon 8 Elite định chuẩn nhiếp ảnh di động.',
    price: 'Từ 29.990.000₫',
    originalPrice: '31.990.000₫',
    image: '/images/xiaomi.png',
    alt: 'Xiaomi 15 Ultra Banner',
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    ctaText: 'Đặt Trước 15 Ultra',
    specs: [
      { label: 'Màn hình', value: '6.73" AMOLED 2K 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite (3nm)' },
      { label: 'Camera', value: 'Leica Quad Camera 50MP' },
      { label: 'Pin & Sạc', value: '5.410 mAh • 90W HyperCharge' },
    ],
    highlightChips: ['Leica Optics', 'Snapdragon 8 Elite', '2K AMOLED 120Hz', '90W HyperCharge'],
  },
  {
    id: 'x15',
    title: 'Xiaomi 15',
    shortTitle: '15',
    tagline: 'Flagship Gọn Gàng • Hiệu Năng Vượt Trội',
    badge: 'FLAGSHIP NHỎ GỌN',
    description: 'Thiết kế viền siêu mỏng cân đối 4 cạnh, cụm 3 camera Leica 50MP và hiệu năng flagship hàng đầu trong thân máy 6.36 inch.',
    price: 'Từ 22.990.000₫',
    originalPrice: '24.490.000₫',
    image: '/images/xiaomi.png',
    alt: 'Xiaomi 15 Banner',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    ctaText: 'Đặt Trước Xiaomi 15',
    specs: [
      { label: 'Màn hình', value: '6.36" AMOLED 1.5K 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite' },
      { label: 'Camera', value: 'Leica Triple 50MP' },
      { label: 'Pin & Sạc', value: '5.240 mAh • 90W HyperCharge' },
    ],
    highlightChips: ['Viền Siêu Mỏng', 'Snapdragon 8 Elite', 'Leica Summilux', 'Pin 5.240 mAh'],
  },
  {
    id: 'rn15-pro-plus',
    title: 'Redmi Note 15 Pro+',
    shortTitle: 'Note 15 Pro+',
    tagline: 'Camera 200MP • Sạc Nhanh 120W',
    badge: 'QUỐC DÂN CAO CẤP',
    description: 'Trải nghiệm camera 200MP chống rung OIS, sạc siêu tốc 120W đầy pin trong 19 phút cùng chuẩn kháng nước bụi IP68 bền bỉ.',
    price: 'Từ 11.990.000₫',
    originalPrice: '12.990.000₫',
    image: '/images/xiaomi.png',
    alt: 'Redmi Note 15 Pro+ Banner',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    ctaText: 'Khám Phá Note 15 Pro+',
    specs: [
      { label: 'Màn hình', value: '6.67" AMOLED 1.5K 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 7s Gen 3' },
      { label: 'Camera', value: '200MP OIS siêu nét' },
      { label: 'Pin & Sạc', value: '5.110 mAh • 120W HyperCharge' },
    ],
    highlightChips: ['200MP Camera', 'HyperCharge 120W', 'AMOLED 120Hz', 'IP68'],
  },
];

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

  heroBanners: XIAOMI_HERO_BANNERS,

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
