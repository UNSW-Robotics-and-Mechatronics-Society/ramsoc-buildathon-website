import { cookies } from "next/headers";

/**
 * The admin area is gated on a single shared-password session cookie, entirely
 * separate from Clerk. `src/middleware.ts` checks the same cookie before Clerk
 * runs, but middleware only covers page navigation — every server action and
 * route handler re-checks it here so a direct POST cannot bypass the gate.
 */
export const ADMIN_COOKIE = "admin_session";
export const ADMIN_COOKIE_VALUE = "authenticated";

/** Scoped to the admin subtree so the cookie is never sent with public pages. */
export const ADMIN_COOKIE_PATH = "/2026/admin";

/** 24 hours. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24;

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === ADMIN_COOKIE_VALUE;
}

/** Throws if the caller is not an authenticated admin. */
export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Unauthorized");
  }
}
