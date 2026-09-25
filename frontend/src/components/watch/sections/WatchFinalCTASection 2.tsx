import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ArrowRight, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { StarButton } from '@/components/ui/StarButton';
import { FINAL_WATCH_MODELS } from '../../../data/watch/data/index';

export function WatchFinalCTASection() {
  const [selectedId, setSelectedId] = useState<string>('series-11');
  const shouldReduceMotion = useReducedMotion();

  const selectedModel =
    FINAL_WATCH_MODELS.find((m) => m.id === selectedId) || FINAL_WATCH_MODELS[1];

  const navigate = useNavigate();

  const handleScrollToModels = () => {
    if (selectedId === 'series-11') {
      navigate('/watch/series-11');
      return;
    }
    if (selectedId === 'se-3') {
      navigate('/watch/se-3');
      return;
    }
    if (selectedId === 'ultra-3') {
      navigate('/watch/ultra-3');
      return;
    }
    const el = document.getElementById('watch-models');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.25,
        delayChildren: shouldReduceMotion ? 0 : 0.2,
      },
    },
  };

  const headerSlideDown: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: -30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: shouldReduceMotion ? 0 : 1.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const itemFadeUp: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, y: 35, filter: 'blur(12px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: shouldReduceMotion ? 0 : 1.2,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const watchDescentVariants: Variants = {
    hidden: shouldReduceMotion
      ? { opacity: 0 }
      : { opacity: 0, scale: 1.12, y: -60, filter: 'blur(16px)' },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: shouldReduceMotion ? 0 : 1.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <section
      id="watch-final-cta"
      className="relative w-full min-h-[100svh] bg-black text-white py-20 sm:py-28 lg:py-32 overflow-hidden select-none flex flex-col justify-center items-center"
      style={{ backgroundColor: '#000000' }}
      aria-label="Khu vực quyết định chọn mua Apple Watch"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        className="watch-container relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center text-center px-4 sm:px-6"
      >
        {/* 1. EYEBROW + HEADLINE + DESCRIPTION */}
        <motion.div
          variants={headerSlideDown}
          className="max-w-2xl mx-auto flex flex-col items-center"
        >
          {/* Animated Neon Fluid Motion Graphic - Feathered Radial Mask */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 relative flex items-center justify-center mb-2 sm:mb-3"
            style={{
              maskImage: 'radial-gradient(circle at center, black 45%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 45%, transparent 80%)',
            }}
          >
            {/* Soft Ambient Glow */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-fuchsia-500/20 to-amber-500/20 blur-lg pointer-events-none"
              aria-hidden="true"
            />
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/images/watch/watch-final-accent-poster.jpg"
              className="w-full h-full object-contain relative z-10 mix-blend-screen pointer-events-none"
            >
              <source src="/videos/watch/watch-final-accent.mp4" type="video/mp4" />
            </video>
          </div>

          <span className="text-xs sm:text-sm font-semibold tracking-[0.08em] text-white uppercase block mb-3 drop-shadow-[0_0_12px_rgba(255,255,255,0.75)]">
            KIỆT TÁC TRÊN CỔ TAY
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-3 leading-tight">
            <span className="watch-rainbow-text">
              Mỗi chi tiết đều có lý do
            </span>
            <br className="hidden sm:inline" />
            <span className="watch-rainbow-text">
              Mỗi khoảnh khắc đều được đo đếm
            </span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-white/95 leading-relaxed font-normal mb-6 sm:mb-8 max-w-lg mx-auto drop-shadow-[0_0_14px_rgba(255,255,255,0.6)]">
            Tinh xảo trong từng chi tiết. Thông minh trong từng khoảnh khắc.
          </p>
        </motion.div>

        {/* 2. LARGE WATCH HERO STAGE WITH ZERO-G LEVITATION */}
        <motion.div
          variants={watchDescentVariants}
          className="relative w-full max-w-[500px] h-[300px] sm:h-[380px] md:h-[420px] flex items-center justify-center my-2 sm:my-4"
        >
          {/* Continuous Zero-Gravity Gentle Levitation */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    y: [-4, 5, -4],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative z-10 w-full h-full flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedModel.id}
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.985, y: 8 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.985 }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative z-10 w-full h-full flex items-center justify-center"
              >
                <img
                  src={selectedModel.image}
                  alt={selectedModel.name}
                  className="w-full h-full object-contain max-h-[clamp(260px,36vw,420px)] drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Soft Ground Contact Shadow */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [0.95, 1.05, 0.95],
                    opacity: [0.7, 0.9, 0.7],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-6 bg-black/80 rounded-full blur-xl pointer-events-none"
            aria-hidden="true"
          />
        </motion.div>

        {/* 3. DYNAMIC PRODUCT INFO (NAME, TAGLINE, PRICE) - ZERO LAYOUT SHIFT */}
        <motion.div
          variants={itemFadeUp}
          className="h-[116px] sm:h-[126px] relative w-full max-w-lg mx-auto mb-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedModel.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center px-2"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight mb-1">
                {selectedModel.name}
              </h3>
              <div className="h-10 sm:h-11 flex items-center justify-center">
                <p className="text-xs sm:text-sm md:text-base text-[#a1a1a6] font-medium leading-snug max-w-md mx-auto">
                  {selectedModel.tagline}
                </p>
              </div>
              <div className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                {selectedModel.startingPrice}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* 4. MINIMAL SEGMENTED MODEL SELECTOR */}
        <motion.div
          variants={itemFadeUp}
          className="mb-8 sm:mb-10"
        >
          <div
            role="tablist"
            aria-label="Chọn dòng Apple Watch"
            className="inline-flex items-center p-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md relative"
          >
            {FINAL_WATCH_MODELS.map((model) => {
              const isSelected = selectedId === model.id;
              return (
                <button
                  key={model.id}
                  role="tab"
                  id={`tab-${model.id}`}
                  aria-selected={isSelected}
                  aria-controls={`panel-${model.id}`}
                  onClick={() => setSelectedId(model.id)}
                  className={`relative px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500 z-10 ${isSelected
                    ? 'text-black'
                    : 'text-[#86868b] hover:text-white'
                    }`}
                >
                  {/* Smooth Spring Sliding Pill Indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="active-model-pill"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 35,
                      }}
                      className="absolute inset-0 bg-white rounded-full shadow-md z-0"
                    />
                  )}
                  <span className="relative z-10">{model.shortName}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* 5. DUAL CTA BUTTONS (PRIMARY + SECONDARY) - FIXED WIDTH */}
        <motion.div
          variants={itemFadeUp}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-12 sm:mb-16"
        >
          {/* Primary CTA (Path A) - StarButton Effect with Constant Fixed Width */}
          <StarButton
            variant="primary"
            onClick={handleScrollToModels}
            className="w-full sm:w-[205px] h-[48px] sm:h-[52px] shrink-0"
          >
            <span>Chọn {selectedModel.shortName}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </StarButton>

          {/* Secondary CTA (Path B) - Black Background with Luminescent Glowing White Text */}
          <button
            type="button"
            onClick={handleScrollToModels}
            className="w-full sm:w-[205px] h-[48px] sm:h-[52px] rounded-full font-bold text-xs sm:text-sm bg-black hover:bg-zinc-950 text-white border border-white/25 hover:border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-white shrink-0"
          >
            <span className="drop-shadow-[0_0_12px_rgba(255,255,255,0.85)]">
              Khám phá các mẫu
            </span>
          </button>
        </motion.div>

        {/* 6. LIGHTWEIGHT REASSURANCE TRUST STRIP WITH ANIMATED LASER DIVIDER */}
        <motion.div
          variants={itemFadeUp}
          className="w-full max-w-4xl pt-10 sm:pt-12 relative"
        >
          {/* Animated Glowing Laser Divider Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent overflow-hidden pointer-events-none">
            {!shouldReduceMotion && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '350%' }}
                transition={{
                  repeat: Infinity,
                  duration: 3.2,
                  ease: 'easeInOut',
                  repeatDelay: 0.5,
                }}
                className="w-48 sm:w-64 h-[2px] -top-[0.5px] relative bg-gradient-to-r from-transparent via-cyan-400 via-blue-500 to-transparent shadow-[0_0_10px_rgba(56,189,248,0.9)]"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center md:text-left">
            {/* Item 1: Free Delivery */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white mb-0.5">
                  GIAO HÀNG MIỄN PHÍ
                </div>
                <div className="text-xs text-[#86868b]">
                  Giao nhanh và an tâm.
                </div>
              </div>
            </div>

            {/* Item 2: Trade-in */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white mb-0.5">
                  THU CŨ ĐỔI MỚI
                </div>
                <div className="text-xs text-[#86868b]">
                  Nhận giá trị cho thiết bị bạn đang dùng.
                </div>
              </div>
            </div>

            {/* Item 3: Official Warranty */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 text-zinc-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white mb-0.5">
                  BẢO HÀNH CHÍNH HÃNG
                </div>
                <div className="text-xs text-[#86868b]">
                  Hỗ trợ và bảo hành chính hãng.
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
