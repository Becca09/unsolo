/**
 * Shared state for the business onboarding flow.
 *
 * Field → persistence mapping (all real B2 API storage):
 *   profile                     → businessName (fullName), handle (username),
 *                                 description (bio), logoUrl (avatarUrl)
 *   business_profiles           → tagline, phone
 *   interests                   → categories
 *   social_accounts             → socials (instagram / x / tiktok handles)
 *   addresses                   → address
 *   business_verifications      → verification (NIN/BVN masked on read)
 *   payout_accounts             → payout (account number masked on read)
 */
export interface BusinessDraft {
  businessName: string;
  handle: string;
  tagline: string;
  description: string;
  logoUrl: string;
  phone: string;
  categories: string[];
  socials: {
    instagram: string;
    x: string;
    tiktok: string;
  };
  address: {
    country: string;
    state: string;
    city: string;
    street: string;
  };
  verification: {
    legalName: string;
    nin: string;
    bvn: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    lga: string;
    street: string;
  };
  payout: {
    bankName: string;
    /** Provider bank code (e.g. Paystack) — set when picked from the directory. */
    bankCode: string;
    accountNumber: string;
    accountName: string;
    /** True when accountName came back from provider resolution. */
    resolved: boolean;
  };
}

export const emptyDraft: BusinessDraft = {
  businessName: "",
  handle: "",
  tagline: "",
  description: "",
  logoUrl: "",
  phone: "",
  categories: [],
  socials: { instagram: "", x: "", tiktok: "" },
  address: { country: "", state: "", city: "", street: "" },
  verification: {
    legalName: "",
    nin: "",
    bvn: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    lga: "",
    street: "",
  },
  payout: { bankName: "", bankCode: "", accountNumber: "", accountName: "", resolved: false },
};

export type DetailField =
  "businessName" | "handle" | "tagline" | "description" | "logoUrl" | "phone" | "address";

export type DetailErrors = Partial<Record<DetailField, string>>;

export type VerificationField = keyof BusinessDraft["verification"];
export type VerificationErrors = Partial<Record<VerificationField, string>>;

export type PayoutField = keyof BusinessDraft["payout"];
export type PayoutErrors = Partial<Record<PayoutField, string>>;

export function isAddressComplete(address: BusinessDraft["address"]): boolean {
  return Object.values(address).every((v) => v.trim().length > 0);
}

export function isAddressPartial(address: BusinessDraft["address"]): boolean {
  const filled = Object.values(address).filter((v) => v.trim().length > 0);
  return filled.length > 0 && filled.length < 4;
}

export function filledSocials(
  socials: BusinessDraft["socials"],
): { platform: "instagram" | "x" | "tiktok"; handle: string }[] {
  return (["instagram", "x", "tiktok"] as const)
    .filter((platform) => socials[platform].trim().length > 0)
    .map((platform) => ({ platform, handle: socials[platform].trim() }));
}

const PHONE_RE = /^\+?[0-9][0-9\s\-()]*$/;

export function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 7 && trimmed.length <= 20 && PHONE_RE.test(trimmed);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Step-1 validation — mirrors the backend schemas (UsernameSchema,
 * CreateProfileSchema, UpdateBusinessProfileSchema, CreateAddressSchema)
 * so errors surface next to the field instead of at submit time.
 */
export function validateDetails(draft: BusinessDraft): DetailErrors {
  const errors: DetailErrors = {};

  if (!draft.businessName.trim()) {
    errors.businessName = "Business name is required.";
  } else if (draft.businessName.trim().length > 120) {
    errors.businessName = "Keep the business name under 120 characters.";
  }

  if (!draft.handle.trim()) {
    errors.handle = "Choose a handle for your business.";
  } else if (!/^[a-z0-9_]{3,30}$/.test(draft.handle.trim())) {
    errors.handle = "3–30 characters: lowercase letters, numbers and underscores only.";
  }

  if (draft.tagline.trim().length > 160) {
    errors.tagline = "Keep the tagline under 160 characters.";
  }

  if (draft.description.length > 2000) {
    errors.description = "Keep the description under 2000 characters.";
  }

  if (draft.logoUrl.trim() && !isValidUrl(draft.logoUrl.trim())) {
    errors.logoUrl = "Enter a valid URL, e.g. https://example.com/logo.png";
  }

  if (draft.phone.trim() && !isValidPhone(draft.phone)) {
    errors.phone = "Enter a valid phone number.";
  }

  if (isAddressPartial(draft.address)) {
    errors.address = "Fill in all four address fields, or leave them all empty.";
  }

  return errors;
}

/**
 * Step-2 validation — mirrors SubmitBusinessVerificationSchema. NIN is
 * required; BVN is optional ("where required"). Every field must be filled
 * before continuing.
 */
export function validateVerification(draft: BusinessDraft): VerificationErrors {
  const errors: VerificationErrors = {};
  const v = draft.verification;

  if (!v.legalName.trim()) {
    errors.legalName = "Enter the legal name of the business owner or representative.";
  }
  if (!v.nin.trim()) {
    errors.nin = "NIN is required.";
  } else if (!/^\d{11}$/.test(v.nin.trim())) {
    errors.nin = "NIN must be exactly 11 digits.";
  }
  if (v.bvn.trim() && !/^\d{11}$/.test(v.bvn.trim())) {
    errors.bvn = "BVN must be exactly 11 digits.";
  }
  if (!v.phone.trim()) {
    errors.phone = "A contact phone number is required.";
  } else if (!isValidPhone(v.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  for (const key of ["country", "state", "city", "lga", "street"] as const) {
    if (!v[key].trim()) {
      errors[key] = "Required.";
    }
  }

  return errors;
}

/**
 * Step-3 validation — mirrors the `local` variant of
 * CreatePayoutAccountSchema (NUBAN: exactly 10 digits).
 */
export function validatePayout(draft: BusinessDraft): PayoutErrors {
  const errors: PayoutErrors = {};
  const p = draft.payout;

  if (!p.bankName.trim()) {
    errors.bankName = "Select or enter your bank.";
  }
  if (!p.accountNumber.trim()) {
    errors.accountNumber = "Account number is required.";
  } else if (!/^\d{10}$/.test(p.accountNumber.trim())) {
    errors.accountNumber = "Account number must be exactly 10 digits.";
  }
  if (!p.accountName.trim()) {
    errors.accountName = "Enter the account holder name.";
  }

  return errors;
}
