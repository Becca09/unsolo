/**
 * Unsolo brand design tokens.
 *
 * These are the single source of truth for brand colors, consumed by the
 * Tailwind preset (`@unsolo/config/tailwind/preset`) as well as anywhere
 * else (e.g., email templates, PWA manifest theme colors) that needs the
 * raw values outside of a Tailwind class context.
 */
export const colors = {
  primary: "#1F2F10",
  accent: "#6D8D08",
  neutral: "#E4E9DD",
  muted: "#6F7168",
  light: "#F4F2EA",
  surface: "#FFFFFF",
  border: "#E4E2D9",
  subtle: "#E9E7DF",
  sage: "#B9C68A",
  moss: "#4A5A1F",
} as const;

export type UnsoloColorToken = keyof typeof colors;
