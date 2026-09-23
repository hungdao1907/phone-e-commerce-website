import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLenis } from 'lenis/react';
import {
  X,
  Sparkles,
  Watch,
  Cpu,
  BatteryCharging,
  HeartPulse,
  ShieldCheck,
  Wifi,
  Layers,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Series11SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SpecItem {
  name: string;
  value: string;
  sub?: string;
}

interface SpecGroup {
  id: string;
  category: string;
  tabLabel: string;
  icon: LucideIcon;
  items: SpecItem[];
}

const SPEC_GROUPS: SpecGroup[] = [
  {
    id: 'design',
    category: 'Thiết Kế & Kích Thước',
    tabLabel: 'Thiết kế',
    icon: Watch,
    items: [
      {
        name: 'Kích thước vỏ',
        value: '42 mm hoặc 46 mm',
        sub: '42 x 36 x 9.7 mm (42mm) · 46 x 39 x 9.7 mm (46mm) — Mỏng hơn gần 10% so với thế hệ trước',
      },
      {
        name: 'Trọng lượng vỏ',
        value: 'Nhôm: 30.0g (42mm) / 36.4g (46mm)',
        sub: 'Titan Cấp 5: 34.4g (42mm) / 41.7g (46mm)',
      },
      {
        name: 'Tùy chọn chất liệu',
        value: 'Nhôm tái chế 100% hoặc Titan Hàng Không Vũ Trụ Cấp 5',
        sub: 'Màu Nhôm: Đen bóng (Jet Black), Bạc (Silver), Vàng hồng (Rose Gold) · Màu Titan: Xám đá phiến, Vàng, Tự nhiên',
      },
      {
        name: 'Kháng nước & Chống bụi',
        value: 'Chống nước 50m (ISO 22810:2010) & Chuẩn IP6X',
        sub: 'Tích hợp cảm biến đo độ sâu nước đến 6m và cảm biến đo nhiệt độ nước cho hoạt động bơi lặn',
      },
    ],
  },
  {
    id: 'display',
    category: 'Màn Hình OLED Góc Rộng',
    tabLabel: 'Màn hình',
    icon: Layers,
    items: [
      {
        name: 'Công nghệ hiển thị',
        value: 'Màn hình OLED góc rộng Always-On Retina',
        sub: 'Góc nhìn nghiêng sáng hơn tới 40% so với thế hệ trước, tối ưu hiển thị viền siêu mỏng',
      },
      {
        name: 'Độ sáng màn hình',
        value: 'Độ sáng đỉnh 2000 nits · Tối thiểu 1 nit',
        sub: 'Tự động điều chỉnh thích ứng mượt mà từ trời nắng gắt ngoài biển đến phòng ngủ tối',
      },
      {
        name: 'Mặt kính bảo vệ',
        value: 'Kính cường lực Ion-X (bản Nhôm) · Tinh thể Sapphire (bản Titan)',
        sub: 'Chống trầy xước và nứt vỡ vượt trội trong mọi hoạt động thể thao mạo hiểm',
      },
    ],
  },
  {
    id: 'performance',
    category: 'Hiệu Năng & Bộ Xử Lý',
    tabLabel: 'Hiệu năng',
    icon: Cpu,
    items: [
      {
        name: 'Bộ vi xử lý (SiP)',
        value: 'Apple S11 SiP với bộ xử lý lõi kép 64-bit',
        sub: 'Xử lý mượt mà, phản hồi tức thì các thuật toán phân tích sức khỏe và cử chỉ thông minh',
      },
      {
        name: 'Neural Engine',
        value: '4 lõi chuyên dụng cho Trí tuệ máy học (AI)',
        sub: 'Tăng tốc độ nhận diện lệnh giọng nói Siri ngoại tuyến trực tiếp trên thiết bị',
      },
      {
        name: 'Dung lượng lưu trữ',
        value: '64 GB',
        sub: 'Lưu trữ hàng nghìn bài hát, podcast và ứng dụng độc lập trên cổ tay',
      },
      {
        name: 'Thao tác điều khiển',
        value: 'Cử chỉ Chạm hai lần (Double Tap) & Digital Crown với phản hồi rung haptic',
        sub: 'Điều khiển cuộc gọi, hẹn giờ hoặc thông báo chỉ bằng việc chạm ngón cái và ngón trỏ',
      },
    ],
  },
  {
    id: 'battery',
    category: 'Pin & Tốc Độ Sạc',
    tabLabel: 'Pin & Sạc',
    icon: BatteryCharging,
    items: [
      {
        name: 'Thời lượng pin sử dụng',
        value: 'Lên đến 18 giờ (Sử dụng bình thường) · Lên đến 36 giờ (Chế độ Nguồn Điện Thấp)',
        sub: 'Đảm bảo hoạt động trọn vẹn cả ngày dài tập luyện cùng chu kỳ theo dõi giấc ngủ ban đêm',
      },
      {
        name: 'Tốc độ sạc siêu tốc',
        value: 'Sạc 80% chỉ trong khoảng 30 phút',
        sub: 'Sạc nhanh từ tính USB-C thế hệ mới · Chỉ cần 15 phút sạc đủ năng lượng theo dõi giấc ngủ 8 tiếng',
      },
    ],
  },
  {
    id: 'health',
    category: 'Cảm Biến Sức Khỏe Chuyên Sâu',
    tabLabel: 'Sức khỏe',
    icon: HeartPulse,
    items: [
      {
        name: 'Điện tâm đồ (ECG)',
        value: 'Cảm biến điện học tim thế hệ mới',
        sub: 'Ghi kết quả ECG tương đương một đạo trình chỉ trong 30 giây · Cảnh báo rung nhĩ sớm',
      },
      {
        name: 'Đo nhịp tim quang học',
        value: 'Cảm biến quang học đo nhịp tim thế hệ 3',
        sub: 'Theo dõi nhịp tim 24/7, phát hiện nhịp tim cao, thấp bất thường và biến thiên nhịp tim HRV',
      },
      {
        name: 'Đo Oxy trong máu & Sinh hiệu',
        value: 'Cảm biến nồng độ Oxy trong máu (SpO2) & Ứng dụng Sinh Hiệu Vitals',
        sub: 'Tổng hợp chỉ số nhiệt độ cổ tay, nhịp thở và nồng độ oxy để đánh giá mức độ hồi phục thể trạng',
      },
      {
        name: 'Theo dõi giấc ngủ',
        value: 'Phân tích 3 giai đoạn: REM, Core và Deep',
        sub: 'Cảnh báo sớm dấu hiệu ngưng thở khi ngủ với độ chính xác chuẩn nghiên cứu lâm sàng',
      },
    ],
  },
  {
    id: 'safety',
    category: 'Tính Năng An Toàn & Cứu Hộ',
    tabLabel: 'An toàn',
    icon: ShieldCheck,
    items: [
      {
        name: 'Cứu trợ khẩn cấp',
        value: 'SOS Khẩn Cấp & Thiết lập ID Y Tế',
        sub: 'Nhấn giữ nút sườn để tự động kết nối dịch vụ cứu nạn và chia sẻ vị trí tức thì',
      },
      {
        name: 'Phát hiện sự cố',
        value: 'Phát Hiện Ngã & Phát Hiện Va Chạm Xe Ô Tô Nghiêm Trọng',
        sub: 'Cảm biến gia tốc kế lực cao và con quay hồi chuyển dải động cao nhận diện tai nạn chính xác',
      },
      {
        name: 'Định vị hồi hương',
        value: 'La bàn Để Quay Về (Backtrack) & Ra Ngoài Nhớ Kiểm Tra (Check In)',
        sub: 'Tự động vẽ lại cung đường GPS ngoại tuyến khi mất sóng, thông báo cho người thân khi tới nơi',
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
        value: 'Wi-Fi 4 (802.11n), Bluetooth 5.3',
        sub: 'Chip Ultra Wideband (UWB) thế hệ 2 hỗ trợ Tìm Chính Xác khoảng cách và hướng đi tới iPhone',
      },
      {
        name: 'Mạng di động Cellular',
        value: 'Hỗ trợ GPS + Cellular (eSIM độc lập)',
        sub: 'Nghe gọi, nhắn tin và phát nhạc trực tuyến độc lập không cần mang theo điện thoại iPhone',
      },
      {
        name: 'Hệ thống âm thanh',
        value: 'Loa ngoài tích hợp phát nhạc trực tiếp & Micrô lọc tiếng ồn gió tiên tiến',
        sub: 'Đàm thoại trong trẻo ngay cả khi di chuyển ngoài trời gió lớn',
      },
    ],
  },
];

export function Series11SpecsModal({ isOpen, onClose }: Series11SpecsModalProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [mounted, setMounted] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const lenis = useLenis();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset scroll to top when changing tabs
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Handle modal open/close: stop Lenis & prevent page background scrolling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      lenis?.stop();
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      lenis?.start();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      lenis?.start();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, lenis]);

  const handleBuyNow = () => {
    onClose();
    navigate('/watch#watch-models');
  };

  const filteredGroups =
    activeTab === 'all'
      ? SPEC_GROUPS
      : SPEC_GROUPS.filter((g) => g.id === activeTab);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 overflow-hidden pointer-events-auto"
          style={{ zIndex: 99999 }}
        >
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Center Modal Container (Crisp White Card with Apple Web Typography) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="apple-specs-modal relative z-10 w-full max-w-4xl h-[640px] sm:h-[680px] md:h-[720px] max-h-[92vh] bg-white border border-neutral-300 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden text-black select-none"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-7 border-b border-neutral-200 flex items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-300 flex items-center justify-center text-black">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <div className="apple-eyebrow text-[11px] sm:text-xs font-bold tracking-[0.14em] text-black uppercase">
                    BẢNG THÔNG SỐ KỸ THUẬT
                  </div>
                  <h3 className="apple-heading text-lg sm:text-2xl font-black text-black tracking-tight">
                    Apple Watch Series 11
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 flex items-center justify-center text-black transition-colors cursor-pointer border border-neutral-300"
                aria-label="Đóng bảng thông số"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="px-5 sm:px-7 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`apple-heading px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white hover:bg-neutral-100 text-black border border-neutral-300'
                }`}
              >
                Tất cả
              </button>
              {SPEC_GROUPS.map((g) => {
                const Icon = g.icon;
                const isActive = activeTab === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setActiveTab(g.id)}
                    className={`apple-heading inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-black text-white shadow-sm'
                        : 'bg-white hover:bg-neutral-100 text-black border border-neutral-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-current" />
                    <span>{g.tabLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Specifications Content (White Background, Black Text) */}
            <div
              ref={scrollContainerRef}
              data-lenis-prevent="true"
              data-lenis-prevent-wheel="true"
              data-lenis-prevent-touch="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 specs-scroll-container bg-white"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-6"
                >
                  {filteredGroups.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <div
                        key={group.id}
                        className="p-4 sm:p-6 rounded-2xl bg-neutral-50/80 border border-neutral-200"
                      >
                        {/* Category Title */}
                        <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-neutral-200">
                          <GroupIcon className="w-5 h-5 text-black" />
                          <h4 className="apple-spec-category text-base sm:text-lg font-bold text-black tracking-tight">
                            {group.category}
                          </h4>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                          {group.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 sm:p-4 rounded-xl bg-white hover:bg-neutral-50 border border-neutral-200 transition-colors flex flex-col justify-start shadow-xs"
                            >
                              <div className="apple-spec-label text-xs font-bold text-black uppercase tracking-wider mb-1">
                                {item.name}
                              </div>
                              <div className="apple-spec-value text-sm sm:text-base font-black text-black mb-1 leading-snug">
                                {item.value}
                              </div>
                              {item.sub && (
                                <div className="apple-spec-desc text-xs text-black leading-relaxed font-normal">
                                  {item.sub}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="hidden sm:block text-xs font-medium text-black">
                Giá khởi điểm từ <span className="apple-price font-black text-black">10.990.000₫</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="apple-heading px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-black text-xs sm:text-sm font-bold transition-colors cursor-pointer border border-neutral-300"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="apple-heading inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Mua ngay Series 11</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
