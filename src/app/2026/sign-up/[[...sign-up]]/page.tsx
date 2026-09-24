import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Path from "@/app/path";
import { getLiveRegistrationStatus } from "@/app/2026/_actions/appConfig";
import { isInvitedLateEntrant } from "@/app/2026/admin/_utils/invitesServer";

export const metadata = { title: "Create an account" };

const backLinkClass =
  "font-blueprint text-ink-dim hover:text-ink inline-flex items-center gap-1.5 text-xs uppercase transition-colors";

/**
 * Sign-up is gated, not public. It opens for everyone during the registration
 * window, and once that window closes it opens only for someone arriving
 * through a valid, unexpired admin invite (see `/2026/admin/invites`). Anyone
 * else who reaches the URL directly is told registration has closed. The page
 * is intentionally unlinked from the public nav — organisers hand the invite
 * link out themselves — but the gate, not the obscurity, is what controls
 * access.
 */
export default async function SignUpPage() {
  const status = await getLiveRegistrationStatus();

  // Only consult the invite once the public window is closed: while it is open,
  // nobody needs one. An invite counts via the cookie from their link, or, if
  // they are already signed in, a live invite for their Clerk email.
  const invite = status.isOpen ? false : await isInvitedLateEntrant();

  const allowed = status.isOpen || invite;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 w-full max-w-sm">
        <Link href={Path[2026].Root} className={backLinkClass}>
          <ArrowLeft size={14} />
          Back to Buildathon
        </Link>
      </div>

      {allowed ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          {!status.isOpen && invite && (
            <p
              role="status"
              className="border-lego-yellow/50 bg-lego-yellow/10 text-ink font-main w-full rounded-md border px-4 py-3 text-sm"
            >
              You&rsquo;ve been invited to register after the public deadline.
              This link is just for you — finish creating your account below.
            </p>
          )}
          <SignUp
            signInUrl={Path[2026].SignIn}
            fallbackRedirectUrl={Path[2026].Onboarding}
          />
        </div>
      ) : (
        <div className="border-ink/15 bg-blueprint-900/60 w-full max-w-sm rounded-lg border p-6 text-center">
          <h1 className="font-display text-2xl">Registration is closed</h1>
          <p className="font-main text-ink-dim mt-2 text-sm">
            Sign-ups for Buildathon 2026 have closed. If you already have an
            account you can still{" "}
            <Link
              href={Path[2026].SignIn}
              className="text-lego-yellow underline underline-offset-2"
            >
              sign in
            </Link>
            . If you just missed the deadline, reach out to the organisers about
            a late invite.
          </p>
        </div>
      )}
    </div>
  );
}
