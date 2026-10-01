"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  const success = state?.success ?? false;
  const error = (state && !state.success ? state.error : null) ?? null;
  const email = (state?.success ? state.email : "") ?? "";

  if (success) {
    return (
      <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
        <div className="card w-full max-w-md p-8 text-center">
          <h1 className="text-unsolo-primary text-2xl font-bold">Check your email</h1>
          <p className="text-unsolo-muted mt-4">
            If an account exists for <strong className="text-unsolo-primary">{email}</strong>, you
            will receive a password reset link.
          </p>
          <Link
            href="/login"
            className="bg-unsolo-accent mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-unsolo-primary text-2xl font-bold">Reset your password</h1>
        <p className="text-unsolo-muted mt-2 text-sm">
          Enter your email and we will send you a reset link.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-unsolo-primary block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              required
              autoComplete="email"
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
            disabled={isPending}
            className="bg-unsolo-accent w-full rounded-full py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="text-unsolo-muted mt-8 text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="text-unsolo-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
