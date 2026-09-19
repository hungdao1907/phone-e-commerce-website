import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';

export interface TechnologyStory {
  id: string;
  category?: string;
  title: string;
  description: string;
  src: string;
  alt: string;
  objectPosition?: string;
}

interface StickyStoryCardProps {
  key?: React.Key;
  index: number;
  story: TechnologyStory;
  progress: MotionValue<number>;
  total: number;
}

const STICKY_BASE_TOP = '11vh';
const STACK_STEP = 16;

function StickyStoryCard({
  index,
  story,
  progress,
  total,
}: StickyStoryCardProps) {
  const reduceMotion = useReducedMotion() === true;
  const isLastStory = index === total - 1;
  const targetScale = Math.max(0.6, 1 - (total - index - 1) * 0.08);
  const scale = useTransform(progress, [index * 0.2, 1], [1, reduceMotion ? 1 : targetScale]);
  const visualOffset = `${index * STACK_STEP}px`;

  return (
    <div
      className={`wave-scroll-card-shell ${isLastStory ? 'wave-scroll-card-shell--last' : ''}`}
      style={{ top: STICKY_BASE_TOP }}
    >
      <motion.article
        className="wave-scroll-card"
        style={{
          scale,
          top: visualOffset,
        }}
      >
        <img
          src={story.src}
          alt={story.alt}
          loading={index === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className="wave-scroll-card__image"
          style={{ objectPosition: story.objectPosition }}
        />
        <div className="wave-scroll-card__scrim" aria-hidden="true" />
        <div className="wave-scroll-card__caption">
          <h3>{story.title}</h3>
          <p className="wave-scroll-card__description">{story.description}</p>
        </div>
      </motion.article>
    </div>
  );
}

interface ImagesScrollingAnimationProps {
  stories: TechnologyStory[];
}

export function ImagesScrollingAnimation({ stories }: ImagesScrollingAnimationProps) {
  const container = useRef<HTMLDivElement>(null);

  // Raw scroll progress for sticky stack and scale
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={container} className="wave-scroll-stack">
      {stories.map((story, index) => (
        <StickyStoryCard
          key={story.id}
          index={index}
          story={story}
          progress={scrollYProgress}
          total={stories.length}
        />
      ))}
    </div>
  );
}
