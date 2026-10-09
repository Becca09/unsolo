"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  apiFetch,
  type Address,
  type BusinessVerification,
  type Interest,
  type PayoutAccount,
  type Profile,
  type SocialAccount,
} from "@/lib/api";

interface ProfileCardProps {
  profile: Profile;
  onUpdated: () => void;
  isActive?: boolean;
  onSetActive?: () => void;
}

export default function ProfileCard({
  profile,
  onUpdated,
  isActive = false,
  onSetActive,
}: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verification, setVerification] = useState<BusinessVerification | null>(null);
  const [verificationLoaded, setVerificationLoaded] = useState(false);

  const isBusiness = profile.type === "business";

  async function loadVerification() {
    try {
      const data = await apiFetch<BusinessVerification>(`/profiles/${profile.id}/verification`);
      setVerification(data);
    } catch {
      // 404 = no submission yet — a valid state, not an error.
      setVerification(null);
    } finally {
      setVerificationLoaded(true);
    }
  }

  useEffect(() => {
    if (isBusiness) loadVerification();
  }, [profile.id]);

  const verificationBadge = !isBusiness
    ? null
    : !verificationLoaded
      ? null
      : verification?.status === "verified"
        ? { label: "Verified", cls: "bg-unsolo-subtle text-unsolo-accent" }
        : verification?.status === "pending"
          ? { label: "Verification pending", cls: "bg-amber-100 text-amber-700" }
          : verification?.status === "rejected"
            ? { label: "Verification rejected", cls: "bg-red-100 text-red-700" }
            : { label: "Not verified", cls: "bg-stone-100 text-stone-500" };

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/profiles/${profile.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          fullName: fullName.trim(),
          bio: bio.trim() || undefined,
        }),
      });
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`card space-y-6 p-6 ${isActive ? "ring-unsolo-accent ring-1" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="border-unsolo-border bg-unsolo-subtle flex h-14 w-14 shrink-0 items-center justify-center rounded-full border">
            <span className="text-2xl">
              {profile.type === "business"
                ? "💼"
                : profile.type === "host"
                  ? "🏠"
                  : profile.type === "planner"
                    ? "🗺️"
                    : "👤"}
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-unsolo-muted inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium uppercase">
                {profile.type}
              </span>
              {isActive && (
                <span className="bg-unsolo-subtle text-unsolo-accent inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase">
                  Active
                </span>
              )}
              {profile.type === "host" && (
                <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium uppercase text-stone-500">
                  Verification coming soon
                </span>
              )}
              {verificationBadge && (
                <Link
                  href="/profile/verification"
                  title="Manage business verification"
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase transition-opacity hover:opacity-80 ${verificationBadge.cls}`}
                >
                  {verificationBadge.label}
                </Link>
              )}
            </div>
            <h2 className="text-unsolo-primary mt-2 text-xl font-bold">{profile.fullName}</h2>
            <p className="text-unsolo-muted text-sm">@{profile.username}</p>
            {profile.bio && <p className="text-unsolo-muted mt-1 text-sm">{profile.bio}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {isBusiness && (
            <Link
              href="/profile/verification"
              className="text-unsolo-accent hover:text-unsolo-moss text-sm font-semibold"
            >
              Verification
            </Link>
          )}
          {!isActive && onSetActive && (
            <button
              onClick={onSetActive}
              className="text-unsolo-accent hover:text-unsolo-moss text-sm font-semibold"
            >
              Set active
            </button>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-unsolo-accent hover:text-unsolo-moss text-sm font-semibold"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {editing && (
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="text-unsolo-primary block text-sm font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]+"
              title="3–30 characters: lowercase letters, numbers and underscores only"
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-1"
            />
            <p className="text-unsolo-muted mt-1 text-xs">
              3–30 characters: lowercase letters, numbers and underscores only.
            </p>
          </div>
          <div>
            <label className="text-unsolo-primary block text-sm font-medium">
              {profile.type === "business"
                ? "Business name"
                : profile.type === "host"
                  ? "Host name"
                  : profile.type === "planner"
                    ? "Display name"
                    : "Full name"}
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              maxLength={120}
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-1"
            />
          </div>
          <div>
            <label className="text-unsolo-primary block text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2000}
              rows={2}
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none transition focus:ring-1"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={loading || !username.trim() || !fullName.trim()}
            className="bg-unsolo-accent rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>
      )}

      <div className="grid items-start gap-6 md:grid-cols-2">
        <SocialsSection
          profileId={profile.id}
          title={profile.type === "business" ? "Social presence" : "Social accounts"}
          onChange={onUpdated}
        />
        <InterestsSection
          profileId={profile.id}
          title={profile.type === "business" ? "Categories" : "Interests"}
          onChange={onUpdated}
        />
        <AddressesSection
          profileId={profile.id}
          title={profile.type === "business" ? "Location" : "Addresses"}
          onChange={onUpdated}
        />
        {profile.type === "host" && <HostVerificationSection />}
        {profile.type !== "traveller" && <PayoutSection profileId={profile.id} />}
      </div>
    </div>
  );
}

