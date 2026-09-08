import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Info } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { StarButton } from '../../../../components/ui/star-button';
import { Series11SpecsModal } from '../components/Series11SpecsModal';

export function Series11FinalCTASection() {
  const shouldReduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);

  const handleBuyNow = () => {
    navigate('/watch#watch-models');
  };

  return (
    <section className="relative w-full overflow-hidden bg-[#07080d] select-none border-t border-white/10">
      {/* Full-Bleed Panoramic Background */}
      <div className="relative w-full aspect-[16/7] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-end">
        {/* Full Edge-to-Edge Enhanced Banner Image */}
        <img
          src="/images/watch/watch-series11-final-banner.png"
          alt="Apple Watch Series 11 - The Future of Connection & Health"
          className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
          loading="lazy"
        />

        {/* Subtle Ambient Vignette for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07080d]/40 via-transparent to-transparent pointer-events-none" />

        {/* Harmonious Left CTA Placement Aligned Under Slogan */}
        <div className="absolute left-[5.5%] sm:left-[6.5%] md:left-[7.5%] bottom-[13%] sm:bottom-[16%] md:bottom-[18%] z-20">
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.1 }}
            className="flex items-center gap-3 sm:gap-4 flex-wrap"
          >
            {/* Primary Buy Now Button with 21st.dev StarButton Animation */}
            <StarButton
              lightColor="#2997ff"
              lightWidth={140}
              duration={2.8}
              backgroundColor="rgba(10, 14, 26, 0.94)"
              borderWidth={1.5}
              className="text-white hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(41,151,255,0.35)] hover:shadow-[0_0_45px_rgba(41,151,255,0.6)]"
              onClick={handleBuyNow}
            >
              <span className="flex items-center gap-2.5 text-white tracking-wide text-sm sm:text-base md:text-lg font-bold">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#2997ff] shrink-0 animate-pulse" />
                <span className="bg-gradient-to-r from-white via-neutral-100 to-blue-200 bg-clip-text text-transparent">
                  Mua ngay
                </span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#2997ff] shrink-0 transition-transform duration-300 group-hover/star-button:translate-x-1" />
              </span>
            </StarButton>

            {/* Secondary Specifications Details Button */}
            <button
              type="button"
              onClick={() => setIsSpecsModalOpen(true)}
              className="group inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 hover:border-white/35 backdrop-blur-md transition-all duration-300 shadow-xl shadow-black/40 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#2997ff] transition-transform duration-300 group-hover:scale-110" />
              <span>Chi tiết</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Detailed Specifications Modal Dialog */}
      <Series11SpecsModal
        isOpen={isSpecsModalOpen}
        onClose={() => setIsSpecsModalOpen(false)}
      />
    </section>
  );
}

