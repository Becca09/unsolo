import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { VerificationDocument } from "@unsolo/database";
import type { RequestDocumentUploadInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { BusinessVerificationsRepository } from "../infrastructure/business-verifications.repository";
import { VerificationDocumentsRepository } from "../infrastructure/verification-documents.repository";
import { StorageService } from "../../../infra/storage/storage.service";

/**
 * Public shape returned by the API. `storagePath` is deliberately excluded —
 * it is an opaque object key, not a URL. `viewUrl` is a short-lived signed
 * URL minted on read, only for uploaded documents.
 */
export interface PublicVerificationDocument {
  id: string;
  verificationId: string;
  type: VerificationDocument["type"];
  status: VerificationDocument["status"];
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  viewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentUploadGrant {
  document: PublicVerificationDocument;
  uploadUrl: string;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

async function toPublic(
  doc: VerificationDocument,
  storage: StorageService,
): Promise<PublicVerificationDocument> {
  const base: PublicVerificationDocument = {
    id: doc.id,
    verificationId: doc.verificationId,
    type: doc.type,
    status: doc.status,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  if (doc.status !== "pending_upload") {
    base.viewUrl = await storage.createSignedViewUrl(doc.storagePath);
  }
  return base;
}

/**
 * VerificationDocumentsService — owner-scoped document upload flow:
 *
 *   requestUpload → row (pending_upload) + signed upload URL
 *   client PUTs file directly to Supabase Storage
 *   confirmUpload → verifies the object exists, marks row `uploaded`
 *
 * Documents can only be added while the parent verification is not yet
 * `verified`. The parent verification must exist first (submit verification
 * before attaching documents).
 */
@Injectable()
export class VerificationDocumentsService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly verifications: BusinessVerificationsRepository,
    private readonly documents: VerificationDocumentsRepository,
    private readonly storage: StorageService,
  ) {}

  async requestUpload(
    authUserId: string,
    profileId: string,
    input: RequestDocumentUploadInput,
  ): Promise<DocumentUploadGrant> {
    const verification = await this.requireOwnedPendingVerification(authUserId, profileId);

    const id = randomUUID();
    const storagePath = `${verification.id}/${id}/${sanitizeFileName(input.fileName)}`;
    const doc = await this.documents.create({
      id,
      verificationId: verification.id,
      type: input.type,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      storagePath,
    });

    const grant = await this.storage.createSignedUploadUrl(storagePath);
    return {
      document: { ...(await toPublic(doc, this.storage)), viewUrl: undefined },
      uploadUrl: grant.uploadUrl,
    };
  }

  async confirmUpload(
    authUserId: string,
    profileId: string,
    documentId: string,
  ): Promise<PublicVerificationDocument> {
    const verification = await this.requireOwnedVerification(authUserId, profileId);
    const doc = await this.requireDocument(verification.id, documentId);

    const received = await this.storage.exists(doc.storagePath);
    if (!received) {
      throw new BadRequestException("Document file was not uploaded");
    }

    const uploaded = await this.documents.markUploaded(doc.id);
    if (!uploaded) {
      throw new BadRequestException("Document is not awaiting upload");
    }
    return toPublic(uploaded, this.storage);
  }

  async list(authUserId: string, profileId: string): Promise<PublicVerificationDocument[]> {
    const verification = await this.requireOwnedVerification(authUserId, profileId);
    const docs = await this.documents.findByVerificationId(verification.id);
    return Promise.all(
      docs.filter((d) => d.status !== "pending_upload").map((d) => toPublic(d, this.storage)),
    );
  }

  async remove(authUserId: string, profileId: string, documentId: string): Promise<void> {
    const verification = await this.requireOwnedPendingVerification(authUserId, profileId);
    const doc = await this.requireDocument(verification.id, documentId);

    const deleted = await this.documents.delete(doc.id);
    if (!deleted) {
      throw new NotFoundException("Document not found");
    }
    await this.storage.remove(doc.storagePath);
  }

  private async requireOwnedVerification(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId || profile.type !== "business") {
      throw new NotFoundException("Profile not found");
    }
    const verification = await this.verifications.findByProfileId(profileId);
    if (!verification) {
      throw new NotFoundException("Submit business verification before adding documents");
    }
    return verification;
  }

  private async requireOwnedPendingVerification(authUserId: string, profileId: string) {
    const verification = await this.requireOwnedVerification(authUserId, profileId);
    if (verification.status === "verified") {
      throw new ForbiddenException("Documents cannot be changed after verification is approved");
    }
    return verification;
  }

  private async requireDocument(verificationId: string, documentId: string) {
    const doc = await this.documents.findById(documentId);
    if (!doc || doc.verificationId !== verificationId) {
      throw new NotFoundException("Document not found");
    }
    return doc;
  }
}
