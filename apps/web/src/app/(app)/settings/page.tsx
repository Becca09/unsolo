import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/settings");
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <h1 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">Settings</h1>
          <p className="text-unsolo-muted mt-2">Manage your Unsolo account.</p>
        </div>

        <section className="card p-6 sm:p-8">
          <h2 className="text-unsolo-primary text-lg font-semibold">Account</h2>
          <div className="mt-6 space-y-6">
            <div>
              <label className="text-unsolo-muted block text-sm font-medium">Email</label>
              <p className="text-unsolo-primary mt-1">{data.user.email}</p>
            </div>
            <div>
              <label className="text-unsolo-muted block text-sm font-medium">Password</label>
              <Link
                href="/forgot-password"
                className="text-unsolo-accent hover:text-unsolo-moss mt-1 inline-block text-sm font-medium"
              >
                Send a password reset link →
              </Link>
            </div>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="text-unsolo-primary text-lg font-semibold">Session</h2>
          <p className="text-unsolo-muted mt-1 text-sm">Sign out of Unsolo on this device.</p>
          <div className="mt-4">
            <Link
              href="/logout"
              className="border-unsolo-border text-unsolo-primary hover:bg-unsolo-subtle inline-flex rounded-full border px-6 py-2.5 text-sm font-semibold transition"
            >
              Log out
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
