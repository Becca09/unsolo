import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Unsolo database schema.
 *
 * Phase B2.1 — user/profile data model.
 *
 * Identity model (approved B1 decision):
 *   - One Supabase Auth identity maps to exactly one `users` row. The
 *     `users.id` primary key IS the Supabase `auth.users.id` UUID — it is
 *     supplied by the backend, never generated here.
 *   - A user can have at most one profile of each type (traveller, planner,
 *     business, host), enforced by `profiles_user_id_type_unique`.
 *   - `profiles` holds the shared public profile fields defined by the spec
 *     (photo, username, full name, bio). Type-specific tables extend a profile 1:1
 *     via a unique `profile_id` foreign key.
 *   - Profile types are separate from admin roles (admin tables are a later
 *     phase).
 */

export const profileTypeEnum = pgEnum("profile_type", ["traveller", "planner", "business", "host"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/**
 * Unsolo users — 1:1 with Supabase Auth users.
 *
 * The record is provisioned lazily on first authenticated API call. It
 * carries no public-facing fields: usernames live on `profiles` (one per
 * profile type), not on the account.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  ...timestamps,
});

/**
 * Base profile — one row per (user, type). Holds the public profile fields
 * the spec defines: photo (`avatar_url`), username, full name, and bio.
 * Interests, social accounts, addresses and payout details are separate B2
 * tables and intentionally not modelled here.
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: profileTypeEnum("type").notNull(),
    username: text("username").notNull(),
    fullName: text("full_name").notNull(),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("profiles_user_id_type_unique").on(table.userId, table.type),
    uniqueIndex("profiles_username_unique").on(sql`lower(${table.username})`),
    index("profiles_user_id_idx").on(table.userId),
  ],
);

/**
 * Traveller profile — extends a base profile 1:1.
 * Traveller-specific data (socials, interests) lands in later B2 tables.
 */
export const travellerProfiles = pgTable(
  "traveller_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("traveller_profiles_profile_id_idx").on(table.profileId)],
);

/**
 * Planner profile — extends a base profile 1:1.
 * `approved_at` is set by an admin approval flow (later phase); planners are
 * not publicly listed until approved. Verification/KYC fields are out of
 * scope for B2.1.
 */
export const plannerProfiles = pgTable(
  "planner_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("planner_profiles_profile_id_idx").on(table.profileId)],
);

/**
 * Business profile — extends a base profile 1:1.
 * `approved_at` is set by an admin approval flow (later phase); businesses
 * are not publicly listed until approved. Verification/KYC fields are out
 * of scope for B2.1.
 */
export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("business_profiles_profile_id_idx").on(table.profileId)],
);

/**
 * Host profile — extends a base profile 1:1.
 * `approved_at` is set by an admin approval flow (later phase); hosts are
 * not publicly listed until approved. Verification/KYC fields are out of
 * scope for B2.1.
 */
export const hostProfiles = pgTable(
  "host_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .unique()
      .references(() => profiles.id, { onDelete: "cascade" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("host_profiles_profile_id_idx").on(table.profileId)],
);

export const socialPlatformEnum = pgEnum("social_platform", ["instagram", "x"]);

/**
 * Social accounts — Phase B2.2.
 *
 * Social links belong to a profile (the spec attaches "socials" to public
 * profiles). A profile can have at most one account per platform, enforced
 * by `social_accounts_profile_id_platform_unique`. At least one of
 * `handle`/`url` must be present, enforced by a check constraint.
 */
export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    platform: socialPlatformEnum("platform").notNull(),
    handle: text("handle"),
    url: text("url"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("social_accounts_profile_id_platform_unique").on(table.profileId, table.platform),
    index("social_accounts_profile_id_idx").on(table.profileId),
    check(
      "social_accounts_handle_or_url",
      sql`${table.handle} is not null or ${table.url} is not null`,
    ),
  ],
);

/**
 * Interests — Phase B2.3.
 *
 * The spec references interests on profiles, trips and search filters but
 * does not define a fixed taxonomy, so interests live in a normalized
 * reference table: names are unique case-insensitively, which keeps values
 * consistent without inventing a fixed list. The same table can back
 * `trip_interests` in a later phase.
 */
export const interests = pgTable(
  "interests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("interests_name_unique").on(sql`lower(${table.name})`)],
);

/**
 * Profile interests — join table linking a profile to an interest.
 * The composite primary key prevents duplicate interests per profile.
 */
export const profileInterests = pgTable(
  "profile_interests",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    interestId: uuid("interest_id")
      .notNull()
      .references(() => interests.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.interestId] }),
    index("profile_interests_interest_id_idx").on(table.interestId),
  ],
);

/**
 * Addresses — Phase B2.4.
 *
 * The spec defines address components as country/state/city/street (under
 * planner/business verification) and requires private addresses to never be
 * exposed. It defines no address types and no primary/default rules, so
 * none are modelled. Addresses attach to a profile, consistent with the
 * spec's profile-level address usage.
 */
export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    country: text("country").notNull(),
    state: text("state").notNull(),
    city: text("city").notNull(),
    street: text("street").notNull(),
    ...timestamps,
  },
  (table) => [index("addresses_profile_id_idx").on(table.profileId)],
);

export const payoutProviderEnum = pgEnum("payout_provider", ["stripe", "local"]);

/**
 * Payout accounts — Phase B2.5.
 *
 * Provider-agnostic payout destination references for provider profiles
 * (planner/business/host receive payouts per the spec). Stores ONLY the
 * minimum non-sensitive data needed to reference and display a payout
 * destination:
 *   - `provider` — which payment provider the destination lives at
 *     (Stripe international / local Nigerian provider, per the spec's
 *     payment abstraction).
 *   - `provider_account_id` — the external provider's account/customer ID
 *     or token (e.g. a Stripe Connect account id). NEVER raw bank details,
 *     card numbers, CVVs, or credentials.
 *   - `display_label` — optional non-sensitive display string (e.g. a bank
 *     name or masked reference) so the UI can show the destination.
 *
 * A profile can hold at most one account per provider, and an external
 * account id cannot be claimed by two profiles for the same provider.
 */
export const payoutAccounts = pgTable(
  "payout_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    provider: payoutProviderEnum("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    displayLabel: text("display_label"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payout_accounts_profile_id_provider_unique").on(table.profileId, table.provider),
    uniqueIndex("payout_accounts_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
    index("payout_accounts_profile_id_idx").on(table.profileId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type ProfileType = (typeof profileTypeEnum.enumValues)[number];
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
export type SocialPlatform = (typeof socialPlatformEnum.enumValues)[number];
export type Interest = typeof interests.$inferSelect;
export type NewInterest = typeof interests.$inferInsert;
export type ProfileInterest = typeof profileInterests.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type NewPayoutAccount = typeof payoutAccounts.$inferInsert;
export type PayoutProvider = (typeof payoutProviderEnum.enumValues)[number];
