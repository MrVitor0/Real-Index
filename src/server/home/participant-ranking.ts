import "server-only";

import { desc, inArray } from "drizzle-orm";

import type { ParticipantRankingData } from "@/features/home/contracts/participant-ranking";
import { formatCredits } from "@/features/market-detail/lib/forecast";
import {
  buildForecastPortfolioSummary,
  type ForecastMarket,
  type ForecastPortfolio,
} from "@/features/market-detail/lib/forecast-engine";
import { getDb } from "@/server/db/client";
import {
  predictionEvents,
  predictionEventSnapshots,
  predictionPositions,
  profiles,
  type PredictionEvent,
  type PredictionEventSnapshot,
  type PredictionPosition,
  type Profile,
} from "@/server/db/schema";

type RankingProfileRecord = Pick<
  Profile,
  | "id"
  | "username"
  | "displayName"
  | "avatarUrl"
  | "availableCredits"
  | "realizedDeltaCredits"
>;

type RankingPositionRecord = Pick<
  PredictionPosition,
  | "profileId"
  | "predictionEventId"
  | "side"
  | "shares"
  | "investedCredits"
  | "averageEntryPrice"
>;

type RankingMarketRecord = Pick<
  PredictionEvent,
  | "id"
  | "communityProbability"
  | "minimumCredits"
  | "status"
  | "resolvedOutcome"
>;

type RankingSnapshotRecord = Pick<
  PredictionEventSnapshot,
  "predictionEventId" | "probability" | "createdAt"
>;

function roundValue(value: number) {
  return Number(value.toFixed(6));
}

function clampLimit(limit: number) {
  return Math.min(100, Math.max(1, Math.floor(limit)));
}

function formatSignedCredits(value: number) {
  const normalizedValue = roundValue(value);
  const prefix = normalizedValue > 0 ? "+ " : normalizedValue < 0 ? "- " : "";

  return prefix
    ? `${prefix}${formatCredits(Math.abs(normalizedValue))}`
    : formatCredits(Math.abs(normalizedValue));
}

function toForecastMarket(
  event: RankingMarketRecord,
  latestSnapshot: RankingSnapshotRecord | null,
): ForecastMarket {
  return {
    id: event.id,
    probability: latestSnapshot?.probability ?? event.communityProbability,
    minimumCredits: event.minimumCredits,
    status: event.status === "resolved" ? "resolved" : "open",
    resolvedOutcome: event.resolvedOutcome ?? undefined,
  };
}

function buildForecastPortfolio(
  profile: RankingProfileRecord,
  positions: RankingPositionRecord[],
): ForecastPortfolio {
  return {
    participantId: profile.id,
    availableCredits: profile.availableCredits,
    realizedDeltaCredits: profile.realizedDeltaCredits,
    positions: positions.map((position) => ({
      marketId: position.predictionEventId,
      side: position.side,
      shares: position.shares,
      investedCredits: position.investedCredits,
      averageEntryPrice: position.averageEntryPrice,
    })),
    ledger: [],
  };
}

