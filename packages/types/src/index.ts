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
 * Platforms named by the Unsolo specification (Instagram, X, TikTok).
 * Extend this list only when the spec names additional platforms.
 */
export const SOCIAL_PLATFORMS = ["instagram", "x", "tiktok"] as const;

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

/**
 * Phase B2.6 — business verification statuses.
 *
 * A business verification submission is reviewed out-of-band (admin phase);
 * `pending` until a reviewer marks it `verified` or `rejected`.
 */
export const BUSINESS_VERIFICATION_STATUSES = ["pending", "verified", "rejected"] as const;

export type BusinessVerificationStatus = (typeof BUSINESS_VERIFICATION_STATUSES)[number];

/**
 * Phase B2.6 — verification document types.
 *
 * Supporting documents a business can attach to its verification
 * submission (manuscript §11: "NIN/identity" and "CAC where applicable").
 * `other` covers additional supporting evidence a reviewer may ask for.
 */
export const VERIFICATION_DOCUMENT_TYPES = ["government_id", "cac_certificate", "other"] as const;

export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENT_TYPES)[number];

/**
 * Lifecycle of an uploaded document: `pending_upload` while the client
 * holds a signed upload URL, `uploaded` once confirmed, then a reviewer
 * marks it `approved` or `rejected`.
 */
export const VERIFICATION_DOCUMENT_STATUSES = [
  "pending_upload",
  "uploaded",
  "approved",
  "rejected",
] as const;

export type VerificationDocumentStatus = (typeof VERIFICATION_DOCUMENT_STATUSES)[number];

/**
 * Allowed upload MIME types for verification documents — images and PDFs
 * only (no executables, archives, or HTML which could carry scripts).
 */
export const VERIFICATION_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

/** Max document size: 5 MB. */
export const VERIFICATION_DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;
