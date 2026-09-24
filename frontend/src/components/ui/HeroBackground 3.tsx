import type { CSSProperties } from 'react';
import { motion, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';

type Star = {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
  twinkle: boolean;
  twinkleOpacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
  bright: boolean;
};

type HeroBackgroundProps = {
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  reducedMotion: boolean;
};

const cinematicEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

function seededNoise(seed: number) {
  const value = Math.sin(seed * 12.9898 + seed * seed * 0.017) * 43758.5453;
  return value - Math.floor(value);
}

function createStars(count: number, seedOffset: number, near = false): Star[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + seedOffset;
    const duration = near
      ? 8 + seededNoise(seed * 7) * 12
      : 12 + seededNoise(seed * 7) * 12;
    const driftDirection = seededNoise(seed * 13) > 0.5 ? 1 : -1;
    const bright = near
      ? seededNoise(seed * 37) > 0.82
      : seededNoise(seed * 37) > 0.975;
    const twinkle = seededNoise(seed * 31) > (near ? 0.46 : 0.64);
    const size = (near
      ? 1 + seededNoise(seed * 11) * 1
      : 0.62 + seededNoise(seed * 11) * 0.7) + (bright ? (near ? 0.65 : 0.35) : 0);
    const opacity = near
      ? 0.45 + seededNoise(seed * 17) * 0.42
      : 0.22 + seededNoise(seed * 17) * 0.47;
    const twinkleDuration = near
      ? 6 + seededNoise(seed * 43) * 8
      : 10 + seededNoise(seed * 43) * 12;

    return {
      id: seed,
      x: seededNoise(seed * 3) * 100,
      y: seededNoise(seed * 5) * 100,
      size,
      opacity,
      duration,
      delay: -seededNoise(seed * 19) * duration,
      driftX: driftDirection * (near ? 4 + seededNoise(seed * 23) * 4 : 2 + seededNoise(seed * 23) * 3),
      driftY: near
        ? 3 + seededNoise(seed * 29) * 5
        : -(2 + seededNoise(seed * 29) * 3),
      twinkle,
      twinkleOpacity: opacity * (0.58 + seededNoise(seed * 41) * 0.25),
      twinkleDuration,
      twinkleDelay: -seededNoise(seed * 47) * twinkleDuration,
      bright,
    };
  });
}

const FAR_STARS = createStars(38, 100);
const NEAR_STARS = createStars(14, 300, true);

// Pre-compute style objects and classNames at module level to avoid per-render allocation
type PrecomputedStar = {
  key: number;
  className: string;
  style: CSSProperties;
};

function precomputeStars(stars: Star[], layer: 'far' | 'near'): PrecomputedStar[] {
  return stars.map((star) => ({
    key: star.id,
    className:
      'cosmic-hero__star'
      + (star.twinkle ? ' cosmic-hero__star--twinkle' : '')
      + (star.bright ? ' cosmic-hero__star--bright' : ''),
    style: {
      left: String(star.x) + '%',
      top: String(star.y) + '%',
      width: star.size,
      height: star.size,
      '--star-opacity': String(star.opacity),
      '--star-duration': String(star.duration) + 's',
      '--star-delay': String(star.delay) + 's',
      '--star-drift-x': String(star.driftX) + 'px',
      '--star-drift-y': String(star.driftY) + 'px',
      '--star-twinkle-opacity': String(star.twinkleOpacity),
      '--star-twinkle-duration': String(star.twinkleDuration) + 's',
      '--star-twinkle-delay': String(star.twinkleDelay) + 's',
    } as CSSProperties,
  }));
}

const PRECOMPUTED_FAR = precomputeStars(FAR_STARS, 'far');
const PRECOMPUTED_NEAR = precomputeStars(NEAR_STARS, 'near');

function StarField({ precomputed, layer }: { precomputed: PrecomputedStar[]; layer: 'far' | 'near' }) {
  return (
    <div className={'cosmic-hero__stars cosmic-hero__stars--' + layer}>
      {precomputed.map((star) => (
        <span
          key={star.key}
          className={star.className}
          style={star.style}
        />
      ))}
    </div>
  );
}

