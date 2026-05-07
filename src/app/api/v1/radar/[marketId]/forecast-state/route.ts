import { NextResponse } from "next/server";

import { radarForecastAccountStateSchema } from "@/features/market-detail/contracts/radar-market-detail";
import { createRouteContext } from "@/server/api/route-context";
import { getViewerForecastMarketState } from "@/server/markets/trading";

type RouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export async function GET(request: Request, { params }: RouteProps) {
  const context = await createRouteContext(request);

  try {
    const { marketId } = await params;
    const state = radarForecastAccountStateSchema.parse(
      await getViewerForecastMarketState(context.viewer, marketId),
    );

    return NextResponse.json(state, {
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
            : "Nao foi possivel carregar o estado da sua conta nesse radar.",
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
