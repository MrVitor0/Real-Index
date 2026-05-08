import { NextResponse } from "next/server";

import { homeSearchesResponseSchema } from "@/features/home/contracts/searches";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { searchHomeMarkets } from "@/server/markets/catalog";

const defaultSearchLimit = 6;
const maxSearchLimit = 10;

function parseSearchLimit(rawLimit: string | null) {
  const parsedLimit = Number(rawLimit ?? defaultSearchLimit);

  if (!Number.isFinite(parsedLimit)) {
    return defaultSearchLimit;
  }

  return Math.min(Math.max(Math.trunc(parsedLimit), 1), maxSearchLimit);
}

export async function GET(request: Request) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    resource: "searches",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams.get("q")?.trim() ?? "";
  const limit = parseSearchLimit(requestUrl.searchParams.get("limit"));

  try {
    const items = query.length > 0 ? await searchHomeMarkets(query, limit) : [];

    const responseBody = homeSearchesResponseSchema.parse({
      meta: {
        requestId: context.requestId,
        generatedAt: new Date().toISOString(),
        auth: context.auth,
      },
      data: {
        query,
        items,
      },
    });

    return NextResponse.json(responseBody, {
      headers: {
        "Cache-Control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  } catch (error) {
    console.error("Failed to execute home search", error);

    return NextResponse.json(
      {
        error: "Failed to execute home search",
        requestId: context.requestId,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }
}
