import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-unsolo-border bg-unsolo-light/95 fixed left-0 top-0 z-50 w-full border-b backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/unsolo-8.png"
            alt="Unsolo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-display text-unsolo-primary text-base font-bold tracking-tight">
            UNSOLO
          </span>
        </Link>
        <div className={`items-center gap-7 ${user ? "flex gap-5" : "hidden md:flex"}`}>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Settings
              </Link>
            </>
          ) : (
            <>
              <a
                href="#trips"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Discover Trips
              </a>
              <a
                href="#business"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Discover Businesses
              </a>
              <a
                href="#planner"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm transition-colors"
              >
                Discover Planners
              </a>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
              <span
                className="text-unsolo-muted hidden cursor-not-allowed items-center gap-1.5 text-sm sm:inline-flex"
                title="Not available yet"
              >
                Discover
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  Soon
                </span>
              </span>
              <Link
                href="/logout"
                className="bg-unsolo-primary text-unsolo-neutral rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
              >
                Log out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-unsolo-muted hover:text-unsolo-primary hidden text-sm font-medium transition-colors sm:inline"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-unsolo-primary text-unsolo-neutral rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85 sm:px-5"
              >
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
