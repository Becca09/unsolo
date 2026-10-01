import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { socialAccounts, type SocialAccount, type SocialPlatform } from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

export interface CreateSocialAccountRecord {
  profileId: string;
  platform: SocialPlatform;
  handle?: string;
  url?: string;
}

export interface UpdateSocialAccountRecord {
  handle?: string;
  url?: string;
}

/**
 * Persistence access for `social_accounts`. No authorization logic lives
 * here — that belongs to the application layer.
 */
@Injectable()
export class SocialAccountsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByProfileId(profileId: string): Promise<SocialAccount[]> {
    return this.database.db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.profileId, profileId));
  }

  async findById(id: string): Promise<SocialAccount | undefined> {
    const [row] = await this.database.db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, id))
      .limit(1);
    return row;
  }

  /**
   * The `social_accounts_profile_id_platform_unique` index enforces at most
   * one account per platform per profile; a duplicate insert surfaces as a
   * Postgres 23505 unique-violation error for the service layer to map.
   */
  async create(data: CreateSocialAccountRecord): Promise<SocialAccount> {
    const [row] = await this.database.db
      .insert(socialAccounts)
      .values({
        profileId: data.profileId,
        platform: data.platform,
        handle: data.handle,
        url: data.url,
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create social account");
    }
    return row;
  }

  async update(id: string, data: UpdateSocialAccountRecord): Promise<SocialAccount | undefined> {
    const [row] = await this.database.db
      .update(socialAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(socialAccounts.id, id))
      .returning();
    return row;
  }

  async delete(id: string, profileId: string): Promise<boolean> {
    const rows = await this.database.db
      .delete(socialAccounts)
      .where(and(eq(socialAccounts.id, id), eq(socialAccounts.profileId, profileId)))
      .returning({ id: socialAccounts.id });
    return rows.length > 0;
  }
}
