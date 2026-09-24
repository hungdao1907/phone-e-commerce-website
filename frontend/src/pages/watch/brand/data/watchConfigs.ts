import type { WatchBrandConfig, WatchBrandId } from '../types/watch';

const appleImage = '/images/watch/watch-hero.jpg';
const samsungImage = '/images/watch/se3-hero-watch.png';
const xiaomiImage = '/images/watch/ultra3-hero-alpine-ridge.jpg'; // We reuse an image for now

export const WATCH_BRAND_CONFIGS: Record<WatchBrandId, WatchBrandConfig> = {
  'apple-watch': {
    id: 'apple-watch',
    label: 'Apple Watch',
    eyebrow: 'APPLE WATCH',
    heroTitle: 'Sức khỏe. Kết nối. Phong cách.',
    heroSubtitle: 'Đồng hồ thông minh tiên tiến nhất thế giới, người bạn đồng hành không thể thiếu mỗi ngày.',
    heroImage: appleImage,
    accent: '#000000',
    accentSoft: '#E5E5EA',
    dark: '#1D1D1F',
    allProductsDescription: 'Khám phá tất cả các dòng Apple Watch phù hợp với phong cách và nhu cầu của bạn.',
    experience: {
      eyebrow: 'APPLE WATCH + HEALTH',
      title: 'Tương lai của sức khỏe nằm trên cổ tay bạn.',
      copy: 'Đo điện tâm đồ, theo dõi giấc ngủ, và các chỉ số sức khỏe chuyên sâu mọi lúc mọi nơi.',
      detail: 'Thiết kế để bảo vệ và nâng cao chất lượng cuộc sống của bạn.',
    },
    whyTitle: 'Vì sao chọn Apple Watch',
    whyPillars: [
      { title: 'Sức khỏe', copy: 'Các cảm biến tiên tiến giúp bạn hiểu rõ cơ thể mình hơn bao giờ hết.' },
      { title: 'Kết nối', copy: 'Giữ liên lạc mượt mà ngay cả khi không có iPhone bên cạnh.' },
      { title: 'Hệ sinh thái', copy: 'Tích hợp hoàn hảo với toàn bộ hệ sinh thái thiết bị Apple.' },
    ],
    finalTitle: 'Tìm Apple Watch của bạn.',
    finalCopy: 'Chọn phiên bản phù hợp để bắt đầu hành trình sống khỏe.',
  },
  'samsung': {
    id: 'samsung',
    label: 'Galaxy Watch',
    eyebrow: 'GALAXY WATCH',
    heroTitle: 'Thấu hiểu bản thân. Thay đổi thói quen.',
    heroSubtitle: 'Kết hợp thiết kế cổ điển và các tính năng sức khỏe hiện đại.',
    heroImage: samsungImage,
    accent: '#1428A0',
    accentSoft: '#D6DFFF',
    dark: '#0A1230',
    allProductsDescription: 'Khám phá Galaxy Watch cho một lối sống cân bằng và năng động.',
    experience: {
      eyebrow: 'GALAXY WELLNESS',
      title: 'Đồng hành cùng mọi nhịp đập.',
      copy: 'Phân tích thành phần cơ thể BIA, theo dõi giấc ngủ và cảnh báo nhịp tim.',
      detail: 'Tích hợp mượt mà với điện thoại Galaxy của bạn.',
    },
    whyTitle: 'Vì sao chọn Galaxy Watch',
    whyPillars: [
      { title: 'Thiết kế', copy: 'Kiểu dáng mặt tròn cổ điển, vòng xoay bezel đặc trưng.' },
      { title: 'Sức khỏe', copy: 'Đo huyết áp và điện tâm đồ nhanh chóng, chính xác.' },
      { title: 'Hệ sinh thái', copy: 'Trải nghiệm không giới hạn với hệ sinh thái Galaxy.' },
    ],
    finalTitle: 'Tìm Galaxy Watch của bạn.',
    finalCopy: 'Phong cách trên tay, sức khỏe trong tầm kiểm soát.',
  },
  'xiaomi': {
    id: 'xiaomi',
    label: 'Xiaomi Watch',
    eyebrow: 'XIAOMI WATCH',
    heroTitle: 'Phong cách sống thông minh.',
    heroSubtitle: 'Thiết kế tinh tế, pin bền bỉ và theo dõi sức khỏe toàn diện trong một tầm giá tuyệt vời.',
    heroImage: xiaomiImage,
    accent: '#E5671B',
    accentSoft: '#FFE1CD',
    dark: '#17120E',
    allProductsDescription: 'Khám phá các dòng Xiaomi Watch với thiết kế thể thao và thời trang.',
    experience: {
      eyebrow: 'XIAOMI LIFESTYLE',
      title: 'Luôn kết nối. Luôn khỏe mạnh.',
      copy: 'Hơn 100 chế độ tập luyện, theo dõi oxy trong máu và giấc ngủ liên tục.',
      detail: 'Màn hình AMOLED sắc nét mang đến trải nghiệm thị giác tuyệt vời.',
    },
    whyTitle: 'Vì sao chọn Xiaomi Watch',
    whyPillars: [
      { title: 'Pin trâu', copy: 'Thời lượng pin lên đến 14 ngày, không lo hết pin.' },
      { title: 'Thể thao', copy: 'Đa dạng chế độ tập luyện cho mọi nhu cầu.' },
      { title: 'Giá trị', copy: 'Nhiều tính năng cao cấp nhưng vẫn rất dễ tiếp cận.' },
    ],
    finalTitle: 'Tìm Xiaomi Watch của bạn.',
    finalCopy: 'Sống khỏe hơn và phong cách hơn mỗi ngày.',
  },
};
