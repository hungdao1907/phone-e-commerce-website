"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface MorphingTextProps {
  className?: string;
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  isReady?: boolean;
}

export type LiquidTextProps = MorphingTextProps;

const morphTimeDefault = 1.5;
const cooldownTimeDefault = 0.5;

const useMorphingText = (
  texts: string[],
  morphTime = morphTimeDefault,
  cooldownTime = cooldownTimeDefault,
  isReady = true,
) => {
  const textIndexRef = useRef(0);
  const morphRef = useRef(0);
  const cooldownRef = useRef(0);
  const timeRef = useRef(new Date());

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);

  const setStyles = useCallback(
    (fraction: number) => {
      const [current1, current2] = [text1Ref.current, text2Ref.current];
      if (!current1 || !current2 || !texts || texts.length === 0) return;

      current2.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
      current2.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

      const invertedFraction = 1 - fraction;
      current1.style.filter = `blur(${Math.min(8 / invertedFraction - 8, 100)}px)`;
      current1.style.opacity = `${Math.pow(invertedFraction, 0.4) * 100}%`;

      current1.textContent = texts[textIndexRef.current % texts.length];
      current2.textContent = texts[(textIndexRef.current + 1) % texts.length];
    },
    [texts],
  );

  const doMorph = useCallback(() => {
    morphRef.current -= cooldownRef.current;
    cooldownRef.current = 0;

    let fraction = morphRef.current / morphTime;

    if (fraction > 1) {
      cooldownRef.current = cooldownTime;
      fraction = 1;
    }

    setStyles(fraction);

    if (fraction === 1) {
      textIndexRef.current++;
    }
  }, [setStyles, morphTime, cooldownTime]);

  const doCooldown = useCallback(() => {
    morphRef.current = 0;
    const [current1, current2] = [text1Ref.current, text2Ref.current];
    if (current1 && current2) {
      current2.style.filter = "none";
      current2.style.opacity = "100%";
      current1.style.filter = "none";
      current1.style.opacity = "0%";
    }
  }, []);

  useEffect(() => {
    if (!isReady || !texts || texts.length === 0) return;

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const newTime = new Date();
      const dt = (newTime.getTime() - timeRef.current.getTime()) / 1000;
      timeRef.current = newTime;

      cooldownRef.current -= dt;

      if (cooldownRef.current <= 0) doMorph();
      else doCooldown();
    };

    timeRef.current = new Date();
    animate();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [doMorph, doCooldown, isReady, texts]);

  return { text1Ref, text2Ref };
};

const Texts: React.FC<Pick<MorphingTextProps, "texts" | "morphTime" | "cooldownTime" | "isReady">> = ({
  texts,
  morphTime,
  cooldownTime,
  isReady,
}) => {
  const { text1Ref, text2Ref } = useMorphingText(texts, morphTime, cooldownTime, isReady);
  return (
    <>
      <span
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-center text-white"
        ref={text1Ref}
      />
      <span
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-center text-white"
        ref={text2Ref}
      />
    </>
  );
};

const SvgFilters: React.FC = () => (
  <svg id="filters" className="hidden" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <filter id="threshold">
        <feColorMatrix
          in="SourceGraphic"
          type="matrix"
          values="1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 255 -140"
        />
      </filter>
    </defs>
  </svg>
);

const MorphingText: React.FC<MorphingTextProps> = ({
  texts,
  className,
  morphTime = morphTimeDefault,
  cooldownTime = cooldownTimeDefault,
  isReady = true,
}) => (
  <div
    className={cn(
      "relative mx-auto flex h-14 sm:h-16 md:h-20 lg:h-24 w-full max-w-screen-md items-center justify-center text-center font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[76px] font-bold leading-none text-white whitespace-nowrap select-none [filter:url(#threshold)_blur(0.6px)]",
      className,
    )}
  >
    <Texts texts={texts} morphTime={morphTime} cooldownTime={cooldownTime} isReady={isReady} />
    <SvgFilters />
  </div>
);

const LiquidText = MorphingText;

export { MorphingText, LiquidText };
export default LiquidText;
