import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Creates a Drizzle client bound to `DATABASE_URL`.
 *
 * NOTE (Phase A — Foundation): This is toolchain wiring only — `schema`
 * currently has no tables, so the returned client cannot query anything
 * meaningful yet. `apps/api` does not call this yet.
 */
export function createDatabaseClient(connectionString: string) {
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabaseClient>;
