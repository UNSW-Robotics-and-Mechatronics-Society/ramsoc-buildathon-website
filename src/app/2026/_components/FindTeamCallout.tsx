import { DISCORD_INVITE } from "@/app/2026/_data/socials";
import { TIMELINE } from "@/app/2026/_data/timeline";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";

/**
 * For people who register without anyone to team up with. Shown on the
 * homepage, in the onboarding team step, and on the dashboard when someone has
 * no team yet.
 *
 * The kick-off details are read from the timeline rather than written out
 * again, so they cannot drift once rooms are confirmed.
 */
export default function FindTeamCallout({
  className = "",
}: {
  className?: string;
}) {
  const kickoff = TIMELINE[0];
  const session = kickoff.sessions[0];

  return (
    <div
      className={`border-grid-major bg-blueprint-900/85 rounded-xl border p-5 sm:p-6 ${className}`}
    >
      <p className="spec-label mb-2">No team yet?</p>
      <h3 className="text-ink mb-2">Find a team</h3>
      <p className="text-ink-dim mb-5 text-sm">
        You do not need to know anyone to enter. Plenty of people sign up on
        their own and pair up in the first week. Teams are {MEMBER_LIMITS.min}{" "}
        to {MEMBER_LIMITS.max} people.
      </p>

      <ul className="mb-5 space-y-4">
        <li className="flex gap-3">
          <span className="font-blueprint text-lego-yellow shrink-0 pt-0.5 text-xs">
            01
          </span>
          <div>
            <p className="font-display text-ink text-base uppercase">
              On the Discord
            </p>
            <p className="text-ink-dim text-sm">
              Post in the team-finding channel with what you are interested in
              building. Captains with space will come to you.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="font-blueprint text-lego-yellow shrink-0 pt-0.5 text-xs">
            02
          </span>
          <div>
            <p className="font-display text-ink text-base uppercase">
              In person at the kick-off
            </p>
            <p className="text-ink-dim text-sm">
              Come to Week {kickoff.week} ({kickoff.dates}, {session.day} at{" "}
              {session.location}). We run a team-forming session on the night,
              so turning up alone is completely normal.
            </p>
          </div>
        </li>
      </ul>

      <a
        href={DISCORD_INVITE}
        target="_blank"
        rel="noreferrer noopener"
        className="button-discord text-base"
      >
        Join the Discord
      </a>
    </div>
  );
}
