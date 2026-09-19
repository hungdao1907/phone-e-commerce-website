"use client";

import React, { useState } from "react";
import { DonutChart } from "@/components/admin/widgets/donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DollarSign, MoreVertical } from "lucide-react";

import { useDashboardRevenue } from "@/hooks/useDashboardRevenue";

export function DoanhThuChart() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const { data: revenueData, isLoading } = useDashboardRevenue();

  const financialData = revenueData && revenueData.length > 0 
    ? revenueData 
    : []; // Empty state

  const totalFinancialValue = financialData.reduce((sum, d) => sum + d.value, 0);

  const activeSegment = financialData.find(
    (segment) => segment.label === hoveredSegment
  );

  const displayValue = activeSegment?.value ?? totalFinancialValue;
  const displayLabel = activeSegment?.label ?? "Tổng doanh thu";

  // Formatter for center content
  const formatCenterValue = (value: number) => {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + " tỷ";
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + "tr";
    return value.toLocaleString('vi-VN');
  };

  return (
    <div className="w-full h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Doanh thu danh mục</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-white/60 text-sm">Doanh thu</span>
            <span className="text-white font-bold text-sm">{totalFinancialValue.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>
        <button className="text-white/30 hover:text-white/60 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Chart + Legend */}
      <div className="flex-1 flex items-center gap-8 min-h-0">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          </div>
        ) : financialData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-sm">
            <span>Chưa có dữ liệu doanh thu</span>
          </div>
        ) : (
          <>
            {/* Left: DonutChart */}
            <div className="relative flex items-center justify-center flex-[1] h-full">
              <DonutChart
                data={financialData}
            size={180}
            strokeWidth={22}
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
                  <p className="text-2xl font-bold text-white">
                    {formatCenterValue(displayValue)}
                  </p>
                  <p className="text-white/40 text-[10px] font-medium truncate max-w-[90px]">
                    {displayLabel}
                  </p>
                </motion.div>
              </AnimatePresence>
            }
          />
        </div>

        {/* Right: Legend */}
        <div className="flex flex-col justify-center flex-[1.2] gap-1">
          {financialData.map((segment, index) => (
            <motion.div
              key={segment.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                hoveredSegment === segment.label ? "bg-white/10" : "hover:bg-white/5"
              )}
              onMouseEnter={() => setHoveredSegment(segment.label)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="flex items-center space-x-2.5">
                <span
                  className="h-3 w-3 rounded-full shadow-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-[13px] font-medium text-white/90">
                  {segment.label}
                </span>
              </div>
              <span className="text-[13px] font-semibold text-white/50">
                {segment.value.toLocaleString('vi-VN')} ₫
              </span>
            </motion.div>
          ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
