import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ULTRA3_DESIGN_DATA } from '../../../../data/watch/ultra-3/data/ultra3Data';

interface Ultra3DesignDisplaySectionProps {
  onOpenSpecs?: () => void;
}

type FeatureId = 'titanium' | 'sapphire' | 'nits' | 'action-button';

interface DesignFeature {
  id: FeatureId;
  tag: string;
  title: string;
  desc: string;
  stat: string;
  statLabel: string;
  image: string;
  badge: string;
}

const DESIGN_FEATURES: DesignFeature[] = [
  {
    id: 'titanium',
    tag: 'GRADE 5 TITANIUM',
    title: 'Vỏ Titan 49mm Chuẩn Vũ Trụ',
    desc: 'Được đúc và tiện từ hợp kim Titan Grade 5 — vật liệu được dùng trên tàu vũ trụ nhờ tỷ lệ độ bền trên trọng lượng vượt trội, chống ăn mòn tuyệt đối trước muối biển.',
    stat: '49 MM',
    statLabel: 'KÍCH THƯỚC VỎ',
    image: '/images/watch/ultra3-macro-titanium.jpg',
    badge: 'GRADE 5 TITANIUM CASE',
  },
  {
    id: 'sapphire',
    tag: 'FLAT SAPPHIRE CRYSTAL',
    title: 'Mặt Kính Sapphire Phẳng Tuyệt Đối',
    desc: 'Khung viền titan nhô cao bao bọc lấy các cạnh của tinh thể sapphire phẳng, ngăn chặn mọi va chạm trực tiếp với đá dăm và vách núi sắc nhọn.',
    stat: 'SAPPHIRE',
    statLabel: 'ĐỘ CỨNG CAO NHẤT',
    image: '/images/watch/ultra3-macro-sapphire.jpg',
    badge: 'FLAT SAPPHIRE CRYSTAL',
  },
  {
    id: 'nits',
    tag: 'ALWAYS-ON RETINA',
    title: 'Độ Sáng 3000 Nit Cực Đại',
    desc: 'Màn hình OLED LTPO3 sáng gấp đôi thế hệ trước. Đọc rõ từng vạch la bàn và cao độ ngay dưới ánh nắng chói chang giữa sa mạc hoặc phản chiếu tuyết trắng.',
    stat: '3000 NITS',
    statLabel: 'ĐỘ SÁNG KỶ LỤC',
    image: '/images/watch/ultra3-macro-3000nits.jpg',
    badge: '3000 NITS • ALWAYS-ON RETINA',
  },
  {
    id: 'action-button',
    tag: 'INTERNATIONAL ORANGE',
    title: 'Nút Tác Vụ Đa Năng',
    desc: 'Nút bấm vật lý với màu cam quốc tế nổi bật. Cho phép kích hoạt bài tập, đánh dấu tọa độ, đổi chặng đua triathlon hoặc giữ để kích hoạt còi báo mà không cần nhìn.',
    stat: '1 CHẠM',
    statLabel: 'THAO TÁC TỨC THÌ',
    image: '/images/watch/ultra3-macro-action-button.jpg?v=2',
    badge: 'ACTION BUTTON • ORANGE',
  },
];

