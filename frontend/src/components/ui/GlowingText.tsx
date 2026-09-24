import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface GlowingTextProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  delay?: number;
  staggerDelay?: number;
  isReady?: boolean;
  replayKey?: number | string;
}

/**
 * GlowingText - Inspired by @hyperiux / Hyperiux Vault (21st.dev/glowing-text)
 * Features an ethereal neon glow reveal that illuminates words sequentially,
 * followed by a refined resting state with breathing ambient glow on highlighted terms.
 */
export function GlowingText({
  text,
  className,
  highlightWords = ['công', 'việc,', 'việc', 'sáng', 'tạo', 'cuộc', 'sống'],
  delay = 0.4,
  staggerDelay = 0.04,
  isReady = true,
  replayKey = 0,
}: GlowingTextProps) {
  const reducedMotion = useReducedMotion() === true;
  const words = useMemo(() => text.split(/\s+/), [text]);

  const normalizeWord = (w: string) =>
    w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  const normalizedHighlights = useMemo(
    () => highlightWords.map((w) => normalizeWord(w)),
    [highlightWords],
  );

  return (
    <p
      key={`glowing-text-${replayKey}`}
      className={cn(
        "relative flex flex-wrap items-center justify-center font-['SF_Pro_Text',-apple-system,BlinkMacSystemFont,'Helvetica_Neue',sans-serif] text-sm leading-relaxed text-center sm:text-[15px] lg:text-base",
        className,
      )}
    >
      {words.map((word, idx) => {
        const isHighlight =
          highlightWords.includes(word) ||
          normalizedHighlights.includes(normalizeWord(word));

        const wordDelay = reducedMotion ? 0 : delay + idx * staggerDelay;

        return (
          <motion.span
            key={`${word}-${idx}`}
            initial={
              reducedMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    y: 10,
                    filter: 'blur(8px)',
                    textShadow: '0 0 0px transparent',
                  }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : isReady
                  ? {
                      opacity: 1,
                      y: 0,
                      filter: 'blur(0px)',
                      textShadow: isHighlight
                        ? [
                            '0 0 0px transparent',
                            '0 0 16px rgba(255,255,255,0.95), 0 0 30px rgba(56,189,248,0.85), 0 0 45px rgba(56,189,248,0.5)',
                            '0 0 12px rgba(255,255,255,0.6), 0 0 22px rgba(56,189,248,0.35)',
                          ]
                        : [
                            '0 0 0px transparent',
                            '0 0 12px rgba(255,255,255,0.8), 0 0 20px rgba(56,189,248,0.4)',
                            '0 0 4px rgba(255,255,255,0.2)',
                          ],
                    }
                  : {
                      opacity: 0,
                      y: 10,
                      filter: 'blur(8px)',
                      textShadow: '0 0 0px transparent',
                    }
            }
            transition={{
              duration: 0.65,
              delay: wordDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={
              reducedMotion
                ? undefined
                : {
                    scale: 1.06,
                    textShadow:
                      '0 0 16px rgba(255,255,255,1), 0 0 28px rgba(56,189,248,0.85)',
                    transition: { duration: 0.2 },
                  }
            }
            className={cn(
              'inline-block mr-[0.28em] transition-colors cursor-default select-none',
              isHighlight
                ? 'text-white font-medium drop-shadow-[0_0_18px_rgba(255,255,255,0.5)]'
                : 'text-neutral-300/90 hover:text-white',
            )}
          >
            {word}
          </motion.span>
        );
      })}
    </p>
  );
}

export default GlowingText;
