"use client";

import { useCallback, useEffect, useState } from "react";
import type { Profile } from "@/lib/api";

const STORAGE_KEY = "unsolo.activeProfileId";
const CHANGE_EVENT = "unsolo:active-profile-changed";

/**
 * Tracks which of the user's profiles is "active" for the authenticated
 * shell. Persisted in localStorage — this is pure UI state, not a data
 * model concept, so it intentionally does not touch the B2 schema.
 *
 * A window event keeps every hook instance (sidebar, dashboard, …) in
 * sync within the same tab.
 */
export function useActiveProfile(profiles: Profile[]): {
  activeProfile: Profile | undefined;
  setActiveProfileId: (id: string) => void;
} {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setActiveId(window.localStorage.getItem(STORAGE_KEY));

    function onChanged(e: Event) {
      setActiveId((e as CustomEvent<string>).detail ?? null);
    }
    window.addEventListener(CHANGE_EVENT, onChanged);
    return () => window.removeEventListener(CHANGE_EVENT, onChanged);
  }, []);

  const setActiveProfileId = useCallback((id: string) => {
    window.localStorage.setItem(STORAGE_KEY, id);
    setActiveId(id);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: id }));
  }, []);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? profiles[0];

  return { activeProfile, setActiveProfileId };
}
