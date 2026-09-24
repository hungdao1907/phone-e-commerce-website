import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Camera, KeyRound, Headphones, Radio, Compass, Key, Share2 } from 'lucide-react';

interface EcosystemStoryPhase {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  badgeColor: string;
  title: string;
  description: string;
}

const STORY_PHASES: EcosystemStoryPhase[] = [
  {
    id: 'intro',
    icon: Sparkles,
    tag: 'TRUNG TÂM KẾT NỐI',
    badgeColor: 'bg-blue-500/15 border-blue-400/30 text-[#2997ff]',
    title: 'Một chiếc Watch. Cả hệ sinh thái chuyển động.',
    description: 'Apple Watch đóng vai trò trung tâm chỉ huy trên cổ tay, điều phối mọi tương tác của bạn một cách mượt mà và trực quan.',
  },
  {
    id: 'iphone',
    icon: Camera,
    tag: 'ĐIỀU KHIỂN TỪ XA',
    badgeColor: 'bg-blue-500/15 border-blue-400/30 text-[#2997ff]',
    title: 'Điều khiển iPhone ngay từ cổ tay.',
    description: 'Xem trước khung hình camera trực tiếp trên màn hình Watch, chụp ảnh nhóm từ xa và nhận thông báo quan trọng mà không cần lấy iPhone ra.',
  },
  {
    id: 'mac',
    icon: KeyRound,
    tag: 'MỞ KHÓA TỰ ĐỘNG',
    badgeColor: 'bg-purple-500/15 border-purple-400/30 text-purple-300',
    title: 'Đến gần. Mac đã sẵn sàng.',
    description: 'Chỉ cần đeo Apple Watch trên tay và ngồi xuống, máy tính Mac tự động mở khóa tức thì mà không cần nhập mật khẩu hay chạm vào cảm biến.',
  },
  {
    id: 'airpods',
    icon: Headphones,
    tag: 'ÂM THANH LIỀN MẠCH',
    badgeColor: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300',
    title: 'Âm thanh luôn theo cùng bạn.',
    description: 'Tự động định tuyến nhạc, podcast và âm thanh cuộc gọi giữa Apple Watch, iPhone và tai nghe AirPods mà không bị gián đoạn.',
  },
  {
    id: 'cellular',
    icon: Radio,
    tag: 'TỰ DO ĐỘC LẬP',
    badgeColor: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    title: 'Để iPhone ở lại. Vẫn luôn kết nối.',
    description: 'Với phiên bản GPS + Cellular và eSIM tương thích, bạn hoàn toàn tự do chạy bộ ngoài trời mà vẫn có thể nghe gọi, nhắn tin và phát nhạc trực tuyến.',
  },
  {
    id: 'all',
    icon: Sparkles,
    tag: 'HỆ SINH THÁI ĐỒNG BỘ',
    badgeColor: 'bg-white/10 border-white/20 text-white',
    title: 'Một hệ sinh thái. Một trải nghiệm liền mạch.',
    description: 'Tất cả thiết bị Apple vận hành như một thể thống nhất, giúp mọi công việc và giải trí hàng ngày của bạn diễn ra tự nhiên hơn bao giờ hết.',
  },
];

const RECAP_CARDS = [
  {
    icon: Compass,
    tag: 'CHIP UWB THẾ HỆ 2',
    title: 'Tìm iPhone Bằng Radar Chỉ Hướng',
    desc: 'Màn hình Watch hiển thị la bàn và khoảng cách thực tế đến từng centimet để bạn tìm thấy iPhone ngay cả khi để chế độ im lặng.',
  },
  {
    icon: Key,
    tag: 'APPLE CARKEY & HOMEKEY',
    title: 'Mở Khóa Xe & Nhà Không Cần Chìa',
    desc: 'Chỉ cần đưa cổ tay đến gần tay nắm cửa để mở khóa xe hơi và nhà thông minh qua Apple Wallet, hoạt động cả khi máy hết pin.',
  },
  {
    icon: Share2,
    tag: 'AUDIO SHARING & LIVE LISTEN',
    title: 'Phát Đồng Thời 2 Cặp AirPods',
    desc: 'Kết nối đồng thời 2 bộ tai nghe AirPods từ một chiếc Apple Watch để hai người cùng nghe nhạc, hoặc dùng làm micro trợ thính từ xa.',
  },
  {
    icon: Sparkles,
    tag: 'CỬ CHỈ DOUBLE TAP',
    title: 'Búng Ngón Tay Điều Khiển Hệ Thống',
    desc: 'Chạm hai ngón tay vào nhau để trả lời cuộc gọi, dừng báo thức hay chụp ảnh từ xa mà không cần chạm tay vào màn hình bất kỳ thiết bị nào.',
  },
];

