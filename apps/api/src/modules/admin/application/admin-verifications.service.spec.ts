import { NotFoundException } from "@nestjs/common";
import type { BusinessVerification, Profile, VerificationDocument } from "@unsolo/database";
import { AdminVerificationsService } from "./admin-verifications.service";
import { BusinessVerificationsRepository } from "../../profiles/infrastructure/business-verifications.repository";
import { VerificationDocumentsRepository } from "../../profiles/infrastructure/verification-documents.repository";
import { ProfilesRepository } from "../../profiles/infrastructure/profiles.repository";
import { StorageService } from "../../../infra/storage/storage.service";

const ADMIN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const VERIFICATION_ID = "44444444-4444-4444-4444-444444444444";
const DOCUMENT_ID = "55555555-5555-5555-5555-555555555555";

function makeVerification(overrides: Partial<BusinessVerification> = {}): BusinessVerification {
  return {
    id: VERIFICATION_ID,
    profileId: PROFILE_ID,
    legalName: "Adaeze Lovelace",
    nin: "12345678901",
    bvn: "10987654321",
    phone: "+2348012345678",
    country: "Nigeria",
    state: "Lagos",
    city: "Lagos",
    lga: "Eti-Osa",
    street: "1 Marina Road",
    status: "pending",
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: PROFILE_ID,
    userId: "11111111-1111-1111-1111-111111111111",
    type: "business",
    username: "atmosphere_travels",
    fullName: "Atmosphere Travels",
    bio: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDocument(overrides: Partial<VerificationDocument> = {}): VerificationDocument {
  return {
    id: DOCUMENT_ID,
    verificationId: VERIFICATION_ID,
    type: "government_id",
    status: "uploaded",
    fileName: "nin-slip.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    storagePath: `${VERIFICATION_ID}/${DOCUMENT_ID}/nin-slip.pdf`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("AdminVerificationsService", () => {
  let service: AdminVerificationsService;
  let verifications: jest.Mocked<BusinessVerificationsRepository>;
  let documents: jest.Mocked<VerificationDocumentsRepository>;
  let profiles: jest.Mocked<ProfilesRepository>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    verifications = {
      listByStatus: jest.fn(),
      findById: jest.fn(),
      review: jest.fn(),
    } as unknown as jest.Mocked<BusinessVerificationsRepository>;
    documents = {
      findByVerificationId: jest.fn(),
    } as unknown as jest.Mocked<VerificationDocumentsRepository>;
    profiles = {
      findById: jest.fn(),
      setBusinessApproved: jest.fn(),
    } as unknown as jest.Mocked<ProfilesRepository>;
    storage = {
      createSignedViewUrl: jest.fn().mockResolvedValue("https://signed.example/doc"),
    } as unknown as jest.Mocked<StorageService>;

    service = new AdminVerificationsService(verifications, documents, profiles, storage);
  });

  describe("list", () => {
    it("returns pending submissions with business context", async () => {
      verifications.listByStatus.mockResolvedValue([makeVerification()]);
      profiles.findById.mockResolvedValue(makeProfile());

      const result = await service.list("pending");

      expect(verifications.listByStatus).toHaveBeenCalledWith("pending");
      expect(result[0]?.businessName).toBe("Atmosphere Travels");
      expect(result[0]?.username).toBe("atmosphere_travels");
      expect(result[0]).not.toHaveProperty("nin");
      expect(result[0]).not.toHaveProperty("bvn");
    });
  });

  describe("get", () => {
    it("returns masked detail with signed document URLs", async () => {
      verifications.findById.mockResolvedValue(makeVerification());
      profiles.findById.mockResolvedValue(makeProfile());
      documents.findByVerificationId.mockResolvedValue([makeDocument()]);

      const result = await service.get(VERIFICATION_ID);

      expect(result.ninMasked).toBe("••••8901");
      expect(result.bvnMasked).toBe("••••4321");
      expect(result).not.toHaveProperty("nin");
      expect(result).not.toHaveProperty("bvn");
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0]?.viewUrl).toBe("https://signed.example/doc");
      expect(result.documents[0]).not.toHaveProperty("storagePath");
    });

    it("omits documents still awaiting upload", async () => {
      verifications.findById.mockResolvedValue(makeVerification());
      profiles.findById.mockResolvedValue(makeProfile());
      documents.findByVerificationId.mockResolvedValue([
        makeDocument({ status: "pending_upload" }),
      ]);

      const result = await service.get(VERIFICATION_ID);

      expect(result.documents).toHaveLength(0);
    });

    it("404s on unknown verification", async () => {
      verifications.findById.mockResolvedValue(undefined);
      await expect(service.get(VERIFICATION_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("review", () => {
    it("approves: sets status, reviewer, timestamp and business approval", async () => {
      verifications.findById.mockResolvedValue(makeVerification());
      verifications.review.mockResolvedValue(makeVerification({ status: "verified" }));
      profiles.findById.mockResolvedValue(makeProfile());
      documents.findByVerificationId.mockResolvedValue([]);

      const result = await service.review(VERIFICATION_ID, ADMIN_ID, { status: "verified" });

      expect(verifications.review).toHaveBeenCalledWith(
        VERIFICATION_ID,
        expect.objectContaining({ status: "verified", reviewedBy: ADMIN_ID }),
      );
      expect(profiles.setBusinessApproved).toHaveBeenCalledWith(PROFILE_ID, true);
      expect(result).not.toHaveProperty("nin");
    });

    it("rejects: records the reason and clears business approval", async () => {
      verifications.findById.mockResolvedValue(makeVerification());
      verifications.review.mockResolvedValue(
        makeVerification({ status: "rejected", rejectionReason: "Blurry ID" }),
      );
      profiles.findById.mockResolvedValue(makeProfile());
      documents.findByVerificationId.mockResolvedValue([]);

      await service.review(VERIFICATION_ID, ADMIN_ID, {
        status: "rejected",
        rejectionReason: "Blurry ID",
      });

      expect(verifications.review).toHaveBeenCalledWith(
        VERIFICATION_ID,
        expect.objectContaining({
          status: "rejected",
          reviewedBy: ADMIN_ID,
          rejectionReason: "Blurry ID",
        }),
      );
      expect(profiles.setBusinessApproved).toHaveBeenCalledWith(PROFILE_ID, false);
    });

    it("404s on unknown verification", async () => {
      verifications.findById.mockResolvedValue(undefined);
      await expect(
        service.review(VERIFICATION_ID, ADMIN_ID, { status: "verified" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(verifications.review).not.toHaveBeenCalled();
    });
  });
});
