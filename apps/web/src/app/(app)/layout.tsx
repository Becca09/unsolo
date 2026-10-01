import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api.server";
import type { Profile } from "@/lib/api";
import { AppShell } from "@/components/AppShell";

/**
 * Authenticated app shell — sidebar navigation wraps every (app) route.
 * Fetches the caller's profiles once so the sidebar profile switcher and
 * the pages share the same data source.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/dashboard");
  }

  let profiles: Profile[] = [];
  try {
    profiles = await serverApiFetch<Profile[]>("/profiles/me");
  } catch {
    // The dashboard and profile pages surface their own error states.
  }

  return (
    <AppShell profiles={profiles} email={data.user.email ?? ""}>
      {children}
    </AppShell>
  );
}
