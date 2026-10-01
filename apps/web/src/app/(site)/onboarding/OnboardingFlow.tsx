"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileSetupWizard from "@/app/(app)/profile/ProfileSetupWizard";

export default function OnboardingFlow({ email }: { email: string }) {
  const router = useRouter();
  const [started, setStarted] = useState(false);

  return (
    <main className="bg-unsolo-light min-h-screen px-6 py-24">
      <div className="mx-auto max-w-2xl">
        {!started ? (
          <div className="card p-8 text-center sm:p-12">
            <h1 className="text-unsolo-primary text-3xl font-bold sm:text-4xl">
              Welcome to Unsolo
            </h1>
            <p className="text-unsolo-muted mx-auto mt-4 max-w-md text-lg leading-relaxed">
              Let&apos;s get your profile ready so you can start discovering trips, businesses, and
              planners.
            </p>
            <p className="text-unsolo-muted mt-2 text-sm">Signed in as {email}</p>
            <button
              onClick={() => setStarted(true)}
              className="bg-unsolo-accent mt-8 inline-flex rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started
            </button>
          </div>
        ) : (
          <ProfileSetupWizard
            onCreated={() => {
              router.push("/dashboard");
              router.refresh();
            }}
            onCancel={() => setStarted(false)}
          />
        )}
      </div>
    </main>
  );
}
