import React from 'react';

export interface WatchRingVisualProps {
  moveProgress?: number; // 0 to 1
  exerciseProgress?: number; // 0 to 1
  standProgress?: number; // 0 to 1
  completionGlow?: number; // 0 to 1 (pulse during 0.66 - 0.78)
  size?: number;
  className?: string;
}

export function WatchRingVisual({
  moveProgress = 1,
  exerciseProgress = 1,
  standProgress = 1,
  completionGlow = 0,
  size = 380,
  className = '',
}: WatchRingVisualProps) {
  const strokeWidth = Math.round(size * 0.076);
  const center = size / 2;

  // Radii for 3 concentric rings (Move, Exercise, Stand)
  const moveRadius = center - strokeWidth - 4;
  const exerciseRadius = moveRadius - strokeWidth - 7;
  const standRadius = exerciseRadius - strokeWidth - 7;

  const moveCircumference = 2 * Math.PI * moveRadius;
  const exerciseCircumference = 2 * Math.PI * exerciseRadius;
  const standCircumference = 2 * Math.PI * standRadius;

  // Target multipliers (Move: 113%, Exercise: 156%, Stand: 83%)
  const currentMovePercent = moveProgress * 113;
  const currentExercisePercent = exerciseProgress * 156;
  const currentStandPercent = standProgress * 83;

  // Primary lap offset (up to 100%)
  const movePrimaryPercent = Math.min(currentMovePercent, 100);
  const movePrimaryOffset = moveCircumference * (1 - movePrimaryPercent / 100);

  // Over-completion lap offset (above 100%)
  const moveOverPercent = Math.max(0, currentMovePercent - 100);
  const moveOverOffset = moveCircumference * (1 - moveOverPercent / 100);

  const exercisePrimaryPercent = Math.min(currentExercisePercent, 100);
  const exercisePrimaryOffset = exerciseCircumference * (1 - exercisePrimaryPercent / 100);

  const exerciseOverPercent = Math.max(0, currentExercisePercent - 100);
  const exerciseOverOffset = exerciseCircumference * (1 - exerciseOverPercent / 100);

  const standPrimaryPercent = Math.min(currentStandPercent, 100);
  const standPrimaryOffset = standCircumference * (1 - standPrimaryPercent / 100);

  // Micro completion scale pulse (1.00 -> 1.018 -> 1.00)
  const completionScale = 1 + completionGlow * 0.018;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        transform: `scale(${completionScale})`,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 3. Very Soft Ambient Halo */}
      <div
        className="absolute inset-0 rounded-full bg-radial from-rose-500/20 via-lime-500/12 to-cyan-500/10 blur-3xl pointer-events-none transition-all duration-500"
        style={{
          opacity: 0.5 + completionGlow * 0.4,
          transform: `scale(${1 + completionGlow * 0.06})`,
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] drop-shadow-2xl overflow-visible will-change-transform"
        aria-hidden="true"
      >
        <defs>
          {/* 2. Controlled Near Bloom Filter */}
          <filter id="ring-glow-filter" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation={3.5 + completionGlow * 3.5} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ========================================================
            1. MOVE RING (Outer - Red #fa114f)
        ======================================================== */}
        {/* Dark Track */}
        <circle
          cx={center}
          cy={center}
          r={moveRadius}
          fill="none"
          stroke="#3d0012"
          strokeWidth={strokeWidth}
          opacity={0.85}
        />
        {/* Primary Arc (0 - 100%) */}
        {movePrimaryPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={moveRadius}
            fill="none"
            stroke="#fa114f"
            strokeWidth={strokeWidth}
            strokeDasharray={moveCircumference}
            strokeDashoffset={movePrimaryOffset}
            strokeLinecap="round"
            filter="url(#ring-glow-filter)"
          />
        )}
        {/* Over-Completion Arc (> 100%) */}
        {moveOverPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={moveRadius}
            fill="none"
            stroke="#ff3068"
            strokeWidth={strokeWidth}
            strokeDasharray={moveCircumference}
            strokeDashoffset={moveOverOffset}
            strokeLinecap="round"
            filter="url(#ring-glow-filter)"
            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          />
        )}

        {/* ========================================================
            2. EXERCISE RING (Middle - Lime Green #92e82a)
        ======================================================== */}
        {/* Dark Track */}
        <circle
          cx={center}
          cy={center}
          r={exerciseRadius}
          fill="none"
          stroke="#1b3300"
          strokeWidth={strokeWidth}
          opacity={0.85}
        />
        {/* Primary Arc (0 - 100%) */}
        {exercisePrimaryPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={exerciseRadius}
            fill="none"
            stroke="#92e82a"
            strokeWidth={strokeWidth}
            strokeDasharray={exerciseCircumference}
            strokeDashoffset={exercisePrimaryOffset}
            strokeLinecap="round"
            filter="url(#ring-glow-filter)"
          />
        )}
        {/* Over-Completion Arc (> 100%) */}
        {exerciseOverPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={exerciseRadius}
            fill="none"
            stroke="#aff848"
            strokeWidth={strokeWidth}
            strokeDasharray={exerciseCircumference}
            strokeDashoffset={exerciseOverOffset}
            strokeLinecap="round"
            filter="url(#ring-glow-filter)"
            className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          />
        )}

        {/* ========================================================
            3. STAND RING (Inner - Cyan #1ee4ff)
        ======================================================== */}
        {/* Dark Track */}
        <circle
          cx={center}
          cy={center}
          r={standRadius}
          fill="none"
          stroke="#00343d"
          strokeWidth={strokeWidth}
          opacity={0.85}
        />
        {/* Primary Arc (0 - 83%) */}
        {standPrimaryPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={standRadius}
            fill="none"
            stroke="#1ee4ff"
            strokeWidth={strokeWidth}
            strokeDasharray={standCircumference}
            strokeDashoffset={standPrimaryOffset}
            strokeLinecap="round"
            filter="url(#ring-glow-filter)"
          />
        )}
      </svg>

      {/* ========================================================
          4. CENTER APPLE LOGO
      ======================================================== */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-300"
        style={{
          transform: `scale(${1 + completionGlow * 0.05})`,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white/95 fill-current drop-shadow-[0_0_20px_rgba(255,255,255,0.45)]"
          aria-label="Apple"
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.02 2.96 1.12.09 2.25-.57 2.95-1.39z" />
        </svg>
      </div>
    </div>
  );
}
