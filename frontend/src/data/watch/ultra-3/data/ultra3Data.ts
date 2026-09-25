import {
  Compass,
  Mountain,
  Waves,
  Shield,
  Zap,
  Activity,
  Heart,
  Radio,
  Clock,
  Gauge,
  Wind,
  Volume2,
  Navigation,
  Crosshair,
  Timer,
  Layers,
  Thermometer,
  BellRing,
  BatteryCharging,
  ShieldCheck,
  RotateCcw,
  Headphones,
  LucideIcon,
} from 'lucide-react';

// Spec Item Interface
export interface Ultra3SpecItem {
  name: string;
  value: string;
  sub?: string;
}

export interface Ultra3SpecGroup {
  id: string;
  category: string;
  tabLabel: string;
  icon: LucideIcon;
  items: Ultra3SpecItem[];
}

// 01. HERO DATA
export const ULTRA3_HERO_DATA = {
  eyebrow: 'APPLE WATCH ULTRA 3',
  titleLines: ['Xa hơn.', 'Cao hơn.', 'Sâu hơn.'],
  subtitle: 'Apple Watch Ultra 3. Cho những nơi không có đường tắt.',
  image: '/images/watch/watch-ultra-studio.png',
  bgImage: '/images/watch/ultra3-hero-alpine-ridge.jpg',
  hudSpecs: [
    { label: 'VỎ TITAN', value: '49 mm Grade 5' },
    { label: 'ĐỘ SÁNG', value: '3000 nits' },
    { label: 'ĐỊNH VỊ', value: 'GPS Kép L1 + L5' },
    { label: 'CHỐNG NƯỚC', value: '100m / Lặn 40m' },
  ],
};

// 02. TITANIUM DESIGN & DISPLAY DATA
export const ULTRA3_DESIGN_DATA = {
  sectionId: 'ultra3-design',
  eyebrow: '02 — THIẾT KẾ TITAN & MÀN HÌNH',
  title: 'Một công cụ thực thụ.\nĐược chế tác bằng titan.',
  subtitle:
    'Vỏ titan Grade 5 chuẩn hàng không vũ trụ, mặt kính sapphire phẳng tuyệt đối và độ sáng cực đại 3000 nit thách thức mọi môi trường khắc nghiệt nhất.',
  features: [
    {
      id: 'titanium',
      title: 'Vỏ Titan 49mm Grade 5',
      desc: 'Khung viền nhô cao bảo vệ toàn diện các cạnh của mặt kính sapphire phẳng trước mọi va chạm địa hình hiểm trở.',
      stat: '49 mm',
      tag: 'GRADE 5 TITANIUM',
    },
    {
      id: 'display',
      title: 'Màn hình Retina LTPO3 3000 nit',
      desc: 'Màn hình sáng nhất từng có trên Apple Watch. Dễ dàng đọc mọi thông số sinh tồn dưới ánh nắng chói chang trên đỉnh núi hay sa mạc.',
      stat: '3000 NITS',
      tag: 'ALWAYS-ON RETINA',
    },
    {
      id: 'action-button',
      title: 'Nút Tác Vụ (Action Button)',
      desc: 'Nút bấm vật lý màu cam quốc tế đặc trưng. Tùy biến khởi động bài tập, đánh dấu tọa độ hoặc kích hoạt còi báo chỉ với một chạm.',
      stat: '1 Chạm',
      tag: 'ACTION BUTTON',
    },
    {
      id: 'crown-guard',
      title: 'Digital Crown có gờ bảo vệ',
      desc: 'Đường kính lớn hơn với các rãnh sâu hơn, giúp thao tác xoay cuộn chính xác ngay cả khi bạn đang đeo găng tay dày mùa đông.',
      stat: 'Rugged',
      tag: 'CROWN GUARD',
    },
  ],
};

