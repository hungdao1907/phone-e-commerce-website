import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import React, { useRef } from 'react';

export type TextEffectPer = 'word' | 'char' | 'line';
export type TextEffectPreset = 'blur' | 'fade' | 'slide' | 'scale';

export interface TextEffectProps {
  children: string;
  per?: TextEffectPer;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  preset?: TextEffectPreset;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.1,
    },
  },
};

const defaultItemVariants: Record<TextEffectPreset, Variants> = {
  blur: {
    hidden: { opacity: 0, filter: 'blur(8px)', y: 4 },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  },
  slide: {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as: Component = 'p',
  className = '',
  preset = 'blur',
  delay = 0,
  trigger,
  onAnimationComplete,
  segmentWrapperClassName = '',
}: TextEffectProps) {
  const containerRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion() === true;
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });

  // If trigger prop is passed explicitly, use it; otherwise use viewport inView (once)
  const isVisible = trigger !== undefined ? trigger : isInView;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.022,
        delayChildren: shouldReduceMotion ? 0 : delay,
      },
    },
  };

  const itemVariants: Variants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.2 } },
      }
    : defaultItemVariants[preset] || defaultItemVariants.blur;

  // Split text based on `per` mode
  const words = React.useMemo(() => {
    if (per === 'word') {
      return children.split(' ');
    }
    if (per === 'char') {
      return children.split('');
    }
    return [children];
  }, [children, per]);

  const MotionComponent = (motion as any)[Component] || motion.p;

  return (
    <MotionComponent
      ref={containerRef as any}
      className={className}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={containerVariants}
      onAnimationComplete={onAnimationComplete}
    >
      {words.map((segment, index) => (
        <motion.span
          key={`${segment}-${index}`}
          variants={itemVariants}
          className={`inline-block whitespace-pre ${segmentWrapperClassName}`}
        >
          {segment}
          {per === 'word' && index < words.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </MotionComponent>
  );
}
