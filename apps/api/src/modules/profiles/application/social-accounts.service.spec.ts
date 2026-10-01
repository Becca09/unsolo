import { ConflictException, NotFoundException } from "@nestjs/common";
import type { Profile, SocialAccount } from "@unsolo/database";
import { SocialAccountsService } from "./social-accounts.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { SocialAccountsRepository } from "../infrastructure/social-accounts.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const SOCIAL_ID = "44444444-4444-4444-4444-444444444444";

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: PROFILE_ID,
    userId: AUTH_USER_ID,
    type: "traveller",
    username: "ada",
    fullName: "Ada",
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeSocial(overrides: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: SOCIAL_ID,
    profileId: PROFILE_ID,
    platform: "instagram",
    handle: "ada",
    url: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("SocialAccountsService", () => {
  let service: SocialAccountsService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let socials: jest.Mocked<SocialAccountsRepository>;

  beforeEach(() => {
    profiles = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    socials = {
      findByProfileId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<SocialAccountsRepository>;

    service = new SocialAccountsService(profiles, socials);
  });

  describe("list", () => {
    it("returns social accounts for an owned profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.findByProfileId.mockResolvedValue([makeSocial()]);

      const result = await service.list(AUTH_USER_ID, PROFILE_ID);

      expect(socials.findByProfileId).toHaveBeenCalledWith(PROFILE_ID);
      expect(result).toHaveLength(1);
    });

    it("rejects listing another user's profile socials", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.list(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(socials.findByProfileId).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const input = { platform: "instagram" as const, handle: "ada" };

    it("creates a social account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.create.mockResolvedValue(makeSocial());

      const result = await service.create(AUTH_USER_ID, PROFILE_ID, input);

      expect(socials.create).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: PROFILE_ID, platform: "instagram" }),
      );
      expect(result.profileId).toBe(PROFILE_ID);
    });

    it("rejects creation on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.create(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(socials.create).not.toHaveBeenCalled();
    });

    it("maps a unique-violation to ConflictException (one account per platform per profile)", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.create.mockRejectedValue({ code: "23505" });

      await expect(service.create(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("update", () => {
    it("updates a social account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.findById.mockResolvedValue(makeSocial());
      socials.update.mockResolvedValue(makeSocial({ handle: "ada2" }));

      const result = await service.update(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID, {
        handle: "ada2",
      });

      expect(result.handle).toBe("ada2");
    });

    it("rejects updates to a social account on a different profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.findById.mockResolvedValue(
        makeSocial({ profileId: "99999999-9999-9999-9999-999999999999" }),
      );

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID, { handle: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(socials.update).not.toHaveBeenCalled();
    });

    it("rejects updates when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID, { handle: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(socials.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes a social account on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.delete.mockResolvedValue(true);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID)).resolves.toBeUndefined();
      expect(socials.delete).toHaveBeenCalledWith(SOCIAL_ID, PROFILE_ID);
    });

    it("rejects deletion when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(socials.delete).not.toHaveBeenCalled();
    });

    it("rejects deletion of a social account not on the profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      socials.delete.mockResolvedValue(false);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, SOCIAL_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