// 03. PRECISION TRAINING & GPS DATA
export const ULTRA3_TRAINING_DATA = {
  sectionId: 'ultra3-training',
  eyebrow: '03 — LUYỆN TẬP CHÍNH XÁC & GPS',
  title: 'Tập luyện nghiêm túc.\nDữ liệu cũng vậy.',
  subtitle:
    'Hệ thống GPS tần số kép L1 và L5 kết hợp các thuật toán định vị độc quyền cung cấp độ chính xác từng mét ngay giữa rừng rậm và khe núi đá che khuất.',
  metrics: [
    { label: 'ELEVATION', value: '3,842 m', sub: 'Độ cao hiện tại' },
    { label: 'PACE', value: "4'38\" /km", sub: 'Tốc độ trung bình' },
    { label: 'HEART RATE', value: '172 bpm', sub: 'Vùng nhịp tim 4' },
    { label: 'POWER', value: '320 W', sub: 'Công suất chạy bộ' },
  ],
  features: [
    {
      title: 'GPS Tần Số Kép L1/L5 Tiên Tiến',
      desc: 'Tích hợp ăng-ten tùy chỉnh thu nhận đồng thời 2 băng tần vệ tinh, triệt tiêu sai số tín hiệu do vách đá dựng đứng hay nhà cao tầng.',
    },
    {
      title: 'Chỉ Số Chạy Bộ Chuyên Sâu',
      desc: 'Theo dõi độ dài sải chân, thời gian tiếp xúc mặt đất và dao động dọc để tối ưu hóa hiệu suất từng km chạy địa hình.',
    },
    {
      title: 'Vùng Nhịp Tim Tùy Biến',
      desc: 'Tự động tính toán hoặc cá nhân hóa ngưỡng chịu đựng cardio để duy trì sức bền trong các giải siêu marathon (Ultra Marathon).',
    },
  ],
};

// 04. OCEAN, DEPTH & EXPLORATION DATA
export const ULTRA3_OCEAN_DATA = {
  sectionId: 'ultra3-ocean',
  eyebrow: '04 — ĐẠI DƯƠNG, ĐỘ SÂU & THÁM HIỂM',
  title: 'Không chỉ chịu nước.\nĐược sinh ra để xuống sâu.',
  subtitle:
    'Chống nước đến 100m và hỗ trợ lặn giải trí sâu 40m theo tiêu chuẩn EN13319. Tích hợp cảm biến đo độ sâu thời gian thực và đo nhiệt độ nước tức thì.',
  depthStats: [
    { label: 'DEPTH', value: '38.4 M' },
    { label: 'WATER TEMP', value: '21°C' },
    { label: 'DIVE TIME', value: '28:45' },
    { label: 'MAX DEPTH', value: '40.0 M' },
  ],
  tools: [
    {
      name: 'Ứng dụng Oceanic+',
      desc: 'Biến Ultra 3 thành một chiếc máy tính lặn chuyên dụng (dive computer) với thuật toán giảm áp Bühlmann ZHL-16C đáng tin cậy.',
    },
    {
      name: 'Thủy Triều & Dự Báo Sóng',
      desc: 'Theo dõi nhanh 7 ngày thủy triều tại hơn 115.000 bãi biển trên khắp hành tinh trước khi bạn lướt sóng hoặc lặn ngắm san hô.',
    },
    {
      name: 'Tọa Độ La Bàn & Tính Năng Quay Về (Backtrack)',
      desc: 'Tự động ghi lại lộ trình di chuyển bằng GPS trong nền, giúp bạn lần theo dấu vết trở về điểm xuất phát dù mất phương hướng.',
    },
  ],
};

// 05. HEALTH, SAFETY & CONNECTIVITY DATA
export const ULTRA3_HEALTH_SAFETY_DATA = {
  sectionId: 'ultra3-safety',
  eyebrow: '05 — SỨC KHỎE, AN TOÀN & KẾT NỐI',
  title: 'Đi xa hơn.\nNhưng không đơn độc.',
  subtitle:
    'Từ cảm biến sức khỏe tiên tiến theo dõi chỉ số sinh học đến còi báo động khẩn cấp phát ra âm thanh 86dB có thể nghe thấy trong bán kính 180 mét.',
  chapters: {
    health: {
      headline: 'Hiểu cơ thể. Ngay cả khi bạn đang phục hồi.',
      items: [
        { title: 'Điện tâm đồ (ECG)', desc: 'Kiểm tra nhịp xoang hoặc rung nhĩ bất kỳ lúc nào.' },
        { title: 'Chỉ số sinh học & SpO2', desc: 'Đo nồng độ oxy trong máu khi leo núi cao.' },
        { title: 'Theo dõi giấc ngủ sâu', desc: 'Phân tích REM, ngủ cốt lõi và chu kỳ phục hồi.' },
      ],
    },
    safety: {
      headline: 'Có những tín hiệu được tạo ra chỉ để bạn được tìm thấy.',
      sirenDb: '86 dB',
      sirenDistance: '180 m',
      items: [
        { title: 'Còi báo Siren 86dB', desc: 'Chuỗi âm thanh 2 tông độc nhất lặp lại liên tục.' },
        { title: 'Phát hiện ngã & Va chạm', desc: 'Tự động gọi cấp cứu SOS khi có chấn động nghiêm trọng.' },
        { title: 'Đèn pin cực sáng', desc: 'Tăng sáng gấp đôi và có chế độ chớp SOS ban đêm.' },
      ],
    },
    connectivity: {
      headline: 'Rời xa thành phố nhưng luôn giữ kết nối.',
      items: [
        { title: 'Mạng di động Cellular', desc: 'Nghe gọi, nhắn tin và stream nhạc không cần iPhone.' },
        { title: 'Điểm tọa độ khẩn cấp', desc: 'Gửi tọa độ GPS vệ tinh tới người thân khi hết sóng.' },
      ],
    },
  },
};

