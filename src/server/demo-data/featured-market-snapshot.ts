import type {
  FeaturedChartPoint,
  FeaturedMarket,
} from "@/features/home/contracts/home-feed";

const SNAPSHOT_WINDOW_MS = 30_000;
const HEADLINE_SWING = 1.8;
const SECONDARY_SWING = 1.15;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToTenth(value: number) {
  return Number(value.toFixed(1));
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createDeterministicRandom(seedValue: string) {
  let seed = hashString(seedValue) || 1;

  return () => {
    seed += 0x6d2b79f5;
    let next = Math.imul(seed ^ (seed >>> 15), seed | 1);

    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothProgress(value: number) {
  return value * value * (3 - 2 * value);
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
    roundToTenth((value / total) * 100),
  );
  const roundedTotal = normalizedValues.reduce((sum, value) => sum + value, 0);
  const anchorIndex = Math.max(outcomeIds.indexOf(anchorOutcomeId), 0);
  const adjustment = roundToTenth(100 - roundedTotal);

  normalizedValues[anchorIndex] = clamp(
    roundToTenth(normalizedValues[anchorIndex] + adjustment),
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

function buildBucketDrift(market: FeaturedMarket, bucketIndex: number) {
  const random = createDeterministicRandom(`${market.id}:${bucketIndex}`);

  return market.outcomes.reduce<Record<string, number>>(
    (accumulator, outcome) => {
      const swing =
        outcome.id === market.headlineOutcomeId
          ? HEADLINE_SWING
          : SECONDARY_SWING;
      const primaryWave = (random() - 0.5) * swing * 2;
      const secondaryWave = (random() - 0.5) * swing;

      accumulator[outcome.id] = roundToTenth(
        primaryWave * 0.65 + secondaryWave * 0.35,
      );
      return accumulator;
    },
    {},
  );
}

function interpolateDrift(
  previousDrift: Record<string, number>,
  nextDrift: Record<string, number>,
  progress: number,
) {
  const easedProgress = smoothProgress(progress);

  return Object.keys(nextDrift).reduce<Record<string, number>>(
    (accumulator, outcomeId) => {
      const start = previousDrift[outcomeId] ?? 0;
      const end = nextDrift[outcomeId] ?? 0;

      accumulator[outcomeId] = roundToTenth(
        start + (end - start) * easedProgress,
      );
      return accumulator;
    },
    {},
  );
}

function buildChartPoint(
  label: string,
  probabilities: Record<string, number>,
): FeaturedChartPoint {
  return {
    label,
    ...probabilities,
  } as FeaturedChartPoint;
}

export function createFeaturedMarketServerSnapshot(
  market: FeaturedMarket,
  now = new Date(),
) {
  const currentTime = now.getTime();
  const bucketIndex = Math.floor(currentTime / SNAPSHOT_WINDOW_MS);
  const progress = (currentTime % SNAPSHOT_WINDOW_MS) / SNAPSHOT_WINDOW_MS;
  const previousDrift = buildBucketDrift(market, bucketIndex - 1);
  const nextDrift = buildBucketDrift(market, bucketIndex);
  const interpolatedDrift = interpolateDrift(
    previousDrift,
    nextDrift,
    progress,
  );
  const baseProbabilities = market.outcomes.reduce<Record<string, number>>(
    (accumulator, outcome) => {
      accumulator[outcome.id] = outcome.probability;
      return accumulator;
    },
    {},
  );
  const nextProbabilities = normalizeProbabilities(
    market.outcomes.map((outcome) => outcome.id),
    market.outcomes.reduce<Record<string, number>>((accumulator, outcome) => {
      accumulator[outcome.id] =
        (baseProbabilities[outcome.id] ?? outcome.probability) +
        (interpolatedDrift[outcome.id] ?? 0);
      return accumulator;
    }, {}),
    market.headlineOutcomeId,
  );
  const latestPointLabel = market.chart.points.at(-1)?.label ?? "Agora";

  return {
    ...market,
    outcomes: market.outcomes.map((outcome) => {
      const nextProbability =
        nextProbabilities[outcome.id] ?? outcome.probability;

      return {
        ...outcome,
        probability: nextProbability,
        change: roundToTenth(nextProbability - outcome.probability),
      };
    }),
    chart: {
      ...market.chart,
      points: [
        ...market.chart.points.slice(0, -1),
        buildChartPoint(latestPointLabel, nextProbabilities),
      ],
    },
  };
}
