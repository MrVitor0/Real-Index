import "server-only";

export type RouteContext = {
  requestId: string;
  auth: {
    status: "anonymous" | "authenticated";
    required: boolean;
    hasCredentials: boolean;
    upgradePath: string;
  };
  viewer: null;
};

export function createRouteContext(request: Request): RouteContext {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const hasCredentials = Boolean(
    request.headers.get("authorization") || request.headers.get("cookie"),
  );

  return {
    requestId,
    auth: {
      status: "anonymous",
      required: false,
      hasCredentials,
      upgradePath: "/login",
    },
    viewer: null,
  };
}
