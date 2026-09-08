"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthResult = { success: true; email?: string } | { success: false; error: string };

const REDIRECT_URL =
  process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ?? "http://localhost:3000/auth/callback";

function normalizeError(error: { message?: string; code?: string }): string {
  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return "An account with this email already exists. Please log in instead.";
  }
  if (error.code === "invalid_credentials") {
    return "Invalid email or password.";
  }
  if (error.code === "email_not_confirmed") {
    return "Please verify your email before logging in.";
  }
  if (error.code === "same_password") {
    return "Your new password must be different from your current password.";
  }
  if (error.message?.includes("verify")) {
    return "Please check your email and confirm your address to continue.";
  }
  if (error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: REDIRECT_URL },
  });

  if (error) {
    return { success: false, error: normalizeError(error) };
  }

  revalidatePath("/");
  return { success: true };
}

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: normalizeError(error) };
  }

  revalidatePath("/");
  redirect("/dashboard");
}

export async function forgotPassword(
  _prevState: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return { success: false, error: "Email is required." };
  }

  const supabase = await createClient();

  const appUrl = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL).origin
    : "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl}/auth/callback?type=recovery&next=/reset-password`,
  });

  if (error) {
    return { success: false, error: normalizeError(error) };
  }

  return { success: true, email };
}

export async function logout(): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: normalizeError(error) };
  }

  revalidatePath("/");
  redirect("/");
}
