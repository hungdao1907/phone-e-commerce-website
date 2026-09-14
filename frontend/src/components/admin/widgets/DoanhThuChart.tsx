"use client";

import React, { useState } from "react";
import { DonutChart } from "@/components/admin/widgets/donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const financialData = [
  { value: 450, color: "#3b82f6", label: "Smartphone" },
  { value: 300, color: "#10b981", label: "iPad" },
  { value: 150, color: "#f59e0b", label: "Laptop" },
  { value: 100, color: "#6366f1", label: "Khác" },
];

const totalFinancialValue = financialData.reduce((sum, d) => sum + d.value, 0);

export function DoanhThuChart() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Find the currently hovered segment data
  const activeSegment = financialData.find(
    (segment) => segment.label === hoveredSegment
  );
  
  // Determine total value (either hovered or overall)
  const displayValue = activeSegment?.value ?? totalFinancialValue;
  const displayLabel = activeSegment?.label ?? "Tổng Doanh Thu";

  return (
    <div className="w-full h-full flex items-center justify-between p-6 gap-4">
      {/* Left Side: Chart */}
      <div className="relative flex items-center justify-center flex-[1] h-full">
        <DonutChart
          data={financialData}
          size={160}
          strokeWidth={18}
          animationDuration={1.2}
          animationDelayPerSegment={0.05}
          highlightOnHover={true}
          activeSegmentLabel={hoveredSegment}
          onSegmentHover={(segment) => setHoveredSegment(segment ? segment.label : null)}
          centerContent={
            <AnimatePresence mode="wait">
              <motion.div
                key={displayLabel}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "circOut" }}
                className="flex flex-col items-center justify-center text-center"
              >
                <p className="text-white/50 text-[10px] font-medium truncate max-w-[90px]">
                  {displayLabel}
                </p>
                <p className="text-xl font-bold text-white">
                  ${displayValue}
                </p>
              </motion.div>
            </AnimatePresence>
          }
        />
      </div>

      {/* Right Side: Title and Legend */}
      <div className="flex flex-col h-full justify-center flex-[1.2]">
        <h2 className="text-lg font-semibold text-white/80 mb-4 pl-2">Doanh Thu</h2>
        <div className="flex flex-col space-y-2">
          {financialData.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
              className={cn(
                "flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer",
                hoveredSegment === segment.label ? "bg-white/10" : "hover:bg-white/5"
              )}
              onMouseEnter={() => setHoveredSegment(segment.label)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center space-x-2.5">
                <span
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: segment.color }}
                ></span>
                <span className="text-[13px] font-medium text-white/90">
                  {segment.label}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-white/50">
                ${segment.value}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
