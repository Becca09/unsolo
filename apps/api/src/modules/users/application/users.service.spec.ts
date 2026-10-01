import type { User } from "@unsolo/database";
import { UsersService } from "./users.service";
import { UsersRepository } from "../infrastructure/users.repository";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: AUTH_USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("UsersService", () => {
  let service: UsersService;
  let users: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    users = {
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new UsersService(users);
  });

  describe("ensureUser", () => {
    it("returns the existing record for a known auth id", async () => {
      users.findById.mockResolvedValue(makeUser());

      const result = await service.ensureUser(AUTH_USER_ID);

      expect(result.id).toBe(AUTH_USER_ID);
      expect(users.create).not.toHaveBeenCalled();
    });

    it("creates exactly one record keyed by the Supabase auth id", async () => {
      users.findById.mockResolvedValue(undefined);
      users.create.mockResolvedValue(makeUser());

      const result = await service.ensureUser(AUTH_USER_ID);

      expect(users.create).toHaveBeenCalledWith(AUTH_USER_ID);
      expect(result.id).toBe(AUTH_USER_ID);
    });
  });
});
