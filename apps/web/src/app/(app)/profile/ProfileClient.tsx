"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type Profile, type User } from "@/lib/api";
import { useActiveProfile } from "@/lib/active-profile";
import ProfileSetupWizard from "./ProfileSetupWizard";
import ProfileCard from "./ProfileCard";

const allProfileTypes = ["traveller", "planner", "business", "host"] as const;

interface ProfileClientProps {
  initialUser: User;
  initialProfiles: Profile[];
}

export default function ProfileClient({ initialUser, initialProfiles }: ProfileClientProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const { activeProfile, setActiveProfileId } = useActiveProfile(profiles);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const profileData = await apiFetch<Profile[]>("/profiles/me");
      setProfiles(profileData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't load your profiles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialProfiles.length === 0 && initialUser.id) {
      load();
    }
  }, [initialProfiles.length, initialUser.id]);

  const usedTypes = new Set(profiles.map((p) => p.type));
  const canAddMore = usedTypes.size < allProfileTypes.length;

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <h1 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">Your profiles</h1>
        </div>

        {/* Profiles */}
        <section>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-unsolo-muted text-sm">
              Manage each profile&apos;s details, socials and interests. Your{" "}
              <span className="text-unsolo-primary font-medium">active</span> profile controls the
              dashboard and sidebar.
            </p>
            {canAddMore && (
              <button
                onClick={() => {
                  setCreating(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                disabled={creating}
                className="bg-unsolo-accent rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                + Add another profile
              </button>
            )}
          </div>

          {creating && (
            <div className="mt-6">
              <ProfileSetupWizard
                excludeTypes={
                  Array.from(usedTypes) as ("traveller" | "planner" | "business" | "host")[]
                }
                onCreated={() => {
                  setCreating(false);
                  load();
                  router.refresh();
                }}
                onCancel={() => setCreating(false)}
              />
            </div>
          )}

          {loading && profiles.length === 0 ? (
            <p className="text-unsolo-muted mt-6 text-sm">Loading profiles...</p>
          ) : error ? (
            <div className="mt-6 rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={load}
                className="text-unsolo-accent mt-2 text-sm font-medium hover:underline"
              >
                Try again
              </button>
            </div>
          ) : profiles.length === 0 ? (
            <div className="card mt-6 p-8 text-center">
              <p className="text-unsolo-muted">No profiles yet.</p>
              <button
                onClick={() => setCreating(true)}
                className="bg-unsolo-accent mt-4 inline-flex rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Create your first profile
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {profiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onUpdated={load}
                  isActive={activeProfile?.id === profile.id}
                  onSetActive={() => setActiveProfileId(profile.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
