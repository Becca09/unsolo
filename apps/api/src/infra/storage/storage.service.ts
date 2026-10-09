import { Injectable, OnModuleInit, ServiceUnavailableException } from "@nestjs/common";
import { SupabaseService } from "../../modules/auth/infrastructure/supabase.service";

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-documents";

/** Signed URL lifetime — short-lived per the KYC access-control pattern. */
const SIGNED_URL_TTL_SECONDS = 60 * 10;

/**
 * StorageService — server-side access to Supabase Storage via the
 * service-role client.
 *
 * The `verification-documents` bucket is private: objects are only
 * reachable through short-lived signed URLs issued here, after the caller
 * has passed an ownership/admin check. File bytes never pass through the
 * API — clients PUT directly to the signed upload URL.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private bucketReady = false;

  constructor(private readonly supabase: SupabaseService) {}

  async onModuleInit() {
    await this.ensureBucket(VERIFICATION_DOCUMENTS_BUCKET);
  }

  /**
   * Creates the private bucket if it does not exist yet. Bucket creation is
   * idempotent-friendly: an "already exists" error is ignored. Kept lazy
   * rather than a startup failure so environments without storage
   * credentials still boot.
   */
  private async ensureBucket(bucket: string) {
    if (this.bucketReady) return;
    const storage = this.supabase.admin.storage;
    const { error } = await storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: "5MB",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      // Not fatal at boot — upload attempts will surface the real error.
      return;
    }
    this.bucketReady = true;
  }

  /**
   * Issues a signed upload URL for `path`. The client PUTs the file
   * directly to the returned URL; the API never receives the bytes.
   */
  async createSignedUploadUrl(
    path: string,
  ): Promise<{ uploadUrl: string; token: string; path: string }> {
    await this.ensureBucket(VERIFICATION_DOCUMENTS_BUCKET);
    const { data, error } = await this.supabase.admin.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      throw new ServiceUnavailableException("Could not prepare document upload");
    }
    return { uploadUrl: data.signedUrl, token: data.token, path: data.path };
  }

  /** Issues a short-lived signed download URL for a stored object. */
  async createSignedViewUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.admin.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    if (error || !data) {
      throw new ServiceUnavailableException("Could not create document access URL");
    }
    return data.signedUrl;
  }

  /** True when an object exists at `path` (used to confirm uploads). */
  async exists(path: string): Promise<boolean> {
    const dir = path.split("/").slice(0, -1).join("/");
    const name = path.split("/").pop() ?? "";
    const { data, error } = await this.supabase.admin.storage
      .from(VERIFICATION_DOCUMENTS_BUCKET)
      .list(dir, { search: name });
    if (error) return false;
    return (data ?? []).some((f) => f.name === name);
  }

  async remove(path: string): Promise<void> {
    await this.supabase.admin.storage.from(VERIFICATION_DOCUMENTS_BUCKET).remove([path]);
  }
}
