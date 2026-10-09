import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { ResolvePayoutAccountInput } from "@unsolo/validation";
import {
  PAYOUT_PROVIDER_RESOLVER,
  type BankOption,
  type PayoutProviderResolver,
  type ResolvedBankAccount,
} from "./payout-provider";

/**
 * PayoutDirectoryService — bank directory and account resolution for the
 * configured payout provider.
 *
 * These are generic provider lookups (not tied to a specific profile), so
 * they live behind authentication only. When no live provider is
 * configured (manual fallback), both operations report unavailable and the
 * client falls back to manual entry.
 */
@Injectable()
export class PayoutDirectoryService {
  constructor(
    @Inject(PAYOUT_PROVIDER_RESOLVER)
    private readonly payoutProvider: PayoutProviderResolver,
  ) {}

  async listBanks(): Promise<BankOption[]> {
    if (!this.payoutProvider.listBanks) {
      throw new ServiceUnavailableException("Bank directory is not configured");
    }
    return this.payoutProvider.listBanks();
  }

  async resolve(input: ResolvePayoutAccountInput): Promise<ResolvedBankAccount> {
    if (!this.payoutProvider.listBanks) {
      throw new ServiceUnavailableException("Bank account resolution is not configured");
    }
    const resolved = await this.payoutProvider.resolveBankAccount(
      { bankCode: input.bankCode },
      input.accountNumber,
    );
    if (!resolved.accountName) {
      throw new ServiceUnavailableException("Could not resolve this account");
    }
    return resolved;
  }
}
