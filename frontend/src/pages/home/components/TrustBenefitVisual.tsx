import { motion } from 'motion/react';

export type BenefitVisualType = 'delivery' | 'returns' | 'authenticity' | 'payment';

interface TrustBenefitVisualProps {
  type: BenefitVisualType;
}

export function TrustBenefitVisual({ type }: TrustBenefitVisualProps) {
  if (type === 'delivery') {
    return (
      <div className="trust-benefit-visual trust-benefit-visual--delivery" aria-hidden="true">
        <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="trust-benefit-visual__svg">
          {/* Subtle Ambient Glow */}
          <circle cx="120" cy="36" r="32" fill="rgba(224, 202, 172, 0.18)" filter="blur(12px)" />
          
          {/* Dotted Guide Route */}
          <path
            d="M 38 68 C 68 68, 86 38, 126 34"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.25"
          />

          {/* Animated Draw Route */}
          <motion.path
            d="M 38 68 C 68 68, 86 38, 126 34"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            variants={{
              initial: { pathLength: 0.35, opacity: 0.3 },
              visible: { pathLength: 0.5, opacity: 0.4 },
              hover: {
                pathLength: 1,
                opacity: 0.75,
                transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          />

          {/* Destination Pin */}
          <motion.g
            variants={{
              initial: { scale: 0.9, opacity: 0.4 },
              visible: { scale: 1, opacity: 0.5 },
              hover: {
                scale: 1.06,
                opacity: 0.9,
                transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <circle cx="126" cy="34" r="9" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.5" />
            <circle cx="126" cy="34" r="4.5" fill="currentColor" opacity="0.85" />
            <circle cx="126" cy="34" r="1.5" fill="#fff" />
          </motion.g>

          {/* Parcel Package */}
          <motion.g
            variants={{
              initial: { x: 0, y: 0, opacity: 0.6 },
              visible: { x: 0, y: 0, opacity: 0.75 },
              hover: {
                x: 12,
                y: -6,
                opacity: 1,
                transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            {/* Box Body */}
            <rect
              x="16"
              y="54"
              width="26"
              height="24"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="rgba(251, 249, 245, 0.92)"
            />
            {/* Tape / Flap Ribbons */}
            <line x1="29" y1="54" x2="29" y2="78" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
            <line x1="16" y1="64" x2="42" y2="64" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
            {/* Small Label */}
            <rect x="20" y="58" width="6" height="4" rx="1" fill="currentColor" opacity="0.4" />
          </motion.g>
        </svg>
      </div>
    );
  }

  if (type === 'returns') {
    return (
      <div className="trust-benefit-visual trust-benefit-visual--returns" aria-hidden="true">
        <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="trust-benefit-visual__svg">
          {/* Subtle Ambient Glow */}
          <circle cx="70" cy="50" r="28" fill="rgba(198, 214, 230, 0.18)" filter="blur(10px)" />

          {/* Origin Point */}
          <circle cx="94" cy="58" r="3" fill="currentColor" opacity="0.35" />

          {/* Animated Return Loop Arc */}
          <motion.path
            d="M 94 58 C 104 36, 76 18, 48 27"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            variants={{
              initial: { pathLength: 0.4, opacity: 0.3 },
              visible: { pathLength: 0.55, opacity: 0.45 },
              hover: {
                pathLength: 1,
                opacity: 0.8,
                transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          />

          {/* Arrow Head */}
          <motion.path
            d="M 52 34 L 46 26 L 55 24"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            variants={{
              initial: { opacity: 0.35, scale: 0.95 },
              visible: { opacity: 0.5, scale: 1 },
              hover: {
                opacity: 0.85,
                scale: 1.05,
                transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          />

          {/* Product Box */}
          <motion.g
            variants={{
              initial: { x: 0, opacity: 0.6 },
              visible: { x: 0, opacity: 0.75 },
              hover: {
                x: -5,
                opacity: 1,
                transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <rect
              x="42"
              y="44"
              width="36"
              height="32"
              rx="5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="rgba(248, 249, 250, 0.92)"
            />
            {/* Box Interior Flap detail */}
            <path
              d="M 51 44 L 51 51 L 69 51 L 69 44"
              stroke="currentColor"
              strokeWidth="1.2"
              opacity="0.5"
            />
          </motion.g>
        </svg>
      </div>
    );
  }

  if (type === 'authenticity') {
    return (
      <div className="trust-benefit-visual trust-benefit-visual--authenticity" aria-hidden="true">
        <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="trust-benefit-visual__svg">
          {/* Subtle Ambient Glow */}
          <circle cx="68" cy="48" r="28" fill="rgba(210, 194, 230, 0.18)" filter="blur(10px)" />

          {/* Device Silhouette (Generic Phone Outline) */}
          <motion.g
            variants={{
              initial: { opacity: 0.35 },
              visible: { opacity: 0.45 },
              hover: {
                opacity: 0.65,
                x: 2,
                transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <rect
              x="62"
              y="16"
              width="44"
              height="70"
              rx="7"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
            />
            {/* Speaker Ear piece */}
            <line x1="77" y1="21" x2="91" y2="21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
            {/* Inner Screen Area */}
            <rect x="67" y="27" width="34" height="50" rx="3" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
          </motion.g>

          {/* Shield Outline */}
          <motion.g
            variants={{
              initial: { scale: 0.96, opacity: 0.6 },
              visible: { scale: 1, opacity: 0.75 },
              hover: {
                scale: 1.04,
                opacity: 1,
                transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <path
              d="M 38 32 C 38 32, 58 25, 58 25 C 58 25, 78 32, 78 32 C 78 54, 58 68, 58 68 C 58 68, 38 54, 38 32 Z"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="rgba(249, 247, 251, 0.92)"
            />

            {/* Checkmark */}
            <motion.path
              d="M 48 46 L 55 53 L 68 39"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={{
                initial: { pathLength: 0.5, opacity: 0.5 },
                visible: { pathLength: 0.75, opacity: 0.7 },
                hover: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            />
          </motion.g>
        </svg>
      </div>
    );
  }

  // Payment Scene
  return (
    <div className="trust-benefit-visual trust-benefit-visual--payment" aria-hidden="true">
      <svg viewBox="0 0 160 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="trust-benefit-visual__svg">
        {/* Subtle Ambient Glow */}
        <circle cx="86" cy="46" r="30" fill="rgba(194, 222, 202, 0.18)" filter="blur(12px)" />

        {/* Terminal / Smartphone Silhouette */}
        <motion.g
          variants={{
            initial: { opacity: 0.35 },
            visible: { opacity: 0.45 },
            hover: {
              opacity: 0.65,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          <rect
            x="96"
            y="26"
            width="44"
            height="62"
            rx="7"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
          />
          <circle cx="118" cy="78" r="3" stroke="currentColor" strokeWidth="1" opacity="0.45" />
          <line x1="108" y1="32" x2="128" y2="32" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
        </motion.g>

        {/* Contactless Radio Waves */}
        <motion.path
          d="M 73 38 C 76 41, 76 49, 73 52"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          variants={{
            initial: { opacity: 0.25 },
            visible: { opacity: 0.35 },
            hover: {
              opacity: 0.8,
              transition: { duration: 0.25, delay: 0.05, ease: 'easeOut' },
            },
          }}
        />
        <motion.path
          d="M 79 34 C 84 39, 84 51, 79 56"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          variants={{
            initial: { opacity: 0.2 },
            visible: { opacity: 0.3 },
            hover: {
              opacity: 0.8,
              transition: { duration: 0.25, delay: 0.12, ease: 'easeOut' },
            },
          }}
        />
        <motion.path
          d="M 85 30 C 92 37, 92 53, 85 60"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          variants={{
            initial: { opacity: 0.15 },
            visible: { opacity: 0.25 },
            hover: {
              opacity: 0.75,
              transition: { duration: 0.25, delay: 0.18, ease: 'easeOut' },
            },
          }}
        />

        {/* Bank / Payment Card */}
        <motion.g
          variants={{
            initial: { x: 0, opacity: 0.65 },
            visible: { x: 0, opacity: 0.75 },
            hover: {
              x: 8,
              opacity: 1,
              transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          <rect
            x="18"
            y="26"
            width="48"
            height="32"
            rx="5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="rgba(246, 249, 247, 0.92)"
          />
          {/* Card Chip */}
          <rect x="25" y="34" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" fill="none" />
          {/* Magstripe / Bottom line */}
          <line x1="18" y1="48" x2="66" y2="48" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        </motion.g>
      </svg>
    </div>
  );
}
