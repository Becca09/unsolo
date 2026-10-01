import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { PayoutAccount } from "@unsolo/database";
import type { CreatePayoutAccountInput, UpdatePayoutAccountInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { PayoutAccountsRepository } from "../infrastructure/payout-accounts.repository";

/**
 * Public shape returned by the API. `providerAccountId` is deliberately
 * excluded — it is an external reference needed only server-side, and the
 * spec requires sensitive values to not be returned unnecessarily.
 */
export interface PublicPayoutAccount {
  id: string;
  profileId: string;
  provider: PayoutAccount["provider"];
  displayLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function toPublic(account: PayoutAccount): PublicPayoutAccount {
  return {
    id: account.id,
    profileId: account.profileId,
    provider: account.provider,
    displayLabel: account.displayLabel,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/**
 * PayoutAccountsService — application layer for profile payout accounts.
 *
 * Ownership rules:
 *   - Payout accounts always attach to a profile owned by the authenticated
 *     user; ownership is resolved from the verified JWT, never from the
 *     request body.
 *   - A profile or payout account belonging to someone else is
 *     indistinguishable from a missing one (404), so existence is never
 *     leaked across users.
 */
@Injectable()
export class PayoutAccountsService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly payoutAccounts: PayoutAccountsRepository,
  ) {}

  async list(authUserId: string, profileId: string): Promise<PublicPayoutAccount[]> {
    await this.requireOwnedProfile(authUserId, profileId);
    const rows = await this.payoutAccounts.findByProfileId(profileId);
    return rows.map(toPublic);
  }

  async create(
    authUserId: string,
    profileId: string,
    input: CreatePayoutAccountInput,
  ): Promise<PublicPayoutAccount> {
    await this.requireOwnedProfile(authUserId, profileId);

    try {
      const account = await this.payoutAccounts.create({
        profileId,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        displayLabel: input.displayLabel,
      });
      return toPublic(account);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          "A payout account with this provider or account reference already exists",
        );
      }
      throw error;
    }
  }

  async update(
    authUserId: string,
    profileId: string,
    payoutAccountId: string,
    input: UpdatePayoutAccountInput,
  ): Promise<PublicPayoutAccount> {
    await this.requireOwnedProfile(authUserId, profileId);
    await this.requireOwnedPayoutAccount(profileId, payoutAccountId);

    try {
      const updated = await this.payoutAccounts.update(payoutAccountId, input);
      if (!updated) {
        throw new NotFoundException("Payout account not found");
      }
      return toPublic(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("A payout account with this account reference already exists");
      }
      throw error;
    }
  }

  async remove(authUserId: string, profileId: string, payoutAccountId: string): Promise<void> {
    await this.requireOwnedProfile(authUserId, profileId);

    const deleted = await this.payoutAccounts.delete(payoutAccountId, profileId);
    if (!deleted) {
      throw new NotFoundException("Payout account not found");
    }
  }

  private async requireOwnedProfile(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private async requireOwnedPayoutAccount(profileId: string, payoutAccountId: string) {
    const account = await this.payoutAccounts.findById(payoutAccountId);
    if (!account || account.profileId !== profileId) {
      throw new NotFoundException("Payout account not found");
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
