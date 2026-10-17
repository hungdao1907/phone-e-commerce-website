"use client";

import React, { useState } from "react";
import { DonutChart } from "@/components/admin/widgets/donut-chart";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { DollarSign, MoreVertical } from "lucide-react";

import { useDashboardRevenue } from "@/hooks/useDashboardRevenue";

const DONUT_COLORS = ['#3ee08c', '#ff8040', '#33ccaa', '#5a8cff'];

export function DoanhThuChart() {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const { data: revenueData, isLoading } = useDashboardRevenue();

  const financialData = revenueData && revenueData.length > 0 
    ? revenueData 
    : []; // Empty state

  const themedData = React.useMemo(() => {
    return financialData.map((item, idx) => ({
      ...item,
      color: DONUT_COLORS[idx % DONUT_COLORS.length]
    }));
  }, [financialData]);

  const totalFinancialValue = themedData.reduce((sum, d) => sum + d.value, 0);

  const activeSegment = themedData.find(
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
    <div className="w-full h-full flex flex-col p-7 justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-[19px] font-semibold text-[#eefaf3]">Doanh thu danh mục</h2>
          <p className="text-[14px] mt-1 text-[#eefaf3]/55">
            Doanh thu <b className="text-[#eefaf3] font-semibold ml-1">{totalFinancialValue.toLocaleString('vi-VN')} đ</b>
          </p>
        </div>
        <button className="text-[#eefaf3]/40 hover:text-[#eefaf3] transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Chart + Legend */}
      <div className="flex-1 flex items-center gap-8 min-h-0 my-auto">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[rgba(62,224,140,0.2)] border-t-[#3ee08c] animate-spin" />
          </div>
        ) : themedData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#eefaf3]/50 text-sm">
            <span>Chưa có dữ liệu doanh thu</span>
          </div>
        ) : (
          <>
            {/* Left: DonutChart */}
            <div className="relative flex items-center justify-center flex-[1] h-full">
              <DonutChart
                data={themedData}
                size={205}
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
                      <p
                        className="text-[34px] font-bold text-[#eefaf3] leading-none"
                        style={{ textShadow: '0 0 22px rgba(62, 224, 140, 0.7)' }}
                      >
                        {formatCenterValue(displayValue)}
                      </p>
                      <p className="text-[#eefaf3]/55 text-[12px] font-medium truncate max-w-[95px] mt-1">
                        {displayLabel}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                }
              />
            </div>

            {/* Right: Legend with Emerald Glass Bars */}
            <div className="flex flex-col justify-center flex-[1.2] gap-4">
              {themedData.map((segment, index) => {
                const percentage = totalFinancialValue > 0 ? (segment.value / totalFinancialValue) * 100 : 0;
                return (
                  <motion.div
                    key={segment.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.4 }}
                    className={cn(
                      "flex flex-col p-2 rounded-xl transition-all duration-200 cursor-pointer",
                      hoveredSegment === segment.label ? "bg-white/10" : "hover:bg-white/5"
                    )}
                    onMouseEnter={() => setHoveredSegment(segment.label)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <div className="flex items-center justify-between text-[14px]">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: segment.color,
                            boxShadow: `0 0 10px ${segment.color}`
                          }}
                        />
                        <span className="text-[13px] font-medium text-[#eefaf3]/90">
                          {segment.label}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#eefaf3]">
                        {segment.value.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {/* Progress Bar from Emerald Glass */}
                    <div className="w-full h-1 bg-white/[0.07] rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.round(percentage)}%`,
                          backgroundColor: segment.color
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
