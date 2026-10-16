import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthData {
  id: string;
  label: string;
  fullMonth: string;
  heightPercent: number; // 20 to 85%
  overallValue: string;
  maxValue: string;
}

const DEFAULT_MONTHS: MonthData[] = [
  { id: 'jan', label: 'JAN', fullMonth: 'January, 2026', heightPercent: 52, overallValue: '$2,140', maxValue: '$980' },
  { id: 'feb', label: 'FEB', fullMonth: 'February, 2026', heightPercent: 40, overallValue: '$1,620', maxValue: '$740' },
  { id: 'mar', label: 'MAR', fullMonth: 'March, 2026', heightPercent: 88, overallValue: '$3,280', maxValue: '$1,340' },
  { id: 'apr', label: 'APR', fullMonth: 'April, 2026', heightPercent: 48, overallValue: '$2,010', maxValue: '$890' },
  { id: 'may', label: 'MAY', fullMonth: 'May, 2026', heightPercent: 62, overallValue: '$2,750', maxValue: '$1,120' },
  { id: 'jun', label: 'JUN', fullMonth: 'June, 2026', heightPercent: 42, overallValue: '$1,890', maxValue: '$810' },
  { id: 'jul', label: 'JUL', fullMonth: 'July, 2026', heightPercent: 78, overallValue: '$2,940', maxValue: '$1,260' },
];

interface RevenueFlowWidgetProps {
  className?: string;
  dynamicRevenue?: string;
}

export function RevenueFlowWidget({ className, dynamicRevenue }: RevenueFlowWidgetProps) {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(2); // Default is MAR (index 2)
  const [isMonthly, setIsMonthly] = useState(true);

  const activeMonth = DEFAULT_MONTHS[selectedMonthIndex];
  const displayRevenue = dynamicRevenue || activeMonth.overallValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "glow-card glow-orange p-5 flex flex-col justify-between min-h-[190px] h-full select-none relative overflow-hidden",
        className
      )}
      style={{
        background: `
          radial-gradient(120% 90% at 0% 0%, rgba(255, 110, 20, 0.45) 0%, rgba(220, 70, 0, 0.15) 45%, transparent 75%),
          linear-gradient(170deg, #141110 0%, #0d0a09 60%, #080605 100%)
        `
      }}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between z-10 shrink-0">
        <div>
          <span className="text-xs font-semibold text-white/90 tracking-wide">
            Revenue Flow
          </span>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            {displayRevenue}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <button
            onClick={() => setIsMonthly(!isMonthly)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-white bg-[#FF5500] hover:bg-[#FF6A1A] shadow-[0_4px_16px_rgba(255,85,0,0.55)] transition-all active:scale-95 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{isMonthly ? 'Monthly' : 'Weekly'}</span>
          </button>
          <span className="text-[11px] font-medium text-zinc-400 mt-1">
            Mar 2026
          </span>
        </div>
      </div>

      {/* Bar Chart Area */}
      <div className="relative w-full mt-1 pt-1 flex flex-col justify-end">
        {/* Floating Tooltip Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMonth.id}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 4 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 pointer-events-none rounded-xl border border-white/10 bg-[#1c1c20]/90 backdrop-blur-md px-3 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.7)]"
            style={{
              top: '-12px',
              left: selectedMonthIndex <= 3 ? `calc(${selectedMonthIndex * 14.28}% + 28px)` : undefined,
              right: selectedMonthIndex > 3 ? `calc(${(6 - selectedMonthIndex) * 14.28}% + 28px)` : undefined,
              minWidth: '124px'
            }}
          >
            <div className="text-[11px] font-medium text-zinc-300 pb-1 mb-1 border-b border-white/5">
              {activeMonth.fullMonth}
            </div>
            <div className="flex items-center justify-between text-[11px] gap-3">
              <span className="text-zinc-400 font-medium">Overall</span>
              <span className="font-bold text-white">{displayRevenue}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] gap-3 mt-0.5">
              <span className="text-zinc-400 font-medium">Max</span>
              <span className="font-semibold text-zinc-200">{activeMonth.maxValue}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 7 Columns Container */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 items-end h-[88px] w-full px-1">
          {DEFAULT_MONTHS.map((m, idx) => {
            const isActive = idx === selectedMonthIndex;

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMonthIndex(idx)}
                className="group relative flex flex-col items-center justify-end h-full cursor-pointer"
              >
                {/* Vertical Bar Container */}
                <div className="relative w-full max-w-[22px] sm:max-w-[26px] flex items-end justify-center h-full">
                  <div
                    className={cn(
                      "w-full rounded-full relative transition-all duration-300 overflow-visible",
                      isActive
                        ? "shadow-[0_0_20px_rgba(255,102,0,0.65)]"
                        : "opacity-80 group-hover:opacity-100"
                    )}
                    style={{
                      height: `${m.heightPercent}%`,
                      background: isActive
                        ? 'linear-gradient(180deg, #FF6600 0%, #B83A00 100%)'
                        : 'linear-gradient(180deg, #38383E 0%, #1A1A1E 100%)',
                      border: isActive
                        ? '1px solid rgba(255, 200, 150, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {/* Active Hairline Center Line */}
                    {isActive && (
                      <div className="absolute inset-x-0 top-3 bottom-3 mx-auto w-[1.5px] bg-white/70 rounded-full" />
                    )}

                    {/* Active Top Pin Checkmark Badge */}
                    {isActive && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#FF5500] border-2 border-white flex items-center justify-center shadow-[0_2px_10px_rgba(255,85,0,0.7)] z-20">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Month Label */}
                <span
                  className={cn(
                    "text-[10px] mt-2 font-bold tracking-wider transition-colors",
                    isActive ? "text-[#FF5500]" : "text-zinc-500 group-hover:text-zinc-300"
                  )}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
