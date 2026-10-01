"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import BusinessOnboarding from "./BusinessOnboarding";

type ProfileType = "traveller" | "planner" | "business" | "host";

const TYPE_META: Record<
  ProfileType,
  {
    label: string;
    cardTitle: string;
    cardDescription: string;
    heading: string;
    subheading: string;
    nameLabel: string;
    namePlaceholder: string;
    usernameLabel: string;
    usernamePlaceholder: string;
    usernameHint: string;
    bioLabel: string;
    bioPlaceholder: string;
    icon: React.ReactNode;
    needsVerification: boolean;
  }
> = {
  traveller: {
    label: "Traveller",
    cardTitle: "Travel as an individual",
    cardDescription: "Discover trips, join experiences and connect with other travellers.",
    heading: "Set up your traveller profile",
    subheading: "This is how you'll appear to other travellers on Unsolo.",
    nameLabel: "Full name",
    namePlaceholder: "e.g. Funke Fiyin",
    usernameLabel: "Username",
    usernamePlaceholder: "e.g. funke_fiyin",
    usernameHint: "Your unique @username — how other travellers find you.",
    bioLabel: "Bio",
    bioPlaceholder: "Tell us a little about yourself...",
    icon: "🧭",
    needsVerification: false,
  },
  planner: {
    label: "Planner",
    cardTitle: "Create and manage trips for travellers",
    cardDescription: "Design trips, organize groups and grow your planning business.",
    heading: "Set up your planner profile",
    subheading: "This is how travellers will find your trips.",
    nameLabel: "Display name",
    namePlaceholder: "e.g. Funke's Adventures",
    usernameLabel: "Username",
    usernamePlaceholder: "e.g. funkes_adventures",
    usernameHint: "Your unique @username — shown on your planner page.",
    bioLabel: "About your planning",
    bioPlaceholder: "What kind of trips do you create?",
    icon: "🗺️",
    needsVerification: false,
  },
  business: {
    label: "Business",
    cardTitle: "Represent a travel-related business",
    cardDescription: "Manage your business presence and services on Unsolo.",
    heading: "Set up your business",
    subheading:
      "Create your business profile so travellers can discover and connect with your business.",
    nameLabel: "Business name",
    namePlaceholder: "e.g. Atmosphere Travels",
    usernameLabel: "Business handle",
    usernamePlaceholder: "e.g. atmosphere_travels",
    usernameHint:
      "Your unique @handle — used in your business's profile URL. Business name is the public display name; the handle is the unique identifier.",
    bioLabel: "Business description",
    bioPlaceholder: "What does your business offer travellers?",
    icon: "💼",
    needsVerification: true,
  },
  host: {
    label: "Host",
    cardTitle: "Represent a property or hosting profile",
    cardDescription: "Offer spaces or experiences to travellers.",
    heading: "Set up your host profile",
    subheading: "This is how travellers will discover your spaces.",
    nameLabel: "Host name",
    namePlaceholder: "e.g. Becca Homes",
    usernameLabel: "Username",
    usernamePlaceholder: "e.g. becca_homes",
    usernameHint: "Your unique @username — shown on your host page.",
    bioLabel: "About your hosting",
    bioPlaceholder: "What do you offer travellers?",
    icon: "🏠",
    needsVerification: true,
  },
};

interface WizardProps {
  excludeTypes?: ProfileType[];
  onCreated: () => void;
  onCancel: () => void;
}

const inputCls =
  "border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-1";

/**
 * Per-type profile creation wizard for traveller/planner/host. Business
 * profiles hand off to BusinessOnboarding, which is a dedicated flow.
 * Only fields backed by the B2 API are submitted — profile
 * (username/fullName/bio), then interests on the created profile.
 */
