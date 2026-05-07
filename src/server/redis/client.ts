import "server-only";

import { Redis } from "@upstash/redis";

import { getRequiredServerEnv } from "@/lib/env";

function createRedis() {
  const { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } =
    getRequiredServerEnv();

  return new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
}

const globalForRedis = globalThis as typeof globalThis & {
  __realSeverityRedis?: ReturnType<typeof createRedis>;
};

export function getRedis() {
  if (!globalForRedis.__realSeverityRedis) {
    globalForRedis.__realSeverityRedis = createRedis();
  }

  return globalForRedis.__realSeverityRedis;
}
