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
      className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
          {icon}
        </div>
      </div>

      {/* Value */}
      {isLoading ? (
        <div className="h-8 w-1/2 bg-slate-100 rounded-md animate-pulse mt-1" />
      ) : (
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      )}

      {/* Footer Area */}
      <div className="flex items-center justify-between gap-1 mt-auto pt-1 w-full overflow-hidden">
        {isLoading ? (
          <div className="h-4 w-20 bg-slate-100 rounded-md animate-pulse" />
        ) : change ? (
          <div className="flex items-center gap-1 min-w-0">
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap shrink-0 border",
              changeType === 'up' ? "bg-emerald-50 text-emerald-600 border-emerald-200/60" : "bg-red-50 text-red-600 border-red-200/60"
            )}>
              {changeType === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {change}
            </div>
            {changeLabel && (
              <span className="text-slate-400 text-[9px] whitespace-nowrap truncate">{changeLabel}</span>
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
