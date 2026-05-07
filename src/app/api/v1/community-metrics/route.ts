import { NextResponse } from "next/server";

import { communityMetricsResponseSchema } from "@/features/home/contracts/community-metrics";
import { createRouteContext } from "@/server/api/route-context";
import { getCommunityMetrics } from "@/server/home/community-metrics";

export async function GET(request: Request) {
  const context = await createRouteContext(request);

  try {
    const data = await getCommunityMetrics();

    const responseBody = communityMetricsResponseSchema.parse({
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
    console.error("Failed to load community metrics", error);

    return NextResponse.json(
      {
        error: "Failed to load community metrics",
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
