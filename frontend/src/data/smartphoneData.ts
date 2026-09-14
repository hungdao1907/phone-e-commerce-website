import type { SmartphoneBrandId, SmartphoneBrandConfig, BrandModel } from '@/types/smartphone';

export function getSmartphoneBrandConfig(brand: SmartphoneBrandId | string): SmartphoneBrandConfig {
  // Default config just to satisfy the build and provide some basic structure
  return {
    id: brand,
    brand: brand.toUpperCase(),
    pageTitle: `Khám phá ${brand.toUpperCase()}`,
    cssClass: `brand-page-${brand}`,
    accent: '#2563eb',
    accentSoft: '#93c5fd',
    dark: '#000000',
    selectionColor: '#2563eb',
    gradientText: 'bg-gradient-to-r from-blue-500 to-purple-500',
    gradientAI: 'bg-gradient-to-r from-purple-500 to-pink-500',
    heroBanners: [
      {
        id: 'banner-1',
        title: `Khám phá ${brand.toUpperCase()}`,
        subtitle: 'Công nghệ của tương lai',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=2071&auto=format&fit=crop',
        alt: `${brand.toUpperCase()} Hero`,
        glowColor: '#2563eb',
        accentColor: '#3b82f6'
      }
    ],
    featuredBadgeText: 'Nổi bật',
    featuredHeadlinePrefix: 'Siêu phẩm',
    featuredHeadlineHighlight: 'Mới Nhất',
    featuredDescription: 'Những dòng máy đình đám nhất hiện nay.',
    allProductsHeadlinePrefix: 'Khám phá',
    allProductsHeadlineHighlight: 'Tất cả sản phẩm',
    allProductsDescription: 'Đầy đủ mọi lựa chọn dành cho bạn.',
    productGroups: [
      {
        id: 'group-1',
        name: 'Dòng Cao Cấp',
        description: 'Trải nghiệm đỉnh cao'
      }
    ],
    whyBrandEyebrow: 'Lý do chọn',
    whyBrandHeadline: `Tại sao lại là ${brand.toUpperCase()}?`,
    whyBrandSubheadline: 'Trải nghiệm đỉnh cao',
    whyBrandDescription: 'Mang đến cho bạn những tinh hoa công nghệ tiên tiến nhất.',
    whyBrandWatermark: brand.toUpperCase(),
    pillars: [
      {
        id: 'pillar-1',
        title: 'Hiệu năng',
        description: 'Mạnh mẽ vượt trội',
        icon: 'Zap'
      }
    ],
    ctaEyebrow: 'Sẵn sàng chưa?',
    ctaHeadline: 'Chọn ngay',
    ctaSubheadline: 'Mẫu yêu thích của bạn',
    ctaDescription: 'Nhanh tay đặt hàng để nhận ưu đãi đặc biệt.',
    ctaPrimaryText: 'Mua ngay',
    ctaSecondaryText: 'Tìm hiểu thêm',
    ctaImages: [
      {
        id: 'cta-1',
        src: 'https://images.unsplash.com/photo-1598327105666-5b89351cb315?q=80&w=2000&auto=format&fit=crop',
        alt: 'CTA Image'
      }
    ],
    consultTitle: 'Cần tư vấn?',
    consultDescription: 'Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn.',
  };
}

export function getSmartphoneProductsByBrand(brand: SmartphoneBrandId | string): BrandModel[] {
  // Return an empty array or mock products.
  // The actual products are fetched from the API in SmartphonePage.tsx anyway.
  return [];
}
