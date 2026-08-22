/**
 * Drizzle schema entrypoint.
 *
 * NOTE (Phase A — Foundation): No application tables are defined yet, per
 * explicit instruction. This file intentionally exports nothing so that
 * `drizzle-kit generate` runs successfully against an empty schema,
 * proving the toolchain (config, credentials wiring, migration output
 * directory) works end to end.
 *
 * Actual tables (users, profiles, trips, bookings, payments, wallets,
 * reviews, messaging, kyc, etc.) will be added table-by-table alongside
 * their owning backend module in later phases, once the schema design in
 * the manuscript has been reviewed and approved.
 */
export {};
