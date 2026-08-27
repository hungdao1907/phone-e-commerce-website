import * as React from 'react';

export interface GlassDescriptionBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  index: string;
  title: string;
  tagline: string;
  accentColor?: string;
}

export const GlassDescriptionBadge = React.forwardRef<HTMLDivElement, GlassDescriptionBadgeProps>(
  ({ index, title, tagline, accentColor, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`eco-glass-descriptor ${className ?? ''}`}
        style={
          {
            ...style,
            ...(accentColor ? { '--descriptor-accent': accentColor } : {}),
          } as React.CSSProperties
        }
        {...props}
      >
        {/* Breathing ambient glow behind glass */}
        <div className="eco-glass-descriptor__glow" aria-hidden="true" />

        {/* Specular curved reflection sheen */}
        <div className="eco-glass-descriptor__specular" aria-hidden="true" />

        {/* Row 1: Index Number • Accent Dot • Uppercase Title */}
        <div className="flex items-center justify-center gap-2 z-10">
          <span className="font-mono text-[10.5px] font-bold text-slate-500 tracking-wider">
            {index}
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300"
            style={{
              backgroundColor: accentColor || '#3b82f6',
              boxShadow: `0 0 8px ${accentColor || '#3b82f6'}80`,
            }}
          />
          <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-800 font-mono">
            {title}
          </span>
        </div>

        {/* Row 2: Tagline / Description */}
        <p className="mt-1 text-[12.5px] sm:text-[13px] font-medium text-slate-600 tracking-tight leading-snug z-10 whitespace-nowrap">
          {tagline}
        </p>
      </div>
    );
  }
);

GlassDescriptionBadge.displayName = 'GlassDescriptionBadge';
