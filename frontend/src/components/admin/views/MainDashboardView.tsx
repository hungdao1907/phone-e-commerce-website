import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleHelloEnglishEffect } from '@/components/ui/AppleHelloEffect';
import { AppleWatchWeatherFace } from '@/components/admin/widgets/AppleWatchWeatherFace';
import { DoanhThuChart } from '@/components/admin/widgets/DoanhThuChart';

export function MainDashboardView() {
  const [showWelcomeText, setShowWelcomeText] = useState(false);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Row: Welcome Banner, Watch, & DoanhThuChart */}
      <div className="flex w-full items-start gap-4">
        {/* Left Area (Hello) */}
        <div
          className="flex-[45] h-[230px] rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center"
          style={{
            backgroundImage: "url('/images/bg_HelloUser.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Decorative Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Content Container */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Apple Hello Drawing Effect */}
            <div className="w-[280px] text-white">
              <AppleHelloEnglishEffect
                speed={1.2}
                onAnimationComplete={() => setShowWelcomeText(true)}
              />
            </div>

            {/* Welcome Text Fades In After Hello Finishes */}
            <AnimatePresence>
              {showWelcomeText && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-semibold text-white/90 tracking-tight">
                    Welcome back, <span className="text-white font-bold">Hung</span>
                  </h1>
                  <p className="text-white/50 mt-1 text-base">
                    Here's what's happening with your store today.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle Area - Apple Watch Weather Face */}
        <div className="flex-none relative flex flex-col items-center justify-start mt-2">
          <div
            className="w-[180px] h-[220px] relative drop-shadow-2xl overflow-hidden"
            style={{ borderRadius: '40px' }}
          >
            <AppleWatchWeatherFace />
          </div>
        </div>

        {/* Right Area - DoanhThuChart */}
        <div className="flex-[55] h-[230px] bg-black/60 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
          <DoanhThuChart />
        </div>
      </div>
    </div>
  );
}
