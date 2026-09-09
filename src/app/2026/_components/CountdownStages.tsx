"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  resolveCountdownPhase,
  type CountdownPhase,
  type CountdownStage,
  type CountdownStageState,
} from "@/app/2026/_data/registrationConfig";

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Australia/Sydney",
});

const UNITS = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
] as const;

type Remaining = Record<(typeof UNITS)[number]["key"], number>;

/** Matches the fold animation in styles.css: 130ms down, then 150ms up. */
const FOLD_MS = 290;

/**
 * Stands in for a digit until the clock starts on mount. Two characters wide,
 * the same as every real value, so the flap count does not change during
 * hydration.
 */
const PLACEHOLDER = "-";

/**
 * One split-flap digit.
 *
 * The top half shows the current number and the bottom half shows the previous
 * one, with two leaves folding across the seam between them: the front leaf
 * carries the old number down and out of the way, and the back leaf brings the
 * new one up into place. Both leaves are mounted only while a flip is running,
 * which is also what restarts the CSS animation on the next one.
 */
function Flap({ char, animate }: { char: string; animate: boolean }) {
  const [view, setView] = useState({
    current: char,
    previous: null as string | null,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (view.current === char) return;

    const previous = view.current;
    // Nothing to fold away when the first real value replaces the placeholder,
    // and nothing should move at all for a viewer who asked for reduced
    // motion, so both land the new number without leaves.
    const folds = animate && previous !== PLACEHOLDER;

    // Deliberately not a cleanup: this effect re-runs as soon as its own
    // setState lands, and a cleanup would cancel the fold it just started.
    clearTimeout(timer.current);
    setView({ current: char, previous: folds ? previous : null });

    if (folds) {
      timer.current = setTimeout(
        () => setView({ current: char, previous: null }),
        FOLD_MS,
      );
    }
  }, [char, animate, view.current]);

  const { current, previous } = view;

  return (
    <span className="flap">
      <span className="flap-half flap-top">
        <span>{current}</span>
      </span>
      <span className="flap-half flap-bottom">
        <span>{previous ?? current}</span>
      </span>

      {previous !== null && (
        // Keyed on the arriving number so two flips in quick succession remount
        // the leaves and replay the fold rather than reusing a finished one.
        <Fragment key={current}>
          <span className="flap-half flap-top flap-fold">
            <span>{previous}</span>
          </span>
          <span className="flap-half flap-bottom flap-fold">
            <span>{current}</span>
          </span>
        </Fragment>
      )}
    </span>
  );
}

function FlapBoard({
  remaining,
  animate,
}: {
  remaining: Remaining | null;
  animate: boolean;
}) {
  return (
    // The digits are decorative; the sr-only summary below the stages carries
    // the same information without announcing every passing second.
    <div className="flap-board" aria-hidden>
      {UNITS.map((unit, index) => {
        const value = remaining
          ? String(remaining[unit.key]).padStart(2, "0")
          : PLACEHOLDER.repeat(2);

        return (
          <Fragment key={unit.key}>
            {index > 0 && <span className="flap-colon">:</span>}
            <div className="flap-unit">
              <div className="flap-digits">
                {value.split("").map((char, position) => (
                  <Flap key={position} char={char} animate={animate} />
                ))}
              </div>
              <span className="font-blueprint text-ink-dim text-[0.6rem] uppercase">
                {unit.label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

const MARKER: Record<CountdownStageState, string> = {
  live: "bg-lego-yellow shadow-[0_0_0_0.22rem_rgb(255_207_0/0.18)]",
  queued: "ring-lego-azure ring-1",
  past: "bg-ink-dim/40",
};

const LABEL: Record<CountdownStageState, string> = {
  live: "text-lego-yellow font-semibold",
  queued: "text-lego-azure",
  past: "text-ink-dim/55",
};

const DATE: Record<CountdownStageState, string> = {
  live: "text-ink",
  // Full strength, not dimmed: while another stage is counting, this date is
  // the thing someone reads off the hero.
  queued: "text-ink",
  past: "text-ink-dim/55 line-through",
};

/**
 * The three key dates, with a split-flap countdown on whichever one is
 * currently running.
 *
 * `initialPhase` is worked out on the server so the first paint puts the board
 * in the right stage. The clock itself only starts on mount, because a
 * server-rendered countdown cannot survive hydration.
 */
export default function CountdownStages({
  stages,
  initialPhase,
}: {
  stages: CountdownStage[];
  initialPhase: CountdownPhase;
}) {
  const [now, setNow] = useState<number | null>(null);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!query.matches);

    const onChange = (e: MediaQueryListEvent) => setAnimate(!e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      // Re-aim at the next whole second every time, so the seconds flap turns
      // over with the clock instead of drifting off it.
      timer = setTimeout(tick, 1_000 - (current % 1_000) + 20);
    };

    tick();
    return () => clearTimeout(timer);
  }, []);

  const phase =
    now === null ? initialPhase : resolveCountdownPhase(stages, now);
  const live = stages.find((stage) => stage.key === phase.liveKey) ?? null;

  let remaining: Remaining | null = null;
  if (live && now !== null) {
    const seconds = Math.max(
      0,
      Math.floor((new Date(live.at).getTime() - now) / 1_000),
    );
    remaining = {
      days: Math.floor(seconds / 86_400),
      hours: Math.floor(seconds / 3_600) % 24,
      minutes: Math.floor(seconds / 60) % 60,
      seconds: seconds % 60,
    };
  }

  let summary: string;
  if (!live) {
    summary = "Every key date has passed.";
  } else if (!remaining) {
    summary = `${live.label}: ${DATE_FORMAT.format(new Date(live.at))}.`;
  } else {
    summary =
      `${remaining.days} days, ${remaining.hours} hours and ` +
      `${remaining.minutes} minutes until ${live.label.toLowerCase()}.`;
  }

  return (
    /* A bordered slab rather than another dashed drafting frame: the spec block
       directly above already wears that treatment, and two of them stacked read
       as one repeated object instead of two different things. */
    <div className="border-grid-major bg-blueprint-900/85 w-full rounded-lg border p-4 backdrop-blur-sm sm:p-5 lg:max-w-lg">
      <p className="spec-label mb-3">Key dates</p>

      <div>
        {stages.map((stage, index) => {
          const state = phase.states[stage.key];

          return (
            <div
              key={stage.key}
              className={`flex flex-col gap-2.5 py-2.5 ${
                index > 0 ? "border-t border-dashed border-white/15" : ""
              } ${state === "live" ? "pb-4" : ""}`}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span
                  className={`font-blueprint flex items-center gap-2 text-xs uppercase ${LABEL[state]}`}
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${MARKER[state]}`}
                  />
                  {stage.label}
                </span>

                {/* Leader rule, as on a drawing's title block. */}
                <span className="h-px min-w-3 flex-1 bg-white/10" />

                <span
                  className={`font-blueprint text-xs tabular-nums ${DATE[state]}`}
                >
                  {DATE_FORMAT.format(new Date(stage.at))}
                </span>
              </div>

              {state === "live" && (
                <FlapBoard remaining={remaining} animate={animate} />
              )}

              {state === "queued" && stage.hint && (
                <p className="font-blueprint text-ink-dim/70 text-[0.65rem]">
                  {stage.hint}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
