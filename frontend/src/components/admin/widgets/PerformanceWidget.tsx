import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PerformanceWidgetProps {
  className?: string;
  value?: string;
  growth?: string;
  isLoading?: boolean;
}

export function PerformanceWidget({
  className,
  value,
  growth = '+42.0%',
  isLoading = false
}: PerformanceWidgetProps) {
  const displayValue = value || '25.600.000 ₫';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "glow-card glow-green p-7 flex flex-col justify-between min-h-[260px] select-none",
        className
      )}
    >
      {/* Top: 3D Icon Box & Growth Pill */}
      <div className="flex items-start justify-between">
        <div className="icon-box-3d">
          <svg className="w-5 h-5 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"/>
          </svg>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
          ↗ {growth}
        </span>
      </div>

      {/* Middle: Label & Value */}
      <div className="my-3">
        <div className="text-xs text-zinc-400 uppercase tracking-wider">Doanh thu tuần</div>
        {isLoading ? (
          <div className="h-8 w-32 bg-white/10 rounded-md animate-pulse my-1" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-white mt-0.5">
            {displayValue}
          </div>
        )}
      </div>

      {/* Bottom: Mini Sparkline SVG from widget.html */}
      <div className="pt-1">
        <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40">
          <defs>
            <linearGradient id="lineGlowWidget" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6ee7b7" stopOpacity="1" />
            </linearGradient>
          </defs>
          <motion.path
            d="M5 34 Q 45 26, 80 24 T 150 18 T 195 6"
            fill="none"
            stroke="url(#lineGlowWidget)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <circle cx="195" cy="6" r="4" fill="#ffffff" stroke="#34d399" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  );
}

export const WeeklyRevenueWidget = PerformanceWidget;


