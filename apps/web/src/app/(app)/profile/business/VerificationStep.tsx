"use client";

import { useState } from "react";
import type { BusinessDraft, VerificationErrors, VerificationField } from "./types";
import { validateVerification } from "./types";
import { FieldError, inputCls, labelCls, StepHeading, StepNav } from "./ui";

interface Props {
  draft: BusinessDraft;
  onChange: (patch: Partial<BusinessDraft>) => void;
  /** Server-side rejection surfaced when a resubmission fails. */
  serverError?: string;
  /** Compact mode drops the heading — used inline on the profile card. */
  compact?: boolean;
  continueLabel?: string;
  submitting?: boolean;
  onBack: () => void;
  onContinue: () => void;
}

const ADDRESS_FIELDS: { key: VerificationField; label: string }[] = [
  { key: "country", label: "Country" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "lga", label: "LGA" },
  { key: "street", label: "Street address" },
];

/**
 * Step 2 — Business verification. Collects the identity and address data
 * persisted to `business_verifications` (NIN/BVN are masked to last-4 on
 * every read path and never returned raw). The document section is a
 * deliberate placeholder so document upload slots into this step later
 * without reshaping the form.
 */
export default function VerificationStep({
  draft,
  onChange,
  serverError,
  compact = false,
  continueLabel,
  submitting = false,
  onBack,
  onContinue,
}: Props) {
  const [errors, setErrors] = useState<VerificationErrors>({});
  const v = draft.verification;

  function setField(field: VerificationField, value: string) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    onChange({ verification: { ...v, [field]: value } });
  }

  function continueStep() {
    const next = validateVerification(draft);
    setErrors(next);
    if (Object.keys(next).length === 0) onContinue();
  }

  return (
    <div>
      {!compact && (
        <StepHeading title="Let's verify your business">
          We verify your business and identity to keep Unsolo safe and compliant.
        </StepHeading>
      )}

      <div className={`${compact ? "mt-4" : "mt-8"} space-y-8`}>
        {/* Identity information */}
        <section>
          <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
            Identity information
          </h3>
          <div className="mt-4 space-y-5">
            <div>
              <label htmlFor="ver-legal-name" className={labelCls}>
                Legal / full name
              </label>
              <input
                id="ver-legal-name"
                value={v.legalName}
                onChange={(e) => setField("legalName", e.target.value)}
                maxLength={120}
                placeholder="Full name of the business owner or representative"
                autoComplete="name"
                className={inputCls}
              />
              <FieldError message={errors.legalName} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="ver-nin" className={labelCls}>
                  National Identification Number (NIN)
                </label>
                <input
                  id="ver-nin"
                  inputMode="numeric"
                  value={v.nin}
                  onChange={(e) => setField("nin", e.target.value.replace(/\D/g, ""))}
                  maxLength={11}
                  placeholder="11 digits"
                  autoComplete="off"
                  className={inputCls}
                />
                <FieldError message={errors.nin} />
              </div>
              <div>
                <label htmlFor="ver-bvn" className={labelCls}>
                  BVN <span className="text-unsolo-muted font-normal">(where required)</span>
                </label>
                <input
                  id="ver-bvn"
                  inputMode="numeric"
                  value={v.bvn}
                  onChange={(e) => setField("bvn", e.target.value.replace(/\D/g, ""))}
                  maxLength={11}
                  placeholder="11 digits"
                  autoComplete="off"
                  className={inputCls}
                />
                <FieldError message={errors.bvn} />
              </div>
            </div>

            <div>
              <label htmlFor="ver-phone" className={labelCls}>
                Personal phone number
              </label>
              <input
                id="ver-phone"
                type="tel"
                value={v.phone}
                onChange={(e) => setField("phone", e.target.value)}
                maxLength={20}
                placeholder="e.g. +234 801 234 5678"
                autoComplete="tel"
                className={inputCls}
              />
              <FieldError message={errors.phone} />
            </div>
          </div>
        </section>

        {/* Address */}
        <section>
          <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
            Residential / business address
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {ADDRESS_FIELDS.map(({ key, label }) => (
              <div key={key} className={key === "street" ? "sm:col-span-2" : ""}>
                <label
                  htmlFor={`ver-${key}`}
                  className="text-unsolo-muted block text-xs font-medium"
                >
                  {label}
                </label>
                <input
                  id={`ver-${key}`}
                  value={v[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  maxLength={120}
                  className={inputCls}
                />
                <FieldError message={errors[key]} />
              </div>
            ))}
          </div>
        </section>

        {/* Documents upload after the submission exists — see Success/Profile */}
        <section>
          <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
            Supporting documents
          </h3>
          <div className="border-unsolo-border bg-unsolo-subtle mt-4 rounded-xl border border-dashed px-6 py-5">
            <p className="text-unsolo-muted text-xs leading-relaxed">
              After submitting, you&apos;ll be asked to upload a government-issued ID (NIN slip,
              passport or licence) and, where applicable, your CAC registration certificate.
              Documents are private and only visible to you and reviewers.
            </p>
          </div>
        </section>

        <p className="text-unsolo-muted text-xs leading-relaxed">
          Your identity details are stored securely and are never shown publicly. After submission,
          only masked versions (e.g. ••••1234) are displayed.
        </p>
      </div>

      {serverError && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <StepNav
        onBack={onBack}
        onContinue={continueStep}
        continueLabel={continueLabel}
        loading={submitting}
      />
    </div>
  );
}
