import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WatchMetricCardProps {
  id: string;
  title: string;
  subtitle: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  percentage: number;
  icon: LucideIcon;
  accentColor: string;
  isActive: boolean;
  isCompleted: boolean;
  progress: number; // 0 to 1
  className?: string;
}

export function WatchMetricCard({
  title,
  subtitle,
  currentValue,
  targetValue,
  unit,
  percentage,
  icon: Icon,
  accentColor,
  isActive,
  isCompleted,
  progress,
  className = '',
}: WatchMetricCardProps) {
  // Clamped display progress for progress bar (0 to 1 scale)
  const scaleProgress = Math.min(Math.max((progress * percentage) / 100, 0), 1);

  // Determine state style: Active (1.0), Completed but not focused (0.75), Inactive/Upcoming (0.50)
  const cardOpacity = isActive ? 1 : isCompleted ? 0.72 : 0.48;
  const cardScale = isActive ? 1 : isCompleted ? 0.995 : 0.985;
  const cardTranslateX = isActive ? '0px' : isCompleted ? '0px' : '12px';

  return (
    <div
      className={`watch-glass-card py-3 px-4 sm:py-3.5 sm:px-4.5 rounded-2xl transition-all duration-500 ease-out flex flex-col justify-between border ${className}`}
      style={{
        opacity: cardOpacity,
        transform: `translateX(${cardTranslateX}) scale(${cardScale})`,
        backgroundColor: isActive ? 'rgba(24, 24, 27, 0.92)' : 'rgba(18, 18, 20, 0.65)',
        borderColor: isActive
          ? `${accentColor}45`
          : isCompleted
          ? 'rgba(255, 255, 255, 0.14)'
          : 'rgba(255, 255, 255, 0.08)',
        boxShadow: isActive ? `0 10px 25px -8px ${accentColor}25` : undefined,
      }}
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
                border: `1px solid ${accentColor}35`,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-[13px] font-bold text-white tracking-wide">{title}</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-normal">{subtitle}</p>
            </div>
          </div>

          <div className="text-right">
            <div
              className="text-base sm:text-lg font-black tracking-tight transition-colors duration-300 font-mono"
              style={{
                fontVariantNumeric: 'tabular-nums',
                color: isActive ? accentColor : '#ffffff',
              }}
            >
              {currentValue}{' '}
              <span className="text-zinc-500 font-semibold text-xs">/ {targetValue}</span>
            </div>
            <div className="text-[9px] font-semibold text-zinc-400">
              {unit} ({percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Progress Track (GPU accelerated scaleX) */}
      <div className="w-full h-1.5 bg-zinc-800/90 rounded-full overflow-hidden mt-1.5">
        <div
          className="h-full rounded-full transition-transform duration-200 ease-out will-change-transform"
          style={{
            width: '100%',
            backgroundColor: accentColor,
            transformOrigin: 'left center',
            transform: `scaleX(${scaleProgress})`,
            boxShadow: isActive ? `0 0 10px ${accentColor}80` : 'none',
          }}
        />
      </div>
    </div>
  );
}
