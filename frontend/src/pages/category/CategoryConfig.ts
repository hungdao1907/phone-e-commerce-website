import { Smartphone, Laptop, Watch, Tablet, Zap, Tag, Star, ArrowRight } from 'lucide-react';

export interface CategoryCardConfig {
  id: string;
  label: string;
  path: string;
  image: string;
  brandQuery: string; // The query value for ?brand=
}

export interface CategoryConfig {
  slug: string;
  banner: {
    title: string;
    description: string;
    badge: string;
    buttonText: string;
    image: string;
  };
  shortcuts?: {
    label: string;
    icon: any;
  }[];
  cards: CategoryCardConfig[];
}

export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  phone: {
    slug: 'phone',
    banner: {
      title: 'Mọi thiết bị, mọi thương hiệu, một nơi',
      description: 'Điện thoại thông minh chính hãng. Trả góp 0% và giao hàng trong ngày.',
      badge: 'Giảm đến 30%',
      buttonText: 'Xem tất cả điện thoại',
      image: '/images/hero/phone-hero.png',
    },
    cards: [
      { id: 'iphone', label: 'iPhone', path: '/phone/iphone', image: '/images/cat-iphone.webp', brandQuery: 'Apple' },
      { id: 'samsung', label: 'Samsung', path: '/phone/samsung', image: '/images/cat-samsung.webp', brandQuery: 'Samsung' },
      { id: 'xiaomi', label: 'Xiaomi', path: '/phone/xiaomi', image: '/images/cat-xiaomi.webp', brandQuery: 'Xiaomi' },
      { id: 'oppo', label: 'OPPO', path: '/phone/oppo', image: '/images/cat-oppo.webp', brandQuery: 'OPPO' },
    ]
  },
  laptop: {
    slug: 'laptop',
    banner: {
      title: 'Hiệu năng bứt phá, sáng tạo không giới hạn',
      description: 'Laptop chính hãng phục vụ hoàn hảo cho công việc và giải trí.',
      badge: 'Bảo hành 2 năm',
      buttonText: 'Xem tất cả laptop',
      image: '/images/hero/laptop-hero.png',
    },
    cards: [
      { id: 'macbook', label: 'MacBook', path: '/laptop/macbook', image: '/images/cat-macbook.webp', brandQuery: 'Apple' },
      { id: 'asus', label: 'ASUS', path: '/laptop/asus', image: '/images/cat-asus.webp', brandQuery: 'Asus' },
      { id: 'lenovo', label: 'Lenovo', path: '/laptop/lenovo-6xfo', image: '/images/cat-lenovo.webp', brandQuery: 'Lenovo' },
      { id: 'dell', label: 'Dell', path: '/laptop/dell', image: '/images/cat-dell.webp', brandQuery: 'Dell' },
    ]
  },
  watch: {
    slug: 'watch',
    banner: {
      title: 'Phong cách và sức khỏe trên cổ tay bạn',
      description: 'Đồng hồ thông minh theo dõi sức khỏe 24/7.',
      badge: 'Mới ra mắt',
      buttonText: 'Xem tất cả đồng hồ',
      image: '/images/hero/watch-hero.png',
    },
    cards: [
      { id: 'apple-watch', label: 'Apple Watch', path: '/watch/apple-watch', image: '/images/cat-apple-watch.webp', brandQuery: 'Apple' },
      { id: 'samsung-watch', label: 'Galaxy Watch', path: '/watch/samsung', image: '/images/cat-galaxy-watch.webp', brandQuery: 'Samsung' },
      { id: 'xiaomi-watch', label: 'Xiaomi Watch', path: '/watch/xiaomi', image: '/images/cat-xiaomi-watch.webp', brandQuery: 'Xiaomi' },
      { id: 'garmin', label: 'Garmin', path: '/watch/garmin', image: '/images/cat-garmin.webp', brandQuery: 'Garmin' },
    ]
  },
  tablet: {
    slug: 'tablet',
    banner: {
      title: 'Màn hình lớn hơn, trải nghiệm tuyệt hơn',
      description: 'iPad và Máy tính bảng cho học tập, giải trí và làm việc.',
      badge: 'Tặng bút cảm ứng',
      buttonText: 'Xem tất cả máy tính bảng',
      image: '/images/hero/tablet-hero.png',
    },
    cards: [
      { id: 'ipad', label: 'iPad', path: '/tablet/ipad', image: '/images/cat-ipad.webp', brandQuery: 'Apple' },
      { id: 'samsung-tablet', label: 'Samsung', path: '/tablet/samsung', image: '/images/cat-samsung-tablet.webp', brandQuery: 'Samsung' },
      { id: 'xiaomi-tablet', label: 'Xiaomi', path: '/tablet/xiaomi', image: '/images/cat-xiaomi-tablet.webp', brandQuery: 'Xiaomi' },
      { id: 'lenovo-tablet', label: 'Lenovo', path: '/tablet/lenovo', image: '/images/cat-lenovo-tablet.webp', brandQuery: 'Lenovo' },
    ]
  }
};
