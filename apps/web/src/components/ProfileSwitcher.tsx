"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Profile } from "@/lib/api";

const TYPE_LABELS: Record<Profile["type"], string> = {
  traveller: "Traveller",
  planner: "Planner",
  business: "Business",
  host: "Host",
};

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfile: Profile | undefined;
  onSelect: (id: string) => void;
  /** Renders the trigger as a full-width row (for the sidebar). */
  block?: boolean;
}

/**
 * Dropdown for switching the active profile in the authenticated shell.
 * The selected profile drives dashboard context; selection is persisted
 * client-side via `useActiveProfile`.
 */
export function ProfileSwitcher({
  profiles,
  activeProfile,
  onSelect,
  block = false,
}: ProfileSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!activeProfile) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`border-unsolo-border bg-unsolo-surface hover:border-unsolo-accent flex items-center gap-3 border py-2 pl-4 pr-3 text-left transition-colors ${
          block ? "w-full justify-between rounded-xl" : "rounded-full"
        }`}
      >
        <span>
          <span className="text-unsolo-primary block text-sm font-semibold">
            {TYPE_LABELS[activeProfile.type]}
          </span>
          <span className="text-unsolo-muted block text-xs">@{activeProfile.username}</span>
        </span>
        <svg
          className={`text-unsolo-muted h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`border-unsolo-border bg-unsolo-surface absolute z-40 mt-2 w-64 overflow-hidden rounded-2xl border shadow-lg ${
            block ? "left-0" : "right-0"
          }`}
        >
          <p className="text-unsolo-muted px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide">
            Switch profile
          </p>
          <ul className="py-1">
            {profiles.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                  }}
                  className="hover:bg-unsolo-subtle flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                >
                  <span className="text-unsolo-accent w-4 text-sm">
                    {p.id === activeProfile.id ? "✓" : ""}
                  </span>
                  <span>
                    <span className="text-unsolo-primary block text-sm font-medium">
                      {TYPE_LABELS[p.type]}
                    </span>
                    <span className="text-unsolo-muted block text-xs">
                      {p.fullName} · @{p.username}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-unsolo-border border-t">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="text-unsolo-accent hover:bg-unsolo-subtle block px-4 py-3 text-sm font-medium transition-colors"
            >
              + Create another profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
