import {
  AddInterestSchema,
  CreateAddressSchema,
  CreatePayoutAccountSchema,
  CreateProfileSchema,
  CreateSocialAccountSchema,
  RequestDocumentUploadSchema,
  ResolvePayoutAccountSchema,
  ReviewBusinessVerificationSchema,
  SubmitBusinessVerificationSchema,
  UpdateAddressSchema,
  UpdateBusinessProfileSchema,
  UpdatePayoutAccountSchema,
  UpdateProfileSchema,
  UpdateSocialAccountSchema,
} from "@unsolo/validation";

/**
 * B2.6 — validation boundary tests.
 *
 * These cover the security-relevant schema rules: only spec-defined
 * platforms/providers are accepted, immutable fields cannot be smuggled
 * into updates, and required fields are enforced.
 */
describe("B2 validation schemas", () => {
  describe("CreateProfileSchema / UpdateProfileSchema", () => {
    const valid = { type: "traveller", username: "ada_123", fullName: "Ada Lovelace" };

    it("accepts the four spec-defined profile types", () => {
      for (const type of ["traveller", "planner", "business", "host"]) {
        expect(CreateProfileSchema.safeParse({ ...valid, type }).success).toBe(true);
      }
    });

    it("rejects unknown profile types", () => {
      expect(CreateProfileSchema.safeParse({ ...valid, type: "admin" }).success).toBe(false);
    });

    it("requires a username and full name", () => {
      expect(CreateProfileSchema.safeParse({ type: "traveller" }).success).toBe(false);
    });

    it("rejects invalid usernames", () => {
      for (const username of ["ab", "Has Spaces", "UPPER"]) {
        expect(CreateProfileSchema.safeParse({ ...valid, username }).success).toBe(false);
      }
    });

    it("does not allow type or userId in updates", () => {
      const result = UpdateProfileSchema.safeParse({
        type: "business",
        userId: "11111111-1111-1111-1111-111111111111",
        fullName: "New name",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("type");
        expect(result.data).not.toHaveProperty("userId");
      }
    });
  });

  describe("CreateSocialAccountSchema / UpdateSocialAccountSchema", () => {
    it("accepts instagram, x and tiktok", () => {
      for (const platform of ["instagram", "x", "tiktok"]) {
        expect(CreateSocialAccountSchema.safeParse({ platform, handle: "@ada" }).success).toBe(
          true,
        );
      }
    });

    it("rejects unsupported platforms", () => {
      for (const platform of ["facebook", "linkedin", "youtube"]) {
        expect(CreateSocialAccountSchema.safeParse({ platform, handle: "@ada" }).success).toBe(
          false,
        );
      }
    });

    it("requires at least one of handle or url", () => {
      expect(CreateSocialAccountSchema.safeParse({ platform: "instagram" }).success).toBe(false);
      expect(UpdateSocialAccountSchema.safeParse({}).success).toBe(false);
    });

    it("does not allow platform changes on update", () => {
      const result = UpdateSocialAccountSchema.safeParse({
        platform: "x",
        handle: "@ada",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("platform");
      }
    });
  });

  describe("AddInterestSchema", () => {
    it("accepts a trimmed non-empty name", () => {
      const result = AddInterestSchema.safeParse({ name: "  hiking  " });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("hiking");
      }
    });

    it("rejects empty names", () => {
      expect(AddInterestSchema.safeParse({ name: "" }).success).toBe(false);
      expect(AddInterestSchema.safeParse({ name: "   " }).success).toBe(false);
    });
  });

  describe("CreateAddressSchema / UpdateAddressSchema", () => {
    const valid = {
      country: "Nigeria",
      state: "Lagos",
      city: "Lagos",
      street: "1 Marina Road",
    };

    it("accepts the four spec-defined components", () => {
      expect(CreateAddressSchema.safeParse(valid).success).toBe(true);
    });

    it("requires all four components", () => {
      for (const key of ["country", "state", "city", "street"] as const) {
        const { [key]: _omitted, ...rest } = valid;
        expect(CreateAddressSchema.safeParse(rest).success).toBe(false);
      }
    });

    it("stores no extra fields", () => {
      const result = CreateAddressSchema.safeParse({
        ...valid,
        postalCode: "100001",
        isPrimary: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("postalCode");
        expect(result.data).not.toHaveProperty("isPrimary");
      }
    });

    it("allows partial updates", () => {
      expect(UpdateAddressSchema.safeParse({ city: "Abuja" }).success).toBe(true);
    });
  });

  describe("CreatePayoutAccountSchema / UpdatePayoutAccountSchema", () => {
    const localBank = {
      provider: "local" as const,
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "Ada Lovelace",
    };

    it("accepts a stripe provider reference", () => {
      expect(
        CreatePayoutAccountSchema.safeParse({
          provider: "stripe",
          providerAccountId: "acct_123",
        }).success,
      ).toBe(true);
    });

    it("accepts a local bank payout account", () => {
      expect(CreatePayoutAccountSchema.safeParse(localBank).success).toBe(true);
    });

    it("rejects unknown providers", () => {
      expect(
        CreatePayoutAccountSchema.safeParse({
          provider: "paypal",
          providerAccountId: "x",
        }).success,
      ).toBe(false);
    });

    it("requires bank details for local payouts, not a provider reference", () => {
      expect(
        CreatePayoutAccountSchema.safeParse({
          provider: "local",
          providerAccountId: "acct_123",
        }).success,
      ).toBe(false);
    });

    it("requires a provider account reference for stripe", () => {
      expect(CreatePayoutAccountSchema.safeParse({ provider: "stripe" }).success).toBe(false);
    });

    it("rejects account numbers that are not 10 digits", () => {
      for (const accountNumber of ["12345", "01234567890", "abcdefghij"]) {
        expect(CreatePayoutAccountSchema.safeParse({ ...localBank, accountNumber }).success).toBe(
          false,
        );
      }
    });

    it("does not allow provider changes on update", () => {
      const result = UpdatePayoutAccountSchema.safeParse({
        provider: "local",
        displayLabel: "x",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("provider");
      }
    });
  });

  describe("UpdateBusinessProfileSchema", () => {
    it("accepts tagline and phone", () => {
      expect(
        UpdateBusinessProfileSchema.safeParse({
          tagline: "Trips that feel like home",
          phone: "+2348012345678",
        }).success,
      ).toBe(true);
    });

    it("rejects malformed phone numbers", () => {
      expect(UpdateBusinessProfileSchema.safeParse({ phone: "call me" }).success).toBe(false);
    });
  });

  describe("SubmitBusinessVerificationSchema", () => {
    const valid = {
      legalName: "Adaeze Lovelace",
      nin: "12345678901",
      phone: "+2348012345678",
      country: "Nigeria",
      state: "Lagos",
      city: "Lagos",
      lga: "Eti-Osa",
      street: "1 Marina Road",
    };

    it("accepts a complete submission", () => {
      expect(SubmitBusinessVerificationSchema.safeParse(valid).success).toBe(true);
    });

    it("accepts a submission without BVN", () => {
      expect(SubmitBusinessVerificationSchema.safeParse(valid).success).toBe(true);
      expect(SubmitBusinessVerificationSchema.safeParse({ ...valid, bvn: "" }).success).toBe(true);
    });

    it("requires NIN to be exactly 11 digits", () => {
      for (const nin of ["12345", "123456789012", "abcdefghijk"]) {
        expect(SubmitBusinessVerificationSchema.safeParse({ ...valid, nin }).success).toBe(false);
      }
    });

    it("requires all address components including LGA", () => {
      for (const key of ["country", "state", "city", "lga", "street"] as const) {
        const { [key]: _omitted, ...rest } = valid;
        expect(SubmitBusinessVerificationSchema.safeParse(rest).success).toBe(false);
      }
    });
  });

  describe("RequestDocumentUploadSchema", () => {
    const valid = {
      type: "government_id",
      fileName: "nin-slip.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024 * 512,
    };

    it("accepts image and PDF documents", () => {
      for (const mimeType of ["image/jpeg", "image/png", "image/webp", "application/pdf"]) {
        expect(RequestDocumentUploadSchema.safeParse({ ...valid, mimeType }).success).toBe(true);
      }
    });

    it("rejects executables, HTML and unknown mime types", () => {
      for (const mimeType of [
        "text/html",
        "application/x-msdownload",
        "application/zip",
        "video/mp4",
      ]) {
        expect(RequestDocumentUploadSchema.safeParse({ ...valid, mimeType }).success).toBe(false);
      }
    });

    it("rejects files over 5 MB and non-positive sizes", () => {
      for (const sizeBytes of [5 * 1024 * 1024 + 1, 0, -1]) {
        expect(RequestDocumentUploadSchema.safeParse({ ...valid, sizeBytes }).success).toBe(false);
      }
    });

    it("rejects path-traversal file names", () => {
      for (const fileName of ["../secret.pdf", "a/b.pdf", "a\\b.pdf", "x?.pdf"]) {
        expect(RequestDocumentUploadSchema.safeParse({ ...valid, fileName }).success).toBe(false);
      }
    });

    it("rejects unknown document types", () => {
      expect(
        RequestDocumentUploadSchema.safeParse({ ...valid, type: "passport_scan" }).success,
      ).toBe(false);
    });
  });

  describe("ResolvePayoutAccountSchema", () => {
    it("requires a bank code and a 10-digit account number", () => {
      expect(
        ResolvePayoutAccountSchema.safeParse({
          bankCode: "058",
          accountNumber: "0123456789",
        }).success,
      ).toBe(true);
      expect(ResolvePayoutAccountSchema.safeParse({ accountNumber: "0123456789" }).success).toBe(
        false,
      );
      expect(
        ResolvePayoutAccountSchema.safeParse({ bankCode: "058", accountNumber: "123" }).success,
      ).toBe(false);
    });
  });

  describe("ReviewBusinessVerificationSchema", () => {
    it("accepts approval without a reason", () => {
      expect(ReviewBusinessVerificationSchema.safeParse({ status: "verified" }).success).toBe(true);
    });

    it("requires a rejection reason when rejecting", () => {
      expect(ReviewBusinessVerificationSchema.safeParse({ status: "rejected" }).success).toBe(
        false,
      );
      expect(
        ReviewBusinessVerificationSchema.safeParse({
          status: "rejected",
          rejectionReason: "Blurry ID",
        }).success,
      ).toBe(true);
    });

    it("cannot set pending through the review endpoint", () => {
      expect(ReviewBusinessVerificationSchema.safeParse({ status: "pending" }).success).toBe(false);
    });
  });

  describe("CreatePayoutAccountSchema — local bankCode", () => {
    const localBank = {
      provider: "local" as const,
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "Ada Lovelace",
    };

    it("accepts an optional provider bank code", () => {
      expect(CreatePayoutAccountSchema.safeParse({ ...localBank, bankCode: "058" }).success).toBe(
        true,
      );
      expect(CreatePayoutAccountSchema.safeParse(localBank).success).toBe(true);
    });
  });
});
