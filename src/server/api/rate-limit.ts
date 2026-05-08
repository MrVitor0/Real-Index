import "server-only";

import { NextResponse } from "next/server";

import { getEnvironmentStatus } from "@/lib/env";
import {
  consumeRateLimit,
  type RateLimitPresetName,
} from "@/server/redis/rate-limit";

import type { RouteContext } from "./route-context";

const CLIENT_IP_HEADERS = [
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
  "x-vercel-forwarded-for",
  "fly-client-ip",
] as const;

const DEFAULT_RATE_LIMIT_ERROR_MESSAGE =
  "Muitas requisicoes em pouco tempo. Aguarde um instante e tente novamente.";

const globalForRateLimit = globalThis as typeof globalThis & {
  __realSeverityRateLimitDisabled?: boolean;
  __realSeverityRateLimitWarningShown?: boolean;
};

function isUnsupportedRateLimitStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorWithCode = error as Error & {
    code?: string;
    cause?: {
      code?: string;
    };
  };
  const errorCode = errorWithCode.code ?? errorWithCode.cause?.code;

  if (errorCode === "NOPERM") {
    return true;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes("noperm") &&
    normalizedMessage.includes("evalsha")
  );
}

function disableRateLimitWithWarning() {
  globalForRateLimit.__realSeverityRateLimitDisabled = true;

  if (globalForRateLimit.__realSeverityRateLimitWarningShown) {
    return;
  }

  globalForRateLimit.__realSeverityRateLimitWarningShown = true;
  console.warn(
    "Rate limit desativado: o Redis atual nao permite executar EVALSHA para o script do Upstash.",
  );
}

function resolveClientIp(request: Request) {
  for (const headerName of CLIENT_IP_HEADERS) {
    const rawValue = request.headers.get(headerName);

    if (!rawValue) {
      continue;
    }

    const firstValue = rawValue.split(",")[0]?.trim();

    if (firstValue) {
      return firstValue;
    }
  }

  return null;
}

export function resolveRateLimitIdentifier(input: {
  request: Request;
  context: RouteContext;
  resource: string;
}) {
  const { context, request, resource } = input;

  if (context.viewer?.id) {
    return `${resource}:viewer:${context.viewer.id}`;
  }

  const clientIp = resolveClientIp(request);

  if (clientIp) {
    return `${resource}:ip:${clientIp}`;
  }

  const userAgent = request.headers.get("user-agent")?.trim();

  if (userAgent) {
    return `${resource}:ua:${userAgent.slice(0, 120)}`;
  }

  return `${resource}:anonymous`;
}

export async function enforceRateLimit(input: {
  request: Request;
  context: RouteContext;
  resource: string;
  presetName?: RateLimitPresetName;
  errorMessage?: string;
}) {
  if (
    !getEnvironmentStatus().hasRedis ||
    globalForRateLimit.__realSeverityRateLimitDisabled
  ) {
    return null;
  }

  const {
    context,
    errorMessage = DEFAULT_RATE_LIMIT_ERROR_MESSAGE,
    presetName = "publicRead",
    request,
    resource,
  } = input;
  let result;

  try {
    result = await consumeRateLimit(
      resolveRateLimitIdentifier({
        request,
        context,
        resource,
      }),
      presetName,
    );
  } catch (error) {
    if (isUnsupportedRateLimitStorageError(error)) {
      disableRateLimitWithWarning();
      return null;
    }

    throw error;
  }

  if (result.success) {
    return null;
  }

  const retryAfterSeconds =
    typeof result.reset === "number"
      ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      : 60;
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Retry-After": String(retryAfterSeconds),
    "x-request-id": context.requestId,
  };

  if (typeof result.limit === "number") {
    headers["x-ratelimit-limit"] = String(result.limit);
  }

  if (typeof result.remaining === "number") {
    headers["x-ratelimit-remaining"] = String(result.remaining);
  }

  if (typeof result.reset === "number") {
    headers["x-ratelimit-reset"] = String(result.reset);
  }

  return NextResponse.json(
    {
      error: errorMessage,
      requestId: context.requestId,
    },
    {
      status: 429,
      headers,
    },
  );
}
