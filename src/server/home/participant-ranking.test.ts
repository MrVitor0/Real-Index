import { describe, expect, it } from "vitest";

import {
  createForecastPortfolio,
  executeForecastEntry,
  type ForecastPortfolio,
} from "@/features/market-detail/lib/forecast-engine";

import { buildParticipantRanking } from "./participant-ranking";

function createPortfolioWithOpenPosition(): ForecastPortfolio {
  return executeForecastEntry({
    portfolio: createForecastPortfolio({
      participantId: "profile-alpha",
      initialCredits: 1_000,
    }),
    market: {
      id: "radar-europa",
      probability: 60,
      minimumCredits: 50,
      status: "open",
    },
    side: "yes",
    spendCredits: 400,
  }).portfolio;
}

describe("participant-ranking", () => {
  it("ordena participantes pelo patrimonio total em credits", () => {
    const bullishPortfolio = createPortfolioWithOpenPosition();
    const ranking = buildParticipantRanking({
      profiles: [
        {
          id: "profile-alpha",
          username: "alpha",
          displayName: "Alpha",
          avatarUrl: null,
          availableCredits: bullishPortfolio.availableCredits,
          realizedDeltaCredits: bullishPortfolio.realizedDeltaCredits,
        },
        {
          id: "profile-beta",
          username: "beta",
          displayName: "Beta",
          avatarUrl: null,
          availableCredits: 1_050,
          realizedDeltaCredits: 0,
        },
      ],
      positions: bullishPortfolio.positions.map((position) => ({
        profileId: "profile-alpha",
        predictionEventId: position.marketId,
        side: position.side,
        shares: position.shares,
        investedCredits: position.investedCredits,
        averageEntryPrice: position.averageEntryPrice,
      })),
      markets: [
        {
          id: "radar-europa",
          communityProbability: 60,
          minimumCredits: 50,
          status: "active",
          resolvedOutcome: null,
        },
      ],
      snapshots: [
        {
          predictionEventId: "radar-europa",
          probability: 80,
          createdAt: new Date("2026-05-07T18:20:00.000Z"),
        },
      ],
      limit: 10,
    });

    expect(ranking.totalParticipants).toBe(2);
    expect(ranking.items[0]).toMatchObject({
      rank: 1,
      profileId: "profile-alpha",
      openPositions: 1,
    });
    expect(ranking.items[0]?.totalEquityCredits).toBeCloseTo(1133.333334, 6);
    expect(ranking.items[1]).toMatchObject({
      rank: 2,
      profileId: "profile-beta",
      totalEquityCredits: 1050,
      openPositions: 0,
    });
  });

  it("usa o snapshot mais recente do radar para calcular o valor de mercado", () => {
    const bullishPortfolio = createPortfolioWithOpenPosition();
    const ranking = buildParticipantRanking({
      profiles: [
        {
          id: "profile-alpha",
          username: "alpha",
          displayName: "Alpha",
          avatarUrl: null,
          availableCredits: bullishPortfolio.availableCredits,
          realizedDeltaCredits: bullishPortfolio.realizedDeltaCredits,
        },
      ],
      positions: bullishPortfolio.positions.map((position) => ({
        profileId: "profile-alpha",
        predictionEventId: position.marketId,
        side: position.side,
        shares: position.shares,
        investedCredits: position.investedCredits,
        averageEntryPrice: position.averageEntryPrice,
      })),
      markets: [
        {
          id: "radar-europa",
          communityProbability: 45,
          minimumCredits: 50,
          status: "active",
          resolvedOutcome: null,
        },
      ],
      snapshots: [
        {
          predictionEventId: "radar-europa",
          probability: 72,
          createdAt: new Date("2026-05-07T17:00:00.000Z"),
        },
        {
          predictionEventId: "radar-europa",
          probability: 81,
          createdAt: new Date("2026-05-07T18:00:00.000Z"),
        },
      ],
    });

    expect(ranking.items[0]?.unrealizedDeltaCredits).toBeCloseTo(140, 6);
    expect(ranking.items[0]?.totalEquityCredits).toBeCloseTo(1140, 6);
  });
});
