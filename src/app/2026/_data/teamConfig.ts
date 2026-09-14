/**
 * Buildathon 2026: one division, teams of 2-6, flat $50 entry fee per team.
 *
 * A team must reach MIN_MEMBERS before its captain can pay, the fee is per
 * team, so we do not let a solo captain lock in a team that will never field
 * a full roster.
 */
export const MEMBER_LIMITS = { min: 2, max: 6 } as const;

export const COMPETITION_YEAR = 2026;

/** Entry fee in cents. Falls back to $50 if the env var is missing/invalid. */
export function getEntryFeeCents(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_TEAM_PRICE);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

/**
 * Square keeps 2.2% of each transaction. Gross the charge up so RAMSoc nets
 * the full entry fee. Single source of truth, both the server action and the
 * payment form read this, so the displayed total always matches the charge.
 */
export const SQUARE_FEE_RATE = 0.022;

export function grossUpForSquareFee(baseCents: number): number {
  return Math.ceil(baseCents / (1 - SQUARE_FEE_RATE));
}

export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

/**
 * Hard cap on how many teams can buy their way onto the floor. Kits, mentors
 * and the MCIC makerspace only stretch this far, so the entry fee stops being
 * collected once this many teams are active.
 *
 * The cap counts *paid* teams, not formed ones: an unpaid team holds nothing,
 * and a slot is taken at the moment the captain's card clears.
 */
export const PAID_TEAM_CAP = 60;

/**
 * Only advertise the remaining count once it drops below this. Above it the
 * number is noise ("47 slots left" says nothing); below it, it is the reason
 * to register tonight rather than next week.
 */
export const LOW_SLOTS_THRESHOLD = 10;

/** How many of the capped slots are gone, and how many are left. */
export type TeamCapacity = {
  cap: number;
  paidTeams: number;
  /** Never negative: an oversell reads as zero left, not minus one. */
  remaining: number;
  soldOut: boolean;
  /** Few enough left to be worth telling people about. */
  isLow: boolean;
};

export function describeCapacity(paidTeams: number): TeamCapacity {
  const remaining = Math.max(PAID_TEAM_CAP - paidTeams, 0);
  return {
    cap: PAID_TEAM_CAP,
    paidTeams,
    remaining,
    soldOut: remaining === 0,
    isLow: remaining < LOW_SLOTS_THRESHOLD,
  };
}
