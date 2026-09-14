import type { TeamCapacity } from "@/app/2026/_data/teamConfig";

/**
 * Scarcity notice for the last few team slots.
 *
 * Deliberately silent for most of the registration window: it renders nothing
 * until the remaining count drops below LOW_SLOTS_THRESHOLD, and nothing at
 * all if capacity could not be read. A number that is always on the page stops
 * being read, and a wrong one is worse than none.
 *
 * Presentational only, and free of server imports, so it renders inside both
 * the server-rendered hero and the client-rendered portal.
 */
export default function SlotsRemaining({
  capacity,
  className = "",
}: {
  /** `null` when capacity is unknown, which renders nothing. */
  capacity: TeamCapacity | null;
  className?: string;
}) {
  if (!capacity || !capacity.isLow) return null;

  if (capacity.soldOut) {
    return (
      <div
        role="status"
        className={`border-lego-coral/50 bg-lego-coral/12 flex items-center gap-3 rounded-lg border px-4 py-3 ${className}`}
      >
        <Dot tone="coral" />
        <p className="font-blueprint text-lego-coral text-xs uppercase">
          Entries are full &mdash; all {capacity.cap} team slots have been
          taken.
        </p>
      </div>
    );
  }

  return (
    <div
      role="status"
      className={`border-lego-yellow/50 bg-lego-yellow/10 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 ${className}`}
    >
      <Dot tone="yellow" />
      <p className="font-blueprint text-ink text-xs uppercase">
        Only{" "}
        <span className="font-display text-lego-yellow text-lg font-bold">
          {capacity.remaining}
        </span>{" "}
        {capacity.remaining === 1 ? "team slot" : "team slots"} left of{" "}
        {capacity.cap}
      </p>
    </div>
  );
}

/** Pulsing marker. Motion is CSS-only, so it respects the reduced-motion rule
 *  in styles.css along with everything else. */
function Dot({ tone }: { tone: "yellow" | "coral" }) {
  const colour = tone === "yellow" ? "bg-lego-yellow" : "bg-lego-coral";
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${colour}`}
      />
      <span
        className={`relative inline-flex h-2.5 w-2.5 rounded-full ${colour}`}
      />
    </span>
  );
}
