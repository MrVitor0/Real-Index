import { NextResponse } from "next/server";

import { marketplaceCatalogSchema } from "@/features/marketplace/contracts/marketplace";
import { createRouteContext } from "@/server/api/route-context";
import { getMarketplaceCatalog } from "@/server/marketplace/catalog";

export async function GET(request: Request) {
  const context = await createRouteContext(request);

  try {
    const catalog = marketplaceCatalogSchema.parse(
      await getMarketplaceCatalog(context.viewer),
    );

    return NextResponse.json(catalog, {
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
            : "Nao foi possivel carregar o marketplace.",
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
