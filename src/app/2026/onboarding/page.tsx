import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/app/2026/_actions/profile";
import { getMyTeam } from "@/app/2026/_actions/team";
import Path from "@/app/path";
import OnboardingFlow from "./_components/OnboardingFlow";
import { getLiveRegistrationStatus } from "@/app/2026/_actions/appConfig";

/**
 * The onboarding form sits on a solid drafting panel above the blueprint grid
 * so the ruled background never fights the field labels.
 */
const PANEL =
  "drafting-frame relative rounded-xl bg-blueprint-900/92 p-5 shadow-2xl backdrop-blur-sm sm:p-8";

export default async function OnboardingPage() {
  const profile = await getProfile();
  const team = await getMyTeam();

  // Already fully onboarded.
  if (profile?.onboarded && team) {
    redirect(Path[2026].Dashboard);
  }

  const regStatus = await getLiveRegistrationStatus();

  // Registration hasn't opened / has closed and this user hasn't started , 
  // block entry. Anyone with a profile can still finish what they began.
  if (!regStatus.isOpen && !profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className={`${PANEL} w-full max-w-md text-center`}>
          <p className="spec-label">Buildathon 2026</p>
          <h2 className="mt-1 mb-3">
            {regStatus.isUpcoming ? "Registration Not Open Yet" : "Registration Closed"}
          </h2>
          <p className="font-main text-sm text-ink-dim">
            {regStatus.isUpcoming
              ? "Registration for Buildathon 2026 hasn't opened yet. Follow us on Discord or Instagram and we'll let you know the moment it does."
              : "Registration for Buildathon 2026 has closed. Follow us on Discord or Instagram for updates on next year's competition."}
          </p>
          {regStatus.nextDeadline && regStatus.nextDeadlineLabel && (
            <p className="font-blueprint mt-4 text-xs text-ink-dim uppercase">
              {regStatus.nextDeadlineLabel}:{" "}
              {regStatus.nextDeadline.toLocaleDateString("en-AU", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "Australia/Sydney",
              })}
            </p>
          )}
          <Link href={Path[2026].Root} className="text-link font-blueprint mt-6 inline-block text-xs uppercase">
            &larr; Back to Buildathon
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-8 pb-20 sm:pt-12">
      <div className="w-full max-w-lg">
        <Link
          href={Path[2026].Root}
          className="font-blueprint mb-4 inline-flex min-h-[44px] items-center gap-1.5 text-xs text-ink-dim uppercase transition-colors hover:text-ink"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Buildathon
        </Link>
        <div className={PANEL}>
          <OnboardingFlow
            hasProfile={!!profile}
            hasTeam={!!team}
            registrationOpen={regStatus.isOpen}
          />
        </div>
      </div>
    </div>
  );
}
