import { Camera, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import type { BrandConfig, BrandProductGroupDefinition, BrandPillar } from '../../../types/smartphone/types/index';

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
