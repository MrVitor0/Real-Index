import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { createPredictionMarketResponseSchema } from "@/features/markets/contracts/create-market";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";
import { createPredictionMarket } from "@/server/markets/catalog";

function buildFieldErrors(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = String(issue.path[0] ?? "form");
    const currentMessages = fieldErrors[path] ?? [];

    if (!currentMessages.includes(issue.message)) {
      currentMessages.push(issue.message);
    }

    fieldErrors[path] = currentMessages;
  }

  return fieldErrors;
}

export async function POST(request: Request) {
  const context = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context,
    presetName: "mutation",
    resource: "markets:create",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Revise os campos destacados e tente novamente.",
          requestId: context.requestId,
          fieldErrors: buildFieldErrors(error),
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