interface RecapCardData {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  desc: string;
}

const RecapFeatureCard: React.FC<{ card: RecapCardData }> = ({ card }) => {
  const Icon = card.icon;
  return (
    <div className="group cursor-pointer transform transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 h-full flex flex-col">
      <div className="text-white rounded-2xl border border-white/10 bg-gradient-to-br from-[#050507] via-[#0e0f14] to-[#050507] shadow-2xl relative backdrop-blur-xl overflow-hidden hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] h-full min-h-[350px] sm:min-h-[370px] flex flex-col justify-between transition-all duration-500">
        {/* Ambient background light bursts */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/10 opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-gradient-to-tr from-white/10 to-transparent blur-3xl opacity-30 group-hover:opacity-50 transform group-hover:scale-110 transition-all duration-700 animate-bounce" />
          <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-white/5 blur-xl animate-ping" />
          <div className="absolute bottom-12 right-12 w-12 h-12 rounded-full bg-white/5 blur-lg animate-ping" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
        </div>

        {/* Card Content */}
        <div className="p-5 sm:p-6 relative z-10 flex flex-col items-center text-center h-full justify-between flex-1">
          <div className="flex flex-col items-center w-full">
            {/* Pulsing Icon Sphere */}
            <div className="relative mb-4 flex items-center justify-center h-12">
              <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse" />
              <div className="p-3.5 rounded-full backdrop-blur-lg border border-white/20 bg-gradient-to-br from-black/90 to-black/70 shadow-2xl transform group-hover:scale-110 transition-all duration-500 hover:shadow-white/20 flex items-center justify-center">
                <div className="transform transition-transform duration-700 ease-out group-hover:rotate-[360deg] text-white">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Category Tag */}
            <div className="min-h-[1.25rem] flex items-center justify-center mb-1.5 w-full">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#2997ff] text-center">
                {card.tag}
              </span>
            </div>

            {/* Feature Title */}
            <div className="min-h-[2.75rem] sm:min-h-[3rem] flex items-center justify-center mb-2 w-full">
              <h4 className="text-[15px] sm:text-base font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-300 leading-snug text-center">
                {card.title}
              </h4>
            </div>

            {/* Feature Description */}
            <div className="min-h-[4.5rem] sm:min-h-[4.75rem] flex items-start justify-center w-full">
              <p className="text-gray-300 text-xs sm:text-[13px] leading-relaxed transform group-hover:text-white transition-colors duration-300 text-center">
                {card.desc}
              </p>
            </div>
          </div>

          {/* Bottom Accent & Bouncing Dots */}
          <div className="flex flex-col items-center w-full mt-auto pt-3">
            <div className="w-1/3 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full transform group-hover:w-1/2 group-hover:h-1 group-hover:via-white transition-all duration-500 animate-pulse" />

            <div className="flex space-x-1.5 mt-2.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        </div>

        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-white/15 to-transparent rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-white/15 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  );
};

