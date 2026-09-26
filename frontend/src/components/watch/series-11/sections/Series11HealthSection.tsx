import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart, Moon, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { SERIES_11_HEALTH_PANELS } from '../../../../data/watch/series-11/data/series11Data';

export function Series11HealthSection() {
  const [activeTab, setActiveTab] = useState<'heart' | 'sleep' | 'recovery'>('heart');
  const shouldReduceMotion = useReducedMotion();

  const currentPanel =
    SERIES_11_HEALTH_PANELS.find((p) => p.id === activeTab) || SERIES_11_HEALTH_PANELS[0];

  const getTabIcon = (id: string) => {
    switch (id) {
      case 'heart':
        return <Heart className="w-4 h-4" />;
      case 'sleep':
        return <Moon className="w-4 h-4" />;
      case 'recovery':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getAmbientGlow = (id: string) => {
    switch (id) {
      case 'heart':
        return 'from-rose-600/15 via-red-950/5';
      case 'sleep':
        return 'from-indigo-600/15 via-purple-950/5';
      case 'recovery':
        return 'from-emerald-600/15 via-teal-950/5';
      default:
        return 'from-blue-600/15 via-blue-950/5';
    }
  };

  const getBadgeColor = (id: string) => {
    switch (id) {
      case 'heart':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'sleep':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'recovery':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <section id="s11-health" className="series11-section bg-black text-white relative overflow-hidden">
      {/* Dynamic Ambient Color Wash */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] sm:w-[1250px] h-[550px] sm:h-[750px] bg-radial ${getAmbientGlow(
          activeTab
        )} to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-700`}
      />

      <div className="series11-container relative z-10">
        {/* Left-Aligned Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-16 text-left">
          <span className="text-xs sm:text-sm font-bold tracking-widest text-[#2997ff] uppercase mb-2 sm:mb-3 block">
            SỨC KHỎE & HỒI PHỤC
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2 sm:mb-3 leading-[1.14]">
            Hiểu cơ thể bạn sâu hơn. <br />
            Cả ngày lẫn đêm.
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-normal leading-relaxed max-w-xl">
            Series 11 liên tục theo dõi các tín hiệu sinh học quan trọng, từ nhịp tim, nhịp thở đến từng giai đoạn ngủ, giúp bạn nhận biết sự thay đổi của cơ thể theo thời gian.
          </p>
        </div>

        {/* Narrative Interactive Filter Tabs */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3.5 mb-10 sm:mb-14">
          {SERIES_11_HEALTH_PANELS.map((panel) => {
            const isActive = activeTab === panel.id;
            return (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActiveTab(panel.id)}
                className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.3)] scale-102'
                    : 'bg-white/[0.04] text-neutral-400 hover:text-white hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                {getTabIcon(panel.id)}
                <span>{panel.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Immersive Expansive Split Canvas (38% Narrative Left / 62% Panoramic Visual Right) */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPanel.id}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -15 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
            >
              {/* Narrative Column (~38% width -> 5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-start text-left">
                <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border ${getBadgeColor(currentPanel.id)}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentPanel.stats}</span>
                </div>

                <h3 className="text-2xl sm:text-4xl font-black text-white mb-4 leading-tight">
                  {currentPanel.headline}
                </h3>
                
                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed mb-8 font-normal">
                  {currentPanel.description}
                </p>

                {/* Key Points */}
                <div className="flex flex-col gap-4 w-full pt-2">
                  {currentPanel.points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-xs sm:text-sm text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-[#2997ff] shrink-0 mt-0.5" />
                      <span className="leading-relaxed font-normal">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panoramic Visual Column (~62% width -> 7 cols) */}
              <div className="lg:col-span-7 flex items-center justify-center">
                <div className="relative w-full aspect-[16/10] rounded-3xl overflow-hidden border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.8)] bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
                  <img
                    src={currentPanel.image}
                    alt={currentPanel.title}
                    className="w-full h-full max-h-[340px] sm:max-h-[400px] object-contain select-none transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
