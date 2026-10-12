"use client";

import React from "react";
import { FunnelChart } from "@/components/admin/widgets/funnel-chart";

export function SalesFunnelChart() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <h2 className="text-sm font-semibold text-white/80 mb-2 self-start pl-2">Sales Conversion Funnel</h2>
      <div className="w-full flex-1 flex items-center justify-center mt-4">
        <FunnelChart
          data={[
            {
              label: "Awareness",
              value: 4100,
              gradient: [
                { offset: "0%", color: "#3b82f6" }, // Blue
                { offset: "100%", color: "#60a5fa" },
              ],
            },
            {
              label: "Interest",
              value: 2957,
              gradient: [
                { offset: "0%", color: "#10b981" }, // Green
                { offset: "100%", color: "#34d399" },
              ],
            },
            {
              label: "Consideration",
              value: 1084,
              gradient: [
                { offset: "0%", color: "#f59e0b" }, // Orange
                { offset: "100%", color: "#fbbf24" },
              ],
            },
            {
              label: "Intent",
              value: 1038,
              gradient: [
                { offset: "0%", color: "#8b5cf6" }, // Purple
                { offset: "100%", color: "#a78bfa" },
              ],
            },
            {
              label: "Purchase",
              value: 320,
              gradient: [
                { offset: "0%", color: "#ef4444" }, // Red
                { offset: "100%", color: "#f87171" },
              ],
            },
          ]}
          layers={3}
        />
      </div>
    </div>
  );
}
