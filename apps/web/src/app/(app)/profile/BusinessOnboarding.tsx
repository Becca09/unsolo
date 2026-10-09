"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import DetailsStep from "./business/DetailsStep";
import PayoutStep from "./business/PayoutStep";
import ReviewStep, { type ReviewSection } from "./business/ReviewStep";
import SuccessStep from "./business/SuccessStep";
import VerificationStep from "./business/VerificationStep";
import {
  type BusinessDraft,
  type DetailErrors,
  emptyDraft,
  filledSocials,
  isAddressComplete,
} from "./business/types";

const FLOW_STEPS = [
  { key: "details", label: "Business details" },
  { key: "verification", label: "Verification" },
  { key: "payout", label: "Payout" },
  { key: "review", label: "Review" },
] as const;

type StepKey = (typeof FLOW_STEPS)[number]["key"];
type Step = StepKey | "success";

interface Props {
  onBack: () => void;
  onCreated: () => void;
}

/**
 * Business profile onboarding — a dedicated multi-step flow, deliberately
 * distinct from the traveller/planner/host wizard.
 *
 * Steps live under ./business/. Submission happens once, on "Complete
 * setup" in review, and persists in order: profile → business details →
 * verification submission → payout account, then best-effort extras
 * (categories, socials, address). Server failures route the user back to
 * the step that owns the bad data.
 */
export default function BusinessOnboarding({ onBack, onCreated }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [draft, setDraft] = useState<BusinessDraft>(emptyDraft);
  const [serverErrors, setServerErrors] = useState<DetailErrors>({});
  const [stepErrors, setStepErrors] = useState<Partial<Record<StepKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stepIndex = step === "success" ? -1 : FLOW_STEPS.findIndex((s) => s.key === step);

  function patchDraft(patch: Partial<BusinessDraft>) {
    setDraft((d) => ({ ...d, ...patch }));
  }

  function goBack() {
    const prev = FLOW_STEPS[stepIndex - 1];
    if (!prev) {
      onBack();
    } else {
      setStep(prev.key);
    }
  }

  async function create() {
    setLoading(true);
    setSubmitError(null);
    setStepErrors({});
    try {
      const body: Record<string, string> = {
        type: "business",
        username: draft.handle.trim().toLowerCase(),
        fullName: draft.businessName.trim(),
      };
      if (draft.description.trim()) body.bio = draft.description.trim();
      if (draft.logoUrl.trim()) body.avatarUrl = draft.logoUrl.trim();

      const profile = await apiFetch<{ id: string }>("/profiles", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Business details extension (tagline, phone) — only send if present.
      const businessBody: Record<string, string> = {};
      if (draft.tagline.trim()) businessBody.tagline = draft.tagline.trim();
      if (draft.phone.trim()) businessBody.phone = draft.phone.trim();
      if (Object.keys(businessBody).length > 0) {
        await apiFetch(`/profiles/${profile.id}/business`, {
          method: "PATCH",
          body: JSON.stringify(businessBody),
        });
      }

      // Verification submission — required by the flow.
      const v = draft.verification;
      try {
        await apiFetch(`/profiles/${profile.id}/verification`, {
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
      } catch (err) {
        setStepErrors({
          verification:
            err instanceof Error
              ? err.message
              : "Verification submission failed. Check the details.",
        });
        setStep("verification");
        return;
      }

      // Payout account — local bank details (bankCode from the directory
      // when a provider resolved it).
      const p = draft.payout;
      try {
        await apiFetch(`/profiles/${profile.id}/payout-accounts`, {
          method: "POST",
          body: JSON.stringify({
            provider: "local",
            bankName: p.bankName.trim(),
            ...(p.bankCode ? { bankCode: p.bankCode } : {}),
            accountNumber: p.accountNumber.trim(),
            accountName: p.accountName.trim(),
          }),
        });
      } catch (err) {
        setStepErrors({
          payout:
            err instanceof Error ? err.message : "Payout setup failed. Check the account details.",
        });
        setStep("payout");
        return;
      }

      // Sub-resources exist per-profile — attach what the user provided.
      // These are best-effort: the profile itself is already created.
      const extras: Promise<unknown>[] = [];
      for (const name of draft.categories) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/interests`, {
            method: "POST",
            body: JSON.stringify({ name }),
          }).catch(() => {}),
        );
      }
      for (const s of filledSocials(draft.socials)) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/socials`, {
            method: "POST",
            body: JSON.stringify({ platform: s.platform, handle: s.handle }),
          }).catch(() => {}),
        );
      }
      if (isAddressComplete(draft.address)) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/addresses`, {
            method: "POST",
            body: JSON.stringify({
              country: draft.address.country.trim(),
              state: draft.address.state.trim(),
              city: draft.address.city.trim(),
              street: draft.address.street.trim(),
            }),
          }).catch(() => {}),
        );
      }
      await Promise.all(extras);
      setCreatedProfileId(profile.id);
      setStep("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not create business profile. Please try again.";
      // A taken handle belongs to step 1 — send the user back to fix it.
      if (/username|taken/i.test(message)) {
        setServerErrors({ handle: "This handle is already taken. Try another one." });
        setStep("details");
      } else {
        setSubmitError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function finish() {
    onCreated();
    router.push("/dashboard");
  }

  return (
    <div className="card p-6 sm:p-10">
      {/* Progress indicator */}
      {step !== "success" && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                      i < stepIndex
                        ? "bg-unsolo-accent text-white"
                        : i === stepIndex
                          ? "border-unsolo-accent text-unsolo-accent border-2"
                          : "border-unsolo-border text-unsolo-muted border"
                    }`}
                  >
                    {i < stepIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className={`mt-1.5 hidden text-[11px] font-medium sm:block ${
                      i <= stepIndex ? "text-unsolo-primary" : "text-unsolo-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-0 h-px flex-1 sm:mb-5 ${
                      i < stepIndex ? "bg-unsolo-accent" : "bg-unsolo-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-unsolo-muted mt-3 text-xs font-medium sm:hidden">
            Step {stepIndex + 1} of {FLOW_STEPS.length} — {FLOW_STEPS[stepIndex]?.label}
          </p>
        </div>
      )}

      {step === "details" && (
        <DetailsStep
          draft={draft}
          onChange={patchDraft}
          serverErrors={serverErrors}
          onBack={onBack}
          onContinue={() => setStep("verification")}
        />
      )}

      {step === "verification" && (
        <VerificationStep
          draft={draft}
          onChange={patchDraft}
          serverError={stepErrors.verification}
          onBack={goBack}
          onContinue={() => setStep("payout")}
        />
      )}

      {step === "payout" && (
        <PayoutStep
          draft={draft}
          onChange={patchDraft}
          serverError={stepErrors.payout}
          onBack={goBack}
          onContinue={() => setStep("review")}
        />
      )}

      {step === "review" && (
        <ReviewStep
          draft={draft}
          error={submitError}
          loading={loading}
          onEdit={(section: ReviewSection) => setStep(section)}
          onBack={goBack}
          onComplete={create}
        />
      )}

      {step === "success" && createdProfileId && (
        <SuccessStep
          businessName={draft.businessName}
          profileId={createdProfileId}
          onDone={finish}
        />
      )}
    </div>
  );
}
