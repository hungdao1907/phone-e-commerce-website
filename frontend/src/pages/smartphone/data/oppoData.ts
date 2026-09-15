import { Camera, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import type { BrandConfig, BrandHeroBanner, BrandProductGroupDefinition, BrandPillar } from '../types';

/* ─── Hero Banners ─── */
const OPPO_HERO_BANNERS: BrandHeroBanner[] = [
  {
    id: 'find-x8-ultra',
    title: 'OPPO Find X8 Ultra',
    shortTitle: 'Find X8 Ultra',
    tagline: 'Hasselblad Quad Tele • Snapdragon 8 Elite',
    badge: 'ĐỈNH CAO FLAGSHIP',
    description: 'Tuyệt tác nhiếp ảnh với hệ thống 4 camera Hasselblad cảm biến lớn, màn hình phẳng siêu sáng và vi xử lý Snapdragon 8 Elite mạnh mẽ.',
    price: 'Từ 28.990.000₫',
    originalPrice: '30.990.000₫',
    image: '/images/samsung.png',
    alt: 'OPPO Find X8 Ultra Banner',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    ctaText: 'Đặt Trước Find X8 Ultra',
    specs: [
      { label: 'Màn hình', value: '6.82" AMOLED 2K 120Hz' },
      { label: 'Vi xử lý', value: 'Snapdragon 8 Elite (3nm)' },
      { label: 'Camera', value: 'Hasselblad Quad 50MP' },
      { label: 'Pin & Sạc', value: '6.100 mAh • 80W SUPERVOOC' },
    ],
    highlightChips: ['Hasselblad Optics', 'Snapdragon 8 Elite', 'Dual Periscope', 'Pin 6.100 mAh'],
  },
  {
    id: 'find-x8-pro',
    title: 'OPPO Find X8 Pro',
    shortTitle: 'Find X8 Pro',
    tagline: 'Camera Tele Kép • Thiết Kế Mỏng Nhẹ',
    badge: 'CHÂN DUNG ĐẲNG CẤP',
    description: 'Hệ thống camera tele tiềm vọng kép Hasselblad, thiết kế mặt lưng cong vô cực và phím chụp nhanh chuyên dụng Quick Button.',
    price: 'Từ 22.990.000₫',
    originalPrice: '24.990.000₫',
    image: '/images/samsung.png',
    alt: 'OPPO Find X8 Pro Banner',
    accentColor: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.45)',
    ctaText: 'Đặt Trước Find X8 Pro',
    specs: [
      { label: 'Màn hình', value: '6.78" AMOLED 1.5K 120Hz' },
      { label: 'Vi xử lý', value: 'MediaTek Dimensity 9400' },
      { label: 'Camera', value: 'Dual Periscope Tele 50MP' },
      { label: 'Pin & Sạc', value: '5.910 mAh • 80W SUPERVOOC' },
    ],
    highlightChips: ['Dual Tele Periscope', 'Dimensity 9400', 'Quick Button', 'Pin Glacier 5.910 mAh'],
  },
  {
    id: 'reno-14-pro',
    title: 'OPPO Reno14 Pro',
    shortTitle: 'Reno14 Pro',
    tagline: 'Chuyên Gia Chân Dung AI • Thiết Kế Sang Trọng',
    badge: 'CHUYÊN GIA CHÂN DUNG',
    description: 'Bắt trọn thần thái tự nhiên với thuật toán chân dung AI thế hệ mới, mặt lưng kính vân nước độc bản và độ bền đạt chuẩn IP69.',
    price: 'Từ 14.990.000₫',
    originalPrice: '15.990.000₫',
    image: '/images/samsung.png',
    alt: 'OPPO Reno14 Pro Banner',
    accentColor: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    ctaText: 'Khám Phá Reno14 Pro',
    specs: [
      { label: 'Màn hình', value: '6.83" AMOLED 1.5K 120Hz' },
      { label: 'Vi xử lý', value: 'Dimensity 8350' },
      { label: 'Camera', value: '50MP AI Portrait Camera' },
      { label: 'Pin & Sạc', value: '6.200 mAh • 80W SUPERVOOC' },
    ],
    highlightChips: ['Portrait AI', 'SUPERVOOC 80W', 'AMOLED 120Hz', 'ColorOS 15'],
  },
];

/* ─── Product Group Definitions ─── */
const OPPO_PRODUCT_GROUPS: BrandProductGroupDefinition[] = [
  {
    id: 'oppo-find-x-series',
    series: 'Find X',
    label: 'DÒNG SẢN PHẨM CAO CẤP',
    title: 'OPPO Find X Series',
    description: 'Đỉnh cao thiết kế và nhiếp ảnh Hasselblad — flagship toàn diện cho người yêu sáng tạo.',
    badge: 'HASSELBLAD × OPPO',
    tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
    accentGradient: 'from-emerald-600 to-teal-600',
  },
  {
    id: 'oppo-reno-series',
    series: 'Reno',
    label: 'THIẾT KẾ THANH LỊCH',
    title: 'OPPO Reno Series',
    description: 'Thiết kế đẹp, chân dung AI tự nhiên và pin bền bỉ — người bạn đồng hành lý tưởng mỗi ngày.',
    badge: 'PORTRAIT AI',
    tagColor: 'text-teal-600 bg-teal-50 border-teal-200/80',
    accentGradient: 'from-teal-500 to-cyan-500',
  },
];

