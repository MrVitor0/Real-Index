import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";

import type { MarketCard } from "@/features/home/contracts/home-feed";
import { openMarketsSchema } from "@/features/home/contracts/home-feed";
import {
  radarMarketContentSchema,
  radarMarketDetailSchema,
  type RadarMarketChartPoint,
  type RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  formatCompactCredits,
  invertSignalScore,
  probabilityToSignalScore,
} from "@/features/market-detail/lib/forecast";

const homeDataDirectory = path.join(process.cwd(), "data", "home");
const chartTicks = [0, 20, 40, 60, 80, 100];

async function readHomeSection<T>(
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const filePath = path.join(homeDataDirectory, fileName);
  const fileContent = await readFile(filePath, "utf8");

  return schema.parse(JSON.parse(fileContent));
}

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

function formatTimeLabel(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${hours}:${minutes}`;
}

function createRadarMarketChart(market: MarketCard): RadarMarketChartPoint[] {
  const pointsCount = 24;
  const now = new Date();
  const random = createDeterministicRandom(`chart:${market.id}`);
  const basePhase = random() * Math.PI * 2;
  const directionBias =
    market.direction === "up" ? 1 : market.direction === "down" ? -1 : 0;

  return Array.from({ length: pointsCount }, (_, index) => {
    const progress = index / (pointsCount - 1);
    const pointDate = new Date(
      now.getTime() - (pointsCount - 1 - index) * 30 * 60_000,
    );
    const wave =
      Math.sin(progress * Math.PI * 2.4 + basePhase) * 4.8 +
      Math.cos(progress * Math.PI * 1.2 + basePhase * 0.7) * 2.1;
    const drift = (1 - progress) * directionBias * -7.2;
    const microNoise = (random() - 0.5) * 1.4;
    const easedValue = clamp(
      roundToTenth(market.probability + wave + drift + microNoise),
      4,
      96,
    );

    return {
      label: index === pointsCount - 1 ? "Agora" : formatTimeLabel(pointDate),
      probability: index === pointsCount - 1 ? market.probability : easedValue,
    };
  });
}

function createCommunityPulse(market: MarketCard) {
  const yesScore = probabilityToSignalScore(market.probability);
  const random = createDeterministicRandom(`book:${market.id}`);
  const baseIntensities = [220, 340, 470, 620];

  return [
    ...baseIntensities.map((baseIntensity, index) => ({
      id: `support-${index}`,
      sentiment: "support" as const,
      score: clamp(yesScore - (3 - index), 1, 99),
      intensityLabel: formatCompactCredits(
        baseIntensity + Math.round(random() * 160),
      ),
    })),
    ...baseIntensities.map((baseIntensity, index) => ({
      id: `counter-${index}`,
      sentiment: "counter" as const,
      score: clamp(yesScore + index + 1, 1, 99),
      intensityLabel: formatCompactCredits(
        baseIntensity + Math.round(random() * 180),
      ),
    })),
  ];
}

function scoreRelatedMarket(
  referenceMarket: MarketCard,
  candidateMarket: MarketCard,
) {
  const referenceTags = new Set(
    referenceMarket.tags.filter((tag) => tag !== "Tudo"),
  );
  const sharedTags = candidateMarket.tags.filter((tag) =>
    referenceTags.has(tag),
  ).length;
  const probabilityDistance = Math.abs(
    referenceMarket.probability - candidateMarket.probability,
  );

  return sharedTags * 10 - probabilityDistance;
}

function createRelatedMarkets(
  referenceMarket: MarketCard,
  allMarkets: MarketCard[],
) {
  return allMarkets
    .filter((market) => market.id !== referenceMarket.id)
    .sort(
      (leftMarket, rightMarket) =>
        scoreRelatedMarket(referenceMarket, rightMarket) -
        scoreRelatedMarket(referenceMarket, leftMarket),
    )
    .slice(0, 3)
    .map((market) => ({
      id: market.id,
      title: market.title,
      probability: market.probability,
      iconLabel: market.iconLabel,
      tone: market.tone,
    }));
}

const getRadarMarketDetailResources = cache(async () => {
  const [openMarkets, radarMarketContent] = await Promise.all([
    readHomeSection("open-markets.json", openMarketsSchema),
    readHomeSection(
      "radar-market-details.json",
      z.array(radarMarketContentSchema),
    ),
  ]);

  return {
    markets: openMarkets.items,
    contentById: new Map(radarMarketContent.map((item) => [item.id, item])),
  };
});

export async function getRadarMarketDetailById(
  marketId: string,
): Promise<RadarMarketDetail | null> {
  const { markets, contentById } = await getRadarMarketDetailResources();
  const market = markets.find((item) => item.id === marketId);
  const content = contentById.get(marketId);

  if (!market || !content) {
    return null;
  }

  const yesScore = probabilityToSignalScore(market.probability);
  const noScore = invertSignalScore(yesScore);

  return radarMarketDetailSchema.parse({
    id: market.id,
    title: market.title,
    subtitle: market.subtitle,
    category:
      market.tags.find((tag) => tag !== "Tudo") ?? market.tags[0] ?? "Radar",
    iconLabel: market.iconLabel,
    tags: market.tags,
    probability: market.probability,
    movementLabel: market.movementLabel,
    direction: market.direction,
    tone: market.tone,
    volumeLabel: market.volumeLabel,
    closeLabel: market.subtitle,
    yesLabel: market.yesPriceLabel,
    noLabel: market.noPriceLabel,
    yesScore,
    noScore,
    overview: content.overview,
    rules: content.rules,
    context: content.context,
    chart: {
      yAxisTicks: chartTicks,
      points: createRadarMarketChart(market),
    },
    communityPulse: createCommunityPulse(market),
    relatedMarkets: createRelatedMarkets(market, markets),
    participationConfig: {
      initialCredits: 1000,
      minimumCredits: 50,
      quickCredits: [50, 100, 250, 500],
    },
  });
}
