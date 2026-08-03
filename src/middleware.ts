import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Path from "@/app/path";

const isProtectedRoute = createRouteMatcher([
  "/2026/dashboard(.*)",
  "/2026/onboarding(.*)",
]);

/**
 * Everything under /2026/admin except the login page itself. Matching by
 * exclusion means a new admin section is protected the moment it is added , 
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
    /*
     * Redirect signed-out visitors to sign-in explicitly rather than calling
     * auth.protect(), which responds 404 to them. A 404 on /dashboard reads as
     * a broken link, and it leaves someone who followed a bookmark with no way
     * back in. redirect_url brings them to where they were headed afterwards.
     */
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL(Path[2026].SignIn, req.url);
      signIn.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signIn);
    }
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
