import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import {
  recentActivityEventTypeSchema,
  recentActivityResponseSchema,
} from "@/features/home/contracts/recent-activity";
import { createRouteContext } from "@/server/api/route-context";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { getRecentActivityFeed } from "@/server/activity/log";

const recentEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  types: z.array(recentActivityEventTypeSchema).optional(),
});

export async function GET(request: Request) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    resource: "recent-events",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const url = new URL(request.url);
    const rawTypes = url.searchParams
      .get("types")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const query = recentEventsQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      types: rawTypes?.length ? rawTypes : undefined,
    });
    const data = await getRecentActivityFeed({
      limit: query.limit,
      types: query.types,
    });
    const responseBody = recentActivityResponseSchema.parse({
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
    const status = error instanceof ZodError ? 400 : 500;

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar os eventos recentes.",
        requestId: context.requestId,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }
}
