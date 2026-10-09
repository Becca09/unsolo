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
import {
  PROFILE_TYPES,
  SOCIAL_PLATFORMS,
  PAYOUT_PROVIDERS,
  BUSINESS_VERIFICATION_STATUSES,
  VERIFICATION_DOCUMENT_TYPES,
  VERIFICATION_DOCUMENT_MIME_TYPES,
  VERIFICATION_DOCUMENT_MAX_BYTES,
} from "@unsolo/types";

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

/**
 * Nigerian NUBAN account number — exactly 10 digits.
 */
export const BankAccountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "Account number must be exactly 10 digits");

export const CreatePayoutAccountSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("stripe"),
    providerAccountId: z.string().trim().min(1).max(255),
    displayLabel: z.string().trim().min(1).max(120).optional(),
  }),
  z.object({
    provider: z.literal("local"),
    bankName: z.string().trim().min(1).max(120),
    bankCode: z.string().trim().min(1).max(20).optional(),
    accountNumber: BankAccountNumberSchema,
    accountName: z.string().trim().min(1).max(120),
    displayLabel: z.string().trim().min(1).max(120).optional(),
  }),
]);

export type CreatePayoutAccountInput = z.infer<typeof CreatePayoutAccountSchema>;

export const UpdatePayoutAccountSchema = z
  .object({
    providerAccountId: z.string().trim().min(1).max(255),
    bankName: z.string().trim().min(1).max(120),
    bankCode: z.string().trim().min(1).max(20),
    accountNumber: BankAccountNumberSchema,
    accountName: z.string().trim().min(1).max(120),
    displayLabel: z.string().trim().min(1).max(120),
  })
  .partial();

export type UpdatePayoutAccountInput = z.infer<typeof UpdatePayoutAccountSchema>;

/**
 * Phase B2.6 — business profile details & verification.
 */

const PhoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(20)
  .regex(/^\+?[0-9][0-9\s\-()]*$/, "Enter a valid phone number");

export const UpdateBusinessProfileSchema = z
  .object({
    tagline: z.string().trim().max(160),
    phone: PhoneSchema,
  })
  .partial();

export type UpdateBusinessProfileInput = z.infer<typeof UpdateBusinessProfileSchema>;

export const BusinessVerificationStatusSchema = z.enum(BUSINESS_VERIFICATION_STATUSES);

const verificationPart = z.string().trim().min(1).max(120);

export const SubmitBusinessVerificationSchema = z.object({
  legalName: verificationPart,
  nin: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "NIN must be exactly 11 digits"),
  bvn: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "BVN must be exactly 11 digits")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  phone: PhoneSchema,
  country: verificationPart,
  state: verificationPart,
  city: verificationPart,
  lga: verificationPart,
  street: verificationPart,
});

export type SubmitBusinessVerificationInput = z.infer<typeof SubmitBusinessVerificationSchema>;

/**
 * Verification document upload request — metadata only. The API validates
 * this, issues a signed upload URL for the private storage bucket, and the
 * client PUTs the file directly to storage before confirming. File bytes
 * never pass through the API.
 */
export const RequestDocumentUploadSchema = z.object({
  type: z.enum(VERIFICATION_DOCUMENT_TYPES),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\:*?"<>|]+$/, "File name contains invalid characters"),
  mimeType: z.enum(VERIFICATION_DOCUMENT_MIME_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(VERIFICATION_DOCUMENT_MAX_BYTES, "File must be 5 MB or smaller"),
});

export type RequestDocumentUploadInput = z.infer<typeof RequestDocumentUploadSchema>;

/**
 * Bank account resolution — asks the configured payout provider (e.g.
 * Paystack) for the verified account name before saving a payout account.
 */
export const ResolvePayoutAccountSchema = z.object({
  bankCode: z.string().trim().min(1).max(20),
  accountNumber: BankAccountNumberSchema,
});

export type ResolvePayoutAccountInput = z.infer<typeof ResolvePayoutAccountSchema>;

/**
 * Admin review of a business verification submission. Rejections require a
 * reason so the business knows what to fix.
 */
export const ReviewBusinessVerificationSchema = z
  .object({
    status: z.enum(["verified", "rejected"]),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
  })
  .refine((v) => v.status !== "rejected" || !!v.rejectionReason, {
    message: "A rejection reason is required when rejecting",
    path: ["rejectionReason"],
  });

export type ReviewBusinessVerificationInput = z.infer<typeof ReviewBusinessVerificationSchema>;