export function buildParticipantRanking(input: {
  profiles: RankingProfileRecord[];
  positions: RankingPositionRecord[];
  markets: RankingMarketRecord[];
  snapshots: RankingSnapshotRecord[];
  limit?: number;
}): ParticipantRankingData {
  const positionsByProfileId = new Map<string, RankingPositionRecord[]>();
  const latestSnapshotByEventId = new Map<string, RankingSnapshotRecord>();

  for (const position of input.positions) {
    const items = positionsByProfileId.get(position.profileId) ?? [];

    items.push(position);
    positionsByProfileId.set(position.profileId, items);
  }

  for (const snapshot of input.snapshots) {
    const currentSnapshot = latestSnapshotByEventId.get(
      snapshot.predictionEventId,
    );

    if (!currentSnapshot || currentSnapshot.createdAt < snapshot.createdAt) {
      latestSnapshotByEventId.set(snapshot.predictionEventId, snapshot);
    }
  }

  const markets = input.markets.map((event) =>
    toForecastMarket(event, latestSnapshotByEventId.get(event.id) ?? null),
  );

  const items = input.profiles
    .map((profile) => {
      const portfolio = buildForecastPortfolio(
        profile,
        positionsByProfileId.get(profile.id) ?? [],
      );
      const summary = buildForecastPortfolioSummary(portfolio, markets);

      return {
        profileId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        availableCredits: summary.availableCredits,
        availableCreditsLabel: formatCredits(summary.availableCredits),
        investedCredits: summary.investedCredits,
        investedCreditsLabel: formatCredits(summary.investedCredits),
        totalEquityCredits: summary.totalEquityCredits,
        totalEquityLabel: formatCredits(summary.totalEquityCredits),
        realizedDeltaCredits: summary.realizedDeltaCredits,
        realizedDeltaLabel: formatSignedCredits(summary.realizedDeltaCredits),
        unrealizedDeltaCredits: summary.unrealizedDeltaCredits,
        unrealizedDeltaLabel: formatSignedCredits(
          summary.unrealizedDeltaCredits,
        ),
        openPositions: summary.openPositions,
      };
    })
    .sort((left, right) => {
      if (right.totalEquityCredits !== left.totalEquityCredits) {
        return right.totalEquityCredits - left.totalEquityCredits;
      }

      if (right.availableCredits !== left.availableCredits) {
        return right.availableCredits - left.availableCredits;
      }

      if (right.realizedDeltaCredits !== left.realizedDeltaCredits) {
        return right.realizedDeltaCredits - left.realizedDeltaCredits;
      }

      return left.displayName.localeCompare(right.displayName, "pt-BR");
    })
    .slice(0, clampLimit(input.limit ?? 25))
    .map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

  return {
    title: "Ranking de credits",
    totalParticipants: input.profiles.length,
    items,
  };
}

export async function getParticipantRanking(input?: { limit?: number }) {
  const db = getDb();
  const profileRows = await db
    .select({
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      availableCredits: profiles.availableCredits,
      realizedDeltaCredits: profiles.realizedDeltaCredits,
    })
    .from(profiles)
    .orderBy(desc(profiles.availableCredits), desc(profiles.createdAt));
  const positionRows = await db
    .select({
      profileId: predictionPositions.profileId,
      predictionEventId: predictionPositions.predictionEventId,
      side: predictionPositions.side,
      shares: predictionPositions.shares,
      investedCredits: predictionPositions.investedCredits,
      averageEntryPrice: predictionPositions.averageEntryPrice,
    })
    .from(predictionPositions);
  const eventIds = [
    ...new Set(positionRows.map((position) => position.predictionEventId)),
  ];

  if (!eventIds.length) {
    return buildParticipantRanking({
      profiles: profileRows,
      positions: [],
      markets: [],
      snapshots: [],
      limit: input?.limit,
    });
  }

  const [marketRows, snapshotRows] = await Promise.all([
    db
      .select({
        id: predictionEvents.id,
        communityProbability: predictionEvents.communityProbability,
        minimumCredits: predictionEvents.minimumCredits,
        status: predictionEvents.status,
        resolvedOutcome: predictionEvents.resolvedOutcome,
      })
      .from(predictionEvents)
      .where(inArray(predictionEvents.id, eventIds)),
    db
      .select({
        predictionEventId: predictionEventSnapshots.predictionEventId,
        probability: predictionEventSnapshots.probability,
        createdAt: predictionEventSnapshots.createdAt,
      })
      .from(predictionEventSnapshots)
      .where(inArray(predictionEventSnapshots.predictionEventId, eventIds))
      .orderBy(desc(predictionEventSnapshots.createdAt)),
  ]);

  return buildParticipantRanking({
    profiles: profileRows,
    positions: positionRows,
    markets: marketRows,
    snapshots: snapshotRows,
    limit: input?.limit,
  });
}
