import { useMemo } from 'react';

interface StarSpec {
  id: number;
  x: number; // percentage
  y: number; // percentage
  size: number; // px
  opacity: number;
  driftClass: string;
  twinkleClass: string;
  driftDuration: number; // seconds
  twinkleDuration: number; // seconds
  delay: number; // seconds (negative for immediate phase offset)
  isBright?: boolean;
  isMobileVisible?: boolean;
}

// Generate a stable array of 54 stars deterministically
function generateStars(): StarSpec[] {
  const stars: StarSpec[] = [];
  const driftClasses = ['star-drift-a', 'star-drift-b', 'star-drift-c', 'star-drift-d'];
  const twinkleClasses = ['star-twinkle-a', 'star-twinkle-b', 'star-twinkle-c'];

  for (let i = 0; i < 54; i++) {
    // Pseudo-random deterministic placement using prime modular math
    const x = (i * 18.7 + (i % 7) * 11.3) % 96 + 2;
    const y = (i * 23.3 + (i % 11) * 7.1) % 94 + 3;

    // Size distribution: 70% 1px, 20% 1.5px, 10% 2px bright
    const sizeCategory = i % 10;
    let size = 1;
    let isBright = false;
    if (sizeCategory === 9) {
      size = 2;
      isBright = true;
    } else if (sizeCategory >= 7) {
      size = 1.5;
    }

    const opacity = 0.2 + ((i * 13) % 55) / 100;
    const driftClass = driftClasses[i % driftClasses.length];
    const twinkleClass = twinkleClasses[i % twinkleClasses.length];
    const driftDuration = 16 + (i % 9) * 1.5; // 16s - 28s
    const twinkleDuration = 7 + (i % 7) * 1.8; // 7s - 18s
    const delay = -(i * 0.65); // staggered initial phase

    // Show ~30 stars on mobile, all 54 on desktop
    const isMobileVisible = i % 5 !== 0;

    stars.push({
      id: i,
      x,
      y,
      size,
      opacity,
      driftClass,
      twinkleClass,
      driftDuration,
      twinkleDuration,
      delay,
      isBright,
      isMobileVisible,
    });
  }

  return stars;
}

export function CategoryStarField() {
  const stars = useMemo(() => generateStars(), []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none"
      aria-hidden="true"
    >
      {/* Subtle Ambient Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#040405_100%)] opacity-80 pointer-events-none" />

      {/* Render Stars */}
      {stars.map((star) => (
        <span
          key={star.id}
          className={`category-star absolute rounded-full bg-white ${
            star.isMobileVisible ? 'block' : 'hidden md:block'
          } ${
            star.isBright
              ? 'shadow-[0_0_6px_rgba(255,255,255,0.7)]'
              : ''
          }`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animation: `
              ${star.driftClass} ${star.driftDuration}s ease-in-out ${star.delay}s infinite,
              ${star.twinkleClass} ${star.twinkleDuration}s ease-in-out ${star.delay}s infinite
            `,
          }}
        />
      ))}
    </div>
  );
}
