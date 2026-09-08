import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
      <div className="card w-full max-w-md p-8 text-center">
        <h1 className="text-unsolo-primary text-2xl font-bold">Dashboard</h1>
        <p className="text-unsolo-muted mt-4">
          You are logged in as <strong className="text-unsolo-primary">{data.user.email}</strong>.
        </p>
        <p className="text-unsolo-muted mt-2 text-xs">User ID: {data.user.id}</p>
      </div>
    </main>
  );
}
