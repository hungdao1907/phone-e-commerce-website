import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Sun, Briefcase, Moon, ArrowDown } from 'lucide-react';
import { MotionSplitText } from '@/components/ui/MotionSplitText';

interface LifestyleStoryData {
  id: string;
  step: string;
  badge: string;
  badgeIcon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  title: string;
  description: string;
  features: { title: string; subtitle: string }[];
  image: string;
  imageAlt: string;
  layout: 'text-left' | 'image-left';
}

const LIFESTYLE_STORIES: LifestyleStoryData[] = [
  {
    id: 'morning',
    step: '01',
    badge: 'BÌNH MINH & THỂ CHẤT · 06:00 AM',
    badgeIcon: Sun,
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    title: 'Đánh thức năng lượng. Bứt phá mọi giới hạn ngày mới',
    description:
      'Mỗi sớm mai là cơ hội để tái lập kỷ lục cá nhân. Hệ thống định vị GPS băng tần kép L1 & L5 chuẩn xác ghi lại từng sải chân dưới tán cây đô thị, trong khi cảm biến quang học thế hệ mới đo công suất chạy bộ, nhịp thở và vùng nhịp tim mục tiêu theo thời gian thực — tiếp thêm động lực trước khi cả thành phố thức giấc',
    features: [
      { title: 'GPS Băng Tần Kép L1 & L5', subtitle: 'Bắt sóng vệ tinh chuẩn từng mét lộ trình' },
      { title: 'Vùng Nhịp Tim Cá Nhân Hóa', subtitle: 'Tối ưu hiệu quả đốt calo & sức bền' },
      { title: 'Chỉ Số Độ Sẵn Sàng', subtitle: 'Đánh giá mức hồi phục thể lực buổi sáng' },
    ],
    image: '/images/watch/watch-lifestyle-morning.jpg',
    imageAlt: 'Chạy bộ buổi sáng cùng Apple Watch',
    layout: 'text-left',
  },
  {
    id: 'work',
    step: '02',
    badge: 'BAN NGÀY & CÔNG VIỆC · 02:30 PM',
    badgeIcon: Briefcase,
    badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    title: 'Làm chủ nhịp sống bận rộn. Tập trung vào điều cốt lõi',
    description:
      'Kết nối thông minh giúp bạn xử lý công việc liền mạch mà không bị phân tâm. Chạm hai lần (Double Tap) ngón trỏ và ngón cái để trả lời cuộc gọi gấp khi đang bận tay, duyệt nhanh lịch trình qua Ngăn Xếp Thông Minh, và an tâm di chuyển với hệ thống Tự Động Nhận Diện Va Chạm SOS',
    features: [
      { title: 'Cử Chỉ Double Tap Độc Quyền', subtitle: 'Thao tác rảnh tay một chạm siêu nhạy' },
      { title: 'Ngăn Xếp Thông Minh', subtitle: 'Gợi ý thông tin ngữ cảnh đúng thời điểm' },
      { title: 'Phát Hiện Va Chạm & Té Ngã', subtitle: 'Tự động gửi định vị khẩn cấp bảo vệ bạn' },
    ],
    image: '/images/watch/watch-lifestyle-work.jpg',
    imageAlt: 'Làm việc và kết nối cùng Apple Watch',
    layout: 'image-left',
  },
  {
    id: 'recover',
    step: '03',
    badge: 'BAN ĐÊM & TÁI TẠO · 11:30 PM',
    badgeIcon: Moon,
    badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    title: 'Khoa học của sự phục hồi. Thức dậy tràn đầy sức sống',
    description:
      'Chăm sóc sức khỏe liên tục ngay cả khi bạn chìm vào giấc ngủ. Màn hình tự động giảm xuống chỉ 1 nit êm dịu, đồng thời cảm biến nhiệt độ cổ tay và nhịp tim âm thầm theo dõi chu kỳ REM, Ngủ Sâu, SpO2 và chất lượng giấc ngủ để bạn luôn sẵn sàng cho ngày mới',
    features: [
      { title: 'Biểu Đồ Giấc Ngủ REM & Sâu', subtitle: 'Phân tích chi tiết chu kỳ tái tạo năng lượng' },
      { title: 'Cảm Biến Nhiệt Độ Cổ Tay', subtitle: 'Theo dõi biến thiên nhiệt độ sinh học ban đêm' },
      { title: 'Báo Thức Rung Taptic', subtitle: 'Đánh thức riêng tư không làm phiền người bên cạnh' },
    ],
    image: '/images/watch/watch-lifestyle-recover.jpg',
    imageAlt: 'Thư giãn và theo dõi giấc ngủ ban đêm',
    layout: 'text-left',
  },
];

