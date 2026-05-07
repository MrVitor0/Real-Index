import { NextResponse } from "next/server";

import { createPredictionMarketResponseSchema } from "@/features/markets/contracts/create-market";
import { createRouteContext } from "@/server/api/route-context";
import { createPredictionMarket } from "@/server/markets/catalog";

export async function POST(request: Request) {
  const context = await createRouteContext(request);

  if (!context.viewer) {
    return NextResponse.json(
      {
        error: "Voce precisa estar autenticado para criar um mercado.",
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
    const payload = await request.json();
    const createdMarket = await createPredictionMarket(context.viewer, payload);

    return NextResponse.json(
      createPredictionMarketResponseSchema.parse(createdMarket),
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel criar esse mercado.",
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
