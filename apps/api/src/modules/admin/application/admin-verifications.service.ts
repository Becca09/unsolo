import { Injectable, NotFoundException } from "@nestjs/common";
import type { BusinessVerificationStatus } from "@unsolo/database";
import type { ReviewBusinessVerificationInput } from "@unsolo/validation";
import { BusinessVerificationsRepository } from "../../profiles/infrastructure/business-verifications.repository";
import { VerificationDocumentsRepository } from "../../profiles/infrastructure/verification-documents.repository";
import { ProfilesRepository } from "../../profiles/infrastructure/profiles.repository";
import { StorageService } from "../../../infra/storage/storage.service";
import type { PublicBusinessVerification } from "../../profiles/application/business-verifications.service";
import type { PublicVerificationDocument } from "../../profiles/application/verification-documents.service";

function maskLast4(value: string): string {
  return `••••${value.slice(-4)}`;
}

export interface AdminVerificationSummary {
  id: string;
  profileId: string;
  businessName: string;
  username: string;
  legalName: string;
  status: BusinessVerificationStatus;
  submittedAt: Date;
}

export interface AdminVerificationDetail extends PublicBusinessVerification {
  rejectionReason: string | null;
  businessName: string;
  username: string;
  documents: PublicVerificationDocument[];
}

/**
 * AdminVerificationsService — the review queue for business verification
 * submissions.
 *
 * Reached only behind AuthGuard + AdminGuard. NIN/BVN stay masked even for
 * reviewers (last-4 is enough to cross-check an ID document; the raw values
 * never leave the API). Documents are returned with short-lived signed
 * view URLs minted per read.
 */
@Injectable()
export class AdminVerificationsService {
  constructor(
    private readonly verifications: BusinessVerificationsRepository,
    private readonly documents: VerificationDocumentsRepository,
    private readonly profiles: ProfilesRepository,
    private readonly storage: StorageService,
  ) {}

  async list(status: BusinessVerificationStatus): Promise<AdminVerificationSummary[]> {
    const rows = await this.verifications.listByStatus(status);
    return Promise.all(
      rows.map(async (v) => {
        const profile = await this.profiles.findById(v.profileId);
        return {
          id: v.id,
          profileId: v.profileId,
          businessName: profile?.fullName ?? "Unknown business",
          username: profile?.username ?? "",
          legalName: v.legalName,
          status: v.status,
          submittedAt: v.submittedAt,
        };
      }),
    );
  }

  async get(id: string): Promise<AdminVerificationDetail> {
    const v = await this.verifications.findById(id);
    if (!v) {
      throw new NotFoundException("Verification not found");
    }
    const profile = await this.profiles.findById(v.profileId);
    const docs = await this.documents.findByVerificationId(v.id);
    const documents = await Promise.all(
      docs
        .filter((d) => d.status !== "pending_upload")
        .map(async (d) => ({
          id: d.id,
          verificationId: d.verificationId,
          type: d.type,
          status: d.status,
          fileName: d.fileName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          viewUrl: await this.storage.createSignedViewUrl(d.storagePath),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
        })),
    );

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
      businessName: profile?.fullName ?? "Unknown business",
      username: profile?.username ?? "",
      documents,
    };
  }

  /**
   * Records the admin decision. Approving also flips
   * `business_profiles.approved_at`, which gates public listing.
   */
  async review(
    id: string,
    adminUserId: string,
    input: ReviewBusinessVerificationInput,
  ): Promise<AdminVerificationDetail> {
    const existing = await this.verifications.findById(id);
    if (!existing) {
      throw new NotFoundException("Verification not found");
    }

    await this.verifications.review(id, {
      status: input.status,
      reviewedBy: adminUserId,
      rejectionReason: input.rejectionReason,
    });
    await this.profiles.setBusinessApproved(existing.profileId, input.status === "verified");

    return this.get(id);
  }
}
