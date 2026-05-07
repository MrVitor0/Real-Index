import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

import { getServerEnv } from "@/lib/env";

function getNeonAuthConfig() {
  const env = getServerEnv();

  if (!env.NEON_AUTH_BASE_URL || !env.NEON_AUTH_COOKIE_SECRET) {
    return null;
  }

  return {
    baseUrl: env.NEON_AUTH_BASE_URL,
    cookies: {
      secret: env.NEON_AUTH_COOKIE_SECRET,
    },
  };
}

const neonAuthConfig = getNeonAuthConfig();

export const auth = neonAuthConfig ? createNeonAuth(neonAuthConfig) : null;

export async function getServerSession() {
  if (!auth) {
    return null;
  }

  const { data } = await auth.getSession();

  return data ?? null;
}
