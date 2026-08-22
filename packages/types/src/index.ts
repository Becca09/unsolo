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
