import { ServiceUnavailableException } from "@nestjs/common";
import { PayoutDirectoryService } from "./payout-directory.service";
import { ManualPayoutProvider, type PayoutProviderResolver } from "./payout-provider";

describe("PayoutDirectoryService", () => {
  it("lists banks from the configured provider", async () => {
    const resolver: PayoutProviderResolver = {
      listBanks: jest.fn().mockResolvedValue([{ name: "GTBank", code: "058" }]),
      resolveBankAccount: jest.fn(),
    };
    const service = new PayoutDirectoryService(resolver);

    await expect(service.listBanks()).resolves.toEqual([{ name: "GTBank", code: "058" }]);
  });

  it("reports unavailable when the provider has no bank directory", async () => {
    const service = new PayoutDirectoryService(new ManualPayoutProvider());

    await expect(service.listBanks()).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(
      service.resolve({ bankCode: "058", accountNumber: "0123456789" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("resolves an account number to the verified account name", async () => {
    const resolver: PayoutProviderResolver = {
      listBanks: jest.fn(),
      resolveBankAccount: jest.fn().mockResolvedValue({ accountName: "ADAEZE LOVELACE" }),
    };
    const service = new PayoutDirectoryService(resolver);

    const result = await service.resolve({ bankCode: "058", accountNumber: "0123456789" });

    expect(resolver.resolveBankAccount).toHaveBeenCalledWith({ bankCode: "058" }, "0123456789");
    expect(result.accountName).toBe("ADAEZE LOVELACE");
  });

  it("reports unavailable when the provider cannot resolve the account", async () => {
    const resolver: PayoutProviderResolver = {
      listBanks: jest.fn(),
      resolveBankAccount: jest.fn().mockResolvedValue({}),
    };
    const service = new PayoutDirectoryService(resolver);

    await expect(
      service.resolve({ bankCode: "999", accountNumber: "0123456789" }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
