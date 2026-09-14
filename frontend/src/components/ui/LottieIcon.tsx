import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface LottieIconProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieIcon({ animationData, className = "w-full h-full", loop = true, autoplay = true, playing }: LottieIconProps & { playing?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: playing !== undefined ? playing : autoplay,
      animationData: animationData,
    });
    animRef.current = anim;
    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [animationData, loop, autoplay]); // Intentionally omitting playing from deps to not recreate animation

  useEffect(() => {
    if (animRef.current) {
      if (playing === true) animRef.current.play();
      else if (playing === false) animRef.current.stop();
    }
  }, [playing]);

  return <div ref={containerRef} className={className} />;
}
