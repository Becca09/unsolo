import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
