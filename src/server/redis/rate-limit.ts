import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "./client";

export const rateLimitPresets = {
  publicRead: {
    prefix: "public-read",
    limit: 60,
    window: "1 m",
  },
  stream: {
    prefix: "stream",
    limit: 20,
    window: "1 m",
  },
  authAttempt: {
    prefix: "auth-attempt",
    limit: 5,
    window: "10 m",
  },
  mutation: {
    prefix: "mutation",
    limit: 15,
    window: "1 m",
  },
} as const;

export type RateLimitPresetName = keyof typeof rateLimitPresets;

const ratelimitRegistry = new Map<RateLimitPresetName, Ratelimit>();

function getRateLimiter(presetName: RateLimitPresetName) {
  const cached = ratelimitRegistry.get(presetName);

  if (cached) {
    return cached;
  }

  const preset = rateLimitPresets[presetName];

  const ratelimit = new Ratelimit({
    redis: getRedis(),
    analytics: true,
    prefix: `ratelimit:${preset.prefix}`,
    limiter: Ratelimit.slidingWindow(preset.limit, preset.window),
  });

  ratelimitRegistry.set(presetName, ratelimit);

  return ratelimit;
}

export function consumeRateLimit(
  identifier: string,
  presetName: RateLimitPresetName = "publicRead",
) {
  return getRateLimiter(presetName).limit(identifier);
}
