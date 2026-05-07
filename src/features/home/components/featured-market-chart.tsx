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

type LiveDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  stroke?: string;
  totalPoints: number;
};

type FeaturedMarketChartProps = {
  outcomes: FeaturedOutcome[];
  points: FeaturedChartPoint[];
  yAxisTicks: number[];
  headlineOutcomeId: string;
  height?: number | `${number}%`;
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
    <div className="code-surface min-w-44 rounded-2xl border border-white/10 bg-market-panel/95 p-3 shadow-2xl shadow-black/35 backdrop-blur-md">
      <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        ponto::{label}
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

function HeadlineLiveDot({ cx, cy, index, stroke, totalPoints }: LiveDotProps) {
  if (
    typeof cx !== "number" ||
    typeof cy !== "number" ||
    typeof index !== "number" ||
    !stroke ||
    index !== totalPoints - 1
  ) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={stroke} opacity={0.18}>
        <animate
          attributeName="r"
          values="6;14;6"
          dur="1.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.18;0;0.18"
          dur="1.8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle
        cx={cx}
        cy={cy}
        r={4.5}
        fill={stroke}
        stroke="rgba(7,12,18,0.92)"
        strokeWidth={2}
      />
    </g>
  );
}

export function FeaturedMarketChart({
  outcomes,
  points,
  yAxisTicks,
  headlineOutcomeId,
  height = 280,
}: FeaturedMarketChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={points}
        margin={{
          top: 8,
          right: 4,
          left: -20,
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
          minTickGap={22}
          tick={{ fill: "rgba(255,255,255,0.36)", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={38}
          ticks={yAxisTicks}
          tick={{ fill: "rgba(255,255,255,0.36)", fontSize: 11 }}
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
              type="monotoneX"
              dataKey={outcome.id}
              stroke={toneUi.line}
              strokeLinecap="round"
              strokeWidth={outcome.id === headlineOutcomeId ? 3.25 : 2.1}
              isAnimationActive
              animationDuration={520}
              animationEasing="ease-out"
              dot={
                outcome.id === headlineOutcomeId
                  ? (dotProps: {
                      cx?: number;
                      cy?: number;
                      index?: number;
                    }) => (
                      <HeadlineLiveDot
                        {...dotProps}
                        stroke={toneUi.line}
                        totalPoints={points.length}
                      />
                    )
                  : false
              }
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
