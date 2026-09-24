"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";
import { SIGNUP_INVITE_TTL_HOURS } from "@/app/2026/admin/_utils/invites";
import type { SignupInvite } from "@/app/2026/admin/_utils/types";
import Path from "@/app/path";

/** URL-safe secret. 24 random bytes is plenty for a hand-issued invite. */
function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

// Deliberately liberal: this only catches an obviously malformed entry, Clerk
// is the real authority on whether an email can hold an account.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listSignupInvites(): Promise<SignupInvite[]> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data, error } = await supabase
    .from("signup_invites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load invites: ${error.message}`);
  return (data ?? []) as SignupInvite[];
}

export async function createSignupInvite(
  emailRaw: string,
  noteRaw?: string,
): Promise<{ success: boolean; invite?: SignupInvite; error?: string }> {
  await assertAdmin();

  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { success: false, error: "Enter a valid email address" };
  }

  const note = noteRaw?.trim() || null;
  const supabase = getSupabaseSecretClient();
  const expires_at = new Date(
    Date.now() + SIGNUP_INVITE_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("signup_invites")
    .insert({ email, token: generateToken(), note, expires_at })
    .select("*")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(Path[2026].AdminInvites);
  return { success: true, invite: data as SignupInvite };
}

export async function revokeSignupInvite(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { error } = await supabase
    .from("signup_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);

  if (error) return { success: false, error: error.message };

  revalidatePath(Path[2026].AdminInvites);
  return { success: true };
}
