"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_PATH,
  ADMIN_COOKIE_VALUE,
  ADMIN_SESSION_MAX_AGE,
} from "@/app/2026/admin/_utils/adminAuth";

/**
 * Compare two secrets in constant time.
 *
 * `timingSafeEqual` throws when the buffers differ in length, which would
 * itself leak the password length, so both sides are hashed to fixed-width
 * 32-byte digests first and the digests are what get compared.
 */
function secretsMatch(candidate: string, expected: string): boolean {
  const a = createHash("sha256").update(candidate, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function adminLogin(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Fail closed: an unset or blank ADMIN_PASSWORD locks the admin area rather
  // than letting an empty password through.
  if (typeof adminPassword !== "string" || adminPassword.trim() === "") {
    return { success: false, error: "Admin access is not configured" };
  }

  if (typeof password !== "string" || password.length === 0) {
    return { success: false, error: "Invalid password" };
  }

  if (!secretsMatch(password, adminPassword)) {
    return { success: false, error: "Invalid password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    path: ADMIN_COOKIE_PATH,
    maxAge: ADMIN_SESSION_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: ADMIN_COOKIE, path: ADMIN_COOKIE_PATH });
}
