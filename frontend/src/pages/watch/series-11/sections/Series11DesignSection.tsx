import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Plus, HeartPulse, Moon, BatteryCharging, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LayoutGridCard {
  id: number;
  className: string;
  badge: string;
  icon: React.ReactNode;
  gridTitle: string;
  gridDesc: string;
  expandedTitle: string;
  expandedDesc: string;
  highlights: string[];
  thumbnail: string;
  imageClass?: string;
  modalImage?: string;
  modalImageClass?: string;
  modalVideo?: string;
}

const CARDS: LayoutGridCard[] = [
  {
    id: 1,
    className: 'md:col-span-2 min-h-[340px] sm:min-h-[420px]',
    badge: 'THÔNG TIN SỨC KHỎE ĐỘT PHÁ',
    icon: <HeartPulse className="w-4 h-4 text-[#ff2d55]" />,
    gridTitle: 'Cảnh báo sức khỏe tim mạch & nguy cơ tăng huyết áp.',
    gridDesc: 'Cảm biến sinh học tân tiến giúp theo dõi sát sao sức khỏe tim mạch và gửi thông báo kịp thời.',
    expandedTitle: 'Chủ động chăm sóc sức khỏe. Luôn lắng nghe trái tim bạn.',
    expandedDesc:
      'Apple Watch Series 11 mang đến cái nhìn sâu sắc chưa từng có về sức khỏe thể chất. Đồng hồ hỗ trợ theo dõi nhịp tim liên tục, đo nồng độ oxy trong máu SpO2, đo điện tâm đồ ECG chuẩn y khoa và phân tích xu hướng huyết áp để đưa ra cảnh báo sớm, giúp bạn chủ động thăm khám kịp thời.',
    highlights: [
      'Cảnh báo sớm xu hướng tăng huyết áp',
      'Ứng dụng Điện Tâm Đồ (ECG) chuẩn y tế',
      'Đo nồng độ oxy trong máu SpO2 chính xác',
    ],
    thumbnail: '/images/watch/highlights_health.jpg',
    imageClass: 'w-full h-full max-h-[250px] sm:max-h-[290px] object-cover rounded-2xl',
    modalImage: '/images/watch/health_heart_rate_modal.png',
    modalImageClass: 'max-h-[300px] sm:max-h-[330px] object-contain drop-shadow-md select-none pointer-events-none',
  },
  {
    id: 2,
    className: 'col-span-1 min-h-[340px] sm:min-h-[420px]',
    badge: 'THEO DÕI GIẤC NGỦ CHUYÊN SÂU',
    icon: <Moon className="w-4 h-4 text-[#5e5ce6]" />,
    gridTitle: 'Điểm số giấc ngủ & phát hiện ngưng thở khi ngủ.',
    gridDesc: 'Đánh giá toàn diện các chu kỳ ngủ và cảnh báo khi phát hiện dấu hiệu rối loạn nhịp thở đêm.',
    expandedTitle: 'Thấu hiểu từng chu kỳ đêm. Thức dậy tràn đầy sinh lực.',
    expandedDesc:
      'Với tính năng Điểm Số Giấc Ngủ mới, bạn sẽ nắm bắt trọn vẹn chất lượng từng đêm nghỉ ngơi qua các giai đoạn REM, Ngủ Sâu và Ngủ Cốt Lõi. Đồng thời, thuật toán máy học thế hệ mới giúp phát hiện sớm các dấu hiệu ngưng thở khi ngủ – một tình trạng nguy hiểm thường bị bỏ qua.',
    highlights: [
      'Chỉ số Điểm Số Giấc Ngủ tổng quan mỗi sáng',
      'Cảnh báo nguy cơ ngưng thở khi ngủ',
      'Phân tích chi tiết các giai đoạn REM, Sâu & Cốt Lõi',
    ],
    thumbnail: '/images/watch/highlights_sleep.jpg',
    imageClass: 'w-full h-full max-h-[250px] sm:max-h-[290px] object-cover rounded-2xl',
    modalVideo: '/videos/watch/watch-sleep-animation.mp4',
  },
  {
    id: 3,
    className: 'col-span-1 min-h-[340px] sm:min-h-[420px]',
    badge: 'THỜI LƯỢNG PIN VƯỢT TRỘI',
    icon: <BatteryCharging className="w-4 h-4 text-[#30d158]" />,
    gridTitle: 'Pin dùng cả ngày. Sạc nhanh 80% chỉ trong 30 phút.',
    gridDesc: 'Tự tin hoạt động 18 giờ liên tục và lên tới 36 giờ ở Chế Độ Nguồn Điện Thấp.',
    expandedTitle: 'Thời lượng pin bền bỉ. Nạp năng lượng siêu tốc.',
    expandedDesc:
      'Với kiến trúc năng lượng siêu hiệu quả từ chip S11 mới, chiếc đồng hồ đáp ứng đến 18 giờ sử dụng thông thường và lên tới 36 giờ ở Chế Độ Nguồn Điện Thấp. Công nghệ sạc nhanh mới giúp bạn sạc từ 0% lên 80% chỉ trong 30 phút, hoặc sạc 15 phút là đủ pin theo dõi giấc ngủ trọn vẹn 8 giờ.',
    highlights: [
      '18 giờ sử dụng thông thường, 36 giờ Chế Độ Nguồn Điện Thấp',
      'Sạc siêu nhanh chạm mốc 80% trong 30 phút',
      'Sạc nhanh 15 phút đủ năng lượng theo dõi giấc ngủ 8 giờ',
    ],
    thumbnail: '/images/watch/highlights_battery.jpg',
    imageClass: 'w-full h-full max-h-[250px] sm:max-h-[290px] object-contain rounded-2xl p-4 bg-white/40',
    modalVideo: '/videos/watch/watch-battery-animation.mp4',
  },
  {
    id: 4,
    className: 'md:col-span-2 min-h-[340px] sm:min-h-[420px]',
    badge: 'ĐỘ BỀN VỮNG CHẮC',
    icon: <ShieldCheck className="w-4 h-4 text-[#e5a823]" />,
    gridTitle: 'Mặt kính Ion-X & Tinh thể Sapphire chống trầy xước.',
    gridDesc: 'Thiết kế vòm kính uốn cong tinh xảo, chống rạn nứt hàng đầu và đạt chuẩn kháng nước WR50.',
    expandedTitle: 'Kiến trúc kính cường lực tiên tiến. Bền bỉ trước mọi thử thách.',
    expandedDesc:
      'Mặt kính trước dày hơn và hình học được tối ưu hóa giúp chống nứt vỡ vượt trội. Phiên bản nhôm sử dụng kính Ion-X gia cường siêu bền, trong khi phiên bản Titan được trang bị tinh thể Sapphire nguyên khối cứng cáp. Kết hợp chuẩn chống bụi IP6X và kháng nước WR50 ở độ sâu 50 mét.',
    highlights: [
      'Tinh thể Sapphire chống trầy xước trên bản Titan',
      'Mặt kính Ion-X gia cường tăng độ bền vòm cong',
      'Kháng nước ở độ sâu 50 mét WR50 và chống bụi IP6X',
    ],
    thumbnail: '/images/watch/highlights_glass.jpg',
    imageClass: 'w-full h-full max-h-[250px] sm:max-h-[290px] object-cover rounded-2xl',
  },
];

