import type { ReactNode } from "react";

export const inputCls =
  "border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-1";

export const labelCls = "text-unsolo-primary block text-sm font-medium";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
}

export function StepHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h2 className="text-unsolo-primary text-2xl font-bold">{title}</h2>
      {children && <p className="text-unsolo-muted mt-2 max-w-lg text-sm">{children}</p>}
    </div>
  );
}

export function ComingSoonChip() {
  return (
    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
      Coming soon
    </span>
  );
}

interface StepNavProps {
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  loading?: boolean;
}

export function StepNav({
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  loading = false,
}: StepNavProps) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onContinue}
        disabled={continueDisabled || loading}
        className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Please wait..." : continueLabel}
      </button>
    </div>
  );
}
