import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { BusinessVerification, Profile, VerificationDocument } from "@unsolo/database";
import { VerificationDocumentsService } from "./verification-documents.service";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { BusinessVerificationsRepository } from "../infrastructure/business-verifications.repository";
import { VerificationDocumentsRepository } from "../infrastructure/verification-documents.repository";
import { StorageService } from "../../../infra/storage/storage.service";

const AUTH_USER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_USER_ID = "22222222-2222-2222-2222-222222222222";
const PROFILE_ID = "33333333-3333-3333-3333-333333333333";
const VERIFICATION_ID = "44444444-4444-4444-4444-444444444444";
const DOCUMENT_ID = "55555555-5555-5555-5555-555555555555";

const UPLOAD_REQUEST = {
  type: "government_id" as const,
  fileName: "nin slip.pdf",
  mimeType: "application/pdf" as const,
  sizeBytes: 1024,
};

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: PROFILE_ID,
    userId: AUTH_USER_ID,
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

function makeVerification(overrides: Partial<BusinessVerification> = {}): BusinessVerification {
  return {
    id: VERIFICATION_ID,
    profileId: PROFILE_ID,
    legalName: "Adaeze Lovelace",
    nin: "12345678901",
    bvn: null,
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

function makeDocument(overrides: Partial<VerificationDocument> = {}): VerificationDocument {
  return {
    id: DOCUMENT_ID,
    verificationId: VERIFICATION_ID,
    type: "government_id",
    status: "pending_upload",
    fileName: "nin slip.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    storagePath: `${VERIFICATION_ID}/${DOCUMENT_ID}/nin_slip.pdf`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("VerificationDocumentsService", () => {
  let service: VerificationDocumentsService;
  let profiles: jest.Mocked<ProfilesRepository>;
  let verifications: jest.Mocked<BusinessVerificationsRepository>;
  let documents: jest.Mocked<VerificationDocumentsRepository>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    profiles = { findById: jest.fn() } as unknown as jest.Mocked<ProfilesRepository>;
    verifications = {
      findByProfileId: jest.fn(),
    } as unknown as jest.Mocked<BusinessVerificationsRepository>;
    documents = {
      findByVerificationId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      markUploaded: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<VerificationDocumentsRepository>;
    storage = {
      createSignedUploadUrl: jest
        .fn()
        .mockResolvedValue({ uploadUrl: "https://signed.example/upload", token: "t", path: "p" }),
      createSignedViewUrl: jest.fn().mockResolvedValue("https://signed.example/view"),
      exists: jest.fn().mockResolvedValue(true),
      remove: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<StorageService>;

    service = new VerificationDocumentsService(profiles, verifications, documents, storage);
  });

  describe("requestUpload", () => {
    it("creates a pending_upload row and returns a signed upload grant", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.create.mockImplementation(async (d) => makeDocument({ id: d.id }));

      const result = await service.requestUpload(AUTH_USER_ID, PROFILE_ID, UPLOAD_REQUEST);

      expect(documents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationId: VERIFICATION_ID,
          type: "government_id",
          sizeBytes: 1024,
        }),
      );
      const createdPath = documents.create.mock.calls[0]?.[0]?.storagePath;
      expect(createdPath).toMatch(new RegExp(`^${VERIFICATION_ID}/`));
      expect(createdPath).toContain("nin_slip.pdf"); // sanitised file name
      expect(result.uploadUrl).toBe("https://signed.example/upload");
      expect(result.document).not.toHaveProperty("storagePath");
    });

    it("rejects when no verification submission exists", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(undefined);

      await expect(
        service.requestUpload(AUTH_USER_ID, PROFILE_ID, UPLOAD_REQUEST),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(documents.create).not.toHaveBeenCalled();
    });

    it("rejects on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(
        service.requestUpload(AUTH_USER_ID, PROFILE_ID, UPLOAD_REQUEST),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(documents.create).not.toHaveBeenCalled();
    });

    it("blocks uploads once verification is approved", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification({ status: "verified" }));

      await expect(
        service.requestUpload(AUTH_USER_ID, PROFILE_ID, UPLOAD_REQUEST),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("confirmUpload", () => {
    it("marks the document uploaded once the object exists", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.findById.mockResolvedValue(makeDocument());
      documents.markUploaded.mockResolvedValue(makeDocument({ status: "uploaded" }));

      const result = await service.confirmUpload(AUTH_USER_ID, PROFILE_ID, DOCUMENT_ID);

      expect(result.status).toBe("uploaded");
      expect(result.viewUrl).toBe("https://signed.example/view");
    });

    it("fails when the file never reached storage", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.findById.mockResolvedValue(makeDocument());
      storage.exists.mockResolvedValue(false);

      await expect(
        service.confirmUpload(AUTH_USER_ID, PROFILE_ID, DOCUMENT_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(documents.markUploaded).not.toHaveBeenCalled();
    });

    it("rejects a document belonging to a different verification", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.findById.mockResolvedValue(
        makeDocument({ verificationId: "99999999-9999-9999-9999-999999999999" }),
      );

      await expect(
        service.confirmUpload(AUTH_USER_ID, PROFILE_ID, DOCUMENT_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("list", () => {
    it("returns confirmed documents with signed view URLs, no storage paths", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.findByVerificationId.mockResolvedValue([
        makeDocument({ status: "uploaded" }),
        makeDocument({ id: "66666666-6666-6666-6666-666666666666", status: "pending_upload" }),
      ]);

      const result = await service.list(AUTH_USER_ID, PROFILE_ID);

      expect(result).toHaveLength(1);
      expect(result[0]?.viewUrl).toBe("https://signed.example/view");
      expect(result[0]).not.toHaveProperty("storagePath");
    });
  });

  describe("remove", () => {
    it("deletes the row and the storage object", async () => {
      profiles.findById.mockResolvedValue(makeProfile());
      verifications.findByProfileId.mockResolvedValue(makeVerification());
      documents.findById.mockResolvedValue(makeDocument({ status: "uploaded" }));
      documents.delete.mockResolvedValue(makeDocument({ status: "uploaded" }));

      await service.remove(AUTH_USER_ID, PROFILE_ID, DOCUMENT_ID);

      expect(storage.remove).toHaveBeenCalledWith(`${VERIFICATION_ID}/${DOCUMENT_ID}/nin_slip.pdf`);
    });

    it("rejects deletion on another user's profile", async () => {
      profiles.findById.mockResolvedValue(makeProfile({ userId: OTHER_USER_ID }));

      await expect(service.remove(AUTH_USER_ID, PROFILE_ID, DOCUMENT_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(documents.delete).not.toHaveBeenCalled();
    });
  });
});
