import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { SocialAccount } from "@unsolo/database";
import type { CreateSocialAccountInput, UpdateSocialAccountInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { SocialAccountsRepository } from "../infrastructure/social-accounts.repository";

/**
 * SocialAccountsService — application layer for profile social accounts.
 *
 * Ownership rules:
 *   - Social accounts always attach to a profile owned by the authenticated
 *     user; ownership is resolved from the verified JWT, never from the
 *     request body.
 *   - A profile or social account belonging to someone else is
 *     indistinguishable from a missing one (404), so existence is never
 *     leaked across users.
 */
@Injectable()
export class SocialAccountsService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly socialAccounts: SocialAccountsRepository,
  ) {}

  async list(authUserId: string, profileId: string): Promise<SocialAccount[]> {
    await this.requireOwnedProfile(authUserId, profileId);
    return this.socialAccounts.findByProfileId(profileId);
  }

  async create(
    authUserId: string,
    profileId: string,
    input: CreateSocialAccountInput,
  ): Promise<SocialAccount> {
    await this.requireOwnedProfile(authUserId, profileId);

    try {
      return await this.socialAccounts.create({
        profileId,
        platform: input.platform,
        handle: input.handle,
        url: input.url,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(`This profile already has a ${input.platform} account`);
      }
      throw error;
    }
  }

  async update(
    authUserId: string,
    profileId: string,
    socialAccountId: string,
    input: UpdateSocialAccountInput,
  ): Promise<SocialAccount> {
    await this.requireOwnedProfile(authUserId, profileId);
    await this.requireOwnedSocialAccount(profileId, socialAccountId);

    const updated = await this.socialAccounts.update(socialAccountId, input);
    if (!updated) {
      throw new NotFoundException("Social account not found");
    }
    return updated;
  }

  async remove(authUserId: string, profileId: string, socialAccountId: string): Promise<void> {
    await this.requireOwnedProfile(authUserId, profileId);

    const deleted = await this.socialAccounts.delete(socialAccountId, profileId);
    if (!deleted) {
      throw new NotFoundException("Social account not found");
    }
  }

  private async requireOwnedProfile(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private async requireOwnedSocialAccount(profileId: string, socialAccountId: string) {
    const account = await this.socialAccounts.findById(socialAccountId);
    if (!account || account.profileId !== profileId) {
      throw new NotFoundException("Social account not found");
    }
    return account;
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
