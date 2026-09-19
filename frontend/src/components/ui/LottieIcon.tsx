import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

interface LottieIconProps {
  animationData?: any;
  path?: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieIcon({ animationData, path, className = "w-full h-full", loop = true, autoplay = false, playing }: LottieIconProps & { playing?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: playing !== undefined ? playing : autoplay,
      ...(path ? { path } : { animationData }),
    });
    animRef.current = anim;
    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [animationData, loop, autoplay]); 

  useEffect(() => {
    if (animRef.current) {
      if (playing === true) animRef.current.play();
      else if (playing === false) animRef.current.stop();
    }
  }, [playing]);

  const handleMouseEnter = () => {
    if (playing === undefined && animRef.current) {
      animRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (playing === undefined && animRef.current) {
      animRef.current.stop();
    }
  };

  return <div ref={containerRef} className={className} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />;
}
