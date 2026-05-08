import { beforeEach, describe, expect, it, vi } from "vitest";

import { recordPlatformActivity } from "@/server/activity/log";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import {
  getPredictionEventIdBySlug,
  getRadarMarketDetailBySlug,
  syncViewerProfile,
} from "@/server/markets/catalog";

import { GET } from "./route";

vi.mock("@/features/market-detail/contracts/radar-market-detail", () => ({
  radarMarketDetailSchema: {
    parse: vi.fn((value) => value),
  },
}));

vi.mock("@/server/api/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/server/api/route-context", () => ({
  createRouteContext: vi.fn(),
}));

vi.mock("@/server/activity/log", () => ({
  recordPlatformActivity: vi.fn(),
}));

vi.mock("@/server/markets/catalog", () => ({
  getPredictionEventIdBySlug: vi.fn(),
  getRadarMarketDetailBySlug: vi.fn(),
  syncViewerProfile: vi.fn(),
}));

const mockedCreateRouteContext = vi.mocked(createRouteContext);
const mockedEnforceRateLimit = vi.mocked(enforceRateLimit);
const mockedRecordPlatformActivity = vi.mocked(recordPlatformActivity);
const mockedGetPredictionEventIdBySlug = vi.mocked(getPredictionEventIdBySlug);
const mockedGetRadarMarketDetailBySlug = vi.mocked(getRadarMarketDetailBySlug);
const mockedSyncViewerProfile = vi.mocked(syncViewerProfile);

describe("GET /api/v1/radar/[marketId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedEnforceRateLimit.mockResolvedValue(null);
    mockedCreateRouteContext.mockResolvedValue({
      requestId: "req-radar",
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
    mockedGetRadarMarketDetailBySlug.mockResolvedValue({
      id: "falha-cloud-europa",
      title: "Falha cloud na Europa",
    } as never);
    mockedGetPredictionEventIdBySlug.mockResolvedValue(
      "4c79a8f9-0b08-4e20-847b-9c9e9736b123",
    );
    mockedSyncViewerProfile.mockResolvedValue({
      id: "profile-1",
    } as never);
    mockedRecordPlatformActivity.mockResolvedValue(undefined);
  });

  it("registra evento quando um usuario autenticado abre o radar", async () => {
    const response = await GET(
      new Request("https://example.test/api/v1/radar/falha-cloud-europa"),
      {
        params: Promise.resolve({
          marketId: "falha-cloud-europa",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(mockedSyncViewerProfile).toHaveBeenCalledWith({
      id: "viewer-1",
      email: "oracle@example.test",
      name: "Oracle",
      image: null,
    });
    expect(mockedGetPredictionEventIdBySlug).toHaveBeenCalledWith(
      "falha-cloud-europa",
    );
    expect(mockedRecordPlatformActivity).toHaveBeenCalledWith({
      actorProfileId: "profile-1",
      predictionEventId: "4c79a8f9-0b08-4e20-847b-9c9e9736b123",
      type: "market_viewed",
    });
  });
});
