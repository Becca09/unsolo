import { Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  BankOption,
  BankRef,
  PayoutProviderResolver,
  ResolvedBankAccount,
} from "../application/payout-provider";

const PAYSTACK_API = "https://api.paystack.co";

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * PaystackPayoutProvider — Nigerian bank account resolution via the
 * Paystack API (`/bank` list + `/bank/resolve`). Bound as the
 * PAYOUT_PROVIDER_RESOLVER only when `PAYSTACK_SECRET_KEY` is configured.
 *
 * SECURITY: the secret key is server-only (Authorization header). Account
 * numbers are sent to Paystack for resolution but are never logged.
 */
@Injectable()
export class PaystackPayoutProvider implements PayoutProviderResolver {
  private readonly baseUrl: string;
  private readonly secretKey: string;

  constructor(config: ConfigService) {
    this.secretKey = config.get<string>("PAYSTACK_SECRET_KEY") ?? "";
    this.baseUrl = config.get<string>("PAYSTACK_BASE_URL") ?? PAYSTACK_API;
    if (!this.secretKey) {
      throw new ServiceUnavailableException("Paystack is not configured");
    }
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (res.status === 401 || res.status === 403) {
      throw new UnauthorizedException("Payout provider credentials are invalid");
    }
    const body = (await res.json().catch(() => null)) as PaystackResponse<T> | null;
    if (!res.ok || !body?.status) {
      throw new ServiceUnavailableException(
        body?.message || "Bank account resolution is temporarily unavailable",
      );
    }
    return body.data;
  }

  async listBanks(): Promise<BankOption[]> {
    const banks = await this.request<{ name: string; code: string }[]>(
      "/bank?country=nigeria&perPage=100",
    );
    return banks.map((b) => ({ name: b.name, code: b.code }));
  }

  /**
   * Resolves an account number to the verified account name. When only a
   * bank name is supplied, the matching Paystack bank code is looked up
   * from the bank directory first.
   */
  async resolveBankAccount(bank: BankRef, accountNumber: string): Promise<ResolvedBankAccount> {
    let bankCode = bank.bankCode;
    if (!bankCode && bank.bankName) {
      const banks = await this.listBanks();
      const wanted = bank.bankName.trim().toLowerCase();
      const match = banks.find(
        (b) => b.name.toLowerCase() === wanted || b.name.toLowerCase().includes(wanted),
      );
      bankCode = match?.code;
    }
    if (!bankCode) {
      return {};
    }

    const data = await this.request<{ account_name: string }>(
      `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    );
    return { accountName: data.account_name };
  }
}
