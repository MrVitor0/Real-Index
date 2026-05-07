import type {
  FeaturedChartPoint,
  FeaturedMarket,
  FeaturedOutcome,
  HomeTone,
} from "@/features/home/contracts/home-feed";

export type FeaturedMarketLiveActivity = {
  id: string;
  headline: string;
  contextLabel: string;
  timestampLabel: string;
  tone: HomeTone;
};

export type FeaturedMarketLivePatch = {
  point: FeaturedChartPoint;
  probabilities: Record<string, number>;
  driftByOutcome: Record<string, number>;
  cyclePhase: number;
  activity: FeaturedMarketLiveActivity;
  emittedAt: number;
};

export type FeaturedMarketLiveState = {
  outcomes: FeaturedOutcome[];
  points: FeaturedChartPoint[];
  activities: FeaturedMarketLiveActivity[];
  lastUpdatedLabel: string;
  baselineProbabilities: Record<string, number>;
  driftByOutcome: Record<string, number>;
  cyclePhase: number;
};

const MAX_POINTS = 12;
const MAX_ACTIVITIES = 3;
const CYCLE_STEP = 0.78;
const CYCLE_HARMONIC_WEIGHT = 0.34;
const HEADLINE_CYCLE_AMPLITUDE = 0.76;
const SECONDARY_CYCLE_AMPLITUDE = 0.42;
const HEADLINE_DRIFT_LIMIT = 0.84;
const SECONDARY_DRIFT_LIMIT = 0.52;
const HEADLINE_NOISE_AMPLITUDE = 0.07;
const SECONDARY_NOISE_AMPLITUDE = 0.05;
const DRIFT_INERTIA = 0.24;
const RECENT_SLOPE_WEIGHT = 0.12;
const TARGET_PULL_WEIGHT = 0.64;
const CHANGE_INERTIA = 0.72;
const CHANGE_MULTIPLIER = 2.6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number) {
  return Number(value.toFixed(1));
}

function roundToHundredth(value: number) {
  return Number(value.toFixed(2));
}

