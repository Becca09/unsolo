"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch, type VerificationDocument } from "@/lib/api";

const DOCUMENT_TYPES = [
  { value: "government_id", label: "Government-issued ID (NIN slip, passport, licence)" },
  { value: "cac_certificate", label: "CAC registration certificate" },
  { value: "other", label: "Other supporting document" },
] as const;

const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_BYTES = 5 * 1024 * 1024;

const STATUS_CHIP: Record<VerificationDocument["status"], { label: string; cls: string }> = {
  pending_upload: { label: "Uploading", cls: "bg-stone-100 text-stone-500" },
  uploaded: { label: "Uploaded", cls: "bg-unsolo-subtle text-unsolo-accent" },
  approved: { label: "Approved", cls: "bg-unsolo-subtle text-unsolo-accent" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

interface Props {
  profileId: string;
}

/**
 * Document upload panel for business verification. Flow per the storage
 * architecture: request a signed upload URL from the API → PUT the file
 * straight to private Supabase Storage → confirm to persist metadata.
 * File bytes never pass through the API; documents are only viewable via
 * short-lived signed URLs.
 */
export default function DocumentsPanel({ profileId }: Props) {
  const [items, setItems] = useState<VerificationDocument[]>([]);
  const [type, setType] = useState<VerificationDocument["type"]>("government_id");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const data = await apiFetch<VerificationDocument[]>(
      `/profiles/${profileId}/verification/documents`,
    );
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [profileId]);

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("File must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const grant = await apiFetch<{
        document: VerificationDocument;
        uploadUrl: string;
      }>(`/profiles/${profileId}/verification/documents`, {
        method: "POST",
        body: JSON.stringify({
          type,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      const put = await fetch(grant.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) {
        throw new Error("Upload failed — please try again.");
      }

      await apiFetch(`/profiles/${profileId}/verification/documents/${grant.document.id}/confirm`, {
        method: "POST",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed — please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    await apiFetch(`/profiles/${profileId}/verification/documents/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((d) => {
            const chip = STATUS_CHIP[d.status];
            return (
              <li
                key={d.id}
                className="bg-unsolo-light flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm"
              >
                <span className="text-unsolo-primary min-w-0 truncate">
                  {d.viewUrl ? (
                    <a
                      href={d.viewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {d.fileName}
                    </a>
                  ) : (
                    d.fileName
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${chip.cls}`}
                  >
                    {chip.label}
                  </span>
                  <button
                    onClick={() => remove(d.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as VerificationDocument["type"])}
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
        >
          {DOCUMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
          className="text-unsolo-muted file:bg-unsolo-primary file:text-unsolo-neutral w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold disabled:opacity-60"
        />
        <p className="text-unsolo-muted text-xs">
          JPG, PNG, WebP or PDF — max 5 MB. Documents are private and only visible to you and
          reviewers.
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
