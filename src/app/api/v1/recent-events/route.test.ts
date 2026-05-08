import { beforeEach, describe, expect, it, vi } from "vitest";

import { recentActivityResponseSchema } from "@/features/home/contracts/recent-activity";
import { getRecentActivityFeed } from "@/server/activity/log";
import { createRouteContext } from "@/server/api/route-context";

import { GET } from "./route";

vi.mock("@/server/api/route-context", () => ({
  createRouteContext: vi.fn(),
}));

vi.mock("@/server/activity/log", () => ({
  getRecentActivityFeed: vi.fn(),
}));

const mockedCreateRouteContext = vi.mocked(createRouteContext);
const mockedGetRecentActivityFeed = vi.mocked(getRecentActivityFeed);

describe("GET /api/v1/recent-events", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateRouteContext.mockResolvedValue({
      requestId: "req-events",
      auth: {
        status: "authenticated",
        required: false,
        hasCredentials: true,
        upgradePath: "/login",
      },
      viewer: {
        id: "viewer-1",
        email: "oracle@example.test",
        name: "Oracle",
        image: null,
      },
    });
  });

  it("retorna eventos recentes filtrando os tipos da query string", async () => {
    mockedGetRecentActivityFeed.mockResolvedValue({
      title: "Atividade recente",
      items: [
        {
          id: "activity-1",
          group: "forecast",
          type: "forecast_entry",
          typeLabel: "Forecast",
          headline: "Oracle reforcou uma leitura",
          description: "Falha cloud na Europa • Escala • 220 REAL Credits",
          createdAt: "2026-05-07T22:00:00.000Z",
          actor: {
            id: "profile-1",
            username: "oracle",
            displayName: "Oracle",
            avatarUrl: null,
          },
          market: {
            id: "market-1",
            slug: "falha-cloud-europa",
            title: "Falha cloud na Europa",
          },
          fromSide: null,
          toSide: "yes",
          creditsAmount: 220,
          creditsAmountLabel: "220 REAL Credits",
          sharesAmount: 360,
          sharesAmountLabel: "360 cotas",
        },
      ],
    });

    const response = await GET(
      new Request(
        "https://example.test/api/v1/recent-events?limit=8&types=forecast_entry,user_joined",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGetRecentActivityFeed).toHaveBeenCalledWith({
      limit: 8,
      types: ["forecast_entry", "user_joined"],
    });
    expect(recentActivityResponseSchema.parse(payload)).toMatchObject({
      meta: {
        requestId: "req-events",
      },
      data: {
        items: expect.arrayContaining([
          expect.objectContaining({
            type: "forecast_entry",
          }),
        ]),
      },
    });
  });

  it("retorna 400 quando a query informa um tipo desconhecido", async () => {
    const response = await GET(
      new Request(
        "https://example.test/api/v1/recent-events?types=forecast_entry,desconhecido",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(mockedGetRecentActivityFeed).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      requestId: "req-events",
    });
  });
});
