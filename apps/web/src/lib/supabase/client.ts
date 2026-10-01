"use client";

import { createBrowserClient } from "@supabase/ssr";

function getAllCookies(): { name: string; value: string }[] {
  if (typeof document === "undefined") return [];
  return document.cookie.split("; ").map((cookie) => {
    const [name, ...rest] = cookie.split("=");
    return {
      name: decodeURIComponent(name ?? ""),
      value: decodeURIComponent(rest.join("=") ?? ""),
    };
  });
}

function buildCookieString(name: string, value: string, options: Record<string, unknown>): string {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.path) str += `; Path=${String(options.path)}`;
  if (options.domain) str += `; Domain=${String(options.domain)}`;
  if (options.maxAge !== undefined && options.maxAge !== null)
    str += `; Max-Age=${String(options.maxAge)}`;
  if (options.expires) str += `; Expires=${new Date(options.expires as string).toUTCString()}`;
  if (options.sameSite) str += `; SameSite=${String(options.sameSite)}`;
  if (options.secure) str += "; Secure";
  return str;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }

  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        return getAllCookies();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        if (typeof document === "undefined") return;
        for (const { name, value, options } of cookiesToSet) {
          document.cookie = buildCookieString(name, value, options);
        }
      },
    },
  });
}
