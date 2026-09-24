import "server-only";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { SIGNUP_INVITE_COOKIE } from "@/app/2026/admin/_utils/invites";
import type { SignupInvite } from "@/app/2026/admin/_utils/types";

/**
 * Server-only helpers for late sign-up invites — the database, cookie and Clerk
 * side of the gate. Kept apart from the client-safe `invites.ts` so importing
 * the constants/pure helpers into the admin panel never drags this into the
 * browser bundle.
 */

/**
 * Return the invite for a token if it is currently usable — exists, not
 * revoked, not expired — otherwise null. Fails closed on any database error so
 * a lookup problem never accidentally opens the gate.
 */
export async function validateInviteToken(
  token: string | null | undefined,
): Promise<SignupInvite | null> {
  if (!token) return null;

  try {
    const supabase = getSupabaseSecretClient();
    const { data, error } = await supabase
      .from("signup_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) return null;

    const invite = data as SignupInvite;
    if (invite.revoked_at) return null;
    if (new Date(invite.expires_at).getTime() < Date.now()) return null;

    return invite;
  } catch {
    return null;
  }
}

/** Stamp the first time an invite link is opened. Best-effort, display-only. */
export async function markInviteOpened(id: string): Promise<void> {
  try {
    const supabase = getSupabaseSecretClient();
    await supabase
      .from("signup_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", id)
      .is("accepted_at", null);
  } catch {
    // A failure here only loses the "opened" marker, never the sign-up itself.
  }
}

/**
 * Is there a live (not revoked, not expired) invite for this email? Emails are
 * stored lower-cased when the invite is issued, so compare that way. This is
 * how an invited late entrant is recognised once they are signed in and past
 * the cookie's reach: their Clerk email is matched against the invite the
 * organiser issued. It only holds if they signed up with the invited address.
 */
export async function hasValidInviteForEmail(
  email: string | null | undefined,
): Promise<boolean> {
  if (!email) return false;

  try {
    const supabase = getSupabaseSecretClient();
    const { data, error } = await supabase
      .from("signup_invites")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    return !error && !!data && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Whether the current request belongs to a late entrant the organisers
 * invited, and so should pass gates that are otherwise closed (onboarding, team
 * create/join). True on either signal: the invite cookie dropped when they
 * opened their link this session, or a live invite matching their signed-in
 * email. Fails closed — any error just means "not invited", never an open gate.
 */
export async function isInvitedLateEntrant(): Promise<boolean> {
  try {
    const store = await cookies();
    if (await validateInviteToken(store.get(SIGNUP_INVITE_COOKIE)?.value)) {
      return true;
    }
  } catch {
    // No cookie store (or a read failure) just falls through to the email check.
  }

  try {
    const user = await currentUser();
    if (await hasValidInviteForEmail(user?.emailAddresses?.[0]?.emailAddress)) {
      return true;
    }
  } catch {
    // Not signed in, or Clerk unavailable: treat as not invited.
  }

  return false;
}
