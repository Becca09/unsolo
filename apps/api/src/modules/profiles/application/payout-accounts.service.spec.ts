import { ConflictException, NotFoundException } from "@nestjs/common";
import type { PayoutAccount, Profile } from "@unsolo/database";
import { PayoutAccountsService } from "./payout-accounts.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { PayoutAccountsRepository } from "../infrastructure/payout-accounts.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const PAYOUT_ID = "44444444-4444-4444-4444-444444444444";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: PROFILE_ID,
    userId: AUTH_USER_ID,
    type: "planner",
    username: "ada",
    fullName: "Ada",
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makePayout(overrides: Partial<PayoutAccount> = {}): PayoutAccount {
  return {
    id: PAYOUT_ID,
    profileId: PROFILE_ID,
    provider: "stripe",
    providerAccountId: "acct_test_123",
    displayLabel: "Stripe account",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("PayoutAccountsService", () => {
  let service: PayoutAccountsService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let payouts: jest.Mocked<PayoutAccountsRepository>;

  beforeEach(() => {
    profiles = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    payouts = {
      findByProfileId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PayoutAccountsRepository>;

    service = new PayoutAccountsService(profiles, payouts);
  });

  describe("list", () => {
    it("returns payout accounts for an owned profile without the external account id", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.findByProfileId.mockResolvedValue([makePayout()]);

      const result = await service.list(AUTH_USER_ID, PROFILE_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty("providerAccountId");
      expect(result[0]?.provider).toBe("stripe");
    });

    it("rejects listing another user's profile payout accounts", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.list(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(payouts.findByProfileId).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const input = {
      provider: "stripe" as const,
      providerAccountId: "acct_test_123",
      displayLabel: "Stripe account",
    };

    it("creates a payout account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.create.mockResolvedValue(makePayout());

      const result = await service.create(AUTH_USER_ID, PROFILE_ID, input);

      expect(payouts.create).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: PROFILE_ID, provider: "stripe" }),
      );
      expect(result).not.toHaveProperty("providerAccountId");
    });

    it("rejects creation on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.create(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(payouts.create).not.toHaveBeenCalled();
    });

    it("maps a unique-violation to ConflictException", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.create.mockRejectedValue({ code: "23505" });

      await expect(service.create(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("update", () => {
    it("updates a payout account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.findById.mockResolvedValue(makePayout());
      payouts.update.mockResolvedValue(makePayout({ displayLabel: "New label" }));

      const result = await service.update(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID, {
        displayLabel: "New label",
      });

      expect(result.displayLabel).toBe("New label");
      expect(result).not.toHaveProperty("providerAccountId");
    });

    it("rejects updates to a payout account on a different profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.findById.mockResolvedValue(
        makePayout({ profileId: "99999999-9999-9999-9999-999999999999" }),
      );

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID, { displayLabel: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(payouts.update).not.toHaveBeenCalled();
    });

    it("rejects updates when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID, { displayLabel: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(payouts.update).not.toHaveBeenCalled();
    });

    it("maps a unique-violation on update to ConflictException", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.findById.mockResolvedValue(makePayout());
      payouts.update.mockRejectedValue({ code: "23505" });

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID, {
          providerAccountId: "acct_taken",
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("remove", () => {
    it("deletes a payout account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.delete.mockResolvedValue(true);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID)).resolves.toBeUndefined();
      expect(payouts.delete).toHaveBeenCalledWith(PAYOUT_ID, PROFILE_ID);
    });

    it("rejects deletion when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(payouts.delete).not.toHaveBeenCalled();
    });

    it("rejects deletion of a payout account not on the profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      payouts.delete.mockResolvedValue(false);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, PAYOUT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
