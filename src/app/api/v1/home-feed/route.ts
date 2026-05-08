import { NextResponse } from "next/server";

import { homeFeedResponseSchema } from "@/features/home/contracts/home-feed";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { getHomeFeedData } from "@/server/markets/catalog";

export async function GET(request: Request) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    resource: "home-feed",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const data = await getHomeFeedData();

    const responseBody = homeFeedResponseSchema.parse({
      meta: {
        requestId: context.requestId,
        generatedAt: new Date().toISOString(),
        auth: context.auth,
      },
      data,
    });

    return NextResponse.json(responseBody, {
      headers: {
        "Cache-Control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  } catch (error) {
    console.error("Failed to build home feed", error);

    return NextResponse.json(
      {
        error: "Failed to load home feed",
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
