import React from 'react';

export function MedalAwardIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 1. Left Ribbon Strap */}
      <polygon points="38,18 49,18 55,36 44,36" />

      {/* 2. Right Ribbon Strap (Overlapping) */}
      <polygon points="62,18 51,18 46,31 56,36" />

      {/* 3. Medal Attachment Loop Bar */}
      <rect x="44" y="38" width="12" height="2.5" rx="1.2" />

      {/* 4. Outer Medal Rim */}
      <circle cx="50" cy="58" r="23" />

      {/* 5. Circular Inset Gap */}
      <circle cx="50" cy="58" r="19.5" fill="none" stroke="currentColor" strokeWidth="0" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 50 37
           A 21 21 0 1 0 50 79
           A 21 21 0 1 0 50 37 Z
           M 50 40
           A 18 18 0 1 1 50 76
           A 18 18 0 1 1 50 40 Z"
        fill="currentColor"
      />
      {/* Inner Central Disc */}
      <circle cx="50" cy="58" r="16.5" fill="currentColor" />
    </svg>
  );
}
