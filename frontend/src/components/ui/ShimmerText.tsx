import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface ShimmerTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  baseColor?: string;
  duration?: number;
}

export function ShimmerText({
  text,
  children,
  className = '',
  shimmerColor = '#a1a1aa',
  baseColor = '#000000',
  duration = 2.8,
}: ShimmerTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const content = text || children;

  if (shouldReduceMotion) {
    return <span className={className}>{content}</span>;
  }

  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${baseColor} 30%, ${shimmerColor} 50%, ${baseColor} 70%)`,
        backgroundSize: '250% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
      animate={{
        backgroundPosition: ['100% 0%', '-100% 0%'],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {content}
    </motion.span>
  );
}
