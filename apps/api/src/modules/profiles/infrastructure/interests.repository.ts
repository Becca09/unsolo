import { Injectable } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { interests, profileInterests, type Interest } from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

/**
 * Persistence access for `interests` and `profile_interests`. No
 * authorization logic lives here — that belongs to the application layer.
 */
@Injectable()
export class InterestsRepository {
  constructor(private readonly database: DatabaseService) {}

  /** Interests linked to a profile, joined with the interest rows. */
  async findByProfileId(profileId: string): Promise<Interest[]> {
    const rows = await this.database.db
      .select({ interest: interests })
      .from(profileInterests)
      .innerJoin(interests, eq(profileInterests.interestId, interests.id))
      .where(eq(profileInterests.profileId, profileId));
    return rows.map((row) => row.interest);
  }

  /** Case-insensitive lookup so "Hiking" and "hiking" resolve to one row. */
  async findInterestByName(name: string): Promise<Interest | undefined> {
    const [row] = await this.database.db
      .select()
      .from(interests)
      .where(sql`lower(${interests.name}) = lower(${name})`)
      .limit(1);
    return row;
  }

  async createInterest(name: string): Promise<Interest> {
    const [row] = await this.database.db.insert(interests).values({ name }).returning();
    if (!row) {
      throw new Error("Failed to create interest");
    }
    return row;
  }

  /**
   * The composite primary key on `profile_interests` prevents duplicates; a
   * duplicate link surfaces as a Postgres 23505 error for the service layer.
   */
  async link(profileId: string, interestId: string): Promise<void> {
    await this.database.db.insert(profileInterests).values({ profileId, interestId });
  }

  async unlink(profileId: string, interestId: string): Promise<boolean> {
    const rows = await this.database.db
      .delete(profileInterests)
      .where(
        and(eq(profileInterests.profileId, profileId), eq(profileInterests.interestId, interestId)),
      )
      .returning({ profileId: profileInterests.profileId });
    return rows.length > 0;
  }
}
