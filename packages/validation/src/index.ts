/**
 * @unsolo/validation
 *
 * Shared Zod schemas, consumed by both apps/api (request DTO validation)
 * and apps/web (form validation), so validation rules never drift between
 * frontend and backend.
 *
 * NOTE (Phase A — Foundation): No domain schemas (e.g., CreateTripSchema,
 * CreateBookingSchema) are defined yet. Those are introduced alongside their
 * corresponding backend modules in later phases.
 */

import { z } from "zod";
import { PROFILE_TYPES, SOCIAL_PLATFORMS, PAYOUT_PROVIDERS } from "@unsolo/types";

export const HealthCheckResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

/**
 * Phase B2.1 — user/profile validation.
 */

export const UsernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/, "Username may only contain lowercase letters, numbers and underscores");

export const ProfileTypeSchema = z.enum(PROFILE_TYPES);

export const CreateProfileSchema = z.object({
  type: ProfileTypeSchema,
  username: UsernameSchema,
  fullName: z.string().trim().min(1).max(120),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

export const UpdateProfileSchema = CreateProfileSchema.omit({ type: true }).partial();

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/**
 * Phase B2.2 — social account validation.
 */

export const SocialPlatformSchema = z.enum(SOCIAL_PLATFORMS);

const socialHandle = z.string().trim().min(1).max(100).optional();
const socialUrl = z.string().url().max(500).optional();

export const CreateSocialAccountSchema = z
  .object({
    platform: SocialPlatformSchema,
    handle: socialHandle,
    url: socialUrl,
  })
  .refine((data) => data.handle !== undefined || data.url !== undefined, {
    message: "Provide a handle, a URL, or both",
  });

export type CreateSocialAccountInput = z.infer<typeof CreateSocialAccountSchema>;

export const UpdateSocialAccountSchema = z
  .object({
    handle: socialHandle,
    url: socialUrl,
  })
  .refine((data) => data.handle !== undefined || data.url !== undefined, {
    message: "Provide a handle, a URL, or both",
  });

export type UpdateSocialAccountInput = z.infer<typeof UpdateSocialAccountSchema>;

/**
 * Phase B2.3 — interest validation.
 */

export const AddInterestSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export type AddInterestInput = z.infer<typeof AddInterestSchema>;

/**
 * Phase B2.4 — address validation.
 *
 * The spec defines address components as country/state/city/street and
 * nothing else — no types, no primary/default flags.
 */

const addressPart = z.string().trim().min(1).max(120);

export const CreateAddressSchema = z.object({
  country: addressPart,
  state: addressPart,
  city: addressPart,
  street: addressPart,
});

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

export const UpdateAddressSchema = CreateAddressSchema.partial();

export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;

/**
 * Phase B2.5 — payout account validation.
 *
 * Only non-sensitive provider references are accepted: the provider and the
 * external account/customer ID or token. Raw bank details, card numbers,
 * CVVs and credentials are never accepted or stored.
 */

export const PayoutProviderSchema = z.enum(PAYOUT_PROVIDERS);

export const CreatePayoutAccountSchema = z.object({
  provider: PayoutProviderSchema,
  providerAccountId: z.string().trim().min(1).max(255),
  displayLabel: z.string().trim().min(1).max(120).optional(),
});

export type CreatePayoutAccountInput = z.infer<typeof CreatePayoutAccountSchema>;

export const UpdatePayoutAccountSchema = CreatePayoutAccountSchema.omit({
  provider: true,
}).partial();

export type UpdatePayoutAccountInput = z.infer<typeof UpdatePayoutAccountSchema>;
