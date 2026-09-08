import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";

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
        <div className="hidden items-center gap-7 md:flex">
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
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-unsolo-muted hover:text-unsolo-primary hidden text-sm font-medium transition-colors sm:inline"
              >
                {user.email}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await logout();
                }}
              >
                <button
                  type="submit"
                  className="bg-unsolo-primary text-unsolo-neutral rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-unsolo-muted hover:text-unsolo-primary text-sm font-medium transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-unsolo-primary text-unsolo-neutral rounded-lg px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
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
