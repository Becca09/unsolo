import { Injectable } from "@nestjs/common";

export interface BankRef {
  bankName?: string;
  /** Provider-side bank code (e.g. Paystack `bank_code`), when known. */
  bankCode?: string;
}

export interface BankOption {
  name: string;
  code: string;
}

export interface ResolvedBankAccount {
  /** Account name as confirmed by the provider, if resolved. */
  accountName?: string;
  /** External provider reference (e.g. a transfer recipient id), if created. */
  providerAccountId?: string;
}

/**
 * PayoutProviderResolver — the seam where a real payout provider plugs in.
 *
 * A provider implementation (e.g. Paystack for Nigerian banks, Stripe
 * Connect for international) is responsible for resolving/verifying bank
 * details and, where supported, creating the external account reference
 * stored on `payout_accounts.provider_account_id`.
 *
 * `listBanks` is optional — a provider that cannot enumerate banks (the
 * manual fallback) simply omits it, and the payout directory endpoints
 * report the feature as unavailable.
 */
export interface PayoutProviderResolver {
  listBanks?(): Promise<BankOption[]>;
  resolveBankAccount(bank: BankRef, accountNumber: string): Promise<ResolvedBankAccount>;
}

export const PAYOUT_PROVIDER_RESOLVER = Symbol("PAYOUT_PROVIDER_RESOLVER");

/**
 * ManualPayoutProvider — the fallback when no live provider is configured
 * (no PAYSTACK_SECRET_KEY). It resolves nothing: the account name the user
 * entered is stored as-is and `provider_account_id` stays null.
 */
@Injectable()
export class ManualPayoutProvider implements PayoutProviderResolver {
  resolveBankAccount(): Promise<ResolvedBankAccount> {
    return Promise.resolve({});
  }
}
