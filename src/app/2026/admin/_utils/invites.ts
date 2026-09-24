import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import type { SignupInvite } from "@/app/2026/admin/_utils/types";

/**
 * Server-side helpers for late sign-up invites, shared by the admin actions,
 * the invite-accept route handler and the gated sign-up page. This is a plain
 * module rather than a `"use server"` one: the actions callable from the client
 * live in `_actions/invites.ts`, these are internal helpers that only ever run
 * on the server.
 */

/** How long a freshly issued invite link stays valid. */
export const SIGNUP_INVITE_TTL_HOURS = 72;

/**
 * The cookie an accepted invite drops so the unlock survives Clerk's multi-step
 * sign-up flow (email verification navigates to sub-routes and would otherwise
 * drop a query param). Scoped to the sign-up route so it is never sent
 * elsewhere, and short-lived: it only has to outlast one sign-up.
 */
export const SIGNUP_INVITE_COOKIE = "signup_invite";
export const SIGNUP_INVITE_COOKIE_PATH = "/2026/sign-up";
export const SIGNUP_INVITE_COOKIE_MAX_AGE = 60 * 60 * 2; // 2 hours

export type InviteState = "active" | "opened" | "expired" | "revoked";

/** Classify an invite for display. "opened" invites still work until expiry. */
export function inviteState(
  invite: SignupInvite,
  now = Date.now(),
): InviteState {
  if (invite.revoked_at) return "revoked";
  if (new Date(invite.expires_at).getTime() < now) return "expired";
  if (invite.accepted_at) return "opened";
  return "active";
}

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
