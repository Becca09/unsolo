import { ConflictException, NotFoundException } from "@nestjs/common";
import type { Profile } from "@unsolo/database";
import { ProfilesService } from "./profiles.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { UsersService } from "../../users/application/users.service";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";

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

describe("ProfilesService", () => {
  let service: ProfilesService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let users: jest.Mocked<UsersService>;

  beforeEach(() => {
    profiles = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      createWithType: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    users = {
      ensureUser: jest.fn().mockResolvedValue({ id: AUTH_USER_ID }),
    } as unknown as jest.Mocked<UsersService>;

    service = new ProfilesService(profiles, users);
  });

  describe("create", () => {
    const input = { type: "traveller" as const, username: "ada", fullName: "Ada" };

    it("provisions the user record and creates a profile owned by the caller", async () => {
      profiles.createWithType.mockResolvedValue(makeProfile());

      const result = await service.create(AUTH_USER_ID, input);

      expect(users.ensureUser).toHaveBeenCalledWith(AUTH_USER_ID);
      expect(profiles.createWithType).toHaveBeenCalledWith(
        expect.objectContaining({ userId: AUTH_USER_ID, type: "traveller" }),
      );
      expect(result.userId).toBe(AUTH_USER_ID);
    });

    it("maps a unique-violation to ConflictException (one profile per type per user)", async () => {
      profiles.createWithType.mockRejectedValue({ code: "23505" });

      await expect(service.create(AUTH_USER_ID, input)).rejects.toBeInstanceOf(ConflictException);
    });

    it("rethrows non-constraint errors", async () => {
      profiles.createWithType.mockRejectedValue(new Error("db down"));

      await expect(service.create(AUTH_USER_ID, input)).rejects.toThrow("db down");
    });
  });

  describe("update", () => {
    it("updates a profile owned by the caller", async () => {
      const profile = makeProfile();
      profiles.findById.mockResolvedValue(profile);
      profiles.update.mockResolvedValue({ ...profile, fullName: "Ada Lovelace" });

      const result = await service.update(AUTH_USER_ID, PROFILE_ID, {
        fullName: "Ada Lovelace",
      });

      expect(result.fullName).toBe("Ada Lovelace");
      expect(profiles.update).toHaveBeenCalledWith(PROFILE_ID, {
        fullName: "Ada Lovelace",
      });
    });

    it("rejects updates to another user's profile without leaking existence", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, { fullName: "Hijack" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(profiles.update).not.toHaveBeenCalled();
    });

    it("rejects updates to a nonexistent profile", async () => {
      profiles.findById.mockResolvedValue(undefined);

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, { fullName: "Nope" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(profiles.update).not.toHaveBeenCalled();
    });
  });

  describe("listMine", () => {
    it("returns only the caller's profiles", async () => {
      profiles.findByUserId.mockResolvedValue([makeProfile()]);

      const result = await service.listMine(AUTH_USER_ID);

      expect(profiles.findByUserId).toHaveBeenCalledWith(AUTH_USER_ID);
      expect(result).toHaveLength(1);
    });
  });
});
