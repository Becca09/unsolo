import { createClient } from "@/lib/supabase/server";

const API_BASE = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ServerApiError extends Error {
  constructor(
    public response: Response,
    message: string,
  ) {
    super(message);
  }
}

export async function serverApiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      throw new ServerApiError(res, json.message || json.error || text);
    } catch (err) {
      if (err instanceof ServerApiError) throw err;
      throw new ServerApiError(res, text);
    }
  }

  return res.json() as Promise<T>;
}
