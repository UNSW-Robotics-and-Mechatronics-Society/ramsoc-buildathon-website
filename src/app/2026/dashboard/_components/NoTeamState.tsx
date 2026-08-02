"use client";

import Link from "next/link";
import Card from "@/app/2026/_components/ui/Card";
import { Button } from "@/app/2026/_components/ui/Button";
import Path from "@/app/path";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";
import type { TeamBrowseItem } from "@/app/_types/registration";

export default function NoTeamState({ teams }: { teams: TeamBrowseItem[] }) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card className="bg-blueprint-900/50 p-5 text-center sm:p-6">
        <p className="spec-label">Status</p>
        <h3 className="mt-1 text-xl">No team yet</h3>
        <p className="font-main text-ink-dim mx-auto mt-2 mb-5 max-w-sm text-sm">
          Buildathon runs in teams of {MEMBER_LIMITS.min} to{" "}
          {MEMBER_LIMITS.max}. Start your own and share the join code, or enter
          a code you have been given.
        </p>
        <Link href={Path[2026].Onboarding} className="block">
          <Button size="full">Create or join a team</Button>
        </Link>
      </Card>

      {teams.length > 0 && (
        <Card className="bg-blueprint-900/50 p-4 sm:p-5">
          <p className="spec-label">Registry</p>
          <h3 className="mt-1 text-lg">Browse teams</h3>
          <p className="font-main text-ink-dim mt-1 mb-4 text-sm">
            Ask a captain for their join code — codes are not listed here.
          </p>
          <ul className="divide-y divide-white/10">
            {teams.map((team) => (
              <li
                key={team.name}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="font-main text-ink min-w-0 truncate text-sm">
                  {team.name}
                </span>
                <span className="font-blueprint text-ink-dim shrink-0 text-xs">
                  {team.member_count}/{MEMBER_LIMITS.max}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
