import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import {
  businessVerifications,
  type BusinessVerification,
  type BusinessVerificationStatus,
} from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

export interface SubmitVerificationRecord {
  profileId: string;
  legalName: string;
  nin: string;
  bvn?: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  lga: string;
  street: string;
}

/**
 * Persistence access for `business_verifications`. Sensitive columns (nin,
 * bvn) are never logged here and callers must never return them raw — the
 * service layer masks them. No authorization logic lives here — that
 * belongs to the application layer.
 */
@Injectable()
export class BusinessVerificationsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByProfileId(profileId: string): Promise<BusinessVerification | undefined> {
    const [row] = await this.database.db
      .select()
      .from(businessVerifications)
      .where(eq(businessVerifications.profileId, profileId))
      .limit(1);
    return row;
  }

  /**
   * Inserts a submission. The unique `profile_id` constraint enforces one
   * verification per profile; a duplicate insert surfaces as Postgres 23505
   * for the service layer to map.
   */
  async create(data: SubmitVerificationRecord): Promise<BusinessVerification> {
    const [row] = await this.database.db.insert(businessVerifications).values(data).returning();
    if (!row) {
      throw new Error("Failed to create business verification");
    }
    return row;
  }

  /**
   * Replaces a pending or rejected submission with fresh data and resets it
   * to pending review. Verified submissions are not mutable through this
   * path.
   */
  async resubmit(
    profileId: string,
    data: SubmitVerificationRecord,
  ): Promise<BusinessVerification | undefined> {
    const [row] = await this.database.db
      .update(businessVerifications)
      .set({ ...data, status: "pending", submittedAt: new Date(), updatedAt: new Date() })
      .where(eq(businessVerifications.profileId, profileId))
      .returning();
    return row;
  }

  async findById(id: string): Promise<BusinessVerification | undefined> {
    const [row] = await this.database.db
      .select()
      .from(businessVerifications)
      .where(eq(businessVerifications.id, id))
      .limit(1);
    return row;
  }

  /** Admin review queue — submissions filtered by status. */
  async listByStatus(status: BusinessVerificationStatus): Promise<BusinessVerification[]> {
    return this.database.db
      .select()
      .from(businessVerifications)
      .where(eq(businessVerifications.status, status));
  }

  /**
   * Records an admin decision: sets status, the review timestamp, the
   * reviewer id, and the rejection reason (cleared on approval).
   */
  async review(
    id: string,
    decision: {
      status: "verified" | "rejected";
      reviewedBy: string;
      rejectionReason?: string;
    },
  ): Promise<BusinessVerification | undefined> {
    const [row] = await this.database.db
      .update(businessVerifications)
      .set({
        status: decision.status,
        reviewedAt: new Date(),
        reviewedBy: decision.reviewedBy,
        rejectionReason: decision.status === "rejected" ? (decision.rejectionReason ?? null) : null,
        updatedAt: new Date(),
      })
      .where(eq(businessVerifications.id, id))
      .returning();
    return row;
  }
}
