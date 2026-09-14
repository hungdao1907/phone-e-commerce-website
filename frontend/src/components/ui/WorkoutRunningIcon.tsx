import React from 'react';

export function WorkoutRunningIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* 1. Head (Circle) */}
      <circle cx="58.5" cy="27" r="9.5" />

      {/* 2. Trailing Back Arm (Upper Left Capsule) */}
      <rect
        x="29"
        y="30"
        width="20"
        height="11"
        rx="5.5"
        transform="rotate(-15 39 35.5)"
      />

      {/* 3. Leading Front Arm (Upper Right Capsule) */}
      <rect
        x="63"
        y="29"
        width="21"
        height="11"
        rx="5.5"
        transform="rotate(-48 73.5 34.5)"
      />

      {/* 4. Torso and Extended Rear Leg (Long Diagonal Sweep Capsule) */}
      <path
        d="M 58 35 
           C 53 38, 47 43, 42 49 
           L 24 72 
           C 20 77, 21 84, 27 88 
           C 33 92, 40 91, 45 85 
           L 60 62 
           C 65 55, 68 47, 65 40 
           C 63 35, 61 33, 58 35 Z"
      />

      {/* 5. Forward Bent Knee / Leg (Hook Capsule) */}
      <path
        d="M 56 46 
           C 59 47, 63 50, 65 55 
           C 67 61, 64 67, 59 71 
           C 53 76, 47 78, 47 72 
           C 47 67, 51 62, 53 58 
           C 55 54, 54 50, 56 46 Z"
      />
    </svg>
  );
}
