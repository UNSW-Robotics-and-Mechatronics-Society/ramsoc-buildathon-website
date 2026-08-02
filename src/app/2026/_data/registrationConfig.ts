// ── Registration window configuration ────────────────────────────────────────
// These are fallbacks only. The live values live in the app_config table and
// are editable from /2026/admin/settings.

export const REGISTRATION = {
  opens: new Date("2026-08-24T00:00:00+10:00"),
  closes: new Date("2026-09-20T23:59:59+10:00"),
  paymentDeadline: new Date("2026-10-05T23:59:59+11:00"),
} as const;

export type RegistrationDates = {
  opens: Date;
  closes: Date;
  paymentDeadline: Date;
};

export type RegistrationStatus = {
  /** Registration window is currently accepting new teams and members. */
  isOpen: boolean;
  /** Registration has not started yet. */
  isUpcoming: boolean;
  /** Captains can still pay the entry fee. */
  paymentOpen: boolean;
  /** The soonest upcoming deadline, for countdown display. */
  nextDeadline: Date | null;
  nextDeadlineLabel: string | null;
};

export function getRegistrationStatus(
  now = new Date(),
  dates: RegistrationDates = REGISTRATION,
): RegistrationStatus {
  const isUpcoming = now < dates.opens;
  const isOpen = now >= dates.opens && now < dates.closes;
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
    paymentOpen,
    nextDeadline: upcoming[0]?.date ?? null,
    nextDeadlineLabel: upcoming[0]?.label ?? null,
  };
}
