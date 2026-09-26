import type { TabletBrandConfig, TabletBrandId } from '../../../types/tablet/types/tablet';

const appleImage = '/images/tablet/ipad-prototype.svg';
const samsungImage = '/images/tablet/galaxy-tab-prototype.svg';
const xiaomiImage = '/images/tablet/xiaomi-pad-prototype.svg';

export const TABLET_BRAND_CONFIGS: Record<TabletBrandId, TabletBrandConfig> = {
  ipad: {
    id: 'ipad',
    label: 'iPad',
    eyebrow: 'IPAD',
    heroTitle: 'Mỏng hơn. Mạnh hơn. Linh hoạt hơn.',
    heroSubtitle: 'Một không gian lớn hơn để học, làm việc, sáng tạo và kết nối theo cách của bạn.',
    heroImage: appleImage,
    accent: '#3E556A',
    accentSoft: '#D8E4ED',
    dark: '#111418',
    allProductsDescription: 'Khám phá những lựa chọn iPad theo cách bạn muốn học, làm việc và sáng tạo.',
    experience: {
      eyebrow: 'IPAD + CREATIVITY',
      title: 'Một mặt phẳng cho mọi ý tưởng.',
      copy: 'Từ phác thảo đến cuộc họp, iPad tạo ra không gian linh hoạt để ý tưởng luôn được tiếp tục.',
      detail: 'Sắp xếp công việc, nội dung và công cụ sáng tạo trong một trải nghiệm nhẹ nhàng.',
    },
    whyTitle: 'Vì sao chọn iPad',
    whyPillars: [
      { title: 'Hiệu năng', copy: 'Trải nghiệm mượt mà cho những tác vụ bạn làm mỗi ngày.' },
      { title: 'Sáng tạo', copy: 'Một không gian tự nhiên để viết, vẽ và phát triển ý tưởng.' },
      { title: 'Hệ sinh thái', copy: 'Làm việc liền mạch cùng các thiết bị và dịch vụ Apple.' },
    ],
    finalTitle: 'Tìm chiếc iPad phù hợp với bạn.',
    finalCopy: 'Chọn một thiết bị phù hợp với cách bạn sống, học tập và sáng tạo.',
  },
  samsung: {
    id: 'samsung',
    label: 'Galaxy Tab',
    eyebrow: 'GALAXY TAB',
    heroTitle: 'Không gian lớn hơn cho mọi ý tưởng.',
    heroSubtitle: 'Kết hợp hiệu năng Galaxy, trải nghiệm bút và đa nhiệm linh hoạt trong một màn hình rộng.',
    heroImage: samsungImage,
    accent: '#506BBA',
    accentSoft: '#D6E1FF',
    dark: '#11141D',
    allProductsDescription: 'Tìm Galaxy Tab phù hợp cho công việc, sáng tạo và thời gian thư giãn của bạn.',
    experience: {
      eyebrow: 'GALAXY MULTITASKING',
      title: 'Nhiều không gian hơn để tạo nên nhiều điều hơn.',
      copy: 'Một màn hình rộng giúp bạn giữ công việc, cảm hứng và kết nối ở cùng một nơi.',
      detail: 'Chuyển đổi giữa ghi chú, nội dung và cuộc trò chuyện với nhịp làm việc tự nhiên.',
    },
    whyTitle: 'Vì sao chọn Galaxy Tab',
    whyPillars: [
      { title: 'Năng suất', copy: 'Mở rộng cách bạn tổ chức và hoàn thành công việc.' },
      { title: 'S Pen', copy: 'Ghi chú, phác thảo và tương tác chính xác theo cách trực quan.' },
      { title: 'Galaxy Ecosystem', copy: 'Kết nối tự nhiên với các thiết bị Galaxy khác.' },
    ],
    finalTitle: 'Tìm Galaxy Tab phù hợp với bạn.',
    finalCopy: 'Chọn cấu hình phù hợp và bắt đầu một không gian làm việc rộng mở hơn.',
  },
  xiaomi: {
    id: 'xiaomi',
    label: 'Xiaomi Pad',
    eyebrow: 'XIAOMI PAD',
    heroTitle: 'Mở rộng cách bạn làm việc và giải trí.',
    heroSubtitle: 'Thiết kế sạch, hiệu năng linh hoạt và màn hình rộng cho nhịp sống hiện đại.',
    heroImage: xiaomiImage,
    accent: '#E5671B',
    accentSoft: '#FFE1CD',
    dark: '#17120E',
    allProductsDescription: 'Khám phá Xiaomi Pad cho học tập, công việc, nội dung và những khoảnh khắc thư giãn.',
    experience: {
      eyebrow: 'WORK + PLAY',
      title: 'Một không gian. Hai nhịp sống.',
      copy: 'Từ một ngày làm việc tập trung đến buổi tối giải trí, Xiaomi Pad giữ mọi thứ liền mạch và nhẹ nhàng.',
      detail: 'Màn hình rộng cùng không gian đa nhiệm giúp chuyển đổi ngữ cảnh thật tự nhiên.',
    },
    whyTitle: 'Vì sao chọn Xiaomi Pad',
    whyPillars: [
      { title: 'Hiệu năng', copy: 'Phản hồi nhanh cho nhịp làm việc và giải trí linh hoạt.' },
      { title: 'Hiển thị', copy: 'Màn hình rộng tạo không gian thoải mái cho nội dung.' },
      { title: 'Đa nhiệm', copy: 'Giữ các việc quan trọng trong cùng một luồng làm việc.' },
    ],
    finalTitle: 'Tìm Xiaomi Pad phù hợp với bạn.',
    finalCopy: 'Chọn chiếc tablet sẵn sàng đồng hành cùng nhịp sống của bạn.',
  },
};
