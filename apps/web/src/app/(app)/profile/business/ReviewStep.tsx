"use client";

import type { BusinessDraft } from "./types";
import { filledSocials, isAddressComplete } from "./types";
import { StepHeading, StepNav } from "./ui";

export type ReviewSection = "details" | "verification" | "payout";

interface Props {
  draft: BusinessDraft;
  error?: string | null;
  loading: boolean;
  onEdit: (section: ReviewSection) => void;
  onBack: () => void;
  onComplete: () => void;
}

function maskLast4(value: string): string {
  return `••••${value.trim().slice(-4)}`;
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">{title}</h3>
      <button
        type="button"
        onClick={onEdit}
        className="text-unsolo-accent hover:text-unsolo-moss text-xs font-semibold"
      >
        Edit
      </button>
    </div>
  );
}

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

function PendingChip({ label = "Pending" }: { label?: string }) {
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
      {label}
    </span>
  );
}

/**
 * Step 4 — Review. Groups everything the flow collected into editable
 * sections. Sensitive values (NIN, BVN, account number) are shown masked —
 * matching what the API returns after submission.
 */
export default function ReviewStep({ draft, error, loading, onEdit, onBack, onComplete }: Props) {
  const socials = filledSocials(draft.socials);
  const v = draft.verification;
  const p = draft.payout;
  const socialLabel = { instagram: "Instagram", x: "X", tiktok: "TikTok" } as const;

  return (
    <div>
      <StepHeading title="Review your business profile">
        Check everything looks right before creating your business profile.
      </StepHeading>

      <div className="mt-8 space-y-4">
        <section className="border-unsolo-border bg-unsolo-surface rounded-2xl border p-6">
          <SectionHeader title="Business information" onEdit={() => onEdit("details")} />
          <dl className="divide-unsolo-border mt-4 divide-y">
            <Row label="Name" value={draft.businessName.trim()} />
            <Row label="Handle" value={`@${draft.handle.trim().toLowerCase()}`} />
            <Row label="Tagline" value={draft.tagline.trim() || "—"} />
            <Row label="Description" value={draft.description.trim() || "—"} />
            <Row label="Logo" value={draft.logoUrl.trim() || "—"} />
            <Row label="Phone" value={draft.phone.trim() || "—"} />
            <Row
              label="Categories"
              value={draft.categories.length > 0 ? draft.categories.join(", ") : "—"}
            />
            <Row
              label="Socials"
              value={
                socials.length > 0
                  ? socials.map((s) => `${socialLabel[s.platform]}: ${s.handle}`).join(", ")
                  : "—"
              }
            />
            <Row
              label="Location"
              value={
                isAddressComplete(draft.address)
                  ? `${draft.address.street}, ${draft.address.city}, ${draft.address.state}, ${draft.address.country}`
                  : "—"
              }
            />
          </dl>
        </section>

        <section className="border-unsolo-border bg-unsolo-surface rounded-2xl border p-6">
          <SectionHeader title="Verification" onEdit={() => onEdit("verification")} />
          <div className="mt-4">
            <PendingChip label="Will be submitted for review" />
          </div>
          <dl className="divide-unsolo-border mt-4 divide-y">
            <Row label="Legal name" value={v.legalName.trim()} />
            <Row label="NIN" value={maskLast4(v.nin)} />
            <Row label="BVN" value={v.bvn.trim() ? maskLast4(v.bvn) : "—"} />
            <Row label="Phone" value={v.phone.trim()} />
            <Row
              label="Address"
              value={`${v.street}, ${v.city}, ${v.lga} LGA, ${v.state}, ${v.country}`}
            />
          </dl>
        </section>

        <section className="border-unsolo-border bg-unsolo-surface rounded-2xl border p-6">
          <SectionHeader title="Payout" onEdit={() => onEdit("payout")} />
          <dl className="divide-unsolo-border mt-4 divide-y">
            <Row label="Bank" value={p.bankName.trim()} />
            <Row label="Account" value={maskLast4(p.accountNumber)} />
            <Row label="Name" value={p.accountName.trim()} />
          </dl>
        </section>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <StepNav
        onBack={onBack}
        onContinue={onComplete}
        continueLabel="Complete setup"
        loading={loading}
      />
    </div>
  );
}
