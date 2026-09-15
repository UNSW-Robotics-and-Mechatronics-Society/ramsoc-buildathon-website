import type { TicketClass } from "@/app/_types/market";

/**
 * Bonus component-shop tickets, minted by easter eggs around the site. Teams
 * earn their regular tickets by turning up to workshops; these are extra, and
 * classed so the shop can weight them: A is worth the most, C the least.
 *
 * Colours are LEGO brick colours so a ticket reads as part of the set. Each
 * class carries its own ink colour that clears contrast on that brick.
 */
export const TICKET_CLASSES: Record<
  TicketClass,
  { label: string; brick: string; ink: string; rank: number }
> = {
  A: { label: "Class A", brick: "#d9202a", ink: "#ffffff", rank: 3 },
  B: { label: "Class B", brick: "#0d69ab", ink: "#ffffff", rank: 2 },
  C: { label: "Class C", brick: "#a0a5a9", ink: "#06264d", rank: 1 },
};

/**
 * Every easter egg that can mint a ticket, keyed by the `source` stored on
 * the ticket. The class is decided here, server-side, never by the client.
 */
export const EGGS = {
  logo6: {
    class: "A",
    title: "Six taps",
    blurb: "You knocked on the logo six times. Somebody answered.",
  },
  rambo: {
    class: "B",
    title: "Rambo",
    blurb: "You found the mascot's page. He's been expecting you.",
  },
  "67": {
    class: "C",
    title: "Six seven",
    blurb: "Six... seven. You know what you did.",
  },
  typeRambo: {
    class: "C",
    title: "Said his name",
    blurb: "You typed it. He heard.",
  },
  faq17: {
    class: "C",
    title: "The seventeenth question",
    blurb: "You opened every single FAQ. Nobody does that.",
  },
  typewriter: {
    class: "B",
    title: "Read the fine print",
    blurb: "One in fifty. You caught the typewriter slipping.",
  },
  cornerRambo: {
    class: "B",
    title: "Caught him",
    blurb: "He was only half in the room. You grabbed him anyway.",
  },
} as const satisfies Record<
  string,
  { class: TicketClass; title: string; blurb: string }
>;

export type EggSource = keyof typeof EGGS;

/** The columns a ticket carries to the client. Never the holder. */
export const TICKET_COLUMNS =
  "id, serial, class, source, minted_at, transfer_count";

export function isEggSource(value: string): value is EggSource {
  return Object.prototype.hasOwnProperty.call(EGGS, value);
}

/** How many taps on the nav logo open the egg, and how quickly. */
export const LOGO_EGG_TAPS = 6;
export const LOGO_EGG_WINDOW_MS = 5000;

/**
 * Query-string flag the sign-in redirect carries back, so a ticket found while
 * signed out is claimed automatically once the person is back on the page.
 */
export const CLAIM_PARAM = "claim";

export function sortTickets<T extends { class: TicketClass; minted_at: string }>(
  tickets: T[],
): T[] {
  return [...tickets].sort(
    (a, b) =>
      TICKET_CLASSES[b.class].rank - TICKET_CLASSES[a.class].rank ||
      b.minted_at.localeCompare(a.minted_at),
  );
}
