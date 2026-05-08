import { NextResponse } from "next/server";

import { navbarBalanceSchema } from "@/features/account/contracts/navbar-balance";
import { createRouteContext } from "@/server/api/route-context";
import { getViewerForecastBalance } from "@/server/markets/trading";

export async function GET(request: Request) {
  const context = await createRouteContext(request);

  try {
    const balance = navbarBalanceSchema.parse(
      await getViewerForecastBalance(context.viewer),
    );

    return NextResponse.json(balance, {
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
            : "Nao foi possivel carregar o saldo da navbar.",
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