function SocialsSection({
  profileId,
  title,
  onChange,
}: {
  profileId: string;
  title: string;
  onChange: () => void;
}) {
  const [platform, setPlatform] = useState<"instagram" | "x" | "tiktok">("instagram");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const [items, setItems] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await apiFetch<SocialAccount[]>(`/profiles/${profileId}/socials`);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => { });
  }, [profileId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/profiles/${profileId}/socials`, {
        method: "POST",
        body: JSON.stringify({
          platform,
          handle: handle.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });
      setHandle("");
      setUrl("");
      await load();
      onChange();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/profiles/${profileId}/socials/${id}`, { method: "DELETE" });
    await load();
    onChange();
  }

  return (
    <ResourceBox title={title} count={items.length}>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="bg-unsolo-light text-unsolo-primary flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="text-unsolo-muted rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium uppercase">
                  {s.platform}
                </span>
                {s.handle ?? s.url}
              </span>
              <button onClick={() => remove(s.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="space-y-2">
        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as typeof platform)}
            className="border-unsolo-border bg-unsolo-surface text-unsolo-primary rounded-lg border px-3 py-2 text-sm outline-none"
          >
            <option value="instagram">Instagram</option>
            <option value="x">X</option>
            <option value="tiktok">TikTok</option>
          </select>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@handle"
            className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
          />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Profile URL (optional)"
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading || (!handle.trim() && !url.trim())}
          className="bg-unsolo-primary text-unsolo-neutral w-full rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>
    </ResourceBox>
  );
}

function InterestsSection({
  profileId,
  title,
  onChange,
}: {
  profileId: string;
  title: string;
  onChange: () => void;
}) {
  const [name, setName] = useState("");
  const [items, setItems] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await apiFetch<Interest[]>(`/profiles/${profileId}/interests`);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => { });
  }, [profileId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/profiles/${profileId}/interests`, {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      await load();
      onChange();
    } finally {
      setLoading(false);
    }
  }

  async function remove(interestId: string) {
    await apiFetch(`/profiles/${profileId}/interests/${interestId}`, { method: "DELETE" });
    await load();
    onChange();
  }

  return (
    <ResourceBox title={title} count={items.length}>
      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {items.map((i) => (
            <span
              key={i.id}
              className="bg-unsolo-subtle text-unsolo-primary inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              {i.name}
              <button
                onClick={() => remove(i.id)}
                className="text-unsolo-muted hover:text-red-600"
                aria-label={`Remove ${i.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. hiking"
          maxLength={60}
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-unsolo-primary text-unsolo-neutral rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Add
        </button>
      </form>
    </ResourceBox>
  );
}

