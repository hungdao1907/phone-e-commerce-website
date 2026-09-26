import React, { useRef } from 'react';
import { Sparkles, Orbit, Palette, Compass, Gauge, Clock } from 'lucide-react';
import { ShimmerText } from '@/components/ui/ShimmerText';
import '@/css/watch.css';

interface WatchFaceItem {
  id: string;
  name: string;
  category: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  themeGradient: string;
  glowColor: string;
  description: string;
  image: string;
  complications: string[];
}

const WATCH_FACES_DATA: WatchFaceItem[] = [
  {
    id: 'minimalist',
    name: 'Minimalist (Tối Giản)',
    category: 'Cổ Điển & Thanh Lịch',
    badge: 'OLED Siêu Sâu',
    icon: Sparkles,
    themeGradient: 'from-[#1e2026] via-[#14151a] to-[#0a0a0d]',
    glowColor: 'bg-zinc-400/15',
    description: 'Đường nét kim siêu mảnh tinh tế trên nền đen OLED sâu thẳm, tôn vinh vẻ đẹp tối giản thuần khiết chuẩn mực Apple.',
    image: '/images/watch/watch-face-minimal.png',
    complications: ['Kim Giây Trôi', 'Pin & Năng Lượng', 'Thời Tiết Live'],
  },
  {
    id: 'astronomy',
    name: 'Thiên Văn (Astronomy)',
    category: 'Khám Phá Vũ Trụ',
    badge: 'Mô Hình 3D Realtime',
    icon: Orbit,
    themeGradient: 'from-[#0e1c3a] via-[#091228] to-[#040814]',
    glowColor: 'bg-blue-500/25',
    description: 'Mô hình địa cầu 3D photorealistic, chu kỳ mặt trăng và dải ngân hà chuyển động sống động theo thời gian thực.',
    image: '/images/watch/watch-face-astronomy.png',
    complications: ['Địa Cầu 3D', 'Chu Kỳ Tuần Trăng', 'Hệ Mặt Trời'],
  },
  {
    id: 'infograph',
    name: 'Infograph (Đa Biến Số)',
    category: 'Kỹ Thuật Số Chuyên Sâu',
    badge: '8 Biến Số Cao Cấp',
    icon: Gauge,
    themeGradient: 'from-[#151d2a] via-[#0d131c] to-[#06090e]',
    glowColor: 'bg-cyan-500/20',
    description: 'Mặt đồng hồ Infograph huyền thoại với 8 biến số hiển thị đồng thời: vòng vận động, nhiệt độ vòng cung, la bàn và giờ thế giới.',
    image: '/images/watch/watch-face-infograph.png',
    complications: ['8 Biến Số Live', 'Vòng Hoạt Động 3 Màu', 'La Bàn & Nhiệt Độ'],
  },
  {
    id: 'typography',
    name: 'Typography (Nghệ Thuật)',
    category: 'Đồ Họa & Năng Động',
    badge: 'Đa Sắc Tràn Viền',
    icon: Palette,
    themeGradient: 'from-[#2e1236] via-[#1a0a20] to-[#0c0410]',
    glowColor: 'bg-pink-500/20',
    description: 'Nghệ thuật chữ số biến hóa màu sắc sống động tràn viền màn hình, phản chiếu nhịp sống và phong cách cá tính của bạn.',
    image: '/images/watch/watch-face-typography.png',
    complications: ['Màu Sắc Đa Tầng', 'Đổi Font Số Động', 'Lịch Biểu'],
  },
  {
    id: 'california',
    name: 'California (Cổ Điển)',
    category: 'Sang Trọng & Đẳng Cấp',
    badge: 'Chữ Số La Mã & Ả Rập',
    icon: Clock,
    themeGradient: 'from-[#0e1d33] via-[#091222] to-[#040812]',
    glowColor: 'bg-blue-400/20',
    description: 'Mặt số California phối sắc xanh Midnight kết hợp chữ số La Mã và Ả Rập, tôn vinh nghệ thuật chế tác đồng hồ Thụy Sĩ đỉnh cao.',
    image: '/images/watch/watch-face-california.png',
    complications: ['Chữ Số Đa Phong Cách', 'Lịch Ngày & Thứ', 'Màu Xanh Midnight'],
  },
  {
    id: 'wayfinder',
    name: 'Wayfinder (Đa Biến Số)',
    category: 'Thể Thao & Thám Hiểm',
    badge: 'Chuyên Nghiệp Ultra',
    icon: Compass,
    themeGradient: 'from-[#28180c] via-[#180e06] to-[#0c0602]',
    glowColor: 'bg-orange-500/25',
    description: 'Mặt đồng hồ chuyên nghiệp tích hợp la bàn vệ tinh, độ cao, tọa độ GPS cùng chế độ ban đêm đỏ bảo vệ thị lực.',
    image: '/images/watch/watch-face-activity.png',
    complications: ['La Bàn Vệ Tinh', 'Độ Cao & Độ Sâu', 'Night Mode Đỏ'],
  },
];

