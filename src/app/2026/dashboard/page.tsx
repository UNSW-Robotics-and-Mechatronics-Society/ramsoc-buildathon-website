import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/app/2026/_actions/profile";
import { getMyTeam, browseTeams } from "@/app/2026/_actions/team";
import { getActiveTasks } from "@/app/2026/_actions/tasks";
import Path from "@/app/path";
import DashboardContent from "./_components/DashboardContent";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect(Path[2026].Onboarding);
  }

  const [team, tasks] = await Promise.all([getMyTeam(), getActiveTasks()]);
  const browsable = team ? [] : await browseTeams();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-28 sm:px-6 sm:pt-12 sm:pb-12">
      {/* Drafting docket header — the title block of a technical drawing. */}
      <header className="border-grid-major mb-6 border-b pb-4">
        <Link
          href={Path[2026].Root}
          className="font-blueprint text-ink-dim hover:text-ink -ml-1 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-xs uppercase transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Buildathon
        </Link>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="spec-label">Sheet 01 &middot; Entrant Record</p>
            <h1 className="text-3xl sm:text-4xl">Build Sheet</h1>
          </div>
          <dl className="font-blueprint text-ink-dim shrink-0 text-right text-[0.65rem] uppercase">
            <div className="flex justify-end gap-2">
              <dt>Event</dt>
              <dd className="text-ink">RAMSoc Buildathon</dd>
            </div>
            <div className="flex justify-end gap-2">
              <dt>Year</dt>
              <dd className="text-ink">2026</dd>
            </div>
          </dl>
        </div>
      </header>

      <DashboardContent
        profile={profile}
        team={team}
        browsableTeams={browsable}
        adminTasks={tasks}
      />
    </main>
  );
}
