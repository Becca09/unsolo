"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/api";
import { useActiveProfile } from "@/lib/active-profile";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"
      />
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0"
      />
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.3 4.3a1.7 1.7 0 013.4 0 1.7 1.7 0 002.6 1 1.7 1.7 0 012.4 2.4 1.7 1.7 0 001 2.6 1.7 1.7 0 010 3.4 1.7 1.7 0 00-1 2.6 1.7 1.7 0 01-2.4 2.4 1.7 1.7 0 00-2.6 1 1.7 1.7 0 01-3.4 0 1.7 1.7 0 00-2.6-1 1.7 1.7 0 01-2.4-2.4 1.7 1.7 0 00-1-2.6 1.7 1.7 0 010-3.4 1.7 1.7 0 001-2.6 1.7 1.7 0 012.4-2.4 1.7 1.7 0 002.6-1zM15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
  },
];

const DISCOVER_ITEMS = ["Trips", "Businesses", "Planners"];

interface AppShellProps {
  profiles: Profile[];
  email: string;
  children: React.ReactNode;
}

/**
 * Authenticated application shell — sidebar navigation on desktop,
 * slide-over drawer on mobile. The active profile shown in the sidebar
 * stays in sync with the dashboard via `useActiveProfile`.
 */
export function AppShell({ profiles, email, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { activeProfile, setActiveProfileId } = useActiveProfile(profiles);

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-5 pt-6"
        onClick={() => setMobileOpen(false)}
      >
        <Image
          src="/brand/unsolo-8.png"
          alt="Unsolo"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="font-display text-unsolo-primary text-base font-bold tracking-tight">
          UNSOLO
        </span>
      </Link>

      {/* Active profile */}
      {profiles.length > 0 && (
        <div className="px-4 pt-6">
          <ProfileSwitcher
            profiles={profiles}
            activeProfile={activeProfile}
            onSelect={setActiveProfileId}
            block
          />
        </div>
      )}

      {/* Primary nav */}
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-unsolo-subtle text-unsolo-primary"
                  : "text-unsolo-muted hover:bg-unsolo-subtle hover:text-unsolo-primary"
              }`}
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}

        {/* Discovery — not yet implemented */}
        <p className="text-unsolo-muted px-3 pb-1 pt-5 text-xs font-semibold uppercase tracking-wide">
          Discover
        </p>
        {DISCOVER_ITEMS.map((label) => (
          <div
            key={label}
            className="text-unsolo-muted/70 flex cursor-not-allowed items-center justify-between rounded-xl px-3 py-2.5 text-sm"
            title="Not available yet"
          >
            {label}
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
              Soon
            </span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-unsolo-border border-t px-4 py-4">
        <p className="text-unsolo-muted truncate px-1 text-xs">{email}</p>
        <Link
          href="/logout"
          className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle mt-3 block w-full rounded-xl border px-3 py-2 text-center text-sm font-semibold transition"
        >
          Log out
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-unsolo-light min-h-screen">
      {/* Mobile top bar */}
      <header className="border-unsolo-border bg-unsolo-surface/95 fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur-sm lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/brand/unsolo-8.png"
            alt="Unsolo"
            width={24}
            height={24}
            className="rounded-md"
          />
          <span className="font-display text-unsolo-primary text-sm font-bold tracking-tight">
            UNSOLO
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="text-unsolo-primary p-2"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="bg-unsolo-surface absolute left-0 top-0 h-full w-72 max-w-[85vw] shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="text-unsolo-muted absolute right-3 top-4 p-2"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="border-unsolo-border bg-unsolo-surface fixed inset-y-0 left-0 z-30 hidden w-64 border-r lg:block">
        {sidebar}
      </aside>

      {/* Content */}
      <div className="pt-14 lg:pl-64 lg:pt-0">{children}</div>
    </div>
  );
}
