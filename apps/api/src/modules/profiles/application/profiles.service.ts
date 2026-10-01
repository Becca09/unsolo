import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Profile } from "@unsolo/database";
import type { CreateProfileInput, UpdateProfileInput } from "@unsolo/validation";
import { UsersService } from "../../users/application/users.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";

/**
 * ProfilesService — application layer for user profiles.
 *
 * Ownership rules:
 *   - Profiles are always created for the authenticated user; the user id
 *     comes from the verified JWT, never from the request body.
 *   - Reads and updates are scoped to the caller's own profiles. A profile
 *     belonging to someone else is indistinguishable from a missing one
 *     (404), so existence is never leaked across users.
 */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly users: UsersService,
  ) {}

  async listMine(authUserId: string): Promise<Profile[]> {
    return this.profiles.findByUserId(authUserId);
  }

  async create(authUserId: string, input: CreateProfileInput): Promise<Profile> {
    // The user record must exist before a profile can reference it.
    await this.users.ensureUser(authUserId);

    try {
      return await this.profiles.createWithType({
        userId: authUserId,
        type: input.type,
        username: input.username,
        fullName: input.fullName,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
      });
    } catch (error) {
      throw mapUniqueViolation(error, input.type);
    }
  }

  async update(authUserId: string, profileId: string, input: UpdateProfileInput): Promise<Profile> {
    const profile = await this.profiles.findById(profileId);

    // Ownership check: a foreign profile is reported as not found so its
    // existence is never leaked to other users.
    if (!profile || profile.userId !== authUserId) {
      throw new NotFoundException("Profile not found");
    }

    try {
      const updated = await this.profiles.update(profileId, input);
      if (!updated) {
        throw new NotFoundException("Profile not found");
      }
      return updated;
    } catch (error) {
      throw mapUniqueViolation(error, profile.type);
    }
  }
}

function mapUniqueViolation(error: unknown, profileType: string): Error {
  if (isUniqueViolation(error)) {
    const constraint = (error as { constraint?: string }).constraint;
    if (constraint === "profiles_username_unique") {
      return new ConflictException("Username is already taken");
    }
    return new ConflictException(`You already have a ${profileType} profile`);
  }
  return error instanceof Error ? error : new Error(String(error));
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}
