import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Signs the user out via Supabase (clears the auth cookies on the response
 * and revokes the session server-side), then redirects to /login.
 *
 * Implemented as a route handler instead of a Server Action so logout has a
 * plain URL — no action-id manifest that can go stale across dev-server
 * restarts or hot reloads.
 */
async function handleLogout(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
