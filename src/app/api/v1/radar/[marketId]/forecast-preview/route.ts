import { NextResponse } from "next/server";

import {
  radarForecastPreviewRequestSchema,
  radarForecastPreviewResponseSchema,
} from "@/features/market-detail/contracts/radar-market-detail";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { previewViewerForecastOperation } from "@/server/markets/trading";

type RouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    presetName: "mutation",
    resource: "radar-forecast-preview",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  if (!context.viewer) {
    return NextResponse.json(
      {
        error: "Voce precisa estar autenticado para revisar essa operacao.",
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
    const payload = radarForecastPreviewRequestSchema.parse(
      await request.json(),
    );
    const preview = radarForecastPreviewResponseSchema.parse(
      await previewViewerForecastOperation({
        viewer: context.viewer,
        marketSlug: marketId,
        request: payload,
      }),
    );

    return NextResponse.json(preview, {
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
            : "Nao foi possivel validar esse forecast.",
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
