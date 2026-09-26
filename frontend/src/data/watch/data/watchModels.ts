import { WatchModel, WatchFinalModel } from '../../../types/watch/types/watch';

export const WATCH_MODELS_DATA: WatchModel[] = [
  {
    id: 'watch-se-3',
    name: 'Apple Watch SE 3',
    shortName: 'SE 3',
    categoryBadge: 'THIẾT YẾU',
    tagline: 'Đủ tính năng thiết yếu. Dễ tiếp cận nhất.',
    price: '6.390.000₫',
    startingPrice: 'Từ 6.390.000₫',
    image: '/images/watch/watch-se-studio.png',
    route: '/watch/se-3',
    ambientColor: 'rgba(56, 189, 248, 0.08)',
    sizes: ['40mm', '44mm'],
    swatches: [
      { name: 'Starlight', hex: '#E2D7C8' },
      { name: 'Midnight', hex: '#1C232B' },
      { name: 'Silver', hex: '#E3E4E5' },
    ],
    highlights: [
      'Vỏ nhôm tái chế, nhẹ và êm',
      'Chống nước 50m, hỗ trợ SOS',
      'Theo dõi nhịp tim & giấc ngủ',
    ],
  },
  {
    id: 'watch-series-11',
    name: 'Apple Watch Series 11',
    shortName: 'Series 11',
    categoryBadge: 'MỚI NHẤT',
    featured: true,
    tagline: 'Mỏng nhất. Màn hình lớn nhất. Sạc siêu tốc.',
    price: '10.990.000₫',
    startingPrice: 'Từ 10.990.000₫',
    image: '/images/watch/watch-series11-studio.png',
    route: '/watch/series-11',
    ambientColor: 'rgba(0, 113, 227, 0.12)',
    sizes: ['42mm', '46mm'],
    swatches: [
      { name: 'Jet Black', hex: '#0A0A0A' },
      { name: 'Rose Gold', hex: '#ECCEC5' },
      { name: 'Silver', hex: '#E3E4E5' },
      { name: 'Slate Titanium', hex: '#3B3B3E' },
    ],
    highlights: [
      'Màn hình OLED góc rộng cực sáng',
      'Thân vỏ siêu mỏng, sạc siêu tốc',
      'Đo điện tâm đồ (ECG) & độ sâu',
    ],
  },
  {
    id: 'watch-ultra-3',
    name: 'Apple Watch Ultra 3',
    shortName: 'Ultra 3',
    categoryBadge: 'TITANIUM',
    tagline: 'Đỉnh cao thể thao mạo hiểm & khám phá.',
    price: '21.990.000₫',
    startingPrice: 'Từ 21.990.000₫',
    image: '/images/watch/watch-ultra-studio.png',
    route: '/watch/ultra-3',
    ambientColor: 'rgba(245, 158, 11, 0.09)',
    sizes: ['49mm'],
    swatches: [
      { name: 'Natural Titanium', hex: '#979187' },
      { name: 'Black Titanium', hex: '#212124' },
    ],
    highlights: [
      'Vỏ Titan Cấp 5, chống nước 100m',
      'GPS tần số kép & còi SOS 86dB',
      'Pin bền bỉ tới 72 giờ thám hiểm',
    ],
  },
];

export const FINAL_WATCH_MODELS: WatchFinalModel[] = [
  {
    id: 'se-3',
    name: 'Apple Watch SE 3',
    shortName: 'SE 3',
    tagline: 'Đủ mọi điều thiết yếu. Khởi đầu hoàn hảo cho mỗi ngày.',
    startingPrice: 'Từ 6.999.000đ',
    image: '/images/watch/watch-se-studio.png',
    ambientColor: 'rgba(56, 189, 248, 0.08)',
    route: '/watch/se-3',
  },
  {
    id: 'series-11',
    name: 'Apple Watch Series 11',
    shortName: 'Series 11',
    tagline: 'Thấu hiểu cơ thể hơn. Sống chủ động và trọn vẹn hơn.',
    startingPrice: 'Từ 11.499.000đ',
    image: '/images/watch/watch-series11-studio.png',
    ambientColor: 'rgba(0, 113, 227, 0.12)',
    route: '/watch/series-11',
  },
  {
    id: 'ultra-3',
    name: 'Apple Watch Ultra 3',
    shortName: 'Ultra 3',
    tagline: 'Vượt qua mọi giới hạn. Sẵn sàng cho những chuyến phiêu lưu lớn.',
    startingPrice: 'Từ 23.999.000đ',
    image: '/images/watch/watch-ultra-studio.png',
    ambientColor: 'rgba(245, 158, 11, 0.09)',
    route: '/watch/ultra-3',
  },
];

export const getWatchModelById = (id: string): WatchModel | undefined => {
  return WATCH_MODELS_DATA.find((m) => m.id === id || m.id === `watch-${id}`);
};
