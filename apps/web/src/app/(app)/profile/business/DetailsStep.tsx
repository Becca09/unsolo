"use client";

import { useState } from "react";
import { type BusinessDraft, type DetailErrors, isAddressPartial, validateDetails } from "./types";
import { FieldError, inputCls, labelCls, StepHeading, StepNav } from "./ui";

interface Props {
  draft: BusinessDraft;
  onChange: (patch: Partial<BusinessDraft>) => void;
  /** Server-side errors surfaced after submit (e.g. handle already taken). */
  serverErrors?: DetailErrors;
  onBack: () => void;
  onContinue: () => void;
}

const ADDRESS_FIELDS = [
  { key: "country", label: "Country" },
  { key: "state", label: "State" },
  { key: "city", label: "City / LGA" },
  { key: "street", label: "Address" },
] as const;

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "x", label: "X" },
  { key: "tiktok", label: "TikTok" },
] as const;

/**
 * Step 1 — Business details. Only collects fields the B2 API can store:
 * name/handle/description/logo URL on the profile, tagline/phone on
 * business_profiles, categories as interests, socials, and an address.
 * Local validation runs before Continue so errors sit next to their
 * fields rather than surfacing at submit time.
 */
export default function DetailsStep({
  draft,
  onChange,
  serverErrors = {},
  onBack,
  onContinue,
}: Props) {
  const [categoryInput, setCategoryInput] = useState("");
  const [errors, setErrors] = useState<DetailErrors>({});

  const shownErrors: DetailErrors = { ...errors, ...serverErrors };

  function addCategory() {
    const name = categoryInput.trim();
    if (name && !draft.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      onChange({ categories: [...draft.categories, name] });
    }
    setCategoryInput("");
  }

  function continueStep() {
    const next = validateDetails(draft);
    setErrors(next);
    if (Object.keys(next).length === 0) onContinue();
  }

  function clearError(field: keyof DetailErrors) {
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <div>
      <StepHeading title="Tell us about your business">
        Add a few details about your business so travellers know who they&apos;re dealing with.
      </StepHeading>

      <div className="mt-8 space-y-8">
        {/* Basics */}
        <div className="space-y-5">
          <div>
            <label htmlFor="biz-name" className={labelCls}>
              Business name
            </label>
            <input
              id="biz-name"
              value={draft.businessName}
              onChange={(e) => {
                clearError("businessName");
                onChange({ businessName: e.target.value });
              }}
              maxLength={120}
              placeholder="e.g. Atmosphere Travels"
              className={inputCls}
            />
            <FieldError message={shownErrors.businessName} />
          </div>

          <div>
            <label htmlFor="biz-handle" className={labelCls}>
              Business handle
            </label>
            <input
              id="biz-handle"
              value={draft.handle}
              onChange={(e) => {
                clearError("handle");
                onChange({ handle: e.target.value.toLowerCase() });
              }}
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]+"
              placeholder="e.g. atmosphere_travels"
              className={inputCls}
            />
            <p className="text-unsolo-muted mt-1 text-xs">
              Your unique @handle — used in your business&apos;s profile URL. 3–30 characters:
              lowercase letters, numbers and underscores only.
            </p>
            <FieldError message={shownErrors.handle} />
          </div>

          <div>
            <label htmlFor="biz-tagline" className={labelCls}>
              Tagline <span className="text-unsolo-muted font-normal">(optional)</span>
            </label>
            <input
              id="biz-tagline"
              value={draft.tagline}
              onChange={(e) => {
                clearError("tagline");
                onChange({ tagline: e.target.value });
              }}
              maxLength={160}
              placeholder="e.g. Trips that feel like home"
              className={inputCls}
            />
            <FieldError message={shownErrors.tagline} />
          </div>

          <div>
            <label htmlFor="biz-description" className={labelCls}>
              Business description
            </label>
            <textarea
              id="biz-description"
              value={draft.description}
              onChange={(e) => {
                clearError("description");
                onChange({ description: e.target.value });
              }}
              maxLength={2000}
              rows={3}
              placeholder="What does your business offer travellers?"
              className={inputCls}
            />
            <FieldError message={shownErrors.description} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="biz-logo" className={labelCls}>
                Logo URL <span className="text-unsolo-muted font-normal">(optional)</span>
              </label>
              <input
                id="biz-logo"
                type="url"
                value={draft.logoUrl}
                onChange={(e) => {
                  clearError("logoUrl");
                  onChange({ logoUrl: e.target.value });
                }}
                placeholder="https://example.com/logo.png"
                className={inputCls}
              />
              <p className="text-unsolo-muted mt-1 text-xs">
                Paste a link to your logo for now — image upload comes later.
              </p>
              <FieldError message={shownErrors.logoUrl} />
            </div>
            <div>
              <label htmlFor="biz-phone" className={labelCls}>
                Business phone number{" "}
                <span className="text-unsolo-muted font-normal">(optional)</span>
              </label>
              <input
                id="biz-phone"
                type="tel"
                value={draft.phone}
                onChange={(e) => {
                  clearError("phone");
                  onChange({ phone: e.target.value });
                }}
                maxLength={20}
                placeholder="e.g. +234 801 234 5678"
                className={inputCls}
              />
              <FieldError message={shownErrors.phone} />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label htmlFor="biz-category" className={labelCls}>
            Business categories
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="biz-category"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="e.g. tours, hotels, rentals"
              maxLength={60}
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={!categoryInput.trim()}
              className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle rounded-xl border px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {draft.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {draft.categories.map((c) => (
                <span
                  key={c}
                  className="bg-unsolo-subtle text-unsolo-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ categories: draft.categories.filter((x) => x !== c) })
                    }
                    className="text-unsolo-muted hover:text-red-600"
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Social presence */}
        <div>
          <span className={labelCls}>Social presence</span>
          <div className="mt-2 space-y-3">
            {SOCIAL_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-unsolo-muted w-24 shrink-0 rounded-full bg-stone-100 px-2.5 py-1.5 text-center text-xs font-medium uppercase">
                  {label}
                </span>
                <input
                  value={draft.socials[key]}
                  onChange={(e) =>
                    onChange({ socials: { ...draft.socials, [key]: e.target.value } })
                  }
                  placeholder="@username"
                  maxLength={100}
                  className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <span className={labelCls}>Business location</span>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            {ADDRESS_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-unsolo-muted block text-xs font-medium">{label}</label>
                <input
                  value={draft.address[key]}
                  onChange={(e) =>
                    onChange({ address: { ...draft.address, [key]: e.target.value } })
                  }
                  maxLength={120}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <FieldError message={shownErrors.address} />
          {!shownErrors.address && isAddressPartial(draft.address) && (
            <p className="mt-2 text-xs text-amber-600">
              Fill in all four fields, or leave them all empty.
            </p>
          )}
        </div>
      </div>

      <StepNav onBack={onBack} onContinue={continueStep} />
    </div>
  );
}
