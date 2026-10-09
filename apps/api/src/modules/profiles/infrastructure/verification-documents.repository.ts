import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import {
  verificationDocuments,
  type VerificationDocument,
  type VerificationDocumentType,
} from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

export interface CreateDocumentRecord {
  /** Pre-generated so the storage path can embed the document id. */
  id: string;
  verificationId: string;
  type: VerificationDocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

/**
 * Persistence access for `verification_documents`. No authorization logic
 * here — ownership/admin checks belong to the application layer.
 */
@Injectable()
export class VerificationDocumentsRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByVerificationId(verificationId: string): Promise<VerificationDocument[]> {
    return this.database.db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.verificationId, verificationId));
  }

  async findById(id: string): Promise<VerificationDocument | undefined> {
    const [row] = await this.database.db
      .select()
      .from(verificationDocuments)
      .where(eq(verificationDocuments.id, id))
      .limit(1);
    return row;
  }

  async create(data: CreateDocumentRecord): Promise<VerificationDocument> {
    const [row] = await this.database.db.insert(verificationDocuments).values(data).returning();
    if (!row) {
      throw new Error("Failed to create verification document");
    }
    return row;
  }

  async markUploaded(id: string): Promise<VerificationDocument | undefined> {
    const [row] = await this.database.db
      .update(verificationDocuments)
      .set({ status: "uploaded", updatedAt: new Date() })
      .where(
        and(eq(verificationDocuments.id, id), eq(verificationDocuments.status, "pending_upload")),
      )
      .returning();
    return row;
  }

  async setStatus(
    id: string,
    status: "approved" | "rejected",
  ): Promise<VerificationDocument | undefined> {
    const [row] = await this.database.db
      .update(verificationDocuments)
      .set({ status, updatedAt: new Date() })
      .where(eq(verificationDocuments.id, id))
      .returning();
    return row;
  }

  async delete(id: string): Promise<VerificationDocument | undefined> {
    const [row] = await this.database.db
      .delete(verificationDocuments)
      .where(eq(verificationDocuments.id, id))
      .returning();
    return row;
  }
}