function formatClockLabel(emittedAt: number) {
  const date = new Date(emittedAt);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function formatAxisLabel(emittedAt: number) {
  const date = new Date(emittedAt);
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function formatContextProbability(value: number) {
  return `${roundToTenth(value)}%`;
}

function buildProbabilityMap(outcomes: FeaturedOutcome[]) {
  return outcomes.reduce<Record<string, number>>((accumulator, outcome) => {
    accumulator[outcome.id] = outcome.probability;
    return accumulator;
  }, {});
}

function buildZeroMap(outcomes: FeaturedOutcome[]) {
  return outcomes.reduce<Record<string, number>>((accumulator, outcome) => {
    accumulator[outcome.id] = 0;
    return accumulator;
  }, {});
}

function getDriftLimit(outcomeId: string, headlineOutcomeId: string) {
  return outcomeId === headlineOutcomeId
    ? HEADLINE_DRIFT_LIMIT
    : SECONDARY_DRIFT_LIMIT;
}

function getNoiseAmplitude(outcomeId: string, headlineOutcomeId: string) {
  return outcomeId === headlineOutcomeId
    ? HEADLINE_NOISE_AMPLITUDE
    : SECONDARY_NOISE_AMPLITUDE;
}

function getCycleAmplitude(outcomeId: string, headlineOutcomeId: string) {
  return outcomeId === headlineOutcomeId
    ? HEADLINE_CYCLE_AMPLITUDE
    : SECONDARY_CYCLE_AMPLITUDE;
}

function normalizeProbabilities(
  outcomeIds: string[],
  rawProbabilities: Record<string, number>,
  anchorOutcomeId: string,
) {
  const clampedValues = outcomeIds.map((outcomeId) =>
    clamp(rawProbabilities[outcomeId] ?? 0, 1, 99),
  );
  const total = clampedValues.reduce((sum, value) => sum + value, 0) || 100;
  const normalizedValues = clampedValues.map((value) =>
    roundToHundredth((value / total) * 100),
  );
  const roundedTotal = normalizedValues.reduce((sum, value) => sum + value, 0);
  const anchorIndex = Math.max(outcomeIds.indexOf(anchorOutcomeId), 0);
  const adjustment = roundToHundredth(100 - roundedTotal);

  normalizedValues[anchorIndex] = clamp(
    roundToHundredth(normalizedValues[anchorIndex] + adjustment),
    1,
    99,
  );

  return outcomeIds.reduce<Record<string, number>>(
    (accumulator, outcomeId, index) => {
      accumulator[outcomeId] = normalizedValues[index] ?? 0;
      return accumulator;
    },
    {},
  );
}

function buildActivity(
  outcome: FeaturedOutcome,
  delta: number,
  nextProbability: number,
  emittedAt: number,
): FeaturedMarketLiveActivity {
  const movement = roundToTenth(Math.abs(delta));
  let headline = `Fluxo estabiliza ${outcome.label}`;

  if (delta >= 0.55) {
    headline = `Conviccao acelera ${outcome.label}`;
  } else if (delta >= 0.2) {
    headline = `Leitura reforca ${outcome.label}`;
  } else if (delta <= -0.55) {
    headline = `Contraponto pressiona ${outcome.label}`;
  } else if (delta <= -0.2) {
    headline = `Ruido reduz ${outcome.label}`;
  }

  return {
    id: `${outcome.id}-${emittedAt}`,
    headline,
    contextLabel: `${delta >= 0 ? "+" : "-"}${movement} pt · ${formatContextProbability(nextProbability)}`,
    timestampLabel: formatClockLabel(emittedAt),
    tone: outcome.tone,
  };
}

function buildPoint(
  label: string,
  probabilities: Record<string, number>,
): FeaturedChartPoint {
  return {
    label,
    ...probabilities,
  } as FeaturedChartPoint;
}

export function createFeaturedMarketLiveState(
  market: FeaturedMarket,
): FeaturedMarketLiveState {
  const emittedAt = Date.now();
  const headlineOutcome =
    market.outcomes.find(
      (outcome) => outcome.id === market.headlineOutcomeId,
    ) ?? market.outcomes[0];

  return {
    outcomes: market.outcomes.map((outcome) => ({ ...outcome })),
    points: market.chart.points.slice(-MAX_POINTS),
    activities: headlineOutcome
      ? [
          buildActivity(
            headlineOutcome,
            0.4,
            headlineOutcome.probability,
            emittedAt,
          ),
        ]
      : [],
    lastUpdatedLabel: formatClockLabel(emittedAt),
    baselineProbabilities: buildProbabilityMap(market.outcomes),
    driftByOutcome: buildZeroMap(market.outcomes),
    cyclePhase: 0,
  };
}

export function createSimulatedFeaturedMarketLivePatch(
  market: FeaturedMarket,
  currentState: FeaturedMarketLiveState,
): FeaturedMarketLivePatch {
  const currentProbabilities = buildProbabilityMap(currentState.outcomes);
  const recentPoint = currentState.points.at(-1);
  const previousPoint = currentState.points.at(-2);
  const nextCyclePhase = currentState.cyclePhase + CYCLE_STEP;
  const driftByOutcome = currentState.outcomes.reduce<Record<string, number>>(
    (accumulator, outcome, index) => {
      const latestValue =
        typeof recentPoint?.[outcome.id] === "number"
          ? recentPoint[outcome.id]
          : outcome.probability;
      const previousValue =
        typeof previousPoint?.[outcome.id] === "number"
          ? previousPoint[outcome.id]
          : latestValue;
      const baselineValue =
        currentState.baselineProbabilities[outcome.id] ?? outcome.probability;
      const previousDrift = currentState.driftByOutcome[outcome.id] ?? 0;
      const recentSlope = latestValue - previousValue;
      const cycleAmplitude = getCycleAmplitude(
        outcome.id,
        market.headlineOutcomeId,
      );
      const phase = nextCyclePhase + index * 1.86;
      const cycleOffset =
        Math.sin(phase) * cycleAmplitude +
        Math.sin(phase * 0.46 + index * 0.72) *
          cycleAmplitude *
          CYCLE_HARMONIC_WEIGHT;
      const targetValue = baselineValue + cycleOffset;
      const nextDrift = clamp(
        previousDrift * DRIFT_INERTIA +
          recentSlope * RECENT_SLOPE_WEIGHT +
          (targetValue - latestValue) * TARGET_PULL_WEIGHT +
          (Math.random() - 0.5) *
            getNoiseAmplitude(outcome.id, market.headlineOutcomeId) *
            2,
        -getDriftLimit(outcome.id, market.headlineOutcomeId),
        getDriftLimit(outcome.id, market.headlineOutcomeId),
      );

      accumulator[outcome.id] = roundToHundredth(nextDrift);
      return accumulator;
    },
    {},
  );
  const rawProbabilities = currentState.outcomes.reduce<Record<string, number>>(
    (accumulator, outcome) => {
      const latestValue =
        typeof recentPoint?.[outcome.id] === "number"
          ? recentPoint[outcome.id]
          : outcome.probability;

      accumulator[outcome.id] = latestValue + (driftByOutcome[outcome.id] ?? 0);
      return accumulator;
    },
    {},
  );
  const probabilities = normalizeProbabilities(
    currentState.outcomes.map((outcome) => outcome.id),
    rawProbabilities,
    market.headlineOutcomeId,
  );
  const emittedAt = Date.now();
  const dominantOutcome = currentState.outcomes.reduce(
    (currentLeader, outcome) => {
      const currentDelta = Math.abs(
        (probabilities[outcome.id] ?? outcome.probability) -
          currentProbabilities[outcome.id],
      );
      const leaderDelta = Math.abs(
        (probabilities[currentLeader.id] ?? currentLeader.probability) -
          currentProbabilities[currentLeader.id],
      );

      return currentDelta > leaderDelta ? outcome : currentLeader;
    },
    currentState.outcomes[0] ?? market.outcomes[0],
  );
  const dominantDelta =
    (probabilities[dominantOutcome.id] ?? dominantOutcome.probability) -
    currentProbabilities[dominantOutcome.id];

  return {
    point: buildPoint(formatAxisLabel(emittedAt), probabilities),
    probabilities,
    driftByOutcome,
    cyclePhase: nextCyclePhase,
    emittedAt,
    activity: buildActivity(
      dominantOutcome,
      dominantDelta,
      probabilities[dominantOutcome.id] ?? dominantOutcome.probability,
      emittedAt,
    ),
  };
}

export function applyFeaturedMarketLivePatch(
  currentState: FeaturedMarketLiveState,
  patch: FeaturedMarketLivePatch,
): FeaturedMarketLiveState {
  const nextOutcomes = currentState.outcomes.map((outcome) => {
    const nextProbability =
      patch.probabilities[outcome.id] ?? outcome.probability;
    const delta = nextProbability - outcome.probability;

    return {
      ...outcome,
      probability: nextProbability,
      change: roundToTenth(
        clamp(
          outcome.change * CHANGE_INERTIA + delta * CHANGE_MULTIPLIER,
          -99,
          99,
        ),
      ),
    };
  });

  return {
    outcomes: nextOutcomes,
    points: [...currentState.points.slice(-(MAX_POINTS - 1)), patch.point],
    activities: [patch.activity, ...currentState.activities].slice(
      0,
      MAX_ACTIVITIES,
    ),
    lastUpdatedLabel: formatClockLabel(patch.emittedAt),
    baselineProbabilities: currentState.baselineProbabilities,
    driftByOutcome: patch.driftByOutcome,
    cyclePhase: patch.cyclePhase,
  };
}
