import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RippleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  rippleColor?: string;
  hoverRippleColor?: string;
  hoverTextColor?: string;
  duration?: number;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      children,
      className = '',
      rippleColor = 'rgba(255, 255, 255, 0.7)',
      hoverRippleColor = '#0071e3',
      hoverTextColor,
      duration = 0.5,
      onClick,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = (forwardedRef as React.RefObject<HTMLButtonElement>) || internalRef;

    // Directional hover liquid droplet state
    const [bubbleState, setBubbleState] = useState<{
      visible: boolean;
      x: number;
      y: number;
      size: number;
      isExiting: boolean;
    }>({
      visible: false,
      x: 0,
      y: 0,
      size: 0,
      isExiting: false,
    });

    // Tactile click shockwave ripples
    const [clickRipples, setClickRipples] = useState<
      Array<{ x: number; y: number; size: number; id: number }>
    >([]);

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate max distance to all 4 corners from (x, y)
      const maxDist = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y)
      );
      const size = Math.ceil(maxDist * 2) + 6;

      setBubbleState({
        visible: true,
        x,
        y,
        size,
        isExiting: false,
      });

      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const maxDist = Math.hypot(
        Math.max(x, rect.width - x),
        Math.max(y, rect.height - y)
      );
      const size = Math.ceil(maxDist * 2) + 6;

      setBubbleState({
        visible: true,
        x,
        y,
        size,
        isExiting: true,
      });

      onMouseLeave?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.8;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple = {
        x,
        y,
        size,
        id: Date.now() + Math.random(),
      };

      setClickRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setClickRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 700);

      onClick?.(e);
    };

    const effectiveHoverTextColor =
      hoverTextColor || (hoverRippleColor === '#ffffff' ? 'text-black' : '');
    const effectiveRippleColor =
      rippleColor || (hoverRippleColor === '#ffffff' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.75)');

    return (
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`relative overflow-hidden cursor-pointer select-none group transition-transform duration-200 active:scale-90 ${className}`}
        {...props}
      >
        {/* Directional Hover Liquid Bubble (21st.dev signature) */}
        {bubbleState.visible && (
          <motion.span
            key={bubbleState.isExiting ? 'exit' : 'enter'}
            initial={
              bubbleState.isExiting
                ? { scale: 1, opacity: 1 }
                : { scale: 0, opacity: 1 }
            }
            animate={
              bubbleState.isExiting
                ? { scale: 0, opacity: 1 }
                : { scale: 1, opacity: 1 }
            }
            transition={{
              duration: bubbleState.isExiting ? 0.35 : 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              if (bubbleState.isExiting) {
                setBubbleState((prev) =>
                  prev.isExiting ? { ...prev, visible: false } : prev
                );
              }
            }}
            className="absolute rounded-full pointer-events-none z-0"
            style={{
              width: bubbleState.size,
              height: bubbleState.size,
              left: bubbleState.x - bubbleState.size / 2,
              top: bubbleState.y - bubbleState.size / 2,
              backgroundColor: hoverRippleColor,
            }}
          />
        )}

        {/* Tactile Click Shockwave Ripples (Water Drop Rings) */}
        <AnimatePresence>
          {clickRipples.map((ripple) => (
            <React.Fragment key={ripple.id}>
              {/* Solid Expanding Wave */}
              <motion.span
                initial={{ scale: 0, opacity: 0.75 }}
                animate={{ scale: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="absolute rounded-full pointer-events-none z-10"
                style={{
                  width: ripple.size,
                  height: ripple.size,
                  left: ripple.x - ripple.size / 2,
                  top: ripple.y - ripple.size / 2,
                  backgroundColor: effectiveRippleColor,
                }}
              />
              {/* Outer Ripple Wave Ring */}
              <motion.span
                initial={{ scale: 0, opacity: 0.9, borderWidth: 2 }}
                animate={{ scale: 1.05, opacity: 0, borderWidth: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute rounded-full pointer-events-none z-10"
                style={{
                  width: ripple.size,
                  height: ripple.size,
                  left: ripple.x - ripple.size / 2,
                  top: ripple.y - ripple.size / 2,
                  borderColor:
                    hoverRippleColor === '#ffffff'
                      ? 'rgba(0, 0, 0, 0.35)'
                      : 'rgba(255, 255, 255, 0.85)',
                }}
              />
            </React.Fragment>
          ))}
        </AnimatePresence>

        {/* Button Content (Icons / Text) */}
        <span
          className={`relative z-20 flex items-center justify-center pointer-events-none w-full h-full transition-colors duration-250 ${
            bubbleState.visible && !bubbleState.isExiting && effectiveHoverTextColor
              ? effectiveHoverTextColor
              : ''
          }`}
        >
          {children}
        </span>
      </button>
    );
  }
);

RippleButton.displayName = 'RippleButton';
export default RippleButton;
