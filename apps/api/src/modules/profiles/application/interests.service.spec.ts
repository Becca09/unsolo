import { ConflictException, NotFoundException } from "@nestjs/common";
import type { Interest, Profile } from "@unsolo/database";
import { InterestsService } from "./interests.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { InterestsRepository } from "../infrastructure/interests.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const INTEREST_ID = "44444444-4444-4444-4444-444444444444";

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

function makeInterest(overrides: Partial<Interest> = {}): Interest {
  return {
    id: INTEREST_ID,
    name: "hiking",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("InterestsService", () => {
  let service: InterestsService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let interests: jest.Mocked<InterestsRepository>;

  beforeEach(() => {
    profiles = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    interests = {
      findByProfileId: jest.fn(),
      findInterestByName: jest.fn(),
      createInterest: jest.fn(),
      link: jest.fn(),
      unlink: jest.fn(),
    } as unknown as jest.Mocked<InterestsRepository>;

    service = new InterestsService(profiles, interests);
  });

  describe("list", () => {
    it("returns interests for an owned profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.findByProfileId.mockResolvedValue([makeInterest()]);

      const result = await service.list(AUTH_USER_ID, PROFILE_ID);

      expect(interests.findByProfileId).toHaveBeenCalledWith(PROFILE_ID);
      expect(result).toHaveLength(1);
    });

    it("rejects listing another user's profile interests", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.list(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(interests.findByProfileId).not.toHaveBeenCalled();
    });
  });

  describe("add", () => {
    const input = { name: "hiking" };

    it("links an existing interest to the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.findInterestByName.mockResolvedValue(makeInterest());
      interests.link.mockResolvedValue(undefined);

      const result = await service.add(AUTH_USER_ID, PROFILE_ID, input);

      expect(interests.createInterest).not.toHaveBeenCalled();
      expect(interests.link).toHaveBeenCalledWith(PROFILE_ID, INTEREST_ID);
      expect(result.id).toBe(INTEREST_ID);
    });

    it("creates the interest row when it does not exist yet", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.findInterestByName.mockResolvedValue(undefined);
      interests.createInterest.mockResolvedValue(makeInterest());
      interests.link.mockResolvedValue(undefined);

      const result = await service.add(AUTH_USER_ID, PROFILE_ID, input);

      expect(interests.createInterest).toHaveBeenCalledWith("hiking");
      expect(result.id).toBe(INTEREST_ID);
    });

    it("rejects adding to another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.add(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(interests.link).not.toHaveBeenCalled();
    });

    it("maps a duplicate link to ConflictException", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.findInterestByName.mockResolvedValue(makeInterest());
      interests.link.mockRejectedValue({ code: "23505" });

      await expect(service.add(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it("recovers from a concurrent interest insert via re-read", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.findInterestByName
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(makeInterest());
      interests.createInterest.mockRejectedValue({ code: "23505" });
      interests.link.mockResolvedValue(undefined);

      const result = await service.add(AUTH_USER_ID, PROFILE_ID, input);

      expect(result.id).toBe(INTEREST_ID);
      expect(interests.link).toHaveBeenCalledWith(PROFILE_ID, INTEREST_ID);
    });
  });

  describe("remove", () => {
    it("removes an interest from the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.unlink.mockResolvedValue(true);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, INTEREST_ID)).resolves.toBeUndefined();
      expect(interests.unlink).toHaveBeenCalledWith(PROFILE_ID, INTEREST_ID);
    });

    it("rejects removal on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, INTEREST_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(interests.unlink).not.toHaveBeenCalled();
    });

    it("rejects removal of an interest not linked to the profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      interests.unlink.mockResolvedValue(false);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, INTEREST_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
