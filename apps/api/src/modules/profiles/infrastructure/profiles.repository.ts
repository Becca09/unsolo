import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  businessProfiles,
  hostProfiles,
  plannerProfiles,
  profiles,
  travellerProfiles,
  type BusinessProfile,
  type Profile,
  type ProfileType,
} from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

const TYPE_TABLES = {
  traveller: travellerProfiles,
  planner: plannerProfiles,
  business: businessProfiles,
  host: hostProfiles,
} as const;

export interface CreateProfileRecord {
  userId: string;
  type: ProfileType;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateProfileRecord {
  username?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Persistence access for `profiles` and the per-type extension tables.
 * No authorization logic lives here — that belongs to the application layer.
 */
@Injectable()
export class ProfilesRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByUserId(userId: string): Promise<Profile[]> {
    return this.database.db.select().from(profiles).where(eq(profiles.userId, userId));
  }

  async findById(id: string): Promise<Profile | undefined> {
    const [row] = await this.database.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    return row;
  }

  /**
   * Inserts the base profile and its type-specific extension row in one
   * transaction. The `profiles_user_id_type_unique` index enforces at most
   * one profile of each type per user; a duplicate insert surfaces as a
   * Postgres 23505 unique-violation error for the service layer to map.
   */
  async createWithType(data: CreateProfileRecord): Promise<Profile> {
    return this.database.db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({
          userId: data.userId,
          type: data.type,
          username: data.username,
          fullName: data.fullName,
          bio: data.bio,
          avatarUrl: data.avatarUrl,
        })
        .returning();

      if (!profile) {
        throw new Error("Failed to create profile");
      }

      await tx.insert(TYPE_TABLES[data.type]).values({ profileId: profile.id });

      return profile;
    });
  }

  async update(id: string, data: UpdateProfileRecord): Promise<Profile | undefined> {
    const [row] = await this.database.db
      .update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();
    return row;
  }

  async findBusinessProfile(profileId: string): Promise<BusinessProfile | undefined> {
    const [row] = await this.database.db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.profileId, profileId))
      .limit(1);
    return row;
  }

  async updateBusinessProfile(
    profileId: string,
    data: { tagline?: string; phone?: string },
  ): Promise<BusinessProfile | undefined> {
    const [row] = await this.database.db
      .update(businessProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(businessProfiles.profileId, profileId))
      .returning();
    return row;
  }

  /** Sets or clears the admin approval flag on a business profile. */
  async setBusinessApproved(profileId: string, approved: boolean): Promise<void> {
    await this.database.db
      .update(businessProfiles)
      .set({ approvedAt: approved ? new Date() : null, updatedAt: new Date() })
      .where(eq(businessProfiles.profileId, profileId));
  }
}
