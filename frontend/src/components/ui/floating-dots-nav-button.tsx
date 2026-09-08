import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingDotsNavButtonProps {
  direction: 'left' | 'right';
  onClick: () => void;
  ariaLabel: string;
  className?: string;
}

const PARTICLES = [
  { id: 1, left: '18%', size: 3, duration: 2.3, delay: 0, color: 'bg-blue-400 text-blue-400' },
  { id: 2, left: '32%', size: 2.5, duration: 2.8, delay: 0.5, color: 'bg-cyan-300 text-cyan-300' },
  { id: 3, left: '48%', size: 3.5, duration: 2.1, delay: 1.1, color: 'bg-white text-white' },
  { id: 4, left: '66%', size: 2, duration: 3.0, delay: 0.3, color: 'bg-indigo-300 text-indigo-300' },
  { id: 5, left: '80%', size: 3, duration: 2.5, delay: 0.8, color: 'bg-sky-400 text-sky-400' },
  { id: 6, left: '25%', size: 2, duration: 2.6, delay: 1.4, color: 'bg-white text-white' },
  { id: 7, left: '58%', size: 2.5, duration: 3.2, delay: 1.7, color: 'bg-blue-300 text-blue-300' },
  { id: 8, left: '74%', size: 2, duration: 2.4, delay: 0.9, color: 'bg-cyan-200 text-cyan-200' },
];

export function FloatingDotsNavButton({
  direction,
  onClick,
  ariaLabel,
  className = '',
}: FloatingDotsNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-white border border-white/20 hover:border-blue-400/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_0_24px_rgba(0,113,227,0.4),0_8px_20px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-108 active:scale-95 cursor-pointer overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* 1. Subtle Ambient Core Glow */}
      <span
        className="absolute inset-0 rounded-full bg-gradient-to-t from-blue-600/20 via-transparent to-white/10 opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        aria-hidden="true"
      />

      {/* 2. Rising Floating Dots Particles (21st.dev Meng To Floating Dots Style) */}
      <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
        {PARTICLES.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{ y: 24, opacity: 0, scale: 0.5 }}
            animate={{
              y: [-6, -34],
              opacity: [0, 0.95, 0],
              scale: [0.6, 1.2, 0.7],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeOut',
            }}
            style={{
              left: particle.left,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            className={`absolute bottom-0 rounded-full shadow-[0_0_8px_currentColor] pointer-events-none ${particle.color}`}
          />
        ))}
      </div>

      {/* 3. Floating Light Streak Sweep */}
      <span className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-out pointer-events-none" />

      {/* 4. Directional Arrow Icon with Spring Translation on Hover */}
      <span className="relative z-10 flex items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {direction === 'left' ? (
          <ChevronLeft className="w-5 h-5 transition-transform duration-300 ease-out group-hover:-translate-x-1 group-active:-translate-x-1.5" />
        ) : (
          <ChevronRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-1 group-active:translate-x-1.5" />
        )}
      </span>
    </button>
  );
}

export default FloatingDotsNavButton;
