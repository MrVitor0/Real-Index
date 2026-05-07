import { NextResponse } from "next/server";

import {
  radarForecastExecutionRequestSchema,
  radarForecastExecutionResponseSchema,
} from "@/features/market-detail/contracts/radar-market-detail";
import { createRouteContext } from "@/server/api/route-context";
import { executeViewerForecastOperation } from "@/server/markets/trading";

type RouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const context = await createRouteContext(request);

  if (!context.viewer) {
    return NextResponse.json(
      {
        error: "Voce precisa estar autenticado para operar nesse radar.",
        requestId: context.requestId,
      },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }

  try {
    const { marketId } = await params;
    const payload = radarForecastExecutionRequestSchema.parse(
      await request.json(),
    );
    const result = radarForecastExecutionResponseSchema.parse(
      await executeViewerForecastOperation({
        viewer: context.viewer,
        marketSlug: marketId,
        request: payload,
      }),
    );

    return NextResponse.json(result, {
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
            : "Nao foi possivel confirmar essa operacao.",
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
