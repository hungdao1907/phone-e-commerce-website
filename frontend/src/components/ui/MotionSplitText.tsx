import React from 'react';
import { motion, type Variants, useReducedMotion } from 'framer-motion';

interface MotionSplitTextProps {
  text: string;
  type?: 'words' | 'chars';
  stagger?: number;
  delay?: number;
  className?: string;
}

export function MotionSplitText({
  text,
  type = 'words',
  stagger = 0.03,
  delay = 0.1,
  className = '',
}: MotionSplitTextProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <p className={className}>{text}</p>;
  }

  const items = type === 'words' ? text.split(' ') : text.split('');

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 10,
      filter: 'blur(2px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 95,
        damping: 20,
        mass: 0.8,
      },
    },
  };

  return (
    <motion.p
      className={`leading-relaxed ${className}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.25 }}
    >
      {items.map((item, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block"
        >
          {item}
          {type === 'words' && i < items.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </motion.p>
  );
}
