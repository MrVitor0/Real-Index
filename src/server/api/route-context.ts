import "server-only";

import { getServerSession } from "@/lib/auth/server";

export type RouteContext = {
  requestId: string;
  auth: {
    status: "anonymous" | "authenticated";
    required: boolean;
    hasCredentials: boolean;
    upgradePath: string;
  };
  viewer: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  } | null;
};

export async function createRouteContext(
  request: Request,
): Promise<RouteContext> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const hasCredentials = Boolean(
    request.headers.get("authorization") || request.headers.get("cookie"),
  );
  const session = await getServerSession();
  const viewer = session?.user
    ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image ?? null,
      }
    : null;

  return {
    requestId,
    auth: {
      status: viewer ? "authenticated" : "anonymous",
      required: false,
      hasCredentials,
      upgradePath: "/login",
    },
    viewer,
  };
}
