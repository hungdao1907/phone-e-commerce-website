import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface FlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  accentColor?: string;
}

export function FlowButton({ text = "Modern Button", accentColor = "#111111", className = "", ...props }: FlowButtonProps) {
  return (
    <button 
      {...props} 
      className={`group/flowbtn relative flex items-center justify-center overflow-hidden rounded-[100px] border-[1.5px] border-neutral-300 hover:border-neutral-900 bg-white pl-7 pr-7 py-2.5 text-xs sm:text-sm font-semibold text-neutral-900 cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white hover:rounded-[12px] active:scale-[0.95] ${className}`}
    >
      {/* Left arrow (arr-2) */}
      <ArrowRight 
        className="absolute w-3.5 h-3.5 left-[-35%] stroke-neutral-900 fill-none z-[9] group-hover/flowbtn:left-3 group-hover/flowbtn:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />

      {/* Text */}
      <span className="relative z-[1] -translate-x-2 group-hover/flowbtn:translate-x-3.5 transition-all duration-[800ms] ease-out whitespace-nowrap">
        {text}
      </span>

      {/* Circle Background Expansion */}
      <span 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-[50%] opacity-0 group-hover/flowbtn:w-[300px] group-hover/flowbtn:h-[300px] group-hover/flowbtn:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] pointer-events-none"
        style={{ backgroundColor: accentColor }}
      ></span>

      {/* Right arrow (arr-1) */}
      <ArrowRight 
        className="absolute w-3.5 h-3.5 right-3 stroke-neutral-900 fill-none z-[9] group-hover/flowbtn:right-[-35%] group-hover/flowbtn:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
      />
    </button>
  );
}
