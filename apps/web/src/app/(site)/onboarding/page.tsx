import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api.server";
import type { Profile } from "@/lib/api";
import OnboardingFlow from "./OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/onboarding");
  }

  let profiles: Profile[] = [];
  try {
    profiles = await serverApiFetch<Profile[]>("/profiles/me");
  } catch {
    // If the profile check fails, continue to onboarding and let the client handle errors.
  }

  if (profiles.length > 0) {
    redirect("/dashboard");
  }

  return <OnboardingFlow email={data.user.email ?? ""} />;
}
