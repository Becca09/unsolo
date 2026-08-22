/**
 * @unsolo/utils
 *
 * Framework-agnostic pure utility functions shared between apps/web and
 * apps/api.
 *
 * NOTE (Phase A — Foundation): This package intentionally contains only
 * generic, non-business-rule helpers (e.g., safe minor-unit currency
 * conversion for representing money as integers). It does NOT contain fee,
 * commission, refund, or payout calculations — those are domain rules that
 * belong to the payments/wallets backend modules and will be implemented in
 * a later phase once the financial formulas are confirmed (see
 * docs/architecture-proposal.md, section P).
 */

/**
 * Converts a decimal amount (e.g., 12.34) into integer minor units
 * (e.g., 1234 cents), avoiding floating point errors. This is a
 * representation helper only — it performs no business calculation.
 */
export function toMinorUnits(amount: number, minorUnitsPerMajor = 100): number {
  return Math.round(amount * minorUnitsPerMajor);
}

/**
 * Converts integer minor units (e.g., 1234 cents) back into a decimal
 * major-unit amount (e.g., 12.34).
 */
export function fromMinorUnits(minorUnits: number, minorUnitsPerMajor = 100): number {
  return minorUnits / minorUnitsPerMajor;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
