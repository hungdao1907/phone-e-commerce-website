import React from 'react';
import { cn } from '@/lib/utils';

export interface SparkleStarProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Elegant 4-pointed sparkle star (astroid/hypocycloid star).
 * Matches the reference design glints seen across the hero canopy.
 */
export function SparkleStar({ className, ...props }: SparkleStarProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-4 h-4', className)}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
    </svg>
  );
}

export default SparkleStar;
