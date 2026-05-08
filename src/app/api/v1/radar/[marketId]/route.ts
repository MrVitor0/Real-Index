import { NextResponse } from "next/server";

import { radarMarketDetailSchema } from "@/features/market-detail/contracts/radar-market-detail";
import { recordPlatformActivity } from "@/server/activity/log";
import { createRouteContext } from "@/server/api/route-context";
import {
  getPredictionEventIdBySlug,
  getRadarMarketDetailBySlug,
  syncViewerProfile,
} from "@/server/markets/catalog";

type RouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const context = await createRouteContext(request);

  try {
    const { marketId } = await params;
    const market = await getRadarMarketDetailBySlug(marketId);

    if (!market) {
      return NextResponse.json(
        {
          error: "Mercado nao encontrado.",
          requestId: context.requestId,
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            "x-request-id": context.requestId,
          },
        },
      );
    }

    if (context.viewer) {
      try {
        const [profile, predictionEventId] = await Promise.all([
          syncViewerProfile(context.viewer),
          getPredictionEventIdBySlug(marketId),
        ]);

        if (predictionEventId) {
          await recordPlatformActivity({
            actorProfileId: profile.id,
            predictionEventId,
            type: "market_viewed",
          });
        }
      } catch (activityError) {
        console.error("Failed to record radar open activity", activityError);
      }
    }

    return NextResponse.json(radarMarketDetailSchema.parse(market), {
      headers: {
        "Cache-Control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar o radar.",
        requestId: context.requestId,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }
}
