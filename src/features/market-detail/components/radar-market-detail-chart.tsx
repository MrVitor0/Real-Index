"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  RadarMarketChartPoint,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import { formatProbability, getToneUi } from "@/features/home/lib/presentation";

const rangeOptions = [
  { id: "1H", label: "1H", size: 4 },
  { id: "6H", label: "6H", size: 12 },
  { id: "1D", label: "1D", size: 24 },
  { id: "1W", label: "1W", size: 24 },
  { id: "ALL", label: "ALL", size: null },
] as const;

function ChartTooltip({
  active,
  payload,
  label,
  tone,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
  }>;
  label?: string;
  tone: RadarMarketDetail["tone"];
}) {
  if (!active || !payload?.length || typeof payload[0]?.value !== "number") {
    return null;
  }

  const toneUi = getToneUi(tone);

  return (
    <div className="code-surface min-w-36 rounded-2xl border border-white/10 bg-market-panel/95 p-3 shadow-2xl shadow-black/30 backdrop-blur-md">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/42">
        {label}
      </p>
      <p className={`mt-2 text-lg font-semibold ${toneUi.text}`}>
        {formatProbability(payload[0].value)}
      </p>
    </div>
  );
}

type RadarMarketDetailChartProps = {
  chart: RadarMarketDetail["chart"];
  tone: RadarMarketDetail["tone"];
};

export function RadarMarketDetailChart({
  chart,
  tone,
}: RadarMarketDetailChartProps) {
  const [activeRange, setActiveRange] =
    useState<(typeof rangeOptions)[number]["id"]>("1D");
  const toneUi = getToneUi(tone);

  const visiblePoints = useMemo(() => {
    const selectedRange = rangeOptions.find(
      (option) => option.id === activeRange,
    );

    if (!selectedRange || selectedRange.size === null) {
      return chart.points;
    }

    return chart.points.slice(-selectedRange.size);
  }, [activeRange, chart.points]);

  return (
    <div className="space-y-4">
      <div className="min-w-0 h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={visiblePoints as RadarMarketChartPoint[]}
            margin={{ top: 8, right: 6, left: -24, bottom: 4 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--market-grid)"
              strokeDasharray="3 6"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              minTickGap={22}
              tick={{ fill: "rgba(255,255,255,0.34)", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={42}
              ticks={chart.yAxisTicks}
              tickFormatter={(value) => `${value}%`}
              tick={{ fill: "rgba(255,255,255,0.34)", fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip tone={tone} />} cursor={false} />
            <Line
              type="monotoneX"
              dataKey="probability"
              stroke={toneUi.line}
              strokeWidth={3}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: toneUi.line }}
              isAnimationActive
              animationDuration={420}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {rangeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setActiveRange(option.id)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
              activeRange === option.id
                ? "border-primary/24 bg-primary/14 text-primary"
                : "border-white/8 bg-white/[0.03] text-white/48 hover:bg-white/[0.06] hover:text-white/76"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
