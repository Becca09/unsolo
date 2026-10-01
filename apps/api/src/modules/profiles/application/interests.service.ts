import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Interest } from "@unsolo/database";
import type { AddInterestInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { InterestsRepository } from "../infrastructure/interests.repository";

/**
 * InterestsService — application layer for profile interests.
 *
 * Ownership rules:
 *   - Interests are added to and removed from a profile owned by the
 *     authenticated user; ownership is resolved from the verified JWT,
 *     never from the request body.
 *   - A profile belonging to someone else is indistinguishable from a
 *     missing one (404), so existence is never leaked across users.
 */
@Injectable()
export class InterestsService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly interests: InterestsRepository,
  ) {}

  async list(authUserId: string, profileId: string): Promise<Interest[]> {
    await this.requireOwnedProfile(authUserId, profileId);
    return this.interests.findByProfileId(profileId);
  }

  async add(authUserId: string, profileId: string, input: AddInterestInput): Promise<Interest> {
    await this.requireOwnedProfile(authUserId, profileId);

    // Find-or-create the canonical interest row (names are unique
    // case-insensitively), then link it to the profile.
    const name = input.name.trim();
    let interest = await this.interests.findInterestByName(name);
    if (!interest) {
      try {
        interest = await this.interests.createInterest(name);
      } catch (error) {
        // Concurrent insert of the same name — re-read the canonical row.
        if (!isUniqueViolation(error)) {
          throw error;
        }
        interest = await this.interests.findInterestByName(name);
        if (!interest) {
          throw error;
        }
      }
    }

    try {
      await this.interests.link(profileId, interest.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("This interest is already on the profile");
      }
      throw error;
    }

    return interest;
  }

  async remove(authUserId: string, profileId: string, interestId: string): Promise<void> {
    await this.requireOwnedProfile(authUserId, profileId);

    const removed = await this.interests.unlink(profileId, interestId);
    if (!removed) {
      throw new NotFoundException("Interest not found on this profile");
    }
  }

  private async requireOwnedProfile(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}
