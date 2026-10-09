"use client";

import DocumentsPanel from "./DocumentsPanel";

interface Props {
  businessName: string;
  /** The created profile — enables the supporting-documents upload panel. */
  profileId: string;
  onDone: () => void;
}

/**
 * Step 5 — Success. The profile and submissions exist, but verification is
 * pending review — the copy deliberately never claims the business is
 * verified. Supporting documents can be uploaded here (or later from the
 * profile card).
 */
export default function SuccessStep({ businessName, profileId, onDone }: Props) {
  return (
    <div className="py-4 text-center">
      <div className="bg-unsolo-subtle mx-auto flex h-16 w-16 items-center justify-center rounded-full">
        <span className="text-unsolo-accent text-3xl">✓</span>
      </div>
      <h2 className="text-unsolo-primary mt-6 text-2xl font-bold">You&apos;re all set!</h2>
      <p className="text-unsolo-muted mx-auto mt-3 max-w-md text-sm leading-relaxed">
        {businessName.trim() || "Your business"} profile has been created successfully. We&apos;re
        reviewing your verification details and will let you know when your business is verified.
      </p>

      <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
        <div className="border-unsolo-border bg-unsolo-surface flex items-center justify-between rounded-xl border px-5 py-3.5">
          <span className="text-unsolo-primary text-sm font-medium">Verification status</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
            Pending
          </span>
        </div>
        <div className="border-unsolo-border bg-unsolo-surface flex items-center justify-between rounded-xl border px-5 py-3.5">
          <span className="text-unsolo-primary text-sm font-medium">Payout method</span>
          <span className="bg-unsolo-subtle text-unsolo-accent rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            Added
          </span>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-sm text-left">
        <h3 className="text-unsolo-primary text-sm font-semibold">
          Supporting documents <span className="text-unsolo-muted font-normal">(optional)</span>
        </h3>
        <p className="text-unsolo-muted mt-1 text-xs">
          Uploading an ID or CAC certificate can speed up the review.
        </p>
        <div className="border-unsolo-border bg-unsolo-surface mt-3 rounded-xl border p-4">
          <DocumentsPanel profileId={profileId} />
        </div>
      </div>

      <button
        onClick={onDone}
        className="bg-unsolo-accent mt-10 inline-flex rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Go to Business Dashboard
      </button>
    </div>
  );
}
