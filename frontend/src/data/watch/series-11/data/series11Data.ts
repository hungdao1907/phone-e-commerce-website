export interface Series11ColorOption {
  id: string;
  name: string;
  material: string;
  hex: string;
  image: string;
}

export interface Series11SpecHighlight {
  label: string;
  value: string;
  desc: string;
}

export interface Series11HealthPanel {
  id: 'heart' | 'sleep' | 'recovery';
  tag: string;
  title: string;
  headline: string;
  description: string;
  stats: string;
  image: string;
  points: string[];
}

export interface Series11FitnessFeature {
  title: string;
  desc: string;
  iconName: string;
}

export interface Series11SmartFeature {
  title: string;
  desc: string;
  iconName: string;
}

export const SERIES_11_COLOR_OPTIONS: Series11ColorOption[] = [
  {
    id: 'jet-black',
    name: 'Jet Black (Đen Bóng)',
    material: 'Vỏ Nhôm Đánh Bóng',
    hex: '#0A0A0A',
    image: '/images/watch/watch-series11-studio.png',
  },
  {
    id: 'silver',
    name: 'Silver (Bạc)',
    material: 'Vỏ Nhôm Phay Xước',
    hex: '#E3E4E5',
    image: '/images/watch/watch-series11-silver-studio.png',
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold (Vàng Hồng)',
    material: 'Vỏ Nhôm Tinh Tế',
    hex: '#ECCEC5',
    image: '/images/watch/watch-titanium-gold.png',
  },
  {
    id: 'slate-titanium',
    name: 'Slate Titanium (Titan Xám Đậm)',
    material: 'Titan Hàng Không Vũ Trụ Cấp 5',
    hex: '#3B3B3E',
    image: '/images/watch/watch-titanium-slate.png',
  },
];

export const SERIES_11_DESIGN_HIGHLIGHTS: Series11SpecHighlight[] = [
  {
    label: 'ĐỘ MỎNG VƯỢT BẬC',
    value: '9.7 mm',
    desc: 'Mỏng hơn gần 10% so với thế hệ tiền nhiệm, cảm giác đeo nhẹ êm tựa như không.',
  },
  {
    label: 'MÀN HÌNH OLED GÓC RỘNG',
    value: '+40%',
    desc: 'Độ sáng vượt trội khi nhìn nghiêng, tối ưu không gian hiển thị tới từng góc cạnh.',
  },
  {
    label: 'KÍCH THƯỚC TÙY CHỌN',
    value: '42mm · 46mm',
    desc: 'Hai kích thước hoàn hảo, tương thích trọn vẹn với toàn bộ bộ sưu tập dây đeo.',
  },
];

export const SERIES_11_HEALTH_PANELS: Series11HealthPanel[] = [
  {
    id: 'heart',
    tag: 'TIM MẠCH & ECG',
    title: 'Cảm Biến Điện Tâm Đồ Thế Hệ Mới',
    headline: 'Nhịp tim của bạn, luôn được lắng nghe.',
    description:
      'Chủ động ghi nhận kết quả điện tâm đồ (ECG) tương đương bản ghi ECG một đạo trình. Hệ thống tự động cảnh báo khi phát hiện nhịp tim bất thường hoặc nhịp không đều.',
    stats: 'ECG chuẩn y khoa',
    image: '/images/watch/watch-heart-rate-face-only.png',
    points: [
      'Ghi ECG 30 giây bằng cách chạm ngón tay vào Digital Crown',
      'Cảnh báo nhịp tim cao, thấp bất thường ngay tức thì',
      'Đo lường nhịp tim liên tục cả khi nghỉ ngơi lẫn vận động',
    ],
  },
  {
    id: 'sleep',
    tag: 'THEO DÕI GIẤC NGỦ',
    title: 'Phân Tích Chi Tiết Từng Chu Kỳ Ngủ',
    headline: 'Thấu hiểu đêm để năng động cả ngày.',
    description:
      'Theo dõi chính xác thời gian bạn ở các giai đoạn ngủ REM, Core và Deep. Tích hợp cảm biến đo nhiệt độ cổ tay và phát hiện dấu hiệu ngưng thở khi ngủ.',
    stats: '3 giai đoạn ngủ chuyên sâu',
    image: '/images/watch/watch-sleep-face-only.png',
    points: [
      'Biểu đồ chu kỳ ngủ trực quan mỗi sáng thức giấc',
      'Cảm biến nhiệt độ cổ tay theo dõi nhịp sinh học tự nhiên',
      'Đánh giá chất lượng phục hồi của hệ thần kinh sau giấc ngủ',
    ],
  },
  {
    id: 'recovery',
    tag: 'SINH HIỆU & HỒI PHỤC',
    title: 'Ứng Dụng Sinh Hiệu Vitals',
    headline: 'Bức tranh toàn cảnh về thể trạng mỗi sáng.',
    description:
      'Theo dõi các số liệu sức khỏe qua đêm như nồng độ oxy trong máu SpO2, nhịp thở và biến thiên nhịp tim HRV để bạn biết khi nào cơ thể sẵn sàng bứt phá hoặc cần nghỉ ngơi.',
    stats: '5 chỉ số cốt lõi qua đêm',
    image: '/images/watch/watch-spo2-face-only.png',
    points: [
      'Tổng hợp SpO2, nhịp thở, nhiệt độ cổ tay thành một chỉ số duy nhất',
      'Nhận diện sớm dấu hiệu mệt mỏi, căng thẳng hay quá tải',
      'Gợi ý chế độ luyện tập phù hợp với trạng thái hồi phục thực tế',
    ],
  },
];

