import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const nextParam = searchParams.get("next");
  // Only allow same-origin relative paths; reject absolute/protocol-relative URLs.
  const next =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_missing_code", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(new URL("/login?error=missing_config", request.url));
  }

  const defaultRedirect = type === "recovery" ? "/reset-password" : next;
  const response = NextResponse.redirect(new URL(defaultRedirect, request.url));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorMessage = encodeURIComponent(error.message);
    const destination = new URL("/login", request.url);
    destination.searchParams.set("error", "oauth_callback_failed");
    destination.searchParams.set("message", errorMessage);
    return NextResponse.redirect(destination);
  }

  return response;
}
