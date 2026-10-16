import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface KpiWidgetProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down';
  changeLabel?: string;
  subDescription?: string;
  icon: React.ReactNode;
  index?: number;
  isLoading?: boolean;
  subtitle?: React.ReactNode;
  variant?: 'emerald' | 'orange' | 'blue' | 'mint' | 'green';
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function KpiWidget({
  title,
  value,
  change,
  changeType = 'up',
  changeLabel,
  subDescription,
  icon,
  index = 0,
  isLoading = false,
  subtitle,
  variant,
  actionText,
  onAction,
  className
}: KpiWidgetProps) {
  // Determine variant based on prop or index
  const activeVariant = variant || (index === 0 ? 'green' : index === 1 ? 'orange' : index === 2 ? 'blue' : 'green');
  const glowClass =
    activeVariant === 'orange'
      ? 'glow-orange'
      : activeVariant === 'blue'
      ? 'glow-blue'
      : 'glow-green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "glow-card p-5 flex flex-col justify-between min-h-[190px] h-full select-none",
        glowClass,
        className
      )}
    >
      {/* Top: 3D Icon Box & Title */}
      <div className="flex items-start justify-between">
        <div className="icon-box-3d !w-9 !h-9 !rounded-xl">
          {icon}
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 truncate ml-2">
          {title}
        </span>
      </div>

      {/* Middle: Big Value & Subtitle */}
      <div className="my-2">
        {isLoading ? (
          <div className="h-8 w-2/3 bg-white/10 rounded-md animate-pulse my-1" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
            {value}
          </div>
        )}
        <p className="text-[11px] text-zinc-400 mt-1 truncate">
          {subDescription || changeLabel}
        </p>
      </div>

      {/* Bottom: Pill Badge & Action Link */}
      <div className="flex items-center justify-between pt-1">
        {isLoading ? (
          <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
        ) : subtitle ? (
          subtitle
        ) : change ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
              changeType === 'up'
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                : "bg-red-500/15 text-red-300 border-red-400/20"
            )}
          >
            {changeType === 'up' ? '↗' : '↘'} {change}
          </span>
        ) : (
          <div />
        )}

        {actionText && (
          <button
            onClick={onAction}
            className="text-xs font-semibold text-white flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer ml-auto"
          >
            {actionText}
          </button>
        )}
      </div>
    </motion.div>
  );
}

