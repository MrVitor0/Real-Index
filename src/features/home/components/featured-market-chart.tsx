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
  FeaturedChartPoint,
  FeaturedOutcome,
} from "@/features/home/contracts/home-feed";
import { formatProbability, getToneUi } from "@/features/home/lib/presentation";

type FeaturedMarketChartProps = {
  outcomes: FeaturedOutcome[];
  points: FeaturedChartPoint[];
  yAxisTicks: number[];
  headlineOutcomeId: string;
};

type TooltipPayloadItem = {
  dataKey?: string | number;
  value?: number;
};

function ChartTooltip({
  active,
  label,
  payload,
  outcomes,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  outcomes: FeaturedOutcome[];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="min-w-44 rounded-2xl border border-white/10 bg-[color:var(--market-panel)]/95 p-3 shadow-2xl shadow-black/35 backdrop-blur-md">
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
        {label}
      </p>
      <div className="space-y-2">
        {outcomes.map((outcome) => {
          const entry = payload.find(
            (payloadItem) => payloadItem.dataKey === outcome.id,
          );

          if (typeof entry?.value !== "number") {
            return null;
          }

          const toneUi = getToneUi(outcome.tone);

          return (
            <div
              key={outcome.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2 text-white/75">
                <span className={`h-2.5 w-2.5 rounded-full ${toneUi.dot}`} />
                <span>{outcome.label}</span>
              </div>
              <span className="font-semibold text-white">
                {formatProbability(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeaturedMarketChart({
  outcomes,
  points,
  yAxisTicks,
  headlineOutcomeId,
}: FeaturedMarketChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={points}
        margin={{
          top: 12,
          right: 8,
          left: -16,
          bottom: 0,
        }}
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
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={44}
          ticks={yAxisTicks}
          tick={{ fill: "rgba(255,255,255,0.38)", fontSize: 12 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          cursor={{
            stroke: "rgba(255,255,255,0.18)",
            strokeDasharray: "4 6",
          }}
          content={<ChartTooltip outcomes={outcomes} />}
        />
        {outcomes.map((outcome) => {
          const toneUi = getToneUi(outcome.tone);

          return (
            <Line
              key={outcome.id}
              type="monotone"
              dataKey={outcome.id}
              stroke={toneUi.line}
              strokeWidth={outcome.id === headlineOutcomeId ? 3.25 : 2.1}
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 0,
                fill: toneUi.line,
              }}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}
