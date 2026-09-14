import Link from "next/link";
import Path from "@/app/path";

/**
 * Shown in place of the card form once the paid cap is reached. The captain
 * got this far legitimately — their team is formed and has the numbers — so
 * this explains the position rather than bouncing them back to the dashboard
 * with no reason given.
 */
export default function SoldOutNotice({ cap }: { cap: number }) {
  return (
    <div className="drafting-frame bg-blueprint-900/60 flex flex-col items-center gap-5 rounded-xl px-5 py-10 text-center">
      <div
        className="bg-lego-coral/20 text-lego-coral flex h-20 w-20 items-center justify-center rounded-full"
        aria-hidden
      >
        <svg
          className="h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <div>
        <p className="spec-label">Entries closed</p>
        <h1 className="mt-1 text-3xl">Buildathon is full</h1>
        <p className="font-main text-ink-dim mt-2 text-sm">
          All {cap} team slots have been taken, so the entry fee is no longer
          being collected. Nothing has been charged to your card. Talk to an
          organiser on the Discord if you would like to go on the waitlist in
          case a slot frees up.
        </p>
      </div>
      <Link href={Path[2026].Dashboard} className="button">
        Back to dashboard
      </Link>
    </div>
  );
}
