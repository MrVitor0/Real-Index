import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
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

type FeaturedChartSeriesPoint = {
  label: string;
  [key: string]: number | string;
};

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
  payload?: FeaturedChartSeriesPoint;
};

function roundToTenth(value: number) {
  return Number(value.toFixed(1));
}

function formatSignedPoints(value: number) {
  if (Math.abs(value) < 0.05) {
    return "0 pt";
  }

  return `${value > 0 ? "+" : ""}${roundToTenth(value)} pt`;
}

function formatAxisPoints(value: number) {
  if (Math.abs(value) < 0.05) {
    return "0";
  }

  return `${value > 0 ? "+" : ""}${roundToTenth(value)}`;
}

function getChangeDataKey(outcomeId: string) {
  return `${outcomeId}Change`;
}

function buildChartSeries(
  points: FeaturedChartPoint[],
  outcomes: FeaturedOutcome[],
) {
  const openingPoint = points[0];

  return points.reduce<FeaturedChartSeriesPoint[]>((accumulator, point) => {
    const seriesPoint: FeaturedChartSeriesPoint = {
      label: point.label,
    };

    outcomes.forEach((outcome) => {
      const probability = point[outcome.id];

      if (typeof probability !== "number") {
        return;
      }

      const openingProbability =
        typeof openingPoint?.[outcome.id] === "number"
          ? openingPoint[outcome.id]
          : probability;

      seriesPoint[outcome.id] = probability;
      seriesPoint[getChangeDataKey(outcome.id)] = roundToTenth(
        probability - openingProbability,
      );
    });

    accumulator.push(seriesPoint);
    return accumulator;
  }, []);
}

function buildDynamicScale(values: number[], fallbackTicks: number[]) {
  const fallbackSpread = Math.max(
    (fallbackTicks.at(-1) ?? 100) - (fallbackTicks[0] ?? 0),
    10,
  );
  const fallbackHalfRange = Math.max(roundToTenth(fallbackSpread / 20), 4);

  if (!values.length) {
    const tickStep = (fallbackHalfRange * 2) / 4;

    return {
      domain: [-fallbackHalfRange, fallbackHalfRange] as [number, number],
      ticks: Array.from({ length: 5 }, (_, index) =>
        roundToTenth(-fallbackHalfRange + tickStep * index),
      ),
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const peak = Math.max(Math.abs(min), Math.abs(max));
  const padding = peak < 1.8 ? 1.6 : Math.max(peak * 0.22, 0.9);
  const halfRange = roundToTenth(Math.max(peak + padding, fallbackHalfRange));
  const tickStep = (halfRange * 2) / 4;
  const ticks = Array.from({ length: 5 }, (_, index) =>
    roundToTenth(-halfRange + tickStep * index),
  );

  return {
    domain: [-halfRange, halfRange] as [number, number],
    ticks,
  };
}

function getGradientId(headlineOutcomeId: string) {
  return `featured-market-chart-${headlineOutcomeId.replace(/[^a-z0-9_-]/gi, "-")}`;
}

function ChartTooltip({
  active,
  label,
  payload,
  outcomes,
  headlineOutcomeId,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadItem[];
  outcomes: FeaturedOutcome[];
  headlineOutcomeId: string;
}) {
  const chartPoint = payload?.[0]?.payload;

  if (!active || !chartPoint) {
    return null;
  }

  const orderedOutcomes = [
    ...outcomes.filter((outcome) => outcome.id === headlineOutcomeId),
    ...outcomes.filter((outcome) => outcome.id !== headlineOutcomeId),
  ];

  return (
    <div className="code-surface min-w-44 rounded-2xl border border-white/10 bg-market-panel/95 p-3 shadow-2xl shadow-black/35 backdrop-blur-md">
      <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-white/45">
        leitura::{label}
      </p>
      <div className="space-y-2">
        {orderedOutcomes.map((outcome) => {
          const toneUi = getToneUi(outcome.tone);
          const probability = chartPoint[outcome.id];
          const delta = chartPoint[getChangeDataKey(outcome.id)];

          if (typeof probability !== "number" || typeof delta !== "number") {
            return null;
          }

          const movementToneClassName =
            delta > 0
              ? "text-market-positive"
              : delta < 0
                ? "text-market-negative"
                : "text-white/55";

          return (
            <div
              key={outcome.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2 text-white/75">
                <span className={`h-2.5 w-2.5 rounded-full ${toneUi.dot}`} />
                <span>{outcome.label}</span>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">
                  {formatProbability(probability)}
                </p>
                <p
                  className={`text-[11px] font-semibold ${movementToneClassName}`}
                >
                  {formatSignedPoints(delta)}
                </p>
              </div>
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
  const headlineOutcome =
    outcomes.find((outcome) => outcome.id === headlineOutcomeId) ?? outcomes[0];

  if (!headlineOutcome) {
    return null;
  }

  const chartSeries = buildChartSeries(points, outcomes);
  const movementValues = chartSeries
    .map((point) => point[getChangeDataKey(headlineOutcome.id)])
    .filter((value): value is number => typeof value === "number");
  const chartScale = buildDynamicScale(movementValues, yAxisTicks);
  const toneUi = getToneUi(headlineOutcome.tone);
  const gradientId = getGradientId(headlineOutcome.id);

  return (
    <ResponsiveContainer width="100%" height={height} minWidth={0}>
      <ComposedChart
        data={chartSeries}
        margin={{
          top: 8,
          right: 4,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={toneUi.line} stopOpacity={0.28} />
            <stop offset="60%" stopColor={toneUi.line} stopOpacity={0.08} />
            <stop offset="100%" stopColor={toneUi.line} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          ticks={chartScale.ticks}
          domain={chartScale.domain}
          tick={{ fill: "rgba(255,255,255,0.36)", fontSize: 11 }}
          tickFormatter={formatAxisPoints}
        />
        <ReferenceLine
          y={0}
          stroke="rgba(255,255,255,0.15)"
          strokeDasharray="4 6"
        />
        <Tooltip
          cursor={{
            stroke: "rgba(255,255,255,0.18)",
            strokeDasharray: "4 6",
          }}
          content={
            <ChartTooltip
              outcomes={outcomes}
              headlineOutcomeId={headlineOutcome.id}
            />
          }
        />
        <Area
          type="monotoneX"
          dataKey={getChangeDataKey(headlineOutcome.id)}
          stroke={toneUi.line}
          strokeLinecap="round"
          strokeWidth={3.25}
          fill={`url(#${gradientId})`}
          isAnimationActive
          animationDuration={520}
          animationEasing="ease-out"
          dot={(dotProps: { cx?: number; cy?: number; index?: number }) => (
            <HeadlineLiveDot
              {...dotProps}
              stroke={toneUi.line}
              totalPoints={chartSeries.length}
            />
          )}
          activeDot={{
            r: 4,
            strokeWidth: 0,
            fill: toneUi.line,
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
