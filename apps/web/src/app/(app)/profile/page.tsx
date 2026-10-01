import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api.server";
import type { Profile, User } from "@/lib/api";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/profile");
  }

  let user: User = { id: data.user.id, createdAt: "", updatedAt: "" };
  let profiles: Profile[] = [];

  try {
    user = await serverApiFetch<User>("/users/me");
    profiles = await serverApiFetch<Profile[]>("/profiles/me");
  } catch {
    // Let the client load its own data and surface friendly errors.
  }

  return <ProfileClient initialUser={user} initialProfiles={profiles} />;
}