function AddressesSection({
  profileId,
  title,
  onChange,
}: {
  profileId: string;
  title: string;
  onChange: () => void;
}) {
  const [items, setItems] = useState<Address[]>([]);
  const [form, setForm] = useState({ country: "", state: "", city: "", street: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await apiFetch<Address[]>(`/profiles/${profileId}/addresses`);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => { });
  }, [profileId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/profiles/${profileId}/addresses`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ country: "", state: "", city: "", street: "" });
      await load();
      onChange();
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/profiles/${profileId}/addresses/${id}`, { method: "DELETE" });
    await load();
    onChange();
  }

  return (
    <ResourceBox title={title} count={items.length}>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="bg-unsolo-light text-unsolo-primary flex items-start justify-between rounded-lg px-3 py-2 text-sm"
            >
              <span>
                {a.street}, {a.city}, {a.state}, {a.country}
              </span>
              <button onClick={() => remove(a.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {(["country", "state"] as const).map((field) => (
            <input
              key={field}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              required
              maxLength={120}
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["city", "street"] as const).map((field) => (
            <input
              key={field}
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              required
              maxLength={120}
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-unsolo-primary text-unsolo-neutral w-full rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add address"}
        </button>
      </form>
    </ResourceBox>
  );
}

/**
 * Host verification reuses the business verification model — not exposed
 * for host profiles yet, so this stays an honest placeholder.
 */
function HostVerificationSection() {
  return (
    <div className="border-unsolo-border bg-unsolo-surface/60 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <span className="text-unsolo-primary text-sm font-semibold">Verification</span>
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
          Coming soon
        </span>
      </div>
      <p className="text-unsolo-muted mt-2 text-sm">
        Verification will be available here when it opens.
      </p>
    </div>
  );
}

/**
 * Payout accounts — real persistence. Local bank details are stored via
 * POST /profiles/:id/payout-accounts; responses only ever carry the masked
 * account number.
 */
function PayoutSection({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<PayoutAccount[]>([]);
  const [form, setForm] = useState({ bankName: "", accountNumber: "", accountName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const data = await apiFetch<PayoutAccount[]>(`/profiles/${profileId}/payout-accounts`);
    setItems(data);
  }

  useEffect(() => {
    load().catch(() => { });
  }, [profileId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/profiles/${profileId}/payout-accounts`, {
        method: "POST",
        body: JSON.stringify({
          provider: "local",
          bankName: form.bankName.trim(),
          accountNumber: form.accountNumber.trim(),
          accountName: form.accountName.trim(),
        }),
      });
      setForm({ bankName: "", accountNumber: "", accountName: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add payout account.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await apiFetch(`/profiles/${profileId}/payout-accounts/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <ResourceBox title="Payout accounts" count={items.length}>
      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="bg-unsolo-light text-unsolo-primary flex items-center justify-between rounded-lg px-3 py-2 text-sm"
            >
              <span>
                {a.bankName ?? a.provider}
                {a.accountNumberMasked ? ` · ${a.accountNumberMasked}` : ""}
                {a.accountName ? ` — ${a.accountName}` : ""}
              </span>
              <button onClick={() => remove(a.id)} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} className="space-y-2">
        <input
          value={form.bankName}
          onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
          placeholder="Bank name"
          required
          maxLength={120}
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <input
          value={form.accountNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, accountNumber: e.target.value.replace(/\D/g, "") }))
          }
          placeholder="Account number (10 digits)"
          required
          inputMode="numeric"
          maxLength={10}
          pattern="\d{10}"
          title="10-digit NUBAN account number"
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        <input
          value={form.accountName}
          onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
          placeholder="Account name"
          required
          maxLength={120}
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary w-full rounded-lg border px-3 py-2 text-sm outline-none"
        />
        {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={
            loading ||
            !form.bankName.trim() ||
            form.accountNumber.trim().length !== 10 ||
            !form.accountName.trim()
          }
          className="bg-unsolo-primary text-unsolo-neutral w-full rounded-lg py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add payout account"}
        </button>
      </form>
    </ResourceBox>
  );
}

function ResourceBox({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-unsolo-border bg-unsolo-surface rounded-xl border p-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-unsolo-primary flex w-full items-center justify-between text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="bg-unsolo-subtle text-unsolo-muted rounded-full px-2 py-0.5 text-xs font-medium">
              {count}
            </span>
          )}
        </span>
        <span>{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
