"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/api";
import { useActiveProfile } from "@/lib/active-profile";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { DASHBOARD_MODULES, TYPE_LABELS, TYPE_TAGLINES, type DashboardModule } from "./modules";

interface DashboardClientProps {
  profiles: Profile[];
  email: string;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export default function DashboardClient({ profiles, email }: DashboardClientProps) {
  const [greet, setGreet] = useState("Welcome");
  const { activeProfile, setActiveProfileId } = useActiveProfile(profiles);

  useEffect(() => {
    setGreet(greeting());
  }, []);

  const greetingName = activeProfile ? firstName(activeProfile.fullName) : email.split("@")[0];
  const modules = activeProfile ? DASHBOARD_MODULES[activeProfile.type] : [];

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">
              {greet}, {greetingName} 👋
            </h1>
            <p className="text-unsolo-muted mt-2 text-lg">
              Here&apos;s what&apos;s happening with your Unsolo account.
            </p>
          </div>
          {activeProfile && (
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              onSelect={setActiveProfileId}
            />
          )}
        </header>

        {profiles.length === 0 ? (
          /* Empty state — dashboard stays visible, profile setup unlocks modules */
          <section className="card border-unsolo-accent/40 mt-10 p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-unsolo-primary text-lg font-semibold">
                  Set up your profile to get started
                </h2>
                <p className="text-unsolo-muted mt-1 max-w-lg text-sm">
                  Create a traveller, planner, business or host profile to unlock trips, connections
                  and bookings on Unsolo.
                </p>
              </div>
              <Link
                href="/onboarding"
                className="bg-unsolo-accent shrink-0 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Set up profile →
              </Link>
            </div>
          </section>
        ) : (
          activeProfile && (
            <>
              {/* Active profile context strip */}
              <section className="border-unsolo-border bg-unsolo-surface mt-10 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="border-unsolo-border bg-unsolo-subtle flex h-12 w-12 shrink-0 items-center justify-center rounded-full border">
                    <span className="text-xl">
                      {activeProfile.type === "business"
                        ? "�"
                        : activeProfile.type === "host"
                          ? "🏠"
                          : activeProfile.type === "planner"
                            ? "🗺️"
                            : "�👤"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-unsolo-muted rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium uppercase">
                        {TYPE_LABELS[activeProfile.type]}
                      </span>
                      <span className="text-unsolo-primary font-semibold">
                        {activeProfile.fullName}
                      </span>
                    </div>
                    <p className="text-unsolo-muted mt-0.5 text-sm">
                      @{activeProfile.username}
                      {activeProfile.bio ? ` — ${activeProfile.bio}` : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="text-unsolo-accent hover:text-unsolo-moss shrink-0 text-sm font-medium"
                >
                  Manage profile →
                </Link>
              </section>

              {/* Workspace modules */}
              <section className="mt-10">
                <h2 className="text-unsolo-primary text-xl font-bold">
                  Your {TYPE_LABELS[activeProfile.type].toLowerCase()} workspace
                </h2>
                <p className="text-unsolo-muted mt-1 text-sm">
                  {TYPE_TAGLINES[activeProfile.type]}
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {modules.map((m) => (
                    <ModuleCard key={m.key} module={m} />
                  ))}
                </div>
              </section>
            </>
          )
        )}
      </div>
    </main>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  if (module.href) {
    return (
      <Link
        href={module.href}
        className="border-unsolo-border bg-unsolo-surface hover:border-unsolo-accent group flex flex-col rounded-2xl border p-5 transition-all"
      >
        <h3 className="text-unsolo-primary font-semibold">{module.title}</h3>
        <p className="text-unsolo-muted mt-1 flex-1 text-sm">{module.description}</p>
        <span className="text-unsolo-accent mt-4 text-sm font-medium transition-transform group-hover:translate-x-0.5">
          Open →
        </span>
      </Link>
    );
  }

  return (
    <div className="border-unsolo-border bg-unsolo-surface/60 flex cursor-not-allowed flex-col rounded-2xl border p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-unsolo-primary font-semibold">{module.title}</h3>
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
          Coming soon
        </span>
      </div>
      <p className="text-unsolo-muted mt-1 flex-1 text-sm">{module.description}</p>
    </div>
  );
}
