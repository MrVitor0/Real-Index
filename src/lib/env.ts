import "server-only";

import { z } from "zod";

const optionalServerEnvSchema = z
  .object({
    DATABASE_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEON_AUTH_BASE_URL: z.string().url().optional(),
    NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
  })
  .superRefine((env, context) => {
    const hasRedisUrl = Boolean(env.UPSTASH_REDIS_REST_URL);
    const hasRedisToken = Boolean(env.UPSTASH_REDIS_REST_TOKEN);
    const hasNeonAuthBaseUrl = Boolean(env.NEON_AUTH_BASE_URL);
    const hasNeonAuthCookieSecret = Boolean(env.NEON_AUTH_COOKIE_SECRET);

    if (hasRedisUrl && !hasRedisToken) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_TOKEN"],
        message:
          "UPSTASH_REDIS_REST_TOKEN is required when UPSTASH_REDIS_REST_URL is set.",
      });
    }

    if (!hasRedisUrl && hasRedisToken) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPSTASH_REDIS_REST_URL"],
        message:
          "UPSTASH_REDIS_REST_URL is required when UPSTASH_REDIS_REST_TOKEN is set.",
      });
    }

    if (hasNeonAuthBaseUrl && !hasNeonAuthCookieSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEON_AUTH_COOKIE_SECRET"],
        message:
          "NEON_AUTH_COOKIE_SECRET is required when NEON_AUTH_BASE_URL is set.",
      });
    }

    if (!hasNeonAuthBaseUrl && hasNeonAuthCookieSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEON_AUTH_BASE_URL"],
        message:
          "NEON_AUTH_BASE_URL is required when NEON_AUTH_COOKIE_SECRET is set.",
      });
    }
  });

const requiredServerEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const requiredDatabaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const requiredRedisEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
});

function readServerEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEON_AUTH_BASE_URL: process.env.NEON_AUTH_BASE_URL,
    NEON_AUTH_COOKIE_SECRET: process.env.NEON_AUTH_COOKIE_SECRET,
  };
}

export function getServerEnv() {
  return optionalServerEnvSchema.parse(readServerEnv());
}

export function getRequiredServerEnv() {
  return requiredServerEnvSchema.parse(getServerEnv());
}

export function getRequiredDatabaseEnv() {
  return requiredDatabaseEnvSchema.parse(getServerEnv());
}

export function getRequiredRedisEnv() {
  return requiredRedisEnvSchema.parse(getServerEnv());
}

export function getEnvironmentStatus() {
  const env = getServerEnv();

  return {
    hasDatabase: Boolean(env.DATABASE_URL),
    hasNeonAuth: Boolean(env.NEON_AUTH_BASE_URL && env.NEON_AUTH_COOKIE_SECRET),
    hasRedis: Boolean(
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
    ),
    hasPublicAppUrl: Boolean(env.NEXT_PUBLIC_APP_URL),
    publicAppUrl: env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5180",
  };
}
