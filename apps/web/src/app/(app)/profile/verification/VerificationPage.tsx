"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, type BusinessVerification, type Profile } from "@/lib/api";
import { emptyDraft, type BusinessDraft } from "../business/types";
import VerificationStep from "../business/VerificationStep";
import DocumentsPanel from "../business/DocumentsPanel";

const STATUS_CHIP: Record<BusinessVerification["status"], { label: string; cls: string }> = {
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-700" },
  verified: { label: "Verified", cls: "bg-unsolo-subtle text-unsolo-accent" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700" },
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2">
      <dt className="text-unsolo-muted w-28 shrink-0 text-xs font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-unsolo-primary min-w-0 break-words text-sm">{value}</dd>
    </div>
  );
}

/**
 * Business verification — dedicated page for the business profile's
 * verification lifecycle: submit, track status, manage supporting
 * documents, resubmit after rejection.
 *
 * Reuses the same VerificationStep form as onboarding and the same
 * DocumentsPanel (signed-URL uploads to private storage).
 */
export default function VerificationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verification, setVerification] = useState<BusinessVerification | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<BusinessDraft>(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoaded(false);
    try {
      const profiles = await apiFetch<Profile[]>("/profiles/me");
      const business = profiles.find((p) => p.type === "business") ?? null;
      setProfile(business);
      if (business) {
        const v = await apiFetch<BusinessVerification>(
          `/profiles/${business.id}/verification`,
        ).catch(() => null);
        setVerification(v);
      }
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load().catch(() => setLoaded(true));
  }, []);

  async function submit() {
    if (!profile) return;
    const v = draft.verification;
    setSubmitting(true);
    setError(null);
    try {
      const result = await apiFetch<BusinessVerification>(`/profiles/${profile.id}/verification`, {
        method: "POST",
        body: JSON.stringify({
          legalName: v.legalName.trim(),
          nin: v.nin.trim(),
          ...(v.bvn.trim() ? { bvn: v.bvn.trim() } : {}),
          phone: v.phone.trim(),
          country: v.country.trim(),
          state: v.state.trim(),
          city: v.city.trim(),
          lga: v.lga.trim(),
          street: v.street.trim(),
        }),
      });
      setVerification(result);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusChip = verification ? STATUS_CHIP[verification.status] : null;
  const showForm = !verification || editing;
  const canEdit = verification && verification.status !== "verified";

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">
            Business verification
          </h1>
          {statusChip && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusChip.cls}`}
            >
              {statusChip.label}
            </span>
          )}
        </div>
        <p className="text-unsolo-muted mt-2 max-w-lg text-sm">
          Verified businesses earn traveller trust and can be publicly listed on Unsolo.
        </p>

        {/* States */}
        {!loaded ? (
          <p className="text-unsolo-muted mt-10 text-sm">Loading...</p>
        ) : !profile ? (
          <div className="card mt-10 p-8 text-center">
            <p className="text-unsolo-muted text-sm">You don&apos;t have a business profile yet.</p>
            <Link
              href="/profile"
              className="bg-unsolo-accent mt-4 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create a business profile
            </Link>
          </div>
        ) : verification?.status === "verified" ? (
          <div className="card mt-10 p-8">
            <div className="flex items-center gap-3">
              <div className="bg-unsolo-subtle flex h-12 w-12 items-center justify-center rounded-full">
                <span className="text-unsolo-accent text-xl">✓</span>
              </div>
              <div>
                <h2 className="text-unsolo-primary text-lg font-semibold">
                  {profile.fullName} is verified
                </h2>
                <p className="text-unsolo-muted text-sm">
                  Your business passed verification and can be publicly listed.
                </p>
              </div>
            </div>
          </div>
        ) : showForm ? (
          <div className="card mt-8 p-6 sm:p-10">
            {verification && (
              <p className="text-unsolo-muted mb-6 text-sm">
                Update your details below and resubmit for review.
              </p>
            )}
            <VerificationStep
              compact={!!verification}
              draft={draft}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              serverError={error ?? undefined}
              continueLabel="Submit verification"
              submitting={submitting}
              onBack={() => (verification ? setEditing(false) : router.push("/profile"))}
              onContinue={submit}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {/* Submission summary */}
            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
                  Submitted details
                </h2>
                {canEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-unsolo-accent hover:text-unsolo-moss text-xs font-semibold"
                  >
                    Edit &amp; resubmit
                  </button>
                )}
              </div>
              <dl className="divide-unsolo-border mt-4 divide-y">
                <Row label="Legal name" value={verification.legalName} />
                <Row label="NIN" value={verification.ninMasked} />
                <Row label="BVN" value={verification.bvnMasked ?? "—"} />
                <Row label="Phone" value={verification.phone} />
                <Row
                  label="Address"
                  value={`${verification.street}, ${verification.city}, ${verification.lga} LGA, ${verification.state}, ${verification.country}`}
                />
              </dl>
            </section>

            {verification.status === "rejected" && verification.rejectionReason && (
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                  Rejection reason
                </p>
                <p className="mt-1 text-sm text-red-700">{verification.rejectionReason}</p>
              </div>
            )}

            {/* Documents */}
            <section className="card p-6">
              <h2 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
                Supporting documents
              </h2>
              <p className="text-unsolo-muted mt-1 text-xs">
                A government-issued ID and, where applicable, your CAC registration certificate help
                reviewers verify your business faster.
              </p>
              <div className="mt-4">
                <DocumentsPanel profileId={profile.id} />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