export const SERIES_11_FITNESS_ITEMS: Series11FitnessFeature[] = [
  {
    title: '3 Vòng Hoạt Động',
    desc: 'Động lực trực quan phát sáng mỗi ngày cho mục tiêu Di chuyển, Tập luyện và Đứng.',
    iconName: 'Flame',
  },
  {
    title: 'Vùng Nhịp Tim Tùy Biến',
    desc: 'Đo lường cường độ bài tập chính xác theo ngưỡng hiếu khí và kỵ khí cá nhân.',
    iconName: 'Activity',
  },
  {
    title: 'Cảm Biến Đo Độ Sâu 6m',
    desc: 'Chống nước 50m cùng cảm biến đo độ sâu nước và nhiệt độ nước cho bơi lội, lặn ống thở.',
    iconName: 'Waves',
  },
];

export const SERIES_11_SMART_ITEMS: Series11SmartFeature[] = [
  {
    title: 'Cử Chỉ Chạm Hai Lần (Double Tap)',
    desc: 'Chạm ngón trỏ và ngón cái để trả lời cuộc gọi, dừng hẹn giờ hoặc phát nhạc mà không cần chạm màn hình.',
    iconName: 'Fingerprint',
  },
  {
    title: 'Ngăn Xếp Thông Minh (Smart Stack)',
    desc: 'Tự động hiển thị các widget thông tin liên quan đúng lúc bạn cần nhất trong ngày.',
    iconName: 'Layers',
  },
  {
    title: 'Apple Pay & Tìm Chính Xác',
    desc: 'Thanh toán một chạm an toàn và định vị tìm kiếm iPhone thất lạc với chỉ dẫn khoảng cách chính xác.',
    iconName: 'Smartphone',
  },
];

export interface Series11SafetyFeature {
  id: string;
  title: string;
  desc: string;
  iconType: 'sos' | 'fall' | 'crash' | 'checkin' | 'backtrack' | 'medical';
}

export const SERIES_11_SAFETY_FEATURES: Series11SafetyFeature[] = [
  {
    id: 'sos',
    title: 'SOS Khẩn Cấp. Ngay lập tức.',
    desc: 'Cần giúp đỡ gấp? Chỉ cần nhấn và giữ nút sườn trên Apple Watch Series 11 để gọi các dịch vụ khẩn cấp và chia sẻ vị trí của bạn.',
    iconType: 'sos',
  },
  {
    id: 'fall',
    title: 'Phát Hiện Ngã luôn sẵn sàng.',
    desc: 'Nếu Series 11 phát hiện bạn bị ngã mạnh, thiết bị có thể tự động giúp kết nối bạn với các dịch vụ khẩn cấp, cung cấp cho nhân viên điều phối vị trí của bạn và thông báo cho người liên hệ khẩn cấp.',
    iconType: 'fall',
  },
  {
    id: 'crash',
    title: 'Phát Hiện Va Chạm. Hộ vệ đeo tay của bạn trên mọi nẻo đường.',
    desc: 'Nếu bạn bị va chạm ô tô nghiêm trọng, Series 11 có thể tự động giúp gọi dịch vụ khẩn cấp, chia sẻ vị trí và thông báo cho các liên hệ khẩn cấp của bạn.',
    iconType: 'crash',
  },
  {
    id: 'checkin',
    title: 'Ra ngoài, nhờ Kiểm Tra.',
    desc: 'Đồng hồ của bạn có thể tự động thông báo cho ai đó khi bạn đã tới điểm đến. Nếu bạn định chạy bộ khi trời tối, bạn có thể khởi động tính năng Kiểm Tra trong quá trình tập luyện để thông báo cho bạn mình khi bạn hoàn thành bài tập.',
    iconType: 'checkin',
  },
  {
    id: 'backtrack',
    title: 'Để Quay Về đưa bạn trở lại đúng đường.',
    desc: 'Tính năng Quay Về trong ứng dụng La Bàn sử dụng dữ liệu GPS để tự động tạo con đường bạn đã đi qua khi bạn ở ngoài vùng phủ sóng. Dễ dàng thêm tọa độ điểm cho bất kỳ thứ gì bạn ưa thích, như đường mòn hoặc khu cắm trại.',
    iconType: 'backtrack',
  },
  {
    id: 'medical',
    title: 'Thiết lập ID Y Tế của bạn.',
    desc: 'Trong trường hợp khẩn cấp, đội cứu hộ có thể nhanh chóng truy cập thông tin y tế quan trọng, như dị ứng hoặc thông tin dùng thuốc, trực tiếp từ Series 11 của bạn.',
    iconType: 'medical',
  },
];
