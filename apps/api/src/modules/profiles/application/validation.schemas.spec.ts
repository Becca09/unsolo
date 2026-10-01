import {
  AddInterestSchema,
  CreateAddressSchema,
  CreatePayoutAccountSchema,
  CreateProfileSchema,
  CreateSocialAccountSchema,
  UpdateAddressSchema,
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
    it("accepts instagram and x", () => {
      for (const platform of ["instagram", "x"]) {
        expect(CreateSocialAccountSchema.safeParse({ platform, handle: "@ada" }).success).toBe(
          true,
        );
      }
    });

    it("rejects unsupported platforms", () => {
      for (const platform of ["facebook", "tiktok", "linkedin", "youtube"]) {
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
    it("accepts stripe and local providers", () => {
      for (const provider of ["stripe", "local"]) {
        expect(
          CreatePayoutAccountSchema.safeParse({
            provider,
            providerAccountId: "acct_123",
          }).success,
        ).toBe(true);
      }
    });

    it("rejects unknown providers", () => {
      expect(
        CreatePayoutAccountSchema.safeParse({
          provider: "paypal",
          providerAccountId: "x",
        }).success,
      ).toBe(false);
    });

    it("requires a provider account reference", () => {
      expect(CreatePayoutAccountSchema.safeParse({ provider: "stripe" }).success).toBe(false);
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
});
