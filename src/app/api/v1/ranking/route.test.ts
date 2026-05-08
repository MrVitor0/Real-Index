import { beforeEach, describe, expect, it, vi } from "vitest";

import { participantRankingResponseSchema } from "@/features/home/contracts/participant-ranking";
import { createRouteContext } from "@/server/api/route-context";
import { getParticipantRanking } from "@/server/home/participant-ranking";

import { GET } from "./route";

vi.mock("@/server/api/route-context", () => ({
  createRouteContext: vi.fn(),
}));

vi.mock("@/server/home/participant-ranking", () => ({
  getParticipantRanking: vi.fn(),
}));

const mockedCreateRouteContext = vi.mocked(createRouteContext);
const mockedGetParticipantRanking = vi.mocked(getParticipantRanking);

describe("GET /api/v1/ranking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateRouteContext.mockResolvedValue({
      requestId: "req-ranking",
      auth: {
        status: "anonymous",
        required: false,
        hasCredentials: false,
        upgradePath: "/login",
      },
      viewer: null,
    });
  });

  it("retorna ranking com meta e itens tipados", async () => {
    mockedGetParticipantRanking.mockResolvedValue({
      title: "Ranking de credits",
      totalParticipants: 1,
      items: [
        {
          rank: 1,
          profileId: "profile-1",
          username: "oracle",
          displayName: "Oracle",
          avatarUrl: null,
          availableCredits: 850,
          availableCreditsLabel: "850 REAL Credits",
          investedCredits: 150,
          investedCreditsLabel: "150 REAL Credits",
          totalEquityCredits: 1020,
          totalEquityLabel: "1.020 REAL Credits",
          realizedDeltaCredits: 20,
          realizedDeltaLabel: "+ 20 REAL Credits",
          unrealizedDeltaCredits: 170,
          unrealizedDeltaLabel: "+ 170 REAL Credits",
          openPositions: 1,
        },
      ],
    });

    const response = await GET(
      new Request("https://example.test/api/v1/ranking?limit=5"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGetParticipantRanking).toHaveBeenCalledWith({
      limit: 5,
    });
    expect(participantRankingResponseSchema.parse(payload)).toMatchObject({
      data: {
        totalParticipants: 1,
      },
    });
  });

  it("retorna 400 quando o limite e invalido", async () => {
    const response = await GET(
      new Request("https://example.test/api/v1/ranking?limit=0"),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(mockedGetParticipantRanking).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      requestId: "req-ranking",
    });
  });
});
