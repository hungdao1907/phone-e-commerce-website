"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CardFanCarouselProps {
  images: string[];
  onIndexChange?: (index: number) => void;
}

const MAX_VISIBLE = 7;
const HALF = 3;

const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -30, y: 7.3, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -22, y: 4.0, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -11, y: 1.3, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 11, y: 1.3, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 22, y: 4.0, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 30, y: 7.3, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  // Card width is 4.5rem (72px) on mobile, 6rem (96px) on desktop.
  // x values in FAN_POSITIONS are 11, 22, 30.
  // We want cards to overlap closely, so we scale the x distances down significantly.
  if (width < 640) return 0.22; // Mobile: 11 * 0.22 = 2.42rem distance
  return 0.48; // Desktop: 11 * 0.32 = 3.52rem distance
}

function getHeightMultiplier(width: number) {
  // Card height is 7rem (112px) on mobile, 9rem (144px) on desktop.
  // max y in FAN_POSITIONS is 7.3.
  // We want a subtle arc, so we scale the y drop down.
  if (width < 640) return 0.25; // Mobile drop: 7.3 * 0.25 = 1.8rem
  return 0.35; // Desktop drop: 7.3 * 0.35 = 2.55rem
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  return {
    rot: distance * 21,
    scale: 1.0 - 0.2244 * absDistance * absDistance,
    x: distance * 30,
    y: absDistance * absDistance * 7.3,
    zIndex: 10 - Math.abs(slot - center),
  };
}

export default function CardFanCarousel({ images = [], onIndexChange }: CardFanCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  // Use images directly, assuming parent handles any padding needed
  const displayImages = images;

  const totalCards = displayImages.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);

  const getVisibleMap = useCallback((center: number) => {
    const map = new Map<number, number>();
    if (!needsPagination) {
      displayImages.forEach((_, i) => map.set(i, i));
      return map;
    }
    for (let slot = 0; slot < MAX_VISIBLE; slot++) {
      map.set(((center + slot - HALF) % totalCards + totalCards) % totalCards, slot);
    }
    return map;
  }, [totalCards, needsPagination, displayImages]);

  const cycle = useCallback((direction: "left" | "right") => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    directionRef.current = direction;
    setCenterIndex(prev => {
      const next = direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards;
      // Convert the centerIndex to the actual image index
      // Since displayImages maps 1:1, we can just pass next.
      // But wait, needsPagination shifts the index? No, getVisibleMap handles the shift. centerIndex is the actual slot.
      if (onIndexChange) onIndexChange(next);
      return next;
    });
  }, [totalCards, onIndexChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(container.querySelectorAll(".fan-card")) as HTMLElement[];
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const hMult = getHeightMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot: number) => getSlotConfig(slotCount, slot);

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y * hMult}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, { x: 0, y: `${12 * hMult}rem`, rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 0.5, ease: "power3.out", delay: 0.2 + slot * 0.06, onComplete: onCardDone });
        } else if (!wasVisible) {
          gsap.set(card, { ...target, opacity: 0 });
          gsap.to(card, { opacity: 1, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        gsap.to(card, { opacity: 0, duration: 0.3, ease: "power2.out", zIndex: 0 });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    // We removed the hover interaction code as requested!

  }, [centerIndex, totalCards, getVisibleMap, needsPagination]);

  if (!totalCards) return null;

  return (
    <div className="flex flex-col items-center w-full py-0 relative z-20 overflow-hidden">

      {/* The Fan Layout Area */}
      <div className="flex items-center justify-center w-full max-w-[90rem]">
        <div 
          ref={containerRef} 
          className="fan-layout flex relative justify-center items-center w-full h-[160px] sm:h-[180px]"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", maskImage: "linear-gradient(to right, transparent, black 15%, black 85%, transparent)", willChange: "transform" }}
        >
          {displayImages.map((imgUrl, index) => {
            return (
              <div
                key={index}
                className="fan-card absolute w-[72px] h-[112px] sm:w-[96px] sm:h-[144px] rounded-xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center pointer-events-none overflow-hidden"
                style={{ willChange: 'transform, opacity' }}
              >
                <img 
                  src={imgUrl} 
                  decoding="async"
                  alt={`Product Image ${index + 1}`} 
                  className="w-full h-full object-cover pointer-events-none" 
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation & Indicators */}
      <div className="flex flex-col items-center gap-3 mt-2 z-30 pointer-events-auto">
        <div className="flex items-center gap-2">
          {displayImages.map((_, i) => {
            if (!needsPagination && totalCards > 1) {
              return (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === centerIndex ? "bg-blue-600 scale-[1.3]" : "bg-neutral-200"}`}
                />
              )
            }
            if (needsPagination) {
              return (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === centerIndex ? "bg-blue-600 scale-[1.3]" : "bg-neutral-200"}`}
                />
              )
            }
            return null;
          })}
        </div>

        {totalCards > 1 && (
          <div className="flex items-center justify-center gap-4">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300 shadow-sm transition-all outline-none"
              onClick={() => cycle("left")}
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:text-black hover:border-neutral-300 shadow-sm transition-all outline-none"
              onClick={() => cycle("right")}
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