const DUST_MOTES = [
  { id: 1, left: '6px', top: '-4px', size: 1.6, delay: 0, duration: 2.5 },
  { id: 2, left: '14px', top: '7px', size: 1.2, delay: 0.7, duration: 3.2 },
  { id: 3, left: '24px', top: '-2px', size: 1.8, delay: 1.4, duration: 2.8 },
  { id: 4, left: '35px', top: '10px', size: 1.0, delay: 0.4, duration: 2.2 },
  { id: 5, left: '48px', top: '-5px', size: 1.5, delay: 1.9, duration: 3.5 },
  { id: 6, left: '60px', top: '6px', size: 1.3, delay: 1.1, duration: 2.6 },
  { id: 7, left: '72px', top: '-1px', size: 1.5, delay: 1.6, duration: 3.0 },
  { id: 8, left: '85px', top: '8px', size: 1.1, delay: 0.5, duration: 2.4 },
  { id: 9, left: '98px', top: '-3px', size: 1.4, delay: 2.2, duration: 3.3 },
  { id: 10, left: '110px', top: '5px', size: 1.0, delay: 1.3, duration: 2.7 },
];

function LuminousScrollBadge() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative inline-flex items-center justify-center group cursor-pointer select-none py-2">
      {/* 1. Outer Ambient Volumetric Warmth Spill */}
      <div className="absolute left-[42%] top-1/2 -translate-y-1/2 w-44 sm:w-52 h-16 bg-gradient-to-r from-orange-400/25 via-amber-500/15 to-transparent blur-xl pointer-events-none rounded-full" />
      <div className="absolute left-[45%] top-1/2 -translate-y-1/2 w-36 sm:w-40 h-12 bg-gradient-to-r from-orange-300/35 via-orange-400/20 to-transparent blur-md pointer-events-none rounded-full" />

      {/* 2. Main Capsule Pill Body */}
      <div className="relative flex items-center px-6 sm:px-7 py-3 rounded-full bg-[#131419]/95 border border-white/14 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
        {/* Left Side: "CUỘN XUỐNG" */}
        <span className="text-white text-xs sm:text-[13px] font-semibold tracking-wide mr-3.5 shrink-0 antialiased">
          CUỘN XUỐNG
        </span>

        {/* Center: The Realistic Luminous Slit & Sparkling Light Beam */}
        <div className="relative flex items-center shrink-0">
          {/* Vertical Light Slit (Luminous laser beacon) */}
          <div className="relative z-30 w-[2.2px] h-5.5 bg-white rounded-full shadow-[0_0_6px_#ffffff,0_0_14px_#ffa673,0_0_24px_#ff6622]" />

          {/* Core Spotlight Beam (Warm, radiant, non-blinding volumetric cone) */}
          <div
            style={{
              clipPath: 'polygon(0% 36%, 100% 4%, 100% 96%, 0% 64%)',
              background:
                'linear-gradient(90deg, rgba(255,245,230,0.75) 0%, rgba(255,190,135,0.42) 25%, rgba(255,145,80,0.2) 65%, transparent 100%)',
            }}
            className="absolute left-[1.5px] top-1/2 -translate-y-1/2 w-36 sm:w-40 h-13 pointer-events-none z-10 blur-[0.7px] mix-blend-screen opacity-90"
          />

          {/* Secondary Soft Atmosphere Cone */}
          <div
            style={{
              clipPath: 'polygon(0% 28%, 100% 0%, 100% 100%, 0% 72%)',
              background:
                'linear-gradient(90deg, rgba(255,210,165,0.38) 0%, rgba(255,150,85,0.18) 50%, transparent 100%)',
            }}
            className="absolute left-[1.5px] top-1/2 -translate-y-1/2 w-42 sm:w-46 h-16 pointer-events-none z-10 blur-sm mix-blend-screen opacity-75"
          />

          {/* Animated Sparkling Dust Motes (Bụi sáng lơ lửng lấp lánh như trong không khí) */}
          {DUST_MOTES.map((mote) => (
            <motion.span
              key={mote.id}
              animate={
                shouldReduceMotion
                  ? { opacity: 0.6 }
                  : {
                      opacity: [0.15, 0.95, 0.25, 0.9, 0.15],
                      scale: [0.75, 1.4, 0.8, 1.3, 0.75],
                      y: [0, -2, 1, -1.5, 0],
                      x: [0, 1, -1, 0.8, 0],
                    }
              }
              transition={{
                duration: mote.duration,
                repeat: Infinity,
                delay: mote.delay,
                ease: 'easeInOut',
              }}
              style={{
                left: mote.left,
                top: mote.top,
                width: `${mote.size}px`,
                height: `${mote.size}px`,
              }}
              className="absolute rounded-full bg-white shadow-[0_0_3px_#ffffff,0_0_6px_#ffbe76] pointer-events-none z-25"
            />
          ))}
        </div>

        {/* Right Side: High-Contrast Crisp "ĐỂ KHÁM PHÁ ↓" */}
        <span className="relative z-30 text-white/95 text-xs sm:text-[13px] font-semibold tracking-wide ml-3.5 flex items-center gap-1.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
          <span>ĐỂ KHÁM PHÁ</span>
          <ArrowDown className="w-3.5 h-3.5 text-amber-300 animate-bounce ml-0.5" />
        </span>
      </div>
    </div>
  );
}

function HeroCoverSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.55], [0.75, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <div ref={containerRef} className="h-[130vh] relative bg-black">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-black">
        {/* Full-Screen Cinematic Apple Keynote Running Lifestyle Background */}
        <motion.div
          style={{
            scale: shouldReduceMotion ? 1 : bgScale,
            opacity: shouldReduceMotion ? 0.75 : bgOpacity,
          }}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/images/watch/watch-lifestyle-hero-bg.png"
            alt=""
            className="w-full h-full object-cover object-center select-none"
            loading="lazy"
            decoding="async"
          />
          {/* Subtle Balanced Vignette & Overlay to ensure text readability while keeping the image crisp & visible */}
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          {/* Bottom Feather Fade to 100% Solid Black */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/80 to-transparent" />
        </motion.div>

        {/* Foreground Content */}
        <motion.div
          style={{
            scale: shouldReduceMotion ? 1 : scale,
            opacity: shouldReduceMotion ? 1 : opacity,
          }}
          className="relative z-10 w-full max-w-4xl text-center flex flex-col items-center justify-center px-4 sm:px-6 py-12"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.12] drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)]">
            Đồng hành cùng bạn trong từng khoảnh khắc
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-zinc-200 leading-relaxed mb-8 max-w-xl mx-auto font-normal drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            Một ngày bắt đầu bằng chuyển động, tiếp nối bằng tập trung và khép lại trong sự thư thái
          </p>

          {/* Luminous Light Beam Flashlight Scroll Badge */}
          <LuminousScrollBadge />
        </motion.div>
      </div>
    </div>
  );
}

