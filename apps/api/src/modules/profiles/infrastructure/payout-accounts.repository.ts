import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { payoutAccounts, type PayoutAccount, type PayoutProvider } from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

export interface CreatePayoutAccountRecord {
  profileId: string;
  provider: PayoutProvider;
  providerAccountId: string;
  displayLabel?: string;
}

export interface UpdatePayoutAccountRecord {
  providerAccountId?: string;
  displayLabel?: string;
}

/**
 * Persistence access for `payout_accounts`. No authorization logic lives
 * here — that belongs to the application layer.
 */
@Injectable()
export class PayoutAccountsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByProfileId(profileId: string): Promise<PayoutAccount[]> {
    return this.database.db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.profileId, profileId));
  }

  async findById(id: string): Promise<PayoutAccount | undefined> {
    const [row] = await this.database.db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.id, id))
      .limit(1);
    return row;
  }

  /**
   * Unique indexes enforce one account per provider per profile and one
   * profile per external account id; violations surface as Postgres 23505
   * errors for the service layer to map.
   */
  async create(data: CreatePayoutAccountRecord): Promise<PayoutAccount> {
    const [row] = await this.database.db
      .insert(payoutAccounts)
      .values({
        profileId: data.profileId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        displayLabel: data.displayLabel,
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create payout account");
    }
    return row;
  }

  async update(id: string, data: UpdatePayoutAccountRecord): Promise<PayoutAccount | undefined> {
    const [row] = await this.database.db
      .update(payoutAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(payoutAccounts.id, id))
      .returning();
    return row;
  }

  async delete(id: string, profileId: string): Promise<boolean> {
    const rows = await this.database.db
      .delete(payoutAccounts)
      .where(and(eq(payoutAccounts.id, id), eq(payoutAccounts.profileId, profileId)))
      .returning({ id: payoutAccounts.id });
    return rows.length > 0;
  }
}
