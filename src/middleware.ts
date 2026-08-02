import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/2026/dashboard(.*)",
  "/2026/onboarding(.*)",
]);

/**
 * Everything under /2026/admin except the login page itself. Matching by
 * exclusion means a new admin section is protected the moment it is added —
 * the Sumobots version listed routes individually and had already drifted,
 * leaving /admin/tasks and /admin/settings unguarded.
 */
const isAdminProtectedRoute = createRouteMatcher(["/2026/admin/(.+)"]);

export default clerkMiddleware(async (auth, req) => {
  // Admin cookie check before Clerk auth
  if (isAdminProtectedRoute(req)) {
    const adminSession = req.cookies.get("admin_session");
    if (adminSession?.value !== "authenticated") {
      return NextResponse.redirect(new URL("/2026/admin", req.url));
    }
  }

  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
