"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/GoogleIcon";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start Google login.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signUp(formData);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-unsolo-primary text-2xl font-bold">Check your email</h1>
          <p className="text-unsolo-muted mt-4">
            We sent a verification link to <strong className="text-unsolo-primary">{email}</strong>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="bg-unsolo-accent mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-unsolo-primary text-2xl font-bold">Create your account</h1>
        <p className="text-unsolo-muted mt-2 text-sm">Join Unsolo and start traveling together.</p>

        <form action={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-unsolo-primary block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-unsolo-border bg-unsolo-surface text-unsolo-primary focus:border-unsolo-accent focus:ring-unsolo-accent mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-1"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-unsolo-primary block text-sm font-medium">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
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
            <p className="text-unsolo-muted mt-1 text-xs">At least 8 characters.</p>
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="bg-unsolo-border h-px flex-1" />
          <span className="text-unsolo-muted text-xs">or</span>
          <div className="bg-unsolo-border h-px flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="border-unsolo-border bg-unsolo-surface text-unsolo-primary hover:bg-unsolo-subtle flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition disabled:opacity-60"
        >
          {googleLoading ? (
            "Connecting..."
          ) : (
            <>
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </>
          )}
        </button>

        <p className="text-unsolo-muted mt-8 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-unsolo-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
