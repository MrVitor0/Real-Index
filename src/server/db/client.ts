import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getRequiredDatabaseEnv } from "@/lib/env";

import * as schema from "./schema";

function createDatabase() {
  const { DATABASE_URL } = getRequiredDatabaseEnv();
  const client = neon(DATABASE_URL);

  return drizzle({ client, schema });
}

const globalForDatabase = globalThis as typeof globalThis & {
  __realSeverityDb?: ReturnType<typeof createDatabase>;
};

export function getDb() {
  if (!globalForDatabase.__realSeverityDb) {
    globalForDatabase.__realSeverityDb = createDatabase();
  }

  return globalForDatabase.__realSeverityDb;
}
