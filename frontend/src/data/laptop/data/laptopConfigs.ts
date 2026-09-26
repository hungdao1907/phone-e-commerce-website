import type { LaptopBrandConfig, LaptopBrandId } from '../../../types/laptop/types/laptop';

const macbookImage = '/images/laptop/macbook-prototype.svg';
const lenovoImage = '/images/laptop/dell-xps-prototype.svg'; // Reuse image temporarily or until proper asset is available
const asusImage = '/images/laptop/asus-rog-prototype.svg';

export const LAPTOP_BRAND_CONFIGS: Record<LaptopBrandId, LaptopBrandConfig> = {
  macbook: {
    id: 'macbook',
    label: 'MacBook',
    eyebrow: 'MACBOOK PRO & AIR',
    heroTitle: 'Sức mạnh vượt bậc. Thiết kế dẫn đầu.',
    heroSubtitle: 'Trải nghiệm đỉnh cao với Apple Silicon thế hệ mới, màn hình Liquid Retina XDR và thời lượng pin cả ngày.',
    heroImage: macbookImage,
    accent: '#2563EB',
    accentSoft: '#DBEAFE',
    dark: '#0B132B',
    allProductsDescription: 'Khám phá thế hệ MacBook Pro và MacBook Air với chip M-Series đáp ứng mọi nhu cầu làm việc và sáng tạo.',
    experience: {
      eyebrow: 'APPLE SILICON ARCHITECTURE',
      title: 'Hiệu năng đột phá trên từng watt điện.',
      copy: 'Sự kết hợp giữa kiến trúc CPU, GPU và bộ nhớ Unified Memory đem lại tốc độ xử lý nhanh đến khó tin mà vẫn vận hành êm ái.',
      detail: 'Tối ưu hoàn hảo giữa phần cứng và macOS cho quy trình làm việc liền mạch và an toàn.',
    },
    whyTitle: 'Vì sao chọn MacBook',
    whyPillars: [
      { title: 'Apple Silicon', copy: 'Tối ưu sức mạnh xử lý và tiết kiệm pin vượt trội trên mọi tác vụ nặng.' },
      { title: 'Liquid Retina XDR', copy: 'Độ sáng cực đại 1600 nits, dải màu P3 sống động và tần số quét ProMotion 120Hz.' },
      { title: 'Hệ sinh thái Liền mạch', copy: 'Làm việc đồng bộ tức thì cùng iPhone, iPad và Apple Watch qua AirDrop, Handoff.' },
    ],
    finalTitle: 'Tìm chiếc MacBook hoàn hảo cho bạn.',
    finalCopy: 'Sẵn sàng chinh phục mọi ý tưởng với hiệu năng đột phá và thiết kế chuẩn mực.',
  },

  lenovo: {
    id: 'lenovo',
    label: 'Lenovo ThinkPad & Legion',
    eyebrow: 'LENOVO BUSINESS & GAMING',
    heroTitle: 'Đỉnh cao chế tác. Tối ưu năng suất.',
    heroSubtitle: 'Sự kết hợp hoàn hảo giữa độ bền bỉ doanh nghiệp và sức mạnh vượt trội cho mọi nhu cầu.',
    heroImage: lenovoImage,
    accent: '#0284C7',
    accentSoft: '#E0F2FE',
    dark: '#081326',
    allProductsDescription: 'Tuyển tập dòng máy tính xách tay cao cấp Lenovo ThinkPad và chiến binh Legion đỉnh cao công nghệ.',
    experience: {
      eyebrow: 'PREMIUM CRAFTSMANSHIP',
      title: 'Thiết kế bền bỉ, bàn phím trứ danh.',
      copy: 'Trải nghiệm gõ phím tốt nhất thế giới trên ThinkPad cùng hệ thống tản nhiệt tiên tiến trên dòng Legion.',
      detail: 'Hoàn hảo cho mọi nhu cầu từ làm việc văn phòng chuyên nghiệp đến gaming cấu hình cao.',
    },
    whyTitle: 'Vì sao chọn Lenovo Laptop',
    whyPillars: [
      { title: 'Độ bền tiêu chuẩn', copy: 'Vượt qua hàng loạt bài kiểm tra độ bền quân sự MIL-STD đảm bảo hoạt động ổn định trong mọi điều kiện.' },
      { title: 'Bàn phím hoàn hảo', copy: 'Hành trình phím sâu, độ nảy tốt và TrackPoint đặc trưng mang lại trải nghiệm nhập liệu tuyệt vời.' },
      { title: 'Đa dạng tùy chọn', copy: 'Từ mỏng nhẹ di động, màn hình gập đột phá đến cấu hình gaming mạnh mẽ.' },
    ],
    finalTitle: 'Nâng tầm công việc cùng Lenovo.',
    finalCopy: 'Chọn mẫu laptop Lenovo phù hợp với định hướng công việc và phong cách của bạn.',
  },

  asus: {
    id: 'asus',
    label: 'ASUS ROG & ZenBook',
    eyebrow: 'ASUS INNOVATION & ROG',
    heroTitle: 'Bứt phá giới hạn. Định hình tương lai.',
    heroSubtitle: 'Công nghệ màn hình OLED đỉnh cao, đồ họa NVIDIA RTX thế hệ mới cùng DNA gaming ROG thống lĩnh mọi đấu trường.',
    heroImage: asusImage,
    accent: '#E11D48',
    accentSoft: '#FFE4E6',
    dark: '#140818',
    allProductsDescription: 'Khám phá dải sản phẩm ASUS ZenBook mỏng nhẹ sang trọng và ROG Gaming dẫn đầu hiệu năng.',
    experience: {
      eyebrow: 'ROG INTELLIGENT COOLING',
      title: 'Tản nhiệt buồng hơi và kim loại lỏng cực hạn.',
      copy: 'Trang bị quạt Arc Flow thế hệ mới và hợp chất tản nhiệt kim loại lỏng Conductonaut Extreme giúp CPU & GPU bung trọn công suất.',
      detail: 'Công nghệ chuyển đổi MUX Switch và NVIDIA Advanced Optimus tối ưu hóa từng khung hình FPS trong game.',
    },
    whyTitle: 'Vì sao chọn ASUS',
    whyPillars: [
      { title: 'Màn hình Lumina OLED', copy: 'Tần số quét lên đến 240Hz, chuẩn màu 100% DCI-P3 và độ tương phản tuyệt đối 1.000.000:1.' },
      { title: 'Hiệu năng Gaming ROG', copy: 'Card đồ họa RTX 40-Series công suất TGP tối đa cho trải nghiệm ray tracing mượt mà.' },
      { title: 'Đột phá Thiết kế', copy: 'Bàn phím cơ chế nâng AAS Ultra, dải đèn AniMe Matrix và khung máy hợp kim nhôm-magiê siêu nhẹ.' },
    ],
    finalTitle: 'Sở hữu cỗ máy ASUS mạnh mẽ nhất.',
    finalCopy: 'Sẵn sàng bứt phá hiệu năng và tận hưởng thế giới giải trí đỉnh cao.',
  },
};
