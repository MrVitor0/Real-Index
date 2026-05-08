import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { participantRankingResponseSchema } from "@/features/home/contracts/participant-ranking";
import { createRouteContext } from "@/server/api/route-context";
import { getParticipantRanking } from "@/server/home/participant-ranking";

const rankingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export async function GET(request: Request) {
  const context = await createRouteContext(request);

  try {
    const url = new URL(request.url);
    const query = rankingQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const data = await getParticipantRanking({
      limit: query.limit,
    });
    const responseBody = participantRankingResponseSchema.parse({
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
            : "Nao foi possivel carregar o ranking.",
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