export function HeroBackground({
  pointerX,
  pointerY,
  reducedMotion,
}: HeroBackgroundProps) {
  // Pointer parallax — 5 MotionValues shared across layers with similar ranges
  const subtleX = useTransform(pointerX, [-1, 1], [-2, 2]);   // glow, far stars
  const subtleY = useTransform(pointerY, [-1, 1], [-2, 2]);   // glow, far stars, nebula Y, aurora Y
  const midX = useTransform(pointerX, [-1, 1], [-3, 3]);      // nebula, aurora
  const strongX = useTransform(pointerX, [-1, 1], [-5, 5]);   // orbit, near stars
  const strongY = useTransform(pointerY, [-1, 1], [-4, 4]);   // orbit, near stars

  return (
    <div className="cosmic-hero__background absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="cosmic-hero__base" />
      <div className="cosmic-hero__stardust cosmic-hero__stardust--far" />

      <motion.div
        className="cosmic-hero__energy-entry"
        initial={reducedMotion ? false : { opacity: 0.3, scale: 1.15 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.82, ease: cinematicEase }}
      >
        <motion.div
          className="cosmic-hero__energy-parallax"
          style={{
            x: reducedMotion ? 0 : subtleX,
            y: reducedMotion ? 0 : subtleY,
          }}
        >
          <div className="cosmic-hero__energy" />
        </motion.div>
      </motion.div>

      <div className="cosmic-hero__lower-atmosphere" />

      <motion.div
        className="cosmic-hero__nebula-entry"
        initial={reducedMotion ? false : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.15, delay: reducedMotion ? 0 : 0.12, ease: cinematicEase }}
      >
        <motion.div
          className="cosmic-hero__parallax-layer"
          style={{ x: reducedMotion ? 0 : midX, y: reducedMotion ? 0 : subtleY }}
        >
          <div className="cosmic-hero__nebula-cloud cosmic-hero__nebula-cloud--left" />
          <div className="cosmic-hero__nebula-cloud cosmic-hero__nebula-cloud--right" />
          <div className="cosmic-hero__nebula-band" />
          <div className="cosmic-hero__nebula-ribbon" />
        </motion.div>
      </motion.div>

      <motion.div
        className="cosmic-hero__aurora-entry cosmic-hero__aurora-entry--primary"
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.9, delay: reducedMotion ? 0 : 0.18, ease: cinematicEase }}
      >
        <motion.div
          className="cosmic-hero__parallax-layer"
          style={{ x: reducedMotion ? 0 : midX, y: reducedMotion ? 0 : subtleY }}
        >
          <div className="cosmic-hero__aurora cosmic-hero__aurora--primary" />
        </motion.div>
      </motion.div>

      <motion.div
        className="cosmic-hero__aurora-entry cosmic-hero__aurora-entry--secondary"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.05, delay: reducedMotion ? 0 : 0.3, ease: cinematicEase }}
      >
        <motion.div
          className="cosmic-hero__parallax-layer"
          style={{ x: reducedMotion ? 0 : midX, y: reducedMotion ? 0 : subtleY }}
        >
          <div className="cosmic-hero__aurora cosmic-hero__aurora--secondary" />
        </motion.div>
      </motion.div>

      <motion.div
        className="cosmic-hero__orbit-entry"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.1, delay: reducedMotion ? 0 : 0.26, ease: cinematicEase }}
      >
        <motion.div
          className="cosmic-hero__parallax-layer"
          style={{ x: reducedMotion ? 0 : strongX, y: reducedMotion ? 0 : strongY }}
        >
          <div className="cosmic-hero__orbit cosmic-hero__orbit--primary" />
          <div className="cosmic-hero__orbit cosmic-hero__orbit--secondary" />
        </motion.div>
      </motion.div>

      <motion.div
        className="cosmic-hero__far-stars-parallax"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.95, delay: reducedMotion ? 0 : 0.22, ease: cinematicEase }}
        style={{ x: reducedMotion ? 0 : subtleX, y: reducedMotion ? 0 : subtleY }}
      >
        <StarField precomputed={PRECOMPUTED_FAR} layer="far" />
      </motion.div>

      <motion.div
        className="cosmic-hero__near-stars-parallax"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reducedMotion ? 0 : 1.1, delay: reducedMotion ? 0 : 0.34, ease: cinematicEase }}
        style={{ x: reducedMotion ? 0 : strongX, y: reducedMotion ? 0 : strongY }}
      >
        <StarField precomputed={PRECOMPUTED_NEAR} layer="near" />
      </motion.div>

      <div className="cosmic-hero__stardust cosmic-hero__stardust--near" />
      <div className="cosmic-hero__vignette" />
      <div className="cosmic-hero__grain" />
    </div>
  );
}