/* ─── Pillars ─── */
const OPPO_PILLARS: BrandPillar[] = [
  {
    num: '01',
    icon: Camera,
    title: 'Hasselblad Color',
    copy: 'Hệ màu tự nhiên Hasselblad\nmang lại chiều sâu nghệ thuật cho mọi bức ảnh.',
    accent: '#10b981',
  },
  {
    num: '02',
    icon: Sparkles,
    title: 'Chuyên Gia Chân Dung AI',
    copy: 'Thuật toán tái tạo chân dung hàng đầu\ntôn vinh vẻ đẹp tự nhiên của bạn.',
    accent: '#059669',
  },
  {
    num: '03',
    icon: RefreshCw,
    title: 'ColorOS 15 Mượt Mà',
    copy: 'Giao diện trực quan, phản hồi tức thì\nvà hiệu năng duy trì ổn định dài lâu.',
    accent: '#34d399',
  },
  {
    num: '04',
    icon: ShieldCheck,
    title: 'Độ Bền Chuẩn Quân Đội',
    copy: 'Kháng nước bụi IP68/IP69 đỉnh cao\nvà kính cường lực Armor Glass siêu bền.',
    accent: '#047857',
  },
];

/* ─── Brand Config ─── */
export const OPPO_BRAND_CONFIG: BrandConfig = {
  id: 'oppo',
  brand: 'OPPO',
  pageTitle: 'OPPO - Camera Hasselblad & Chuyên Gia Chân Dung AI | Cửa Hàng Công Nghệ',
  cssClass: 'oppo-catalog-page',

  accent: '#047857',
  accentSoft: '#D1FAE5',
  dark: '#0D1714',
  selectionColor: '#10b981',

  gradientText: 'brand-gradient-oppo',
  gradientAI: 'brand-gradient-oppo-ai',

  heroBanners: OPPO_HERO_BANNERS,

  featuredBadgeText: 'OPPO Flagship Mới Nhất',
  featuredHeadlinePrefix: 'Khám Phá',
  featuredHeadlineHighlight: 'Đỉnh Cao Hasselblad',
  featuredDescription: 'Trải nghiệm đỉnh cao công nghệ nhiếp ảnh hợp tác cùng Hasselblad — thiết kế thanh lịch, chân dung AI tự nhiên và hiệu năng mạnh mẽ.',

  allProductsHeadlinePrefix: 'Dòng Sản Phẩm',
  allProductsHeadlineHighlight: 'OPPO Nổi Bật',
  allProductsDescription: 'Từ dòng flagship Find X đỉnh cao đến dòng Reno thời thượng — tìm kiếm người bạn đồng hành hoàn hảo cho phong cách của bạn.',
  productGroups: OPPO_PRODUCT_GROUPS,

  whyBrandEyebrow: 'Vì Sao Chọn OPPO?',
  whyBrandHeadline: 'Cảm hứng thẩm mỹ',
  whyBrandSubheadline: 'vượt thời gian.',
  whyBrandDescription: 'Hòa quyện giữa nghệ thuật nhiếp ảnh Hasselblad, công nghệ chân dung AI đột phá và ngôn ngữ thiết kế mỏng nhẹ tinh tế.',
  whyBrandWatermark: 'OPPO',
  pillars: OPPO_PILLARS,

  ctaEyebrow: 'Bắt Đầu Hành Trình?',
  ctaHeadline: 'Chiếc OPPO tiếp theo',
  ctaSubheadline: 'dành riêng cho bạn.',
  ctaDescription: 'Khám phá ngay các dòng sản phẩm OPPO Find X và Reno để nâng tầm trải nghiệm công nghệ.',
  ctaPrimaryText: 'Chọn OPPO',
  ctaSecondaryText: 'Xem tất cả sản phẩm',
  ctaImages: [
    { src: '/images/samsung.png', alt: 'OPPO Find X8 Ultra', position: 'left' },
    { src: '/images/samsung.png', alt: 'OPPO Find X8 Pro', position: 'center' },
    { src: '/images/samsung.png', alt: 'OPPO Reno14 Pro', position: 'right' },
  ],

  consultTitle: 'Bạn Cần Tư Vấn Chọn Điện Thoại OPPO Phù Hợp?',
  consultDescription: 'Đội ngũ chuyên viên luôn sẵn sàng giải đáp về công nghệ camera Hasselblad, sạc nhanh SUPERVOOC và chính sách bảo hành.',
};
