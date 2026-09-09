// ── Key date configuration ───────────────────────────────────────────────────
// These are fallbacks only. The live values live in the app_config table and
// are editable from /2026/admin/settings.

export const KEY_DATES = {
  opens: new Date("2026-08-24T00:00:00+10:00"),
  // Registration closes the night before the Week 1 kick-off, so the roster is
  // settled before anyone walks into MCIC.
  closes: new Date("2026-09-14T23:59:59+10:00"),
  // Payment closes with registration, which means the end of the grace period
  // below rather than the published date, so a last-minute team can still pay.
  paymentDeadline: new Date("2026-09-15T23:59:59+10:00"),
  competitionStarts: new Date("2026-09-15T18:00:00+10:00"),
  // Projects are in before the Week 6 closing presentations, same day.
  projectDeadline: new Date("2026-10-23T10:00:00+11:00"),
} as const;

/**
 * How long sign-ups keep working after the published close.
 *
 * Deliberately not advertised anywhere: the hero counts down to the published
 * date, and a deadline nobody believes is not a deadline. It exists so that
 * someone who leaves it to the last minute is not turned away over a few
 * hours.
 */
export const GRACE_PERIOD_HOURS = 24;

/** The registration window, which is all `getRegistrationStatus` needs. */
export type RegistrationDates = {
  opens: Date;
  closes: Date;
  paymentDeadline: Date;
};

/** The registration window plus the two competition milestones. */
export type KeyDates = RegistrationDates & {
  competitionStarts: Date;
  projectDeadline: Date;
};

export type RegistrationStatus = {
  /**
   * Still accepting new teams and members. Stays true through the grace
   * period, so this is the flag to gate sign-up on.
   */
  isOpen: boolean;
  /** Registration has not started yet. */
  isUpcoming: boolean;
  /** Past the published close, but inside the grace period. */
  inGracePeriod: boolean;
  /** Captains can still pay the entry fee. */
  paymentOpen: boolean;
  /** The soonest upcoming deadline, for countdown display. */
  nextDeadline: Date | null;
  nextDeadlineLabel: string | null;
};

export function getRegistrationStatus(
  now = new Date(),
  dates: RegistrationDates = KEY_DATES,
): RegistrationStatus {
  const graceCloses = new Date(
    dates.closes.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000,
  );

  const isUpcoming = now < dates.opens;
  const isOpen = now >= dates.opens && now < graceCloses;
  const inGracePeriod = now >= dates.closes && now < graceCloses;
  const paymentOpen = now < dates.paymentDeadline;

  const upcoming = [
    { date: dates.opens, label: "Registration opens" },
    { date: dates.closes, label: "Registration closes" },
    { date: dates.paymentDeadline, label: "Payment deadline" },
  ]
    .filter((d) => d.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    isOpen,
    isUpcoming,
    inGracePeriod,
    paymentOpen,
    nextDeadline: upcoming[0]?.date ?? null,
    nextDeadlineLabel: upcoming[0]?.label ?? null,
  };
}

// ── The hero countdown ───────────────────────────────────────────────────────

export type CountdownStageKey =
  "closes" | "competitionStarts" | "projectDeadline";

/**
 * `past` has landed, `live` is the one counting down, `queued` is waiting for
 * the stage before it to land.
 */
export type CountdownStageState = "past" | "live" | "queued";

export type CountdownStage = {
  key: CountdownStageKey;
  label: string;
  /** ISO 8601, so a stage crosses the server/client boundary unambiguously. */
  at: string;
  /** What has to happen before this stage starts counting. */
  hint?: string;
};

export type CountdownPhase = {
  states: Record<CountdownStageKey, CountdownStageState>;
  /** The one stage currently counting down, if any. */
  liveKey: CountdownStageKey | null;
};

/** The three milestones the hero counts down to, in the order they land. */
export function getCountdownStages(dates: KeyDates): CountdownStage[] {
  return [
    {
      key: "closes",
      label: "Registration closes",
      at: dates.closes.toISOString(),
    },
    {
      key: "competitionStarts",
      label: "Competition begins",
      at: dates.competitionStarts.toISOString(),
      hint: "Starts when registration closes",
    },
    {
      key: "projectDeadline",
      label: "Project deadline",
      at: dates.projectDeadline.toISOString(),
      hint: "Starts when the competition begins",
    },
  ];
}

/**
 * Which stage is counting, and what state each one is in.
 *
 * The stages run as a chain: a stage only starts counting once the stage
 * before it has landed, so the hero shows one timer at a time rather than
 * three at once. A stage whose predecessor has not landed stays queued even if
 * its own date has passed, which keeps the display honest if the dates are
 * ever saved out of order.
 */
export function resolveCountdownPhase(
  stages: CountdownStage[],
  now = Date.now(),
): CountdownPhase {
  const states = {} as Record<CountdownStageKey, CountdownStageState>;
  let liveKey: CountdownStageKey | null = null;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const previous = stages[i - 1];
    const armed = !previous || now >= new Date(previous.at).getTime();

    if (now >= new Date(stage.at).getTime()) {
      states[stage.key] = "past";
    } else if (armed && liveKey === null) {
      states[stage.key] = "live";
      liveKey = stage.key;
    } else {
      states[stage.key] = "queued";
    }
  }

  return { states, liveKey };
}
