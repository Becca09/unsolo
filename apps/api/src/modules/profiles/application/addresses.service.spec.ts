import { NotFoundException } from "@nestjs/common";
import type { Address, Profile } from "@unsolo/database";
import { AddressesService } from "./addresses.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { AddressesRepository } from "../infrastructure/addresses.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const ADDRESS_ID = "44444444-4444-4444-4444-444444444444";

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

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: ADDRESS_ID,
    profileId: PROFILE_ID,
    country: "Nigeria",
    state: "Lagos",
    city: "Lagos",
    street: "1 Marina Road",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AddressesService", () => {
  let service: AddressesService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let addresses: jest.Mocked<AddressesRepository>;

  beforeEach(() => {
    profiles = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;

    addresses = {
      findByProfileId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AddressesRepository>;

    service = new AddressesService(profiles, addresses);
  });

  describe("list", () => {
    it("returns addresses for an owned profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.findByProfileId.mockResolvedValue([makeAddress()]);

      const result = await service.list(AUTH_USER_ID, PROFILE_ID);

      expect(addresses.findByProfileId).toHaveBeenCalledWith(PROFILE_ID);
      expect(result).toHaveLength(1);
    });

    it("rejects listing another user's profile addresses", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.list(AUTH_USER_ID, PROFILE_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(addresses.findByProfileId).not.toHaveBeenCalled();
    });
  });

  describe("create", () => {
    const input = {
      country: "Nigeria",
      state: "Lagos",
      city: "Lagos",
      street: "1 Marina Road",
    };

    it("creates an address on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.create.mockResolvedValue(makeAddress());

      const result = await service.create(AUTH_USER_ID, PROFILE_ID, input);

      expect(addresses.create).toHaveBeenCalledWith(
        expect.objectContaining({ profileId: PROFILE_ID, country: "Nigeria" }),
      );
      expect(result.profileId).toBe(PROFILE_ID);
    });

    it("rejects creation on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.create(AUTH_USER_ID, PROFILE_ID, input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(addresses.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates an address on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.findById.mockResolvedValue(makeAddress());
      addresses.update.mockResolvedValue(makeAddress({ city: "Abuja" }));

      const result = await service.update(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID, {
        city: "Abuja",
      });

      expect(result.city).toBe("Abuja");
    });

    it("rejects updates to an address on a different profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.findById.mockResolvedValue(
        makeAddress({ profileId: "99999999-9999-9999-9999-999999999999" }),
      );

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID, { city: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(addresses.update).not.toHaveBeenCalled();
    });

    it("rejects updates when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(
        service.update(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID, { city: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(addresses.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("deletes an address on the caller's own profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.delete.mockResolvedValue(true);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID)).resolves.toBeUndefined();
      expect(addresses.delete).toHaveBeenCalledWith(ADDRESS_ID, PROFILE_ID);
    });

    it("rejects deletion when the profile belongs to another user", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(addresses.delete).not.toHaveBeenCalled();
    });

    it("rejects deletion of an address not on the profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      addresses.delete.mockResolvedValue(false);

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, ADDRESS_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