export default function ProfileSetupWizard({
  excludeTypes = [],
  onCreated,
  onCancel,
}: WizardProps) {
  const availableTypes = useMemo(
    () => (Object.keys(TYPE_META) as ProfileType[]).filter((t) => !excludeTypes.includes(t)),
    [excludeTypes],
  );

  const [type, setType] = useState<ProfileType | null>(null);
  const [step, setStep] = useState<"type" | "identity" | "review" | "done">("type");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = type ? TYPE_META[type] : null;

  const steps: string[] = ["type", "identity", "review", "done"];
  const stepIndex = steps.indexOf(step);

  function addInterest() {
    const name = interestInput.trim();
    if (name && !interests.some((i) => i.toLowerCase() === name.toLowerCase())) {
      setInterests((prev) => [...prev, name]);
    }
    setInterestInput("");
  }

  async function create() {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, string> = {
        type,
        username: username.trim().toLowerCase(),
        fullName: fullName.trim(),
      };
      if (bio.trim()) body.bio = bio.trim();

      const profile = await apiFetch<{ id: string }>("/profiles", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Sub-resources exist per-profile — attach what the user provided.
      // These are best-effort: the profile itself is already created.
      await Promise.all(
        interests.map((name) =>
          apiFetch(`/profiles/${profile.id}/interests`, {
            method: "POST",
            body: JSON.stringify({ name }),
          }).catch(() => { }),
        ),
      );
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (availableTypes.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-unsolo-muted text-sm">
          You already have a profile for every available type.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle mt-4 inline-flex rounded-full border px-5 py-2 text-sm font-semibold transition"
        >
          Close
        </button>
      </div>
    );
  }

  // Business gets its own dedicated onboarding flow.
  if (type === "business" && step !== "type") {
    return <BusinessOnboarding onBack={() => setStep("type")} onCreated={onCreated} />;
  }

  return (
    <div className="card p-6 sm:p-10">
      {/* Progress */}
      {step !== "type" && (
        <div className="mb-8 flex items-center gap-2">
          {steps.slice(1, -1).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${i + 1 <= stepIndex ? "bg-unsolo-accent" : "bg-unsolo-subtle"
                }`}
            />
          ))}
        </div>
      )}

      {/* Step 1 — profile type */}
      {step === "type" && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">
            What are you joining Unsolo as?
          </h2>
          <p className="text-unsolo-muted mt-2 text-sm">
            You can add more profile types later — each has its own identity and dashboard.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {availableTypes.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`border-unsolo-border rounded-2xl border p-5 text-left transition-all ${type === t
                  ? "border-unsolo-accent bg-unsolo-subtle ring-unsolo-accent ring-1"
                  : "bg-unsolo-surface hover:border-unsolo-accent/50"
                  }`}
              >
                <span className="text-2xl">{TYPE_META[t].icon}</span>
                <span className="text-unsolo-primary mt-3 block text-lg font-semibold">
                  {TYPE_META[t].label}
                </span>
                <span className="text-unsolo-primary mt-1 block text-sm font-medium">
                  {TYPE_META[t].cardTitle}
                </span>
                <span className="text-unsolo-muted mt-1 block text-sm">
                  {TYPE_META[t].cardDescription}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => setStep("identity")}
              disabled={!type}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — identity (labels vary per type) */}
      {step === "identity" && meta && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">{meta.heading}</h2>
          <p className="text-unsolo-muted mt-2 text-sm">{meta.subheading}</p>

          <div className="mt-8 space-y-6">
            <div>
              <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
                Your identity
              </h3>
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-unsolo-primary block text-sm font-medium">
                    {meta.nameLabel}
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    maxLength={120}
                    placeholder={meta.namePlaceholder}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-unsolo-primary block text-sm font-medium">
                    {meta.usernameLabel}
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9_]+"
                    title="3–30 characters: lowercase letters, numbers and underscores only"
                    placeholder={meta.usernamePlaceholder}
                    className={inputCls}
                  />
                  <p className="text-unsolo-muted mt-1 text-xs">
                    {meta.usernameHint} 3–30 characters: lowercase letters, numbers and underscores
                    only.
                  </p>
                </div>
                <div>
                  <label className="text-unsolo-primary block text-sm font-medium">
                    {meta.bioLabel}
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder={meta.bioPlaceholder}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-unsolo-primary text-sm font-semibold uppercase tracking-wide">
                Interests
              </h3>
              <div className="mt-3 flex gap-2">
                <input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInterest();
                    }
                  }}
                  placeholder="e.g. hiking"
                  maxLength={60}
                  className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  disabled={!interestInput.trim()}
                  className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {interests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="bg-unsolo-subtle text-unsolo-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                    >
                      {i}
                      <button
                        type="button"
                        onClick={() => setInterests((p) => p.filter((x) => x !== i))}
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

          {error && (
            <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("type")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={() => setStep("review")}
              disabled={
                !username.trim() ||
                !fullName.trim() ||
                username.trim().length < 3 ||
                !/^[a-z0-9_]+$/.test(username.trim())
              }
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — review */}
      {step === "review" && meta && type && (
        <div>
          <h2 className="text-unsolo-primary text-2xl font-bold">
            Review your {meta.label.toLowerCase()} profile
          </h2>
          <p className="text-unsolo-muted mt-2 text-sm">Make sure everything looks right.</p>

          <dl className="border-unsolo-border bg-unsolo-surface mt-8 space-y-4 rounded-2xl border p-6">
            <div>
              <dt className="text-unsolo-muted text-xs font-medium uppercase tracking-wide">
                Type
              </dt>
              <dd className="text-unsolo-primary mt-0.5 font-semibold">{meta.label}</dd>
            </div>
            <div>
              <dt className="text-unsolo-muted text-xs font-medium uppercase tracking-wide">
                {meta.nameLabel}
              </dt>
              <dd className="text-unsolo-primary mt-0.5 font-semibold">{fullName.trim()}</dd>
            </div>
            <div>
              <dt className="text-unsolo-muted text-xs font-medium uppercase tracking-wide">
                {meta.usernameLabel}
              </dt>
              <dd className="text-unsolo-primary mt-0.5">@{username.trim().toLowerCase()}</dd>
            </div>
            {bio.trim() && (
              <div>
                <dt className="text-unsolo-muted text-xs font-medium uppercase tracking-wide">
                  {meta.bioLabel}
                </dt>
                <dd className="text-unsolo-primary mt-0.5 text-sm">{bio.trim()}</dd>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <dt className="text-unsolo-muted text-xs font-medium uppercase tracking-wide">
                  Interests
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="bg-unsolo-subtle text-unsolo-primary rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {i}
                    </span>
                  ))}
                </dd>
              </div>
            )}

          </dl>

          {error && (
            <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("identity")}
              className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={create}
              disabled={loading}
              className="bg-unsolo-accent rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : `Create ${meta.label.toLowerCase()} profile`}
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — done (+ verification placeholder for business/host) */}
      {step === "done" && meta && (
        <div className="text-center">
          <div className="bg-unsolo-subtle mx-auto flex h-14 w-14 items-center justify-center rounded-full">
            <span className="text-unsolo-accent text-2xl">✓</span>
          </div>
          <h2 className="text-unsolo-primary mt-4 text-2xl font-bold">
            Your {meta.label.toLowerCase()} profile is live
          </h2>
          <p className="text-unsolo-muted mx-auto mt-2 max-w-md text-sm">
            @{username.trim().toLowerCase()} is ready. You can manage it any time from Your
            profiles.
          </p>

          {meta.needsVerification && (
            <div className="border-unsolo-border bg-unsolo-surface mx-auto mt-8 max-w-md rounded-2xl border p-6 text-left">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-unsolo-primary font-semibold">{meta.label} verification</h3>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Verification required
                </span>
              </div>
              <p className="text-unsolo-muted mt-2 text-sm">
                Verification helps us confirm that this {meta.label.toLowerCase()} is legitimate and
                helps protect the Unsolo community.
              </p>
              <button
                disabled
                title="Coming soon"
                className="bg-unsolo-subtle text-unsolo-muted mt-4 w-full cursor-not-allowed rounded-full py-2.5 text-sm font-semibold"
              >
                Continue to verification — coming soon
              </button>
            </div>
          )}

          <button
            onClick={onCreated}
            className="bg-unsolo-accent mt-8 inline-flex rounded-full px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
