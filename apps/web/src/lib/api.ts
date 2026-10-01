"use client";

import { createClient } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public response: Response,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
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
      throw new ApiError(res, json.message || json.error || text);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(res, text);
    }
  }

  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  type: "traveller" | "planner" | "business" | "host";
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  id: string;
  profileId: string;
  platform: "instagram" | "x";
  handle: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Interest {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  profileId: string;
  country: string;
  state: string;
  city: string;
  street: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayoutAccount {
  id: string;
  profileId: string;
  provider: "stripe" | "local";
  displayLabel: string | null;
  createdAt: string;
  updatedAt: string;
}
