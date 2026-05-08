import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/server";
import { enforceRateLimit } from "@/server/api/rate-limit";
import { createRouteContext } from "@/server/api/route-context";

type AuthRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

type AuthHandler = ReturnType<NonNullable<typeof auth>["handler"]>;
type AuthMethod = keyof AuthHandler;

function createUnavailableResponse() {
  return NextResponse.json(
    {
      error:
        "Neon Auth nao esta configurado. Defina NEON_AUTH_BASE_URL e NEON_AUTH_COOKIE_SECRET.",
    },
    { status: 503 },
  );
}

async function handle(
  method: AuthMethod,
  request: Request,
  context: AuthRouteContext,
) {
  if (!auth) {
    return createUnavailableResponse();
  }

  const routeContext = await createRouteContext(request);
  const rateLimitResponse = await enforceRateLimit({
    request,
    context: routeContext,
    presetName: method === "GET" ? "publicRead" : "authAttempt",
    resource: method === "GET" ? "auth-read" : "auth-attempt",
  });

  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const handler = auth.handler()[method];

  return handler(request, context);
}

export function GET(request: Request, context: AuthRouteContext) {
  return handle("GET", request, context);
}

export function POST(request: Request, context: AuthRouteContext) {
  return handle("POST", request, context);
}

export function PUT(request: Request, context: AuthRouteContext) {
  return handle("PUT", request, context);
}

export function PATCH(request: Request, context: AuthRouteContext) {
  return handle("PATCH", request, context);
}

export function DELETE(request: Request, context: AuthRouteContext) {
  return handle("DELETE", request, context);
}