export function WatchEcosystemSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  // Primary scroll-driven narrative timeline: 0.00 -> 1.00
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track exact active phase cleanly with zero text overlap
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    let index = 0;
    if (latest < 0.16) index = 0;
    else if (latest < 0.33) index = 1;
    else if (latest < 0.50) index = 2;
    else if (latest < 0.67) index = 3;
    else if (latest < 0.83) index = 4;
    else index = 5;

    setActivePhaseIndex(index);
  });

  // Watch Scale & Opacity transitions
  const watchScale = useTransform(scrollYProgress, [0, 0.12, 0.67, 0.78, 0.84, 1], [0.92, 1, 1, 1.08, 1, 1]);
  const watchGlowOpacity = useTransform(scrollYProgress, [0, 0.12, 0.67, 0.78, 1], [0.3, 0.6, 0.6, 1, 0.7]);
  const cellularBadgeOpacity = useTransform(scrollYProgress, [0.65, 0.70, 0.81, 0.85], [0, 1, 1, 0]);

  // iPhone: Enters Phase 1 (0.16), dims in Phase 2 & 3, fades in Phase 4, settles in Phase 5
  const iphoneOpacity = useTransform(
    scrollYProgress,
    [0.12, 0.18, 0.30, 0.36, 0.64, 0.70, 0.80, 0.86],
    [0, 1, 1, 0.35, 0.35, 0.1, 0.1, 0.95]
  );
  const iphoneX = useTransform(scrollYProgress, [0.12, 0.22, 0.83, 1], [70, 0, 0, 0]);
  const iphoneScale = useTransform(scrollYProgress, [0.12, 0.22, 0.66, 0.74, 0.84, 1], [0.85, 1, 1, 0.9, 0.95, 0.95]);

  // Mac: Enters Phase 2 (0.33), dims in Phase 3 & 4, settles in Phase 5
  const macOpacity = useTransform(
    scrollYProgress,
    [0.28, 0.36, 0.47, 0.53, 0.80, 0.86],
    [0, 1, 1, 0.35, 0.35, 0.95]
  );
  const macY = useTransform(scrollYProgress, [0.28, 0.38, 0.83, 1], [-50, 0, 0, 0]);
  const macScale = useTransform(scrollYProgress, [0.28, 0.38, 0.83, 1], [0.88, 1, 1, 0.95]);

  // AirPods: Enters Phase 3 (0.50), dims in Phase 4, settles in Phase 5
  const airpodsOpacity = useTransform(
    scrollYProgress,
    [0.45, 0.53, 0.64, 0.70, 0.80, 0.86],
    [0, 1, 1, 0.25, 0.25, 0.95]
  );
  const airpodsX = useTransform(scrollYProgress, [0.45, 0.55, 0.83, 1], [-70, 0, 0, 0]);
  const airpodsScale = useTransform(scrollYProgress, [0.45, 0.55, 0.83, 1], [0.85, 1, 1, 0.95]);

  // Connection Beam Opacities
  const beamIphoneOpacity = useTransform(scrollYProgress, [0.15, 0.22, 0.31, 0.37, 0.81, 0.87], [0, 0.85, 0.85, 0.2, 0.2, 0.7]);
  const beamMacOpacity = useTransform(scrollYProgress, [0.32, 0.39, 0.48, 0.54, 0.81, 0.87], [0, 0.85, 0.85, 0.2, 0.2, 0.7]);
  const beamAirpodsOpacity = useTransform(scrollYProgress, [0.49, 0.56, 0.65, 0.71, 0.81, 0.87], [0, 0.85, 0.85, 0.2, 0.2, 0.7]);

  // Active Phase Story Item
  const activeStory = STORY_PHASES[activePhaseIndex];
  const ActiveIcon = activeStory.icon;

  // Reduced motion static fallback
  if (shouldReduceMotion) {
    return (
      <section className="watch-section-normal bg-[#08080a] text-white relative overflow-hidden py-16 sm:py-20 border-t border-white/5">
        <div className="w-full max-w-6xl xl:max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold tracking-widest text-[#2997ff] uppercase mb-2 block">
              Hệ Sinh Thái Apple
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Tốt hơn khi ở bên nhau.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Apple Watch kết nối liền mạch với iPhone, AirPods và Mac để những việc bạn làm mỗi ngày diễn ra tự nhiên hơn.
            </p>
          </div>

          {/* Static Constellation Stage */}
          <div className="relative max-w-4xl mx-auto aspect-[16/10] bg-zinc-950/70 rounded-3xl border border-white/10 p-6 flex items-center justify-center mb-12">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Mac Top */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 sm:w-64">
                <img src="/images/watch/ecosystem-macbook.png" alt="MacBook Pro" className="w-full h-auto object-contain drop-shadow-xl" />
              </div>
              {/* AirPods Left */}
              <div className="absolute left-4 sm:left-12 top-1/2 -translate-y-1/2 w-28 sm:w-36">
                <img src="/images/watch/ecosystem-airpods.png" alt="AirPods Pro" className="w-full h-auto object-contain drop-shadow-xl" />
              </div>
              {/* Watch Center */}
              <div className="relative z-10 w-32 sm:w-44">
                <img src="/images/watch/watch-series11-studio.png" alt="Apple Watch" className="w-full h-auto object-contain drop-shadow-2xl" />
              </div>
              {/* iPhone Right */}
              <div className="absolute right-4 sm:right-12 top-1/2 -translate-y-1/2 w-24 sm:w-32">
                <img src="/images/watch/ecosystem-iphone.png" alt="iPhone 16 Pro" className="w-full h-auto object-contain drop-shadow-xl" />
              </div>
            </div>
          </div>

          {/* Recap Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {RECAP_CARDS.map((card, idx) => (
              <RecapFeatureCard key={idx} card={card} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-black text-white border-t border-white/10">
      {/* 1. Scroll-Driven Story Track (320vh) */}
      <div ref={containerRef} className="relative w-full bg-black" style={{ height: '320vh' }}>
        {/* Sticky Cinematic Viewport */}
        <div className="sticky top-0 h-screen w-full flex flex-col justify-between overflow-hidden px-4 sm:px-6 lg:px-8 py-5 sm:py-7 select-none bg-black">
          {/* Background White Wave Resonance (Nền đen tuyền, trung tâm tỏa sóng ánh sáng trắng) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black flex items-center justify-center">
            {/* 1. Core White Spotlight Glow */}
            <div className="absolute w-[500px] sm:w-[680px] md:w-[820px] h-[500px] sm:h-[680px] md:h-[820px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_38%,rgba(255,255,255,0.02)_60%,transparent_72%)] blur-[90px]" />

            {/* 2. Concentric Expanding White Wave Ripples (Sóng ánh sáng trắng lan tỏa) */}
            <div className="absolute w-[260px] sm:w-[340px] h-[260px] sm:h-[340px] rounded-full border border-white/30 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50" />
            <div className="absolute w-[420px] sm:w-[520px] h-[420px] sm:h-[520px] rounded-full border border-white/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1.3s] opacity-40" />
            <div className="absolute w-[580px] sm:w-[700px] h-[580px] sm:h-[700px] rounded-full border border-white/15 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_2.6s] opacity-30" />
            <div className="absolute w-[740px] sm:w-[880px] h-[740px] sm:h-[880px] rounded-full border border-white/10 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_3.8s] opacity-20" />

            {/* 3. Subtle Static/Breathing Ambient Wave Rings */}
            <div className="absolute w-[220px] sm:w-[280px] h-[220px] sm:h-[280px] rounded-full border border-white/25 bg-white/[0.03] shadow-[0_0_60px_rgba(255,255,255,0.18)]" />
            <div className="absolute w-[380px] sm:w-[460px] h-[380px] sm:h-[460px] rounded-full border border-white/15" />
            <div className="absolute w-[540px] sm:w-[640px] h-[540px] sm:h-[640px] rounded-full border border-white/10" />
            <div className="absolute w-[700px] sm:w-[820px] h-[700px] sm:h-[820px] rounded-full border border-white/5" />
          </div>

          {/* Section Top Header (Persistent) */}
          <div className="relative z-20 text-center max-w-2xl lg:max-w-3xl mx-auto pt-2 sm:pt-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-zinc-200 mb-2 border border-white/15 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-white" />
              <span>Hệ Sinh Thái Apple</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-1.5 leading-tight">
              Tốt hơn khi ở bên nhau.
            </h2>
            <p className="text-xs sm:text-sm md:text-[15px] text-white/90 leading-relaxed max-w-xl mx-auto font-normal">
              Apple Watch kết nối liền mạch với iPhone, AirPods và Mac để những việc bạn làm mỗi ngày diễn ra tự nhiên hơn.
            </p>
          </div>

          {/* Ecosystem Interactive Constellation Stage */}
          <div className="relative z-10 flex-1 flex items-center justify-center w-full max-w-5xl mx-auto my-1 sm:my-2">
            <div className="relative w-full h-[260px] sm:h-[320px] md:h-[360px] lg:h-[400px] flex items-center justify-center">

              {/* SVG Connection Rays & Signals between Watch & Devices */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 800 400"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Glowing gradients */}
                  <linearGradient id="beamToIphone" x1="50%" y1="50%" x2="80%" y2="50%">
                    <stop offset="0%" stopColor="#2997ff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#2997ff" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="beamToMac" x1="50%" y1="50%" x2="50%" y2="15%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="beamToAirpods" x1="50%" y1="50%" x2="20%" y2="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                  </linearGradient>
                </defs>

                {/* Beam to iPhone (Right) */}
                <motion.line
                  x1="430"
                  y1="200"
                  x2="620"
                  y2="200"
                  stroke="url(#beamToIphone)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  style={{ opacity: beamIphoneOpacity }}
                />

                {/* Beam to Mac (Top) */}
                <motion.line
                  x1="400"
                  y1="160"
                  x2="400"
                  y2="70"
                  stroke="url(#beamToMac)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  style={{ opacity: beamMacOpacity }}
                />

                {/* Beam to AirPods (Left) */}
                <motion.line
                  x1="370"
                  y1="200"
                  x2="180"
                  y2="200"
                  stroke="url(#beamToAirpods)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  style={{ opacity: beamAirpodsOpacity }}
                />
              </svg>

              {/* 1. TOP DEVICE: MacBook Pro M4 */}
              <motion.div
                style={{
                  opacity: macOpacity,
                  y: macY,
                  scale: macScale,
                }}
                className="absolute top-0 sm:top-1 left-1/2 -translate-x-1/2 w-44 sm:w-60 md:w-68 lg:w-76 z-10 flex flex-col items-center pointer-events-none"
              >
                <img
                  src="/images/watch/ecosystem-macbook.png"
                  alt="MacBook Pro M4"
                  className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>

              {/* 2. LEFT DEVICE: AirPods 4 ANC */}
              <motion.div
                style={{
                  opacity: airpodsOpacity,
                  x: airpodsX,
                  scale: airpodsScale,
                }}
                className="absolute left-2 sm:left-6 md:left-12 lg:left-16 top-1/2 -translate-y-1/2 w-28 sm:w-36 md:w-44 lg:w-48 z-10 flex flex-col items-center pointer-events-none"
              >
                <img
                  src="/images/watch/ecosystem-airpods.png"
                  alt="AirPods 4 ANC"
                  className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>

              {/* 3. CENTER ANCHOR: Apple Watch (The Hub) */}
              <div className="relative z-20 flex items-center justify-center">
                {/* Radial White Halo directly behind Apple Watch */}
                <motion.div
                  style={{ opacity: watchGlowOpacity }}
                  className="absolute w-44 sm:w-60 h-44 sm:h-60 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0.18)_40%,transparent_70%)] blur-2xl pointer-events-none"
                />

                <motion.div
                  style={{
                    scale: watchScale,
                  }}
                  className="relative w-36 sm:w-44 md:w-52 lg:w-56 cursor-pointer group"
                >
                  <img
                    src="/images/watch/watch-series11-studio.png"
                    alt="Apple Watch Series 11 Hub"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)] transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Cellular LTE Indicator Badge Overlay on Watch in Phase E */}
                  <motion.div
                    style={{ opacity: cellularBadgeOpacity }}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold tracking-wide backdrop-blur-md flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>eSIM 4G Active</span>
                  </motion.div>
                </motion.div>
              </div>

              {/* 4. RIGHT DEVICE: iPhone 16 Pro Max */}
              <motion.div
                style={{
                  opacity: iphoneOpacity,
                  x: iphoneX,
                  scale: iphoneScale,
                }}
                className="absolute right-2 sm:right-6 md:right-12 lg:right-16 top-1/2 -translate-y-1/2 w-24 sm:w-32 md:w-38 lg:w-42 z-10 flex flex-col items-center pointer-events-none"
              >
                <img
                  src="/images/watch/ecosystem-iphone.png"
                  alt="iPhone 16 Pro Max"
                  className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </div>
          </div>

          {/* Dynamic Contextual Callout Display with AnimatePresence (ZERO OVERLAP GUARANTEE) */}
          <div className="relative z-20 w-full max-w-xl mx-auto pb-2 sm:pb-4">
            <div className="relative min-h-[96px] sm:min-h-[105px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStory.id}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="flex flex-col items-center text-center justify-center max-w-lg px-2"
                >
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-2 backdrop-blur-md ${activeStory.badgeColor}`}
                  >
                    <ActiveIcon className="w-3.5 h-3.5" />
                    <span>{activeStory.tag}</span>
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1.5 tracking-tight">
                    {activeStory.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-white/95 leading-relaxed max-w-md font-normal">
                    {activeStory.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Minimal 6-Step Story Indicator Pills - Pure White */}
            <div className="flex items-center justify-center gap-1.5 mt-2">
              {STORY_PHASES.map((phase, step) => {
                const isActive = activePhaseIndex === step;
                return (
                  <div
                    key={phase.id}
                    className={`h-1 rounded-full transition-all duration-300 ${isActive ? 'w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]' : 'w-5 bg-white/25'
                      }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recap Feature Cards Tray at Bottom - Crisp Apple White Theme */}
      <div className="relative z-30 bg-white text-zinc-900 border-t border-black/5 py-14 sm:py-20 overflow-hidden">
        {/* Ambient 3D Apple Logo with Floor Shadow in Corner */}
        <div className="absolute -top-4 sm:top-4 right-2 sm:right-8 md:right-16 w-24 sm:w-36 md:w-44 lg:w-52 pointer-events-none opacity-80 sm:opacity-90 select-none z-0">
          <img
            src="/images/watch/apple-3d-logo-shadow.png"
            alt="Apple 3D Logo"
            className="w-full h-auto object-contain"
            loading="lazy"
          />
        </div>

        <div className="w-full max-w-6xl xl:max-w-[1140px] mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black mb-2 tracking-tight">
              Những siêu năng lực hệ sinh thái ít người biết
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-zinc-600 leading-relaxed font-normal">
              Những tính năng kết nối thông minh và kỳ diệu giúp nâng tầm toàn diện trải nghiệm Apple của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {RECAP_CARDS.map((card, idx) => (
              <RecapFeatureCard key={idx} card={card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