// 06. ENDURANCE BATTERY & FINAL CTA DATA
export const ULTRA3_BATTERY_CTA_DATA = {
  sectionId: 'ultra3-battery',
  eyebrow: '06 — PIN BỀN BỈ & SỞ HỮU',
  title: '42 giờ.\nVà câu chuyện vẫn chưa kết thúc.',
  subtitle:
    'Thời lượng pin lên đến 42 giờ sử dụng bình thường và lên đến 72 giờ ở Chế độ Nguồn Điện Thấp. Sạc nhanh 15 phút cho 12 giờ sử dụng mạo hiểm.',
  stats: [
    { value: '42 GIỜ', label: 'Sử dụng thông thường liên tục' },
    { value: '72 GIỜ', label: 'Chế độ Nguồn Điện Thấp' },
    { value: '15 PHÚT', label: 'Sạc nhanh dùng đến 12 giờ' },
    { value: '45 PHÚT', label: 'Đạt 80% dung lượng pin' },
  ],
  card: {
    title: 'Apple Watch Ultra 3',
    specs: '49mm • Vỏ Titan Grade 5 • Màn hình Sapphire • Dây Ocean Cam',
    price: '21.999.000đ',
    image: '/images/watch/ultra3-banner-summit.jpg',
    finishes: ['Titan Tự Nhiên', 'Titan Đen Không Gian'],
  },
  trustBadges: [
    {
      icon: ShieldCheck,
      title: 'Bảo hành chính hãng',
      desc: '12 tháng Apple Care',
    },
    {
      icon: RotateCcw,
      title: 'Đổi trả miễn phí',
      desc: 'Trong 14 ngày',
    },
    {
      icon: Headphones,
      title: 'Chuyên gia Ultra',
      desc: 'Tư vấn kỹ thuật 24/7',
    },
  ],
};

