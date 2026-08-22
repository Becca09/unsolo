/// <reference types="node" />
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * NOTE (Phase A — Foundation): `schema.ts` intentionally exports no tables
 * yet. This config exists only to prove the toolchain (generate/migrate/
 * studio) is wired correctly. Running `db:generate` at this stage will
 * produce an empty migration set.
 */
export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
  strict: true,
  verbose: true,
} satisfies Config;
