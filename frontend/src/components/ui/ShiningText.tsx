import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ShiningTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  shineColor?: string;
  baseColor?: string;
  duration?: number;
}

/**
 * ShiningText - Component inspired by @preetsuthar17 / HextaUI (21st.dev)
 * Creates a sweeping shine beam animation across text.
 */
export function ShiningText({
  text,
  children,
  className = '',
  shineColor = '#111827',
  baseColor = '#9ca3af',
  duration = 2.5,
}: ShiningTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const content = text || children;

  if (shouldReduceMotion) {
    return <span className={className}>{content}</span>;
  }

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent select-none ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${baseColor} 0%, ${baseColor} 32%, ${shineColor} 50%, ${baseColor} 68%, ${baseColor} 100%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      animate={{
        backgroundPosition: ['150% 0%', '-150% 0%'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {content}
    </motion.span>
  );
}

export default ShiningText;