export function Series11DesignSection() {
  const [selected, setSelected] = useState<LayoutGridCard | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close expanded card on Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <section
      id="s11-design"
      className="relative w-full py-16 sm:py-24 bg-white text-[#1d1d1f] select-none overflow-hidden"
    >
      <div className="series11-container w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14 text-left">
          <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-[#0071e3] uppercase mb-2 block">
            THIẾT KẾ & VẬT LIỆU
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-black leading-[1.12] mb-3">
            Ngắm nhìn cận cảnh.
          </h2>
          <p className="text-sm sm:text-base text-[#86868b] font-normal leading-relaxed max-w-2xl">
            Chạm vào từng chi tiết để khám phá kỹ thuật chế tác đỉnh cao, độ mỏng kỷ lục và các vật liệu cao cấp trên Apple Watch Series 11.
          </p>
        </div>

        {/* Aceternity-inspired Layout Grid Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative">
          {CARDS.map((card) => (
            <motion.div
              key={card.id}
              layoutId={`card-${card.id}`}
              onClick={() => setSelected(card)}
              whileHover={shouldReduceMotion ? undefined : { y: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={cn(
                card.className,
                'relative rounded-[2rem] sm:rounded-[2.5rem] bg-[#f5f5f7] border border-black/[0.04] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition-shadow cursor-pointer group'
              )}
            >
              {/* Top Tag & Plus Icon */}
              <div className="flex items-center justify-between z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/5 shadow-2xs backdrop-blur-sm">
                  {card.icon}
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-[#1d1d1f] uppercase">
                    {card.badge}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/80 border border-black/5 shadow-2xs flex items-center justify-center text-black/60 group-hover:bg-[#1d1d1f] group-hover:text-white transition-all">
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-300" />
                </div>
              </div>

              {/* Centered High-Res Visual */}
              <div className="relative flex items-center justify-center my-4 z-0 py-2">
                <img
                  src={card.thumbnail}
                  alt={card.gridTitle}
                  className={cn(
                    card.imageClass,
                    'transition-transform duration-500 ease-out group-hover:scale-105 select-none pointer-events-none'
                  )}
                  loading="lazy"
                />
              </div>

              {/* Bottom Card Title & Description */}
              <div className="z-10 text-left mt-auto pt-2">
                <h3 className="text-lg sm:text-xl font-bold text-black tracking-tight mb-1 group-hover:text-[#0071e3] transition-colors">
                  {card.gridTitle}
                </h3>
                <p className="text-xs sm:text-sm text-[#86868b] line-clamp-2 leading-relaxed font-normal">
                  {card.gridDesc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Full-Screen Expanded Card Modal (Framer Motion LayoutId shared animation) */}
        <AnimatePresence>
          {selected && (
            <>
              {/* Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setSelected(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 cursor-pointer"
                aria-hidden="true"
              />

              {/* Centered Modal Container */}
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <motion.div
                  layoutId={`card-${selected.id}`}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="relative w-full max-w-3xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-black/10 flex flex-col max-h-[88vh] overflow-y-auto"
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Đóng chi tiết"
                    className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-black/70 hover:text-black transition-colors cursor-pointer z-30"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* Header Area with Badge */}
                  <div className="p-6 sm:p-8 pb-0 text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f5f7] border border-black/5 mb-3">
                      {selected.icon}
                      <span className="text-[10px] sm:text-xs font-bold tracking-widest text-[#1d1d1f] uppercase">
                        {selected.badge}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-snug">
                      {selected.expandedTitle}
                    </h3>
                  </div>

                  {/* Showcase Visual inside Modal: Video or Image */}
                  <div className="relative w-full aspect-[16/9] max-h-[340px] sm:max-h-[360px] bg-[#f5f5f7] my-4 flex items-center justify-center overflow-hidden rounded-2xl p-2">
                    {selected.modalVideo ? (
                      <video
                        key={`modal-vid-${selected.id}`}
                        src={selected.modalVideo}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full max-h-[320px] object-contain rounded-xl select-none"
                      />
                    ) : (
                      <motion.img
                        initial={shouldReduceMotion ? undefined : { scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        src={selected.modalImage || selected.thumbnail}
                        alt={selected.expandedTitle}
                        className={cn(
                          selected.modalImageClass
                            ? selected.modalImageClass
                            : selected.id === 3
                            ? 'max-h-[240px] object-contain p-6'
                            : 'w-full h-full object-cover',
                          'select-none pointer-events-none'
                        )}
                      />
                    )}
                  </div>

                  {/* Editorial Description & Feature Highlights */}
                  <div className="p-6 sm:p-8 pt-2 text-left">
                    <p className="text-sm sm:text-base text-[#1d1d1f] leading-relaxed mb-6 font-normal">
                      {selected.expandedDesc}
                    </p>

                    <div className="border-t border-black/8 pt-4">
                      <h4 className="text-xs font-bold tracking-wider text-[#86868b] uppercase mb-3">
                        ĐIỂM NỔI BẬT CHÍNH
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selected.highlights.map((item, index) => (
                          <li
                            key={index}
                            className="p-3 rounded-xl bg-[#f5f5f7] text-xs font-semibold text-[#1d1d1f] flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0071e3] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
