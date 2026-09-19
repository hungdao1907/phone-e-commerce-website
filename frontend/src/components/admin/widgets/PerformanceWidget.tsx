import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign } from 'lucide-react';

export function PerformanceWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-white/50 text-xs font-medium">Total profit:</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
          <TrendingUp className="w-3 h-3" />
          +42%
        </div>
      </div>

      {/* Value */}
      <div className="mt-3">
        <p className="text-xl font-bold text-white">$25.6k</p>
        <p className="text-white/30 text-[11px] mt-0.5">Weekly Profit</p>
      </div>

      {/* Mini Chart (SVG demo) */}
      <div className="mt-3 w-full h-[60px]">
        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 Q20,45 40,35 T80,30 T120,20 T160,25 T200,10"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <path
            d="M0,50 Q20,45 40,35 T80,30 T120,20 T160,25 T200,10 L200,60 L0,60 Z"
            fill="url(#perfGrad)"
            opacity="0.5"
          />
        </svg>
      </div>
    </motion.div>
  );
}
