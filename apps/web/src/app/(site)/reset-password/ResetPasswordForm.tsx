"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
        } else if (data.session) {
          setSessionReady(true);
        } else {
          setError("This password reset link is invalid or has expired.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not verify reset link.");
      }
      setVerifying(false);
    }

    checkSession();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const submittedPassword = String(formData.get("password") ?? "");
    const submittedConfirm = String(formData.get("confirm") ?? "");

    if (submittedPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (submittedPassword !== submittedConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: submittedPassword,
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        await supabase.auth.signOut();
        router.push("/login?success=password_updated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    }

    setLoading(false);
  }

  if (verifying) {
    return (
      <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-unsolo-primary text-2xl font-bold">Verifying link...</h1>
        </div>
      </main>
    );
  }

  if (!sessionReady) {
    return (
      <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-unsolo-primary text-2xl font-bold">Invalid or expired link</h1>
          <p className="text-unsolo-muted mt-4 text-sm">
            {error ?? "This password reset link is invalid or has expired."}
          </p>
          <Link
            href="/forgot-password"
            className="bg-unsolo-accent mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-unsolo-primary text-2xl font-bold">Create new password</h1>
        <p className="text-unsolo-muted mt-2 text-sm">Choose a strong new password.</p>

        <form action={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="password" className="text-unsolo-primary block text-sm font-medium">
              New password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent w-full rounded-xl border px-4 py-3 pr-20 text-sm outline-none transition focus:ring-1"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-unsolo-muted hover:text-unsolo-primary absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirm" className="text-unsolo-primary block text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-1"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-unsolo-accent w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