function ParallaxLifestyleItem({
  story,
  index,
  total,
}: {
  story: LifestyleStoryData;
  index: number;
  total: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Entrance scroll progress (from below entering viewport up to sticky center)
  const { scrollYProgress: enterProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start'],
  });

  // Exit scroll progress (from sticky center exiting upward)
  const { scrollYProgress: exitProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const isImageLeft = story.layout === 'image-left';

  // 1. Text entrance animation:
  // For text-left: slide in from left (-100px -> 0px)
  // For text-right: slide in from right (+100px -> 0px)
  const textX = useTransform(
    enterProgress,
    [0.15, 0.8],
    isImageLeft ? [100, 0] : [-100, 0]
  );
  const textOpacity = useTransform(enterProgress, [0.2, 0.65], [0, 1]);

  // 2. Image entrance animation:
  // For image-right: slide in from right (+120px -> 0px)
  // For image-left: slide in from left (-120px -> 0px)
  const imageX = useTransform(
    enterProgress,
    [0.15, 0.8],
    isImageLeft ? [-120, 0] : [120, 0]
  );
  const imageScale = useTransform(enterProgress, [0.15, 0.8], [0.88, 1]);
  const imageOpacity = useTransform(enterProgress, [0.2, 0.65], [0, 1]);

  // 3. Exit Animation (slides up and fades out as next story enters)
  const exitY = useTransform(exitProgress, [0, 0.8], [0, -70]);
  const exitOpacity = useTransform(
    exitProgress,
    [0, 0.8],
    [1, index === total - 1 ? 1 : 0]
  );

  return (
    <div ref={containerRef} className="h-[150vh] relative">
      <div className="sticky top-0 h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{
            y: shouldReduceMotion ? 0 : exitY,
            opacity: shouldReduceMotion ? 1 : exitOpacity,
          }}
          className="relative w-full max-w-6xl flex flex-col justify-center will-change-transform"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* Text Column (Floats directly on dark background) */}
            <motion.div
              style={{
                x: shouldReduceMotion ? 0 : textX,
                opacity: shouldReduceMotion ? 1 : textOpacity,
              }}
              className={`lg:col-span-6 flex flex-col justify-center ${
                isImageLeft ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
              }`}
            >
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3 leading-snug">
                {story.title}
              </h3>

              <MotionSplitText
                text={story.description}
                className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed mb-6 font-normal"
                stagger={0.038}
                delay={0.2}
              />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.3 }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.18,
                      delayChildren: 0.35,
                    },
                  },
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-white/10"
              >
                {story.features.map((feat, fIdx) => (
                  <motion.div
                    key={fIdx}
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 20,
                        scale: 0.94,
                      },
                      visible: {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 95,
                          damping: 20,
                          mass: 0.8,
                        },
                      },
                    }}
                    className="group/feat relative p-4 rounded-2xl bg-white border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.15)] cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.03] hover:shadow-[0_15px_35px_rgba(255,255,255,0.25)] overflow-hidden"
                  >
                    <div className="text-xs font-bold text-black mb-1">
                      {feat.title}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-zinc-600 leading-snug">
                      {feat.subtitle}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Image Column (Floats directly on dark background with subtle shadow/border) */}
            <motion.div
              style={{
                x: shouldReduceMotion ? 0 : imageX,
                scale: shouldReduceMotion ? 1 : imageScale,
                opacity: shouldReduceMotion ? 1 : imageOpacity,
              }}
              className={`lg:col-span-6 rounded-3xl overflow-hidden aspect-[16/10] border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.8)] group ${
                isImageLeft ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
              }`}
            >
              <img
                src={story.image}
                alt={story.imageAlt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function WatchLifestyleSection() {
  return (
    <section id="watch-lifestyle" className="relative bg-black text-white">
      {/* 1. Cover / Hero Intro Header on background */}
      <HeroCoverSection />

      {/* 2. Seamless Parallax Stories directly on background */}
      {LIFESTYLE_STORIES.map((story, i) => (
        <ParallaxLifestyleItem
          key={story.id}
          story={story}
          index={i}
          total={LIFESTYLE_STORIES.length}
        />
      ))}
    </section>
  );
}
