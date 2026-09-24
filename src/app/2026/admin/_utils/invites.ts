import type { SignupInvite } from "@/app/2026/admin/_utils/types";

/**
 * Client-safe constants and pure helpers for late sign-up invites. Anything
 * that touches the database, cookies or Clerk lives in `invitesServer.ts` so
 * this module can be imported from client components (the admin panel) without
 * pulling server-only code into the browser bundle.
 */

/** How long a freshly issued invite link stays valid. */
export const SIGNUP_INVITE_TTL_HOURS = 72;

/**
 * The cookie an accepted invite drops so the unlock survives the whole late
 * sign-up journey — Clerk's multi-step sign-up (email verification navigates to
 * sub-routes that would otherwise drop a query param) and then onboarding and
 * team selection, which are gated on the same closed window. Scoped to the
 * competition subtree so it reaches all of those but nowhere else, and given a
 * day to live so finishing the flow in one sitting never trips the gate.
 */
export const SIGNUP_INVITE_COOKIE = "signup_invite";
export const SIGNUP_INVITE_COOKIE_PATH = "/2026";
export const SIGNUP_INVITE_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

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
