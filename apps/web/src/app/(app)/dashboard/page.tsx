import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api.server";
import type { Profile } from "@/lib/api";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/dashboard");
  }

  let profiles: Profile[] = [];

  try {
    profiles = await serverApiFetch<Profile[]>("/profiles/me");
  } catch {
    // Fall through so the client can show friendly error states.
  }

  return <DashboardClient profiles={profiles} email={data.user.email ?? ""} />;
}
