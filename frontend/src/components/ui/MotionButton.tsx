import React, { FC, useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  label: string;
  direction?: 'left' | 'right';
  classes?: string;
  onClick?: () => void;
}

const MotionButton: FC<Props> = ({ label, classes, direction = 'right', onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isLeft = direction === 'left';

  // Cấu hình lò xo (spring) cho độ mượt tối đa 60fps
  const springConfig = { type: 'spring' as const, stiffness: 400, damping: 30 };

  return (
    <motion.button
      layout
      transition={springConfig}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative h-[48px] w-[160px] cursor-pointer rounded-full border border-white/10 bg-black/40 p-1 outline-none',
        classes
      )}
    >
      {/* Nền tròn bung ra (dùng layout của Framer Motion để force hardware acceleration) */}
      <motion.span
        layout
        initial={false}
        animate={{
          width: isHovered ? 'calc(100% - 8px)' : '40px',
        }}
        style={{
          left: isLeft ? 'auto' : '4px',
          right: isLeft ? '4px' : 'auto',
        }}
        transition={springConfig}
        className={cn(
          'absolute top-1 bottom-1 m-0 block overflow-hidden rounded-full bg-white will-change-[width]'
        )}
        aria-hidden="true"
      />
      
      {/* Icon */}
      <motion.div
        animate={{
          x: isHovered ? (isLeft ? -4 : 4) : 0,
        }}
        transition={springConfig}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center will-change-transform',
          isLeft ? 'right-1' : 'left-1'
        )}
      >
        {isLeft ? (
          <ArrowLeft className="size-5 text-black" />
        ) : (
          <ArrowRight className="size-5 text-black" />
        )}
      </motion.div>

      {/* Text */}
      <motion.span
        animate={{
          color: isHovered ? '#000000' : '#ffffff',
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-center text-sm font-semibold tracking-tight whitespace-nowrap z-10',
          isLeft ? 'right-10 w-[110px]' : 'left-10 w-[110px]'
        )}
      >
        {label}
      </motion.span>
    </motion.button>
  );
};

export default MotionButton;
