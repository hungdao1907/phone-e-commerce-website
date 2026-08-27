import * as React from 'react';

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether this button represents the active/selected state */
  active?: boolean;
  /** Custom className for the outer wrapper */
  wrapClassName?: string;
  /** Custom className for the inner content area */
  contentClassName?: string;
  /** Accent color for active indicators (CSS color value) */
  accentColor?: string;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      children,
      active = false,
      wrapClassName,
      contentClassName,
      accentColor,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={`eco-glass-btn-wrap ${active ? 'eco-glass-btn-wrap--active' : ''} ${wrapClassName ?? ''}`}
        style={
          accentColor
            ? ({ '--eco-glass-accent': accentColor } as React.CSSProperties)
            : undefined
        }
      >
        <button
          className={`eco-glass-btn ${active ? 'eco-glass-btn--active' : ''} ${className ?? ''}`}
          ref={ref}
          style={style}
          {...props}
        >
          {/* Specular Highlight (top-left) */}
          <span className="eco-glass-btn__specular" aria-hidden="true" />
          {/* Content Area */}
          <span className={`eco-glass-btn__content ${contentClassName ?? ''}`}>
            {children}
          </span>
        </button>
        {/* Diffuse Shadow Layer */}
        <div className="eco-glass-btn__shadow" aria-hidden="true" />
      </div>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export { GlassButton };
