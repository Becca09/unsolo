import { ConflictException, NotFoundException } from "@nestjs/common";
import type { BusinessVerification, Profile } from "@unsolo/database";
import { BusinessVerificationsService } from "./business-verifications.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { BusinessVerificationsRepository } from "../infrastructure/business-verifications.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const VERIFICATION_ID = "44444444-4444-4444-4444-444444444444";

const SUBMISSION = {
  legalName: "Adaeze Lovelace",
  nin: "12345678901",
  bvn: "10987654321",
  phone: "+2348012345678",
  country: "Nigeria",
  state: "Lagos",
  city: "Lagos",
  lga: "Eti-Osa",
  street: "1 Marina Road",
};

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: PROFILE_ID,
    userId: AUTH_USER_ID,
    type: "business",
    username: "atmosphere_travels",
    fullName: "Atmosphere Travels",
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeVerification(overrides: Partial<BusinessVerification> = {}): BusinessVerification {
  return {
    id: VERIFICATION_ID,
    profileId: PROFILE_ID,
    ...SUBMISSION,
    status: "pending",
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("BusinessVerificationsService", () => {
  let service: BusinessVerificationsService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let verifications: jest.Mocked<BusinessVerificationsRepository>;

  beforeEach(() => {
    profiles = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    verifications = {
      findByProfileId: jest.fn(),
      create: jest.fn(),
      resubmit: jest.fn(),
    } as unknown as jest.Mocked<BusinessVerificationsRepository>;

    service = new BusinessVerificationsService(profiles, verifications);
  });

  describe("get", () => {
    it("returns the submission with NIN and BVN masked", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());

      const result = await service.get(AUTH_USER_ID, PROFILE_ID);

      expect(result.ninMasked).toBe("••••8901");
      expect(result.bvnMasked).toBe("••••4321");
      expect(result).not.toHaveProperty("nin");
      expect(result).not.toHaveProperty("bvn");
      expect(result.status).toBe("pending");
    });

    it("rejects reads on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.get(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(NotFoundException);
      expect(verifications.findByProfileId).not.toHaveBeenCalled();
    });

    it("rejects verification on a non-business profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ type: "traveller" }));

      await expect(service.get(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it("404s when no submission exists", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(undefined);

      await expect(service.get(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("submit", () => {
    it("creates a pending submission on an owned business profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(undefined);
      verifications.create.mockResolvedValue(makeVerification());

      const result = await service.submit(AUTH_USER_ID, PROFILE_ID, SUBMISSION);

      expect(verifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: PROFILE_ID, ...SUBMISSION }),
      );
      expect(result.status).toBe("pending");
      expect(result).not.toHaveProperty("nin");
    });

    it("resubmits a pending submission with fresh data", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      verifications.resubmit.mockResolvedValue(makeVerification());

      await service.submit(AUTH_USER_ID, PROFILE_ID, SUBMISSION);

      expect(verifications.resubmit).toHaveBeenCalledWith(
        PROFILE_ID,
        expect.objectContaining(SUBMISSION),
      );
      expect(verifications.create).not.toHaveBeenCalled();
    });

    it("rejects resubmission once verified", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification({ status: "verified" }));

      await expect(service.submit(AUTH_USER_ID, PROFILE_ID, SUBMISSION)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(verifications.create).not.toHaveBeenCalled();
      expect(verifications.resubmit).not.toHaveBeenCalled();
    });

    it("rejects submission on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.submit(AUTH_USER_ID, PROFILE_ID, SUBMISSION)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(verifications.create).not.toHaveBeenCalled();
    });
  });
});
