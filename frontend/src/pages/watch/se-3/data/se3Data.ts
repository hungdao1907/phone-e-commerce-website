import {
  Sun,
  BatteryCharging,
  Disc,
  Shield,
  Moon,
  Heart,
  Sparkles,
  Flame,
  Phone,
  MessageSquare,
  Music,
  Timer,
  Activity,
  Zap,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Watch,
  Layers,
  Cpu,
  HeartPulse,
  Wifi,
  LucideIcon,
} from 'lucide-react';

export interface SE3HeroStat {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}

export interface SE3DesignCard {
  id: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  stat?: string;
  desc: string;
}

export interface SE3HealthMetric {
  id: string;
  icon: LucideIcon;
  title: string;
  value: string;
  status: string;
  accentColor: string;
  type: 'chart' | 'wave' | 'progress';
  progress?: number;
}

export interface SE3ActivityRingData {
  id: 'move' | 'exercise' | 'stand';
  label: string;
  color: string;
  bgTrackColor: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startPercent: number;
  endPercent: number;
}

export interface SE3QuickAppItem {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  badge?: string;
}

export interface SE3TrustBadge {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface SpecItem {
  name: string;
  value: string;
  sub?: string;
}

export interface SpecGroup {
  id: string;
  category: string;
  tabLabel: string;
  icon: LucideIcon;
  items: SpecItem[];
}

// 1. HERO SECTION DATA
export const SE3_HERO_DATA = {
  badge: 'WATCH SE 3',
  titleLine1: 'Một nhịp mới.',
  titleLine2: 'Một lối sống mới.',
  subtitle: 'Mạnh mẽ hơn. Thông minh hơn. Cho mỗi ngày của bạn.',
  image: '/images/watch/se3-hero-watch.png',
  leftStat: {
    label: 'Màn hình sáng hơn',
    value: '25%',
    sub: 'Tối đa 2.000 nit',
    icon: Sun,
  } as SE3HeroStat,
  rightStat: {
    label: 'Pin bền bỉ',
    value: '18 giờ',
    sub: 'Sử dụng cả ngày',
    icon: BatteryCharging,
  } as SE3HeroStat,
};

// 2. DESIGN & DISPLAY DATA (Circular Testimonials & Storytelling)
export interface SE3CircularDesignItem {
  name: string;
  designation: string;
  quote: string;
  src: string;
  badge?: string;
  stat?: string;
  statLabel?: string;
}

export const SE3_CIRCULAR_DESIGN_ITEMS: SE3CircularDesignItem[] = [
  {
    name: 'Màn hình Retina 2.000 nit',
    designation: 'Sáng hơn 25% • Rực rỡ dưới nắng gắt',
    quote:
      'Màn hình Retina OLED với độ sáng đỉnh 2.000 nit mang lại khả năng hiển thị vượt trội ngay cả dưới ánh nắng gắt trực tiếp ban trưa. Mọi chỉ số tập luyện, thông báo và bản đồ định vị đều sắc nét đến từng điểm ảnh.',
    src: '/images/watch/se3-retina-bright.jpg',
    badge: 'RETINA DISPLAY',
    stat: '2.000 nit',
    statLabel: 'Độ sáng đỉnh (Peak)',
  },
  {
    name: 'Màn hình Luôn Bật thế hệ mới',
    designation: 'Luôn sẵn sàng • Không cần nhấc cổ tay',
    quote:
      'Màn hình luôn bật giúp bạn liếc nhanh giờ giấc, vòng hoạt động và dữ liệu sức khỏe quan trọng bất kỳ lúc nào mà không cần chạm vào mặt kính hay xoay cổ tay. Tối ưu năng lượng thông minh suốt cả ngày dài.',
    src: '/images/watch/se3-always-on.jpg',
    badge: 'ALWAYS-ON',
    stat: '1Hz - 60Hz',
    statLabel: 'Tần số quét LTPO',
  },
  {
    name: 'Khung nhôm 100% tái chế',
    designation: 'Mỏng nhẹ hoàn mỹ • Thân thiện môi trường',
    quote:
      'Chế tác chuẩn xác từ hợp kim nhôm hàng không vũ trụ tái chế 100% với độ hoàn thiện tinh xảo. Trọng lượng siêu nhẹ chỉ từ 26.4g, ôm sát cổ tay cho cảm giác êm ái tự nhiên như không có gì suốt ngày dài làm việc lẫn ban đêm theo dõi giấc ngủ.',
    src: '/images/watch/se3-aluminum-chassis.jpg',
    badge: 'AEROSPACE ALUMINUM',
    stat: '26.4g',
    statLabel: 'Trọng lượng siêu nhẹ',
  },
  {
    name: 'Mặt kính Ion-X cường lực',
    designation: 'Chống va đập • Bền bỉ vượt trội',
    quote:
      'Mặt kính Ion-X được tôi luyện nhiệt độ cao giúp gia cố cấu trúc phân tử sâu, tăng cường khả năng chịu lực va đập và chống trầy xước trong mọi hoạt động tập luyện ngoài trời lẫn sinh hoạt thường nhật.',
    src: '/images/watch/se3-ionx-glass.jpg',
    badge: 'DURABILITY',
    stat: 'Ion-X',
    statLabel: 'Kính tôi nhiệt chuyên biệt',
  },
  {
    name: 'Chuẩn kháng nước 50m & Kháng bụi IP6X',
    designation: 'Chuẩn WR50 ISO • Sẵn sàng bơi lội',
    quote:
      'Đạt chuẩn kháng nước 50 mét theo tiêu chuẩn ISO 22810:2010 và chuẩn kháng bụi IP6X, Apple Watch SE 3 tự tin đồng hành cùng bạn từ hồ bơi, biển khơi cho đến các cung đường chạy việt dã bụi bặm nhiều thách thức.',
    src: '/images/watch/se3-water-resistant.jpg',
    badge: 'WATER RESISTANT',
    stat: 'WR50',
    statLabel: 'Kháng nước 50m & Kháng bụi IP6X',
  },
];

export const SE3_DESIGN_DATA = {
  intro: {
    eyebrow: 'THIẾT KẾ & MÀN HÌNH',
    titleLine1: 'Đẹp trong mọi chi tiết.',
    titleLine2: 'Rõ nét mọi khoảnh khắc.',
    subtitle:
      'Màn hình Retina sắc nét với viền siêu mỏng, tối ưu từng điểm ảnh để mang lại trải nghiệm thị giác sống động và chân thực nhất cho nhịp sống thường nhật.',
    image: '/images/watch/se3-intro-watch.jpg',
  },
  bento: {
    brightness: {
      badge: 'ĐỘ SÁNG MÀN HÌNH',
      stat: '25%',
      headline: 'sáng hơn',
      subhead: 'Tối đa 2.000 nit',
      desc: 'Rõ ràng hơn ngoài trời, từ thông báo đến dữ liệu luyện tập.',
      image: '/images/watch/se3-display-macro.jpg',
    },
    alwaysOn: {
      badge: 'ALWAYS-ON DISPLAY',
      title: 'Luôn hiển thị.',
      desc: 'Giờ và thông số thiết yếu luôn sẵn sàng trong tầm mắt.',
      activeStatus: 'Hiển thị đầy đủ',
      alwaysOnStatus: 'Always-On tiết kiệm điện',
    },
    durability: {
      badge: 'ĐƯỢC TẠO RA ĐỂ ĐỒNG HÀNH MỖI NGÀY',
      headline: 'Mỏng. Tinh tế. Bền bỉ.',
      desc: 'Khung nhôm 100% tái chế siêu nhẹ, kết hợp mặt kính cường lực chống va đập.',
      sideImage: '/images/watch/se3-side-profile.jpg',
      specs: [
        { stat: '50m', label: 'Kháng nước', sub: 'Chuẩn WR50 bơi lội' },
        { stat: 'Ion-X', label: 'Mặt kính bền bỉ', sub: 'Chống nứt & trầy xước' },
        { stat: 'IP6X', label: 'Kháng bụi', sub: 'Bảo vệ toàn diện' },
      ],
    },
  },
  // Legacy fallback compatibility
  eyebrow: 'THIẾT KẾ & MÀN HÌNH',
  titleLine1: 'Đẹp trong mọi chi tiết.',
  titleLine2: 'Rõ nét mọi khoảnh khắc.',
  subtitle:
    'Màn hình Retina sắc nét với viền siêu mỏng, tối ưu từng điểm ảnh để mang lại trải nghiệm thị giác sống động và chân thực nhất.',
  image: '/images/watch/se3-intro-watch.jpg',
  cards: [
    {
      id: 'brightness',
      icon: Sun,
      iconColor: '#38bdf8',
      title: 'Sáng hơn 25%',
      stat: '2.000 nit',
      desc: 'Rực rỡ rõ nét ngay cả dưới ánh nắng chói chang nhất.',
    },
    {
      id: 'always-on',
      icon: Disc,
      iconColor: '#a855f7',
      title: 'Màn hình Always-On',
      desc: 'Thông tin quan trọng luôn sẵn sàng trong tầm mắt.',
    },
    {
      id: 'durability',
      icon: Shield,
      iconColor: '#e2e8f0',
      title: 'Thiết kế bền bỉ',
      desc: 'Khung nhôm siêu nhẹ, kính Ion-X, chống nước 50m.',
    },
  ] as SE3DesignCard[],
};

// 3. HEALTH & RECOVERY DATA
export interface SE3HealthSlideItem {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  thumbnail?: string;
  stat?: string;
  statLabel?: string;
  accentColor?: string;
}

export const SE3_HEALTH_SLIDER_ITEMS: SE3HealthSlideItem[] = [
  {
    id: 'sleep',
    title: 'Theo dõi & Phân tích Giấc ngủ chuyên sâu',
    category: 'GIẤC NGỦ & PHỤC HỒI',
    description:
      'Ghi nhận chính xác các giai đoạn ngủ REM, ngủ cốt lõi (Core) và ngủ sâu (Deep). Phân tích xu hướng chất lượng nghỉ ngơi giúp bạn hình thành thói quen ngủ khoa học và tái tạo năng lượng hoàn hảo.',
    image: '/images/watch/se3-health-sleep.jpg',
    stat: '7h 45m',
    statLabel: 'Thời lượng ngủ tối ưu',
    accentColor: '#a855f7',
  },
  {
    id: 'heart',
    title: 'Cảm biến Nhịp tim & Thông báo bất thường',
    category: 'SỨC KHỎE TIM MẠCH',
    description:
      'Cảm biến quang học đo nhịp tim liên tục cả ngày lẫn đêm. Nhận thông báo kịp thời khi nhịp tim tăng cao hoặc xuống thấp bất thường, đồng thời theo dõi sát sao biểu đồ BPM trong mọi buổi tập thể thao.',
    image: '/images/watch/se3-health-heart.jpg',
    stat: '138 BPM',
    statLabel: 'Nhịp tim khi vận động',
    accentColor: '#ef4444',
  },
  {
    id: 'vitals',
    title: 'Ứng dụng Sinh hiệu Vitals & Xu hướng Thể chất',
    category: 'SINH HIỆU QUA ĐÊM',
    description:
      'Tổng hợp các chỉ số sức khỏe chủ chốt qua đêm như nhiệt độ cổ tay, nhịp hô hấp và nhịp tim nghỉ ngơi. Dễ dàng nhận biết sớm các thay đổi của cơ thể khi bị căng thẳng, tập luyện quá sức hay cảm sốt.',
    image: '/images/watch/se3-health-vitals.jpg',
    stat: 'Đạt chuẩn',
    statLabel: 'Tất cả chỉ số ổn định',
    accentColor: '#06b6d4',
  },
  {
    id: 'workout',
    title: '3 Vòng Hoạt động & Đa dạng Bài tập Luyện',
    category: 'THỂ DỤC & HOẠT ĐỘNG',
    description:
      'Khép 3 vòng Di chuyển, Tập luyện và Đứng mỗi ngày để duy trì động lực vận động. Khám phá hàng chục môn thể thao từ chạy bộ, đạp xe, bơi lội đến bài tập sức mạnh với dữ liệu đo lường chuẩn xác.',
    image: '/images/watch/se3-health-workout.jpg',
    stat: '650 / 600 kcal',
    statLabel: 'Mục tiêu hoàn thành',
    accentColor: '#22c55e',
  },
  {
    id: 'safety',
    title: 'An toàn tối đa với Phát hiện Va chạm & Té ngã',
    category: 'AN TOÀN & CỨU HỘ',
    description:
      'Cảm biến gia tốc lực G cao và thuật toán thông minh phát hiện các cú té ngã nặng hoặc va chạm ô tô nghiêm trọng. Tự động đếm ngược và kết nối các dịch vụ cứu hộ khẩn cấp SOS khi bạn cần trợ giúp nhất.',
    image: '/images/watch/se3-health-safety.jpg',
    stat: 'SOS 24/7',
    statLabel: 'Phát hiện sự cố tức thì',
    accentColor: '#f97316',
  },
];

export const SE3_HEALTH_DATA = {
  eyebrow: 'SỨC KHỎE & THỂ CHẤT',
  titleLine1: 'Lắng nghe cơ thể bạn.',
  titleLine2: 'Sống khỏe mỗi ngày.',
  description:
    'Theo dõi giấc ngủ, nhịp tim và mức độ vận động với độ chính xác cao. Dữ liệu trực quan, dễ hiểu giúp bạn nâng cao thể lực và đưa ra các lựa chọn lành mạnh hơn mỗi ngày.',
  image: '/images/watch/se3-health-lifestyle.png',
  metrics: [
    {
      id: 'sleep',
      icon: Moon,
      title: 'Giấc ngủ',
      value: '7 giờ 45 phút',
      status: 'Ngủ tốt',
      accentColor: '#8b5cf6',
      type: 'chart',
    },
    {
      id: 'heart',
      icon: Heart,
      title: 'Nhịp tim',
      value: '68 bpm',
      status: 'Trong mức ổn định',
      accentColor: '#ef4444',
      type: 'wave',
    },
    {
      id: 'recovery',
      icon: Sparkles,
      title: 'Phục hồi',
      value: '85%',
      status: 'Sẵn sàng cho ngày mới',
      accentColor: '#06b6d4',
      type: 'progress',
      progress: 85,
    },
    {
      id: 'activity',
      icon: Flame,
      title: 'Vận động',
      value: '560 kcal',
      status: 'Mục tiêu đạt 93%',
      accentColor: '#22c55e',
      type: 'progress',
      progress: 93,
    },
  ] as SE3HealthMetric[],
};

// 4. FITNESS & EVERYDAY INTELLIGENCE DATA (Interactive Storytelling)
export const SE3_FITNESS_INTELLIGENCE_DATA = {
  intro: {
    eyebrow: 'TẬP LUYỆN',
    titleLine1: 'Năng động hơn.',
    titleLine2: 'Thông minh hơn mỗi ngày.',
    description:
      'Từ mỗi buổi tập đến những thao tác nhỏ trong ngày, Apple Watch SE 3 luôn theo kịp bạn.',
    bgImage: '/images/watch/se3-health-workout.jpg',
  },
  workout: {
    eyebrow: 'TẬP LUYỆN',
    title: 'Theo Dõi Tập Luyện Tức Thì',
    subtitle: 'Mô phỏng dữ liệu thực tế thu thập liên tục trong lúc bạn chạy.',
    telemetry: [
      {
        id: 'distance',
        label: '5.24 KM',
        value: '5.24',
        unit: 'KM',
        sub: 'Quãng đường',
        accentColor: '#38bdf8',
      },
      {
        id: 'pace',
        label: "5'18\"/KM",
        value: "5'18\"",
        unit: '/KM',
        sub: 'Pace trung bình',
        accentColor: '#fbbf24',
      },
      {
        id: 'heartRate',
        label: '168 BPM',
        value: '168',
        unit: 'BPM',
        sub: 'Nhịp tim',
        accentColor: '#fa114f',
      },
      {
        id: 'time',
        label: '27:46',
        value: '27:46',
        unit: 'PHÚT',
        sub: 'Thời gian',
        accentColor: '#34d399',
      },
    ],
  },
  rings: {
    eyebrow: 'HOẠT ĐỘNG',
    badge: '3 VÒNG HOẠT ĐỘNG',
    headlineLine1: 'Mỗi chuyển động.',
    headlineLine2: 'Đều được ghi nhận.',
    description:
      'Theo dõi hoạt động trong ngày và xem bạn còn bao xa để hoàn thành các vòng.',
    items: [
      {
        id: 'move',
        label: 'Di chuyển',
        color: '#fa114f',
        bgTrackColor: 'rgba(250, 17, 79, 0.22)',
        currentValue: 560,
        targetValue: 650,
        unit: 'CAL',
        startPercent: 42,
        endPercent: 87,
      },
      {
        id: 'exercise',
        label: 'Thể dục',
        color: '#a1ff00',
        bgTrackColor: 'rgba(161, 255, 0, 0.22)',
        currentValue: 23,
        targetValue: 30,
        unit: 'PHÚT',
        startPercent: 38,
        endPercent: 76,
      },
      {
        id: 'stand',
        label: 'Đứng',
        color: '#00f0ff',
        bgTrackColor: 'rgba(0, 240, 255, 0.22)',
        currentValue: 11,
        targetValue: 12,
        unit: 'GIỜ',
        startPercent: 65,
        endPercent: 92,
      },
    ] as SE3ActivityRingData[],
  },
  everyday: {
    eyebrow: 'THÔNG MINH MỖI NGÀY',
    headlineLine1: 'Ít thao tác hơn.',
    headlineLine2: 'Làm được nhiều hơn.',
    description:
      'Trả lời nhanh cuộc gọi bằng Double Tap, dọn thông báo với Wrist Flick, hay xem thẻ Smart Stack tiện lợi trong nháy mắt.',
    incomingCaller: 'Minh',
    callerPhone: 'iPhone • Cuộc gọi đến',
    connectedText: 'Đang kết nối • 00:01',
    quickApps: [
      { id: 'call', label: 'Cuộc gọi', sub: 'Chạm đúp nghe tức thì', icon: Phone },
      { id: 'message', label: 'Tin nhắn', sub: 'Trả lời nhanh văn bản', icon: MessageSquare },
      { id: 'smartstack', label: 'Smart Stack', sub: 'Ngăn xếp ngữ cảnh', icon: Layers },
      { id: 'music', label: 'Âm nhạc', sub: 'Phát trực tiếp tai nghe', icon: Music },
      { id: 'timer', label: 'Hẹn giờ', sub: 'Bấm giờ nấu nướng & tập', icon: Timer },
    ] as SE3QuickAppItem[],
  },
};

// 5. FINAL CTA DATA
export const SE3_FINAL_CTA_DATA = {
  title: 'Bắt đầu nhịp mới.',
  subtitle: 'Chiếc đồng hồ dành cho một phiên bản tốt hơn của bạn.',
  card: {
    title: 'Apple Watch SE 3',
    specs: 'GPS • 44mm • Vỏ nhôm • Dây thể thao',
    price: '6.999.000đ',
    image: '/images/watch/se3-lifestyle-panorama-card.png',
  },
  trustBadges: [
    {
      icon: ShieldCheck,
      title: 'Bảo hành chính hãng',
      desc: '12 tháng',
    },
    {
      icon: RotateCcw,
      title: 'Đổi trả dễ dàng',
      desc: 'Trong 14 ngày',
    },
    {
      icon: Headphones,
      title: 'Hỗ trợ chuyên gia',
      desc: '24/7',
    },
  ] as SE3TrustBadge[],
};

// 6. DETAILED SPECIFICATIONS (FOR SPECS MODAL)
export const SE3_SPEC_GROUPS: SpecGroup[] = [
  {
    id: 'design',
    category: 'Thiết Kế & Kích Thước',
    tabLabel: 'Thiết kế',
    icon: Watch,
    items: [
      {
        name: 'Kích thước vỏ',
        value: '40 mm hoặc 44 mm',
        sub: '40 x 34 x 10.7 mm (40mm) · 44 x 38 x 10.7 mm (44mm)',
      },
      {
        name: 'Trọng lượng vỏ',
        value: '26.4g (40mm) / 32.9g (44mm)',
        sub: 'Thiết kế mỏng nhẹ, tối ưu cho hoạt động thể thao hằng ngày',
      },
      {
        name: 'Vật liệu chế tác',
        value: 'Nhôm tái chế 100% thân thiện môi trường',
        sub: 'Mặt sau chế tác từ vật liệu composite sợi nylon đồng màu tinh tế',
      },
      {
        name: 'Kháng nước',
        value: 'Chống nước 50m (ISO 22810:2010)',
        sub: 'Thoải mái bơi lội ở vùng nước nông như bể bơi hoặc bãi biển',
      },
    ],
  },
  {
    id: 'display',
    category: 'Màn Hình Retina Sắc Nét',
    tabLabel: 'Màn hình',
    icon: Layers,
    items: [
      {
        name: 'Công nghệ màn hình',
        value: 'Màn hình Retina OLED LTPO',
        sub: 'Không gian hiển thị rộng rãi hơn 20% so với thế hệ trước',
      },
      {
        name: 'Độ sáng màn hình',
        value: 'Độ sáng đỉnh 2.000 nits (Sáng hơn 25%)',
        sub: 'Đọc rõ thông tin ngay cả dưới ánh nắng gay gắt ban trưa',
      },
      {
        name: 'Mặt kính bảo vệ',
        value: 'Kính cường lực Ion-X gia cường',
        sub: 'Chống trầy xước, nứt vỡ trong các va đập hàng ngày',
      },
    ],
  },
  {
    id: 'performance',
    category: 'Hiệu Năng & Vi Xử Lý',
    tabLabel: 'Hiệu năng',
    icon: Cpu,
    items: [
      {
        name: 'Bộ xử lý (SiP)',
        value: 'Apple S9 SiP lõi kép 64-bit',
        sub: 'Tăng tốc độ xử lý nhanh hơn 20%, hỗ trợ phản hồi mượt mà',
      },
      {
        name: 'Dung lượng lưu trữ',
        value: '32 GB',
        sub: 'Lưu trữ thoải mái podcast, ứng dụng và bài hát nghe ngoại tuyến',
      },
      {
        name: 'Cử chỉ điều khiển',
        value: 'Digital Crown với phản hồi xúc giác Haptic',
        sub: 'Thao tác điều hướng mượt mà, phản hồi chân thực',
      },
    ],
  },
  {
    id: 'battery',
    category: 'Thời Lượng Pin & Sạc',
    tabLabel: 'Pin',
    icon: BatteryCharging,
    items: [
      {
        name: 'Thời lượng sử dụng',
        value: 'Lên đến 18 giờ (Cả ngày dài)',
        sub: 'Đủ năng lượng cho ngày dài làm việc, tập luyện và theo dõi giấc ngủ',
      },
      {
        name: 'Chế độ nguồn điện thấp',
        value: 'Lên đến 32 giờ',
        sub: 'Kéo dài thời gian dùng pin khi đi công tác hoặc du lịch',
      },
      {
        name: 'Phương thức sạc',
        value: 'Cáp sạc nhanh từ tính USB-C',
        sub: 'Sạc tiện lợi, kết nối nam châm tự căn chỉnh chắc chắn',
      },
    ],
  },
  {
    id: 'health',
    category: 'Sức Khỏe & An Toàn',
    tabLabel: 'Sức khỏe',
    icon: HeartPulse,
    items: [
      {
        name: 'Cảm biến nhịp tim',
        value: 'Cảm biến quang học đo nhịp tim thế hệ 2',
        sub: 'Thông báo nhịp tim cao, thấp bất thường và thông báo nhịp không đều',
      },
      {
        name: 'Theo dõi giấc ngủ',
        value: 'Giai đoạn ngủ: REM, Core, Deep',
        sub: 'Thống kê thời lượng ngủ và đánh giá chất lượng giấc ngủ',
      },
      {
        name: 'Tính năng an toàn',
        value: 'Phát hiện ngã & Phát hiện va chạm xe',
        sub: 'Tự động gọi cứu hộ và gửi vị trí khẩn cấp khi gặp sự cố nghiêm trọng',
      },
    ],
  },
  {
    id: 'connectivity',
    category: 'Kết Nối & Âm Thanh',
    tabLabel: 'Kết nối',
    icon: Wifi,
    items: [
      {
        name: 'Kết nối không dây',
        value: 'Wi-Fi 802.11b/g/n 2.4GHz, Bluetooth 5.3',
        sub: 'GPS, GLONASS, Galileo và QZSS tích hợp độ chính xác cao',
      },
      {
        name: 'Tùy chọn Cellular',
        value: 'GPS + Cellular (eSIM độc lập)',
        sub: 'Nghe gọi, nhắn tin độc lập không cần mang theo iPhone',
      },
      {
        name: 'Âm thanh',
        value: 'Loa ngoài tích hợp & Micrô đàm thoại',
        sub: 'Đàm thoại trong trẻo với tính năng khử ồn gió',
      },
    ],
  },
];

// ============================================================
// 6. BATTERY, CONNECTIVITY & SAFETY DATA
// ============================================================
export interface SE3BatteryStat {
  id: string;
  number: string;
  unit: string;
  label: string;
  sub: string;
  accentColor: string;
  eyebrow?: string;
  highlight?: string;
}

export interface SE3ConnectivityApp {
  id: string;
  label: string;
  icon: LucideIcon;
  angle: number; // degrees around center watch
  radius: number; // px offset from center
  color: string;
  sub?: string;
}

export interface SE3SafetyFeature {
  id: string;
  title: string;
  sub: string;
  icon: LucideIcon;
}

export const SE3_BATTERY_CONNECTIVITY_SAFETY_DATA = {
  sectionEyebrow: 'BATTERY & CONNECTIVITY & SAFETY',
  headlineLine1: 'Luôn sẵn sàng.',
  headlineLine2: 'Luôn bên bạn.',
  subheadline: 'Pin cả ngày, kết nối ngay trên cổ tay và những tính năng an toàn luôn sẵn sàng khi bạn cần.',

  // Chapter 01 — Battery
  battery: {
    eyebrow: '01 — BATTERY',
    headline: '18 giờ pin.',
    headlineSub: 'Pin dùng cả ngày.',
    description: 'Đủ sức đi cùng bạn suốt một ngày dài — từ buổi tập sáng sớm đến cuối buổi tối.',
    stats: [
      {
        id: 'fastcharge',
        number: '15',
        unit: 'PHÚT',
        label: 'Sạc nhanh → đến 8 giờ dùng',
        sub: 'Chỉ 15 phút sạc nhanh mang lại thêm 8 giờ sử dụng, kịp giờ ra ngoài hay trước khi ngủ.',
        accentColor: '#06b6d4',
        eyebrow: 'SẠC NHANH',
        highlight: '15 PHÚT',
      },
      {
        id: 'allday',
        number: '18',
        unit: 'GIỜ',
        label: 'Cả ngày',
        sub: 'Lên đến 18 giờ',
        accentColor: '#3b82f6',
        eyebrow: 'SỬ DỤNG THÔNG THƯỜNG',
        highlight: 'Cả ngày',
      },
      {
        id: 'lowpower',
        number: '32',
        unit: 'GIỜ',
        label: '32 giờ',
        sub: 'Khi bạn cần lâu hơn',
        accentColor: '#a855f7',
        eyebrow: 'NGUỒN ĐIỆN THẤP',
        highlight: '32 GIỜ',
      },
    ] as SE3BatteryStat[],
  },

  // Chapter 02 — Connectivity
  connectivity: {
    eyebrow: '02 — CONNECTIVITY',
    headline: 'Ra ngoài.',
    headlineSub: 'Vẫn kết nối.',
    description: 'Để iPhone ở nhà. Apple Watch SE 3 Cellular giữ cho bạn luôn kết nối, nghe nhạc và nhận chỉ đường ngay trên cổ tay.',
    apps: [
      { id: 'calls', label: 'Cuộc gọi', icon: Phone, angle: -90, radius: 180, color: '#34d399', sub: 'Gọi điện trực tiếp' },
      { id: 'messages', label: 'Tin nhắn', icon: MessageSquare, angle: -25, radius: 195, color: '#38bdf8', sub: 'Soạn tin & thông báo' },
      { id: 'maps', label: 'Bản đồ', icon: Layers, angle: 35, radius: 185, color: '#f59e0b', sub: 'Chỉ đường cổ tay' },
      { id: 'music', label: 'Âm nhạc', icon: Music, angle: 95, radius: 180, color: '#ec4899', sub: 'Nghe nhạc trực tuyến' },
      { id: 'pay', label: 'Apple Pay', icon: Wifi, angle: 155, radius: 190, color: '#a855f7', sub: 'Chạm thanh toán' },
    ] as SE3ConnectivityApp[],
  },

  // Chapter 03 — Safety
  safety: {
    eyebrow: '03 — SAFETY',
    headline: 'Có những tính năng',
    headlineSub: 'bạn hy vọng sẽ không bao giờ cần.',
    description: 'Nhưng nếu cần — Apple Watch SE 3 luôn ở đó để bảo vệ bạn.',
    conclusion: 'Luôn sẵn sàng. Ngay cả trong những khoảnh khắc bạn không dự đoán trước.',
    features: [
      {
        id: 'fall',
        title: 'Phát Hiện Ngã',
        sub: 'Tự động gọi cấp cứu nếu bạn không phản hồi sau 1 phút',
        icon: Shield,
      },
      {
        id: 'crash',
        title: 'Phát Hiện Va Chạm',
        sub: 'Nhận biết tai nạn xe nghiêm trọng và gửi vị trí GPS cho dịch vụ khẩn cấp',
        icon: ShieldCheck,
      },
      {
        id: 'sos',
        title: 'SOS Khẩn Cấp',
        sub: 'Giữ nút bên để kết nối ngay với trung tâm khẩn cấp địa phương',
        icon: HeartPulse,
      },
    ] as SE3SafetyFeature[],
  },
};