export function Ultra3DesignDisplaySection({ onOpenSpecs }: Ultra3DesignDisplaySectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const [[activeFeatureId, direction], setFeatureState] = useState<[FeatureId, number]>(['titanium', 0]);

  const activeFeature =
    DESIGN_FEATURES.find((f) => f.id === activeFeatureId) || DESIGN_FEATURES[0];

  const handleSelectFeature = (newId: FeatureId) => {
    if (newId === activeFeatureId) return;
    const currentIndex = DESIGN_FEATURES.findIndex((f) => f.id === activeFeatureId);
    const nextIndex = DESIGN_FEATURES.findIndex((f) => f.id === newId);
    const newDirection = nextIndex > currentIndex ? 1 : -1;
    setFeatureState([newId, newDirection]);
  };

  const imageSlideVariants: Variants = {
    enter: (dir: number) => ({
      y: shouldReduceMotion ? 0 : (dir >= 0 ? 65 : -65),
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        y: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
      },
    },
    exit: (dir: number) => ({
      y: shouldReduceMotion ? 0 : (dir >= 0 ? -65 : 65),
      opacity: 0,
      scale: 0.98,
      transition: {
        y: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      },
    }),
  };

  return (
    <section
      id={ULTRA3_DESIGN_DATA.sectionId}
      className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#0a0a0d] text-white overflow-hidden scroll-mt-16 select-none"
    >
      {/* Cool Graphite & Brushed Titanium Atmospheric Background */}
      <div className="absolute inset-0 bg-radial from-neutral-800/10 via-transparent to-[#0a0a0d] pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#060608] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#08080a] to-transparent pointer-events-none" />

      {/* Grid line pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center text-center">
        {/* Section Eyebrow */}
        <motion.span
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-white text-luminescent-white uppercase mb-3 block"
        >
          {ULTRA3_DESIGN_DATA.eyebrow}
        </motion.span>

        {/* Section Headline */}
        <motion.h2
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="ultra-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 whitespace-pre-line text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
        >
          {ULTRA3_DESIGN_DATA.title}
        </motion.h2>

        {/* Section Subtitle */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="ultra-body text-sm sm:text-base md:text-lg text-white text-luminescent-white max-w-2xl mx-auto mb-14 leading-relaxed"
        >
          {ULTRA3_DESIGN_DATA.subtitle}
        </motion.p>

        {/* Central Hardware Showcase Card with Entrance Animation */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl bg-[#111115]/85 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl mb-8 text-left relative overflow-hidden"
        >
          {/* Subtle metallic corner sheen reflection */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
            {/* Left Column: Visual Stage (Entrance Reveal + Directional Vertical Slide) */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, x: -20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 flex flex-col items-center justify-center relative w-full"
            >
              <div
                className={`relative w-full aspect-square max-w-[340px] sm:max-w-[400px] lg:max-w-[420px] rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-500 ${
                  activeFeatureId === 'nits'
                    ? 'bg-black border-amber-500/30 shadow-[0_0_50px_rgba(255,165,0,0.25)]'
                    : activeFeatureId === 'action-button'
                    ? 'bg-[#0b0b0e] border-[#ff6700]/30 shadow-[0_0_40px_rgba(255,103,0,0.2)]'
                    : activeFeatureId === 'sapphire'
                    ? 'bg-[#08080b] border-cyan-500/30 shadow-[0_0_40px_rgba(34,211,238,0.15)]'
                    : 'bg-[#0d0d10] border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.8)]'
                }`}
              >
                {/* Subtle feature ambient backdrop glow */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 pointer-events-none z-0 ${
                    activeFeatureId === 'nits'
                      ? 'bg-radial from-amber-500/20 via-orange-500/10 to-transparent opacity-100'
                      : activeFeatureId === 'action-button'
                      ? 'bg-radial from-[#ff6700]/20 via-neutral-900/50 to-transparent opacity-100'
                      : activeFeatureId === 'sapphire'
                      ? 'bg-radial from-cyan-500/15 via-blue-500/5 to-transparent opacity-100'
                      : 'bg-radial from-neutral-600/15 via-transparent to-transparent opacity-100'
                  }`}
                />

                {/* Directional Slide Image Transition (Lướt lên/lướt xuống theo vị trí card) */}
                <div className="relative w-full h-full overflow-hidden z-10">
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={activeFeature.id}
                      custom={direction}
                      variants={imageSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="absolute inset-0 p-2 flex items-center justify-center will-change-transform"
                    >
                      <img
                        src={activeFeature.image}
                        alt={activeFeature.title}
                        className="w-full h-full object-cover rounded-xl select-none transform-gpu"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Top Corner Feature Badge */}
                <div className="absolute top-3.5 left-3.5 z-20">
                  <div className="px-3 py-1.5 rounded-lg bg-black/85 border border-white/20 text-[10px] sm:text-[11px] font-mono font-bold text-white text-luminescent-white backdrop-blur-md flex items-center gap-2 shadow-lg">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeFeatureId === 'action-button'
                          ? 'bg-[#ff6700]'
                          : activeFeatureId === 'nits'
                          ? 'bg-amber-400'
                          : activeFeatureId === 'sapphire'
                          ? 'bg-cyan-400'
                          : 'bg-neutral-300'
                      }`}
                    />
                    <span>{activeFeature.badge}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: 4 Feature Selectors (Staggered Cascade Reveal) */}
            <div className="lg:col-span-6 space-y-3 w-full">
              {DESIGN_FEATURES.map((item, idx) => {
                const isActive = activeFeatureId === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={shouldReduceMotion ? false : { opacity: 0, x: 28, y: 6 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.55,
                      delay: 0.35 + idx * 0.1,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => handleSelectFeature(item.id)}
                    whileHover={{ x: isActive ? 6 : 4 }}
                    whileTap={{ scale: 0.985 }}
                    className={`group relative p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer border flex flex-col justify-between ${
                      isActive
                        ? 'ultra-card-active bg-white/[0.08] border-[#ff6700] shadow-[0_4px_24px_rgba(255,103,0,0.15)] translate-x-1 sm:translate-x-1.5'
                        : 'ultra-card-inactive bg-black/40 border-white/[0.04]'
                    }`}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <div className="absolute left-0 inset-y-3 w-1 bg-[#ff6700] rounded-r-full shadow-[0_0_12px_#ff6700]" />
                    )}

                    <div className="flex items-center justify-between mb-1.5 pl-1.5">
                      <span
                        className={`ultra-card-tag text-[10px] font-mono tracking-widest uppercase font-bold transition-colors duration-200 ${
                          isActive
                            ? 'text-[#ff6700]'
                            : 'text-neutral-500'
                        }`}
                      >
                        {item.tag}
                      </span>
                      <span
                        className={`ultra-card-stat ultra-heading text-xs sm:text-sm font-bold font-mono transition-opacity duration-200 ${
                          isActive
                            ? 'text-white text-luminescent-white opacity-100'
                            : 'text-neutral-500'
                        }`}
                      >
                        {item.stat}
                      </span>
                    </div>

                    <div className="pl-1.5">
                      <h4
                        className={`ultra-card-title ultra-heading text-base sm:text-lg font-bold mb-1 transition-colors duration-200 ${
                          isActive ? 'text-white text-luminescent-white' : 'text-neutral-400'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className={`ultra-card-desc text-xs font-normal leading-relaxed ${
                        isActive ? 'text-white text-luminescent-white' : 'text-neutral-500'
                      }`}>
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Action Button: Technical Specs Modal Trigger */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.75, ease: 'easeOut' }}
          className="flex items-center justify-center"
        >
          <button
            type="button"
            onClick={onOpenSpecs}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white text-luminescent-white hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            <span>Xem đầy đủ thông số vỏ & màn hình</span>
            <ChevronRight className="w-4 h-4 text-[#ff6700]" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