// DETAILED SPECIFICATIONS (FOR SPECS MODAL)
export const ULTRA3_SPEC_GROUPS: Ultra3SpecGroup[] = [
  {
    id: 'design',
    category: 'Vỏ Máy & Kích Thước',
    tabLabel: 'Thiết kế',
    icon: Mountain,
    items: [
      {
        name: 'Kích thước vỏ',
        value: '49 x 44 x 14.4 mm',
        sub: 'Trọng lượng: 61.4 g (chưa bao gồm dây đeo)',
      },
      {
        name: 'Chất liệu vỏ',
        value: 'Titanium Grade 5 hàng không vũ trụ',
        sub: 'Khung viền nhô cao bao bọc màn hình sapphire bảo vệ tuyệt đối khỏi va đập',
      },
      {
        name: 'Nút điều khiển',
        value: 'Nút Tác Vụ (Action Button) tùy chỉnh + Digital Crown có gờ bảo vệ + Nút sườn',
        sub: 'Màu cam nổi bật, tích hợp khe loa kép và còi báo động khẩn cấp',
      },
    ],
  },
  {
    id: 'display',
    category: 'Màn Hình & Kính',
    tabLabel: 'Màn hình',
    icon: Gauge,
    items: [
      {
        name: 'Công nghệ màn hình',
        value: 'Retina LTPO3 OLED Always-On',
        sub: 'Độ phân giải 410 x 502 pixel, mật độ 338 ppi, diện tích hiển thị 1185 mm²',
      },
      {
        name: 'Độ sáng cực đại',
        value: '3000 nits (tối đa) — 1 nit (tối thiểu trong đêm)',
        sub: 'Hiển thị sắc nét dưới ánh nắng mặt trời gắt nhất và tự chuyển giao diện đêm Night Mode',
      },
      {
        name: 'Chất liệu mặt kính',
        value: 'Mặt kính tinh thể Sapphire phẳng tuyệt đối',
        sub: 'Chống trầy xước cao nhất trong toàn bộ dòng Apple Watch',
      },
    ],
  },
  {
    id: 'durability',
    category: 'Độ Bền & Khả Năng Lặn',
    tabLabel: 'Lặn & Bền bỉ',
    icon: Waves,
    items: [
      {
        name: 'Chuẩn chống nước',
        value: 'Chống nước 100m theo tiêu chuẩn ISO 22810',
        sub: 'Thích hợp cho các môn thể thao dưới nước tốc độ cao và lướt sóng',
      },
      {
        name: 'Lặn giải trí sâu',
        value: 'Đạt chuẩn EN13319 lặn đến độ sâu 40m',
        sub: 'Cảm biến đo độ sâu với độ chính xác ±1m cùng cảm biến đo nhiệt độ nước',
      },
      {
        name: 'Tiêu chuẩn quân đội',
        value: 'MIL-STD 810H & Chống bụi IP6X',
        sub: 'Thử nghiệm qua độ cao, nhiệt độ khắc nghiệt (-20°C đến 55°C), bụi cát và rung sốc',
      },
    ],
  },
  {
    id: 'gps',
    category: 'Định Vị & Cảm Biến',
    tabLabel: 'GPS & Cảm biến',
    icon: Compass,
    items: [
      {
        name: 'Hệ thống định vị',
        value: 'GPS tần số kép chính xác cao (L1 và L5)',
        sub: 'Kết hợp GLONASS, Galileo, QZSS và BeiDou với thuật toán vệ tinh độc quyền',
      },
      {
        name: 'Còi báo động (Siren)',
        value: '86 decibel, tầm phát âm thanh lên đến 180 mét',
        sub: 'Phát chuỗi âm thanh SOS cứu hộ liên tục trong trường hợp nguy cấp',
      },
      {
        name: 'Cảm biến tích hợp',
        value: 'Độ sâu, Nhiệt độ nước, La bàn, Cao độ kế luôn bật, Con quay hồi chuyển dải động cao',
        sub: 'Cảm biến gia tốc lực cao phục vụ Phát Hiện Va Chạm và Té Ngã',
      },
    ],
  },
  {
    id: 'battery',
    category: 'Pin & Năng Lượng',
    tabLabel: 'Pin',
    icon: BatteryCharging,
    items: [
      {
        name: 'Thời lượng sử dụng bình thường',
        value: 'Lên đến 42 giờ',
        sub: 'Hoạt động cả ngày lẫn đêm qua nhiều buổi tập luyện chuyên sâu',
      },
      {
        name: 'Chế độ Nguồn Điện Thấp',
        value: 'Lên đến 72 giờ',
        sub: 'Tối ưu hóa tần số đọc GPS và nhịp tim cho các cuộc phiêu lưu đường dài',
      },
      {
        name: 'Công nghệ sạc nhanh',
        value: 'Cáp sạc nhanh từ tính USB-C',
        sub: 'Sạc 15 phút cho 12 giờ sử dụng, sạc khoảng 45 phút để đạt 80%',
      },
    ],
  },
  {
    id: 'connectivity',
    category: 'Kết Nối & Sức Khỏe',
    tabLabel: 'Kết nối & Y tế',
    icon: Radio,
    items: [
      {
        name: 'Kết nối mạng',
        value: '4G LTE và UMTS Cellular tích hợp sẵn trên mọi phiên bản',
        sub: 'Wi-Fi 4 (802.11n), Bluetooth 5.3, Chip Ultra Wideband thế hệ 2',
      },
      {
        name: 'Tính năng an toàn',
        value: 'SOS Khẩn Cấp, Cuộc gọi khẩn cấp quốc tế, Phát Hiện Va Chạm, Phát Hiện Té Ngã',
        sub: 'Tính năng Check In cho phép bạn bè theo dõi lộ trình thể thao trực tiếp',
      },
      {
        name: 'Theo dõi sức khỏe',
        value: 'Cảm biến điện học tim (ECG), Cảm biến quang học tim thế hệ 3, Oxy trong máu (SpO2)',
        sub: 'Cảm biến nhiệt độ cơ thể hỗ trợ theo dõi chu kỳ và tình trạng hồi phục',
      },
    ],
  },
];
