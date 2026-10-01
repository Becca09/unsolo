"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

const inputCls =
  "border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-1";

const STEPS = ["Basics", "Presence", "Profile", "Verification", "Review"] as const;
type Step = (typeof STEPS)[number] | "created";

interface Props {
  onBack: () => void;
  onCreated: () => void;
}

/**
 * Business profile onboarding — a dedicated flow, deliberately distinct from
 * the traveller/planner/host wizard. Submits only fields the B2 API supports
 * (profile: username/fullName/bio; sub-resources: interests → categories,
 * socials, addresses). Website, logo upload and verification documents are
 * UI placeholders until their phases land.
 */
export default function BusinessOnboarding({ onBack, onCreated }: Props) {
  const [step, setStep] = useState<Step>("Basics");
  const [businessName, setBusinessName] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [socials, setSocials] = useState([
    { platform: "instagram" as const, handle: "" },
    { platform: "x" as const, handle: "" },
  ]);
  const [address, setAddress] = useState({ country: "", state: "", city: "", street: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = STEPS.indexOf(step as (typeof STEPS)[number]);
  const addressComplete = Object.values(address).every((v) => v.trim());
  const addressPartial = !addressComplete && Object.values(address).some((v) => v.trim());
  const handleValid = /^[a-z0-9_]{3,30}$/.test(handle.trim());
  const basicsValid = businessName.trim() && handleValid;
  const filledSocials = socials.filter((s) => s.handle.trim());

  function addCategory() {
    const name = categoryInput.trim();
    if (name && !categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setCategories((prev) => [...prev, name]);
    }
    setCategoryInput("");
  }

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        type: "business",
        username: handle.trim().toLowerCase(),
        fullName: businessName.trim(),
      };
      if (description.trim()) body.bio = description.trim();

      const profile = await apiFetch<{ id: string }>("/profiles", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const extras: Promise<unknown>[] = [];
      for (const name of categories) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/interests`, {
            method: "POST",
            body: JSON.stringify({ name }),
          }).catch(() => {}),
        );
      }
      for (const s of filledSocials) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/socials`, {
            method: "POST",
            body: JSON.stringify({ platform: s.platform, handle: s.handle.trim() }),
          }).catch(() => {}),
        );
      }
      if (addressComplete) {
        extras.push(
          apiFetch(`/profiles/${profile.id}/addresses`, {
            method: "POST",
            body: JSON.stringify({
              country: address.country.trim(),
              state: address.state.trim(),
              city: address.city.trim(),
              street: address.street.trim(),
            }),
          }).catch(() => {}),
        );
      }
      await Promise.all(extras);
      setStep("created");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create business profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 sm:p-10">
      {/* Step indicator */}
      {step !== "created" && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
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
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-2 mb-5 h-px flex-1 sm:mb-5 ${
                      i < stepIndex ? "bg-unsolo-accent" : "bg-unsolo-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1 — Business basics */}
      {step === "Basics" && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">Business basics</h2>
          <p className="text-unsolo-muted mt-2 text-sm">
            The core identity travellers will see for your business.
          </p>
          <div className="mt-8 space-y-5">
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">Business name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Atmosphere Travels"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Business handle
              </label>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                minLength={3}
                maxLength={30}
                pattern="[a-z0-9_]+"
                title="3–30 characters: lowercase letters, numbers and underscores only"
                placeholder="e.g. atmosphere_travels"
                className={inputCls}
              />
              <p className="text-unsolo-muted mt-1 text-xs">
                Your unique @handle — used in your business&apos;s profile URL. 3–30 characters:
                lowercase letters, numbers and underscores only.
              </p>
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Business description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="What does your business offer travellers?"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Business categories
              </label>
              <div className="mt-1 flex gap-2">
                <input
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
              {categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <span
                      key={c}
                      className="bg-unsolo-subtle text-unsolo-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => setCategories((p) => p.filter((x) => x !== c))}
                        className="text-unsolo-muted hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep("Presence")}
              disabled={!basicsValid}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Business presence */}
      {step === "Presence" && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">Business presence</h2>
          <p className="text-unsolo-muted mt-2 text-sm">
            Where travellers can find your business online and in the world.
          </p>
          <div className="mt-8 space-y-6">
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Business website
              </label>
              <input
                disabled
                placeholder="Coming soon"
                className="border-unsolo-border bg-unsolo-subtle text-unsolo-muted mt-1 w-full cursor-not-allowed rounded-xl border px-4 py-3 text-sm outline-none"
              />
              <p className="text-unsolo-muted mt-1 text-xs">
                Website links will be supported in a later phase.
              </p>
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Social accounts
              </label>
              <div className="mt-2 space-y-3">
                {socials.map((s, idx) => (
                  <div key={s.platform} className="flex items-center gap-2">
                    <span className="text-unsolo-muted w-24 rounded-full bg-stone-100 px-2.5 py-1.5 text-center text-xs font-medium uppercase">
                      {s.platform === "x" ? "X" : "Instagram"}
                    </span>
                    <input
                      value={s.handle}
                      onChange={(e) =>
                        setSocials((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, handle: e.target.value } : p)),
                        )
                      }
                      placeholder="@handle"
                      maxLength={100}
                      className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">
                Business location
              </label>
              <div className="mt-2 grid gap-4 sm:grid-cols-2">
                {(["country", "state", "city", "street"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-unsolo-muted block text-xs font-medium capitalize">
                      {field === "state" ? "State / Region" : field}
                    </label>
                    <input
                      value={address[field]}
                      onChange={(e) => setAddress((a) => ({ ...a, [field]: e.target.value }))}
                      maxLength={120}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
              {addressPartial && (
                <p className="mt-2 text-xs text-amber-600">
                  Fill in all four fields, or leave them all empty.
                </p>
              )}
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("Basics")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep("Profile")}
              disabled={addressPartial}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Business profile (logo + preview) */}
      {step === "Profile" && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">Business profile</h2>
          <p className="text-unsolo-muted mt-2 text-sm">
            How your business will appear on Unsolo.
          </p>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">Business logo</label>
              <div className="border-unsolo-border bg-unsolo-subtle mt-2 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
                <span className="text-unsolo-muted text-2xl">🖼️</span>
                <p className="text-unsolo-muted mt-2 text-sm font-medium">Logo upload</p>
                <p className="text-unsolo-muted mt-1 text-xs">Coming soon</p>
              </div>
            </div>
            <div>
              <label className="text-unsolo-primary block text-sm font-medium">Preview</label>
              <div className="border-unsolo-border bg-unsolo-surface mt-2 rounded-xl border p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-unsolo-subtle text-unsolo-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold">
                    {businessName.trim() ? businessName.trim().charAt(0).toUpperCase() : "B"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-unsolo-primary truncate font-semibold">
                      {businessName.trim() || "Business name"}
                    </p>
                    <p className="text-unsolo-muted text-sm">
                      @{handle.trim() || "business_handle"}
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                    Not verified
                  </span>
                </div>
                {description.trim() && (
                  <p className="text-unsolo-muted mt-3 text-sm">{description.trim()}</p>
                )}
                {categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {categories.map((c) => (
                      <span
                        key={c}
                        className="bg-unsolo-subtle text-unsolo-primary rounded-full px-2.5 py-1 text-[11px] font-medium"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
                {addressComplete && (
                  <p className="text-unsolo-muted mt-3 text-xs">
                    📍 {address.city}, {address.country}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("Presence")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep("Verification")}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Verification */}
      {step === "Verification" && (
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-unsolo-primary text-2xl font-bold">Business verification</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Required
            </span>
          </div>
          <p className="text-unsolo-muted mt-3 max-w-lg text-sm leading-relaxed">
            Verification helps us confirm that this business is legitimate and helps protect the
            Unsolo community. Verified businesses get a badge on their profile.
          </p>

          <div className="border-unsolo-border bg-unsolo-surface mt-8 rounded-2xl border p-6">
            <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
              What verification involves
            </h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <span className="bg-unsolo-accent mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white">
                  ✓
                </span>
                <div>
                  <p className="text-unsolo-primary text-sm font-medium">Business information</p>
                  <p className="text-unsolo-muted text-xs">
                    Name, handle and description — provided
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    addressComplete
                      ? "bg-unsolo-accent text-white"
                      : "border-unsolo-border text-unsolo-muted border"
                  }`}
                >
                  {addressComplete ? "✓" : "○"}
                </span>
                <div>
                  <p className="text-unsolo-primary text-sm font-medium">Business location</p>
                  <p className="text-unsolo-muted text-xs">
                    {addressComplete ? "Provided" : "Not provided — optional for now"}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="border-unsolo-border text-unsolo-muted mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]">
                  ○
                </span>
                <div>
                  <p className="text-unsolo-primary text-sm font-medium">
                    Business verification documents
                  </p>
                  <p className="text-unsolo-muted text-xs">Coming soon</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="border-unsolo-border text-unsolo-muted mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]">
                  ○
                </span>
                <div>
                  <p className="text-unsolo-primary text-sm font-medium">Verification review</p>
                  <p className="text-unsolo-muted text-xs">Coming soon</p>
                </div>
              </li>
            </ul>
            <div className="border-unsolo-border mt-6 border-t pt-5">
              <button
                disabled
                title="Coming soon"
                className="bg-unsolo-subtle text-unsolo-muted w-full cursor-not-allowed rounded-full py-3 text-sm font-semibold"
              >
                Start verification — coming soon
              </button>
              <p className="text-unsolo-muted mt-2 text-center text-xs">
                Verification opens in a later phase. You can create your business profile now.
              </p>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("Profile")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep("Review")}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Continue to review
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Review & create */}
      {step === "Review" && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">Review &amp; create</h2>
          <p className="text-unsolo-muted mt-2 text-sm">
            Confirm your business details before creating the profile.
          </p>
          <dl className="border-unsolo-border bg-unsolo-surface mt-8 divide-unsolo-border divide-y rounded-2xl border">
            {[
              ["Business name", businessName.trim()],
              ["Handle", `@${handle.trim().toLowerCase()}`],
              ["Description", description.trim() || "—"],
              [
                "Categories",
                categories.length > 0 ? categories.join(", ") : "—",
              ],
              [
                "Location",
                addressComplete
                  ? `${address.street}, ${address.city}, ${address.state}, ${address.country}`
                  : "—",
              ],
              [
                "Social accounts",
                filledSocials.length > 0
                  ? filledSocials.map((s) => `${s.platform}: ${s.handle.trim()}`).join(", ")
                  : "—",
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-4 px-6 py-3.5">
                <dt className="text-unsolo-muted w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                  {label}
                </dt>
                <dd className="text-unsolo-primary text-sm">{value}</dd>
              </div>
            ))}
            <div className="flex items-center gap-4 px-6 py-3.5">
              <dt className="text-unsolo-muted w-32 shrink-0 text-xs font-medium uppercase tracking-wide">
                Verification
              </dt>
              <dd>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                  Required — pending
                </span>
              </dd>
            </div>
          </dl>
          {error && (
            <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("Verification")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={create}
              disabled={loading}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create business profile"}
            </button>
          </div>
        </div>
      )}

      {/* Created — not "live", verification still required */}
      {step === "created" && (
        <div>
          <div className="flex items-start gap-4">
            <div className="bg-unsolo-subtle flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
              <span className="text-unsolo-accent text-xl">✓</span>
            </div>
            <div>
              <h2 className="text-unsolo-primary text-2xl font-bold">Business profile created</h2>
              <p className="text-unsolo-muted mt-2 max-w-lg text-sm leading-relaxed">
                Your business profile has been created, but verification is required before your
                business can access all business features.
              </p>
            </div>
          </div>
          <div className="border-unsolo-border bg-unsolo-surface mt-8 rounded-2xl border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-unsolo-primary font-semibold">Verification</h3>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Required
              </span>
            </div>
            <p className="text-unsolo-muted mt-2 text-sm">
              Business verification is coming soon. You&apos;ll be able to submit verification from
              your business profile once it opens.
            </p>
          </div>
          <button
            onClick={onCreated}
            className="bg-unsolo-accent mt-8 rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
