import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-unsolo-light flex min-h-screen items-center justify-center px-6 py-24">
          <div className="card w-full max-w-md p-8 text-center">
            <h1 className="text-unsolo-primary text-2xl font-bold">Loading...</h1>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