import { FloatingDotsNavButton } from '@/components/ui/FloatingDotsNavButton';

export function WatchFacesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const card = scrollRef.current.firstElementChild as HTMLElement | null;
      const cardWidth = card ? card.offsetWidth + 24 : 330;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-[#fbfbfd] text-zinc-900 relative overflow-hidden py-16 sm:py-24">
      {/* 1. Header is centered inside standard max-w-7xl Apple grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-5">
          <div className="max-w-xl lg:max-w-2xl">
            <span className="text-xs font-bold tracking-widest text-[#0071e3] uppercase mb-2 block">
              BỘ MẶT ĐỒNG HỒ ĐA DẠNG
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950 mb-3 leading-tight">
              Mặt đồng hồ đa phong cách.
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 leading-relaxed font-normal">
              Hàng trăm mặt đồng hồ tùy biến chuyên sâu. Chuyển đổi linh hoạt theo từng trang phục, hoạt động và cảm hứng mỗi ngày.
            </p>
          </div>

          {/* 21st.dev Meng To Floating Dots Navigation Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <FloatingDotsNavButton
              direction="left"
              onClick={() => scroll('left')}
              ariaLabel="Cuộn sang trái"
            />
            <FloatingDotsNavButton
              direction="right"
              onClick={() => scroll('right')}
              ariaLabel="Cuộn sang phải"
            />
          </div>
        </div>
      </div>


      {/* 2. Full-bleed Edge-to-Edge Carousel: Card 1 aligns with header left, right side overflows freely */}
      <div
        ref={scrollRef}
        className="watch-faces-carousel"
      >
        {WATCH_FACES_DATA.map((face) => {
          const BadgeIcon = face.icon;
          return (
            <div
              key={face.id}
              className="w-[290px] sm:w-[315px] lg:w-[335px] h-[480px] sm:h-[500px] flex-shrink-0 snap-start flex flex-col justify-between rounded-[28px] overflow-hidden bg-white border border-zinc-200/90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] hover:-translate-y-2 transition-all duration-500 group cursor-pointer select-none"
            >
              {/* Visual Stage Container with Bespoke Themed Ambient Backdrop */}
              <div
                className={`relative h-[215px] sm:h-[235px] w-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${face.themeGradient} p-4 flex-shrink-0`}
              >
                {/* Atmospheric Glow */}
                <div
                  className={`absolute w-36 h-36 rounded-full blur-2xl ${face.glowColor} pointer-events-none`}
                />

                {/* Top Floating Glass Badge */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold tracking-wide shadow-sm">
                    <BadgeIcon className="w-3 h-3 text-white/90" />
                    <span>{face.badge}</span>
                  </span>
                </div>

                {/* Watch Face Floating Image with 3D Depth Scale */}
                <img
                  src={face.image}
                  alt={face.name}
                  className="relative z-1 max-h-[150px] sm:max-h-[170px] w-auto object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.65)] group-hover:scale-106 transition-transform duration-700 ease-out"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Information Block */}
              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 bg-white">
                <div>
                  {/* Category */}
                  <div className="text-[10px] sm:text-[11px] font-bold text-zinc-500 tracking-wider uppercase mb-1">
                    {face.category}
                  </div>

                  {/* Face Name */}
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 tracking-tight mb-2 group-hover:text-[#0071e3] transition-colors duration-300 min-h-[1.5rem] flex items-center">
                    {face.name}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed line-clamp-2 mb-4 font-normal h-[2.5rem] overflow-hidden">
                    {face.description}
                  </p>
                </div>

                {/* Complications Chips */}
                <div className="pt-3.5 border-t border-zinc-100">
                  <div className="mb-2">
                    <ShimmerText
                      baseColor="#09090b"
                      shimmerColor="#71717a"
                      className="text-[10px] font-bold uppercase tracking-wider block"
                    >
                      Biến số nổi bật
                    </ShimmerText>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {face.complications.map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium bg-zinc-900 text-white border border-zinc-900 shadow-xs transition-colors duration-200 group-hover:bg-black"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
