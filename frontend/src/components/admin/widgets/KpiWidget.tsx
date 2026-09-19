import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiWidgetProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
  changeLabel?: string;
  icon: React.ReactNode;
  index?: number;
  isLoading?: boolean;
  subtitle?: React.ReactNode;
}

export function KpiWidget({ title, value, change, changeType = 'up', changeLabel, icon, index = 0, isLoading = false, subtitle }: KpiWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-3 hover:bg-white/[0.06] transition-colors duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-white/50 text-xs font-medium uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/40">
          {icon}
        </div>
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="h-8 w-1/2 bg-white/10 rounded-md animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      )}

      {/* Footer Area */}
      <div className="flex items-center justify-between gap-1 mt-auto pt-1 w-full overflow-hidden">
        {isLoading ? (
          <div className="h-4 w-20 bg-white/10 rounded-md animate-pulse" />
        ) : change ? (
          <div className="flex items-center gap-1 min-w-0">
            <div className={cn(
              "flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shrink-0",
              changeType === 'up' ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
            )}>
              {changeType === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {change}
            </div>
            {changeLabel && (
              <span className="text-white/30 text-[9px] whitespace-nowrap truncate">{changeLabel}</span>
            )}
          </div>
        ) : <div />}

        {/* Subtitle / Extra Info */}
        {!isLoading && subtitle && (
          <div className="shrink-0">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
}
