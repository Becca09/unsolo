/**
 * @unsolo/types
 *
 * Shared TypeScript types/enums for the Unsolo platform.
 *
 * NOTE (Phase A — Foundation): This package intentionally contains no
 * domain/business types yet (no Trip, Booking, Payment, etc.). Those are
 * introduced alongside their corresponding backend modules in later phases,
 * once the database schema and domain rules have been reviewed and approved.
 *
 * This placeholder exists to prove the package wiring (build/typecheck/lint)
 * works across the monorepo.
 */

export const UNSOLO_TYPES_PACKAGE = "@unsolo/types" as const;

/**
 * Phase B2.1 — profile types.
 *
 * A user can have at most one profile of each type. Profile types are
 * separate from admin roles.
 */
export const PROFILE_TYPES = ["traveller", "planner", "business", "host"] as const;

export type ProfileType = (typeof PROFILE_TYPES)[number];

/**
 * Phase B2.2 — social account platforms.
 *
 * Platforms named by the Unsolo specification (Instagram, X). Extend this
 * list only when the spec names additional platforms.
 */
export const SOCIAL_PLATFORMS = ["instagram", "x"] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/**
 * Phase B2.5 — payout providers.
 *
 * The spec requires a payment abstraction: Stripe for international
 * payments and a Nigerian/local provider for Nigeria, without hardcoding
 * providers throughout the application. `local` is the provider-agnostic
 * slot for the local provider until the spec names it.
 */
export const PAYOUT_PROVIDERS = ["stripe", "local"] as const;

export type PayoutProvider = (typeof PAYOUT_PROVIDERS)[number];
