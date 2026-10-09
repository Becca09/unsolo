import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { BusinessVerification, BusinessVerificationStatus } from "@unsolo/database";
import type { SubmitBusinessVerificationInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { BusinessVerificationsRepository } from "../infrastructure/business-verifications.repository";

/**
 * Public shape returned by the API. `nin`/`bvn` are masked to their last
 * four digits — the raw values are never exposed after submission.
 */
export interface PublicBusinessVerification {
  id: string;
  profileId: string;
  legalName: string;
  ninMasked: string;
  bvnMasked: string | null;
  phone: string;
  country: string;
  state: string;
  city: string;
  lga: string;
  street: string;
  status: BusinessVerificationStatus;
  /** Present when rejected — tells the owner what to fix. */
  rejectionReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function maskLast4(value: string): string {
  return `••••${value.slice(-4)}`;
}

function toPublic(v: BusinessVerification): PublicBusinessVerification {
  return {
    id: v.id,
    profileId: v.profileId,
    legalName: v.legalName,
    ninMasked: maskLast4(v.nin),
    bvnMasked: v.bvn ? maskLast4(v.bvn) : null,
    phone: v.phone,
    country: v.country,
    state: v.state,
    city: v.city,
    lga: v.lga,
    street: v.street,
    status: v.status,
    rejectionReason: v.rejectionReason,
    submittedAt: v.submittedAt,
    reviewedAt: v.reviewedAt,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

/**
 * BusinessVerificationsService — application layer for business
 * verification submissions.
 *
 * Ownership rules mirror the other profile services: verification always
 * attaches to a `business` profile owned by the authenticated user, and a
 * foreign or non-business profile is indistinguishable from a missing one
 * (404). A `verified` submission is immutable; `pending`/`rejected`
 * submissions can be resubmitted with corrected data.
 */
@Injectable()
export class BusinessVerificationsService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly verifications: BusinessVerificationsRepository,
  ) {}

  async get(authUserId: string, profileId: string): Promise<PublicBusinessVerification> {
    await this.requireOwnedBusinessProfile(authUserId, profileId);
    const verification = await this.verifications.findByProfileId(profileId);
    if (!verification) {
      throw new NotFoundException("Verification not found");
    }
    return toPublic(verification);
  }

  async submit(
    authUserId: string,
    profileId: string,
    input: SubmitBusinessVerificationInput,
  ): Promise<PublicBusinessVerification> {
    await this.requireOwnedBusinessProfile(authUserId, profileId);

    const existing = await this.verifications.findByProfileId(profileId);
    if (existing?.status === "verified") {
      throw new ConflictException("This business is already verified");
    }

    if (existing) {
      const resubmitted = await this.verifications.resubmit(profileId, {
        profileId,
        ...input,
      });
      if (!resubmitted) {
        throw new NotFoundException("Verification not found");
      }
      return toPublic(resubmitted);
    }

    try {
      const created = await this.verifications.create({ profileId, ...input });
      return toPublic(created);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException("A verification submission already exists for this profile");
      }
      throw error;
    }
  }

  private async requireOwnedBusinessProfile(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId || profile.type !== "business") {
      throw new NotFoundException("Profile not found");
    }
    return profile;
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
