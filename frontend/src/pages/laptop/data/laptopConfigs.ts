import type { LaptopBrandConfig, LaptopBrandId } from '../types/laptop';

const appleImage = '/images/laptop/macbook-prototype.svg';
const dellImage = '/images/laptop/dell-xps-prototype.svg';
const asusImage = '/images/laptop/asus-rog-prototype.svg';
const hpImage = '/images/laptop/hp-spectre-prototype.svg';

export const LAPTOP_BRAND_CONFIGS: Record<LaptopBrandId, LaptopBrandConfig> = {
  apple: {
    id: 'apple',
    label: 'MacBook',
    eyebrow: 'MACBOOK PRO & AIR',
    heroTitle: 'Sức mạnh vượt bậc. Thiết kế dẫn đầu.',
    heroSubtitle: 'Trải nghiệm đỉnh cao với Apple Silicon thế hệ mới, màn hình Liquid Retina XDR và thời lượng pin cả ngày.',
    heroImage: appleImage,
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

  dell: {
    id: 'dell',
    label: 'Dell XPS & Alienware',
    eyebrow: 'DELL PRECISION & XPS',
    heroTitle: 'Đỉnh cao chế tác. Tối ưu năng suất AI.',
    heroSubtitle: 'Khung nhôm CNC nguyên khối tinh xảo, màn hình OLED InfinityEdge và sức mạnh xử lý thông minh cùng Intel Core Ultra.',
    heroImage: dellImage,
    accent: '#0284C7',
    accentSoft: '#E0F2FE',
    dark: '#081326',
    allProductsDescription: 'Tuyển tập dòng máy tính xách tay cao cấp Dell XPS và chiến binh Alienware đỉnh cao công nghệ.',
    experience: {
      eyebrow: 'PREMIUM CRAFTSMANSHIP',
      title: 'Chế tác cơ khí chính xác đến từng micromet.',
      copy: 'Từng chi tiết được cắt gọt từ nhôm nguyên khối, chiếu nghỉ tay kính Gorilla Glass và bàn phím cảm ứng hiện đại.',
      detail: 'Hệ thống tản nhiệt buồng hơi tiên tiến giúp máy luôn duy trì hiệu suất ổn định trong nhiều giờ render và gaming.',
    },
    whyTitle: 'Vì sao chọn Dell Laptop',
    whyPillars: [
      { title: 'Màn hình InfinityEdge', copy: 'Viền màn hình siêu mỏng 4 cạnh, tỷ lệ hiển thị 16:10 và chuẩn màu sắc đồ họa chuẩn mực.' },
      { title: 'Thiết kế Vị lai', copy: 'Hàng phím chức năng cảm ứng điện dung và touchpad tàng hình đem lại cảm giác tối giản đẳng cấp.' },
      { title: 'Độ tin cậy Doanh nghiệp', copy: 'Độ bền tiêu chuẩn công nghiệp và chính sách bảo hành Dell ProSupport tận nơi tiện lợi.' },
    ],
    finalTitle: 'Nâng tầm công việc cùng Dell.',
    finalCopy: 'Chọn mẫu laptop Dell phù hợp với định hướng công việc và phong cách của bạn.',
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

  hp: {
    id: 'hp',
    label: 'HP Spectre & OMEN',
    eyebrow: 'HP ELEGANCE & PERFORMANCE',
    heroTitle: 'Vẻ đẹp thanh lịch. Sức mạnh vượt trội.',
    heroSubtitle: 'Kiến trúc xoay gập 360 độ linh hoạt, camera AI thông minh và âm thanh sống động được tinh chỉnh bởi Bang & Olufsen.',
    heroImage: hpImage,
    accent: '#0D9488',
    accentSoft: '#CCFBF1',
    dark: '#081919',
    allProductsDescription: 'Trải nghiệm dòng máy tính doanh nhân HP Spectre x360 đẳng cấp và HP Omen Gaming chuyên nghiệp.',
    experience: {
      eyebrow: 'INTELLIGENT AI COLLABORATION',
      title: 'Trợ lý AI tích hợp sẵn sàng nâng tầm công việc.',
      copy: 'Camera AI tự động theo dõi khuôn mặt, khử nhiễu micro bằng AI hai chiều và tính năng tự động khóa máy khi bạn rời đi.',
      detail: 'Bút cảm ứng stylus độ nhạy cao đi kèm biến chiếc laptop thành bảng vẽ nghệ thuật bất cứ khi nào bạn muốn.',
    },
    whyTitle: 'Vì sao chọn HP Laptop',
    whyPillars: [
      { title: 'Thiết kế Vát cạnh Đá quý', copy: 'Khung nhôm nguyên khối cắt gọt tỉ mỉ mang đến diện mạo độc bản và vô cùng sang trọng.' },
      { title: 'Âm thanh Bang & Olufsen', copy: 'Hệ thống 4 loa đa hướng tái tạo âm trường chi tiết và sống động cho mọi thước phim.' },
      { title: 'Bảo mật HP Wolf Security', copy: 'Bảo vệ dữ liệu toàn diện từ cấp độ phần cứng BIOS đến hệ điều hành ngăn chặn mọi mối đe dọa.' },
    ],
    finalTitle: 'Chọn chiếc laptop HP ưng ý ngay hôm nay.',
    finalCopy: 'Tự tin tỏa sáng trong mọi cuộc họp và tận hưởng hiệu suất làm việc linh hoạt.',
  },
};
