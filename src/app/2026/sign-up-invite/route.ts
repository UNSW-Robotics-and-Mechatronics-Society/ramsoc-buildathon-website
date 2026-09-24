import { NextResponse, type NextRequest } from "next/server";
import {
  SIGNUP_INVITE_COOKIE,
  SIGNUP_INVITE_COOKIE_MAX_AGE,
  SIGNUP_INVITE_COOKIE_PATH,
  markInviteOpened,
  validateInviteToken,
} from "@/app/2026/admin/_utils/invites";
import Path from "@/app/path";

/**
 * The landing point for an admin-issued invite link,
 * `/2026/sign-up-invite?token=…`. It validates the token, and on success drops
 * a short-lived, httpOnly cookie before handing the visitor to the sign-up
 * page. The cookie — not the query string — is what unlocks sign-up, so the
 * unlock survives Clerk's multi-step flow, and the raw token never lingers in
 * the address bar through email verification.
 *
 * An invalid or expired token just lands on the closed sign-up page like any
 * other uninvited visitor.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const invite = await validateInviteToken(token);

  const signUp = new URL(Path[2026].SignUp, req.url);

  if (!invite) {
    return NextResponse.redirect(signUp);
  }

  await markInviteOpened(invite.id);

  const res = NextResponse.redirect(signUp);
  res.cookies.set(SIGNUP_INVITE_COOKIE, invite.token, {
    httpOnly: true,
    path: SIGNUP_INVITE_COOKIE_PATH,
    maxAge: SIGNUP_INVITE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
