"use server";

import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

const MIN_AGE_YEARS = 21;

export type AuthActionState = {
  error?: string;
  needsEmailConfirmation?: boolean;
};

function isOldEnough(dob: string): boolean {
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MIN_AGE_YEARS);
  return birthDate <= cutoff;
}

function safeInternalRedirect(target: string): string | null {
  return target.startsWith("/") && !target.startsWith("//") ? target : null;
}

async function signUp(
  role: "poster" | "browser",
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "");

  if (!email || !password || !dateOfBirth) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!isOldEnough(dateOfBirth)) {
    return { error: "You must be 21 or older to use Krystle's Pistols." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Something went wrong creating your account." };

  // accounts has no client insert policy — write via service role, mirroring every
  // other server-side mutation in this app.
  const serviceClient = createServiceRoleClient();
  const { error: insertError } = await serviceClient.from("accounts").insert({
    id: data.user.id,
    role,
    email,
    date_of_birth: dateOfBirth,
  });
  if (insertError) {
    return { error: "Account created but setup failed — contact support." };
  }

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  redirect(role === "poster" ? "/verify-identity" : "/");
}

export async function signUpPoster(_prevState: AuthActionState, formData: FormData) {
  return signUp("poster", formData);
}

export async function signUpBrowser(_prevState: AuthActionState, formData: FormData) {
  return signUp("browser", formData);
}

export async function logIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeInternalRedirect(String(formData.get("redirect") ?? ""));

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password." };

  const { data: account } = await supabase
    .from("accounts")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!account || account.status === "banned" || account.status === "deleted") {
    await supabase.auth.signOut();
    return { error: "This account is not available. Contact support if you believe this is an error." };
  }

  redirect(redirectTo ?? (account.role === "poster" ? "/verify-identity" : "/"));
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
