import { NextResponse } from "next/server";

import {
  marketplaceRedeemRequestSchema,
  marketplaceRedeemResponseSchema,
} from "@/features/marketplace/contracts/marketplace";
import { createRouteContext } from "@/server/api/route-context";
import { redeemMarketplaceReward } from "@/server/marketplace/catalog";

export async function POST(request: Request) {
  const context = await createRouteContext(request);

  if (!context.viewer) {
    return NextResponse.json(
      {
        error: "Voce precisa entrar para trocar REAL Credits no marketplace.",
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
    const payload = marketplaceRedeemRequestSchema.parse(await request.json());
    const response = marketplaceRedeemResponseSchema.parse(
      await redeemMarketplaceReward({
        viewer: context.viewer,
        rewardId: payload.rewardId,
      }),
    );

    return NextResponse.json(response, {
      status: 201,
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
            : "Nao foi possivel concluir o resgate.",
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
