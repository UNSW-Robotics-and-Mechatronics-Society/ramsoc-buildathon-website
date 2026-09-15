export type TicketClass = "A" | "B" | "C";

export type Ticket = {
  id: string;
  serial: string;
  class: TicketClass;
  /** The easter egg that minted it. */
  source: string;
  minted_at: string;
  transfer_count: number;
};

/** What other people in the market see of you. Never a real name. */
export type MarketIdentity = {
  alias: string;
  avatarSeed: number;
};

export type MarketMessageKind = "chat" | "offer" | "system";

export type MarketMessage = {
  id: string;
  seq: number;
  kind: MarketMessageKind;
  body: string;
  created_at: string;
  /** Null for system notices. */
  author: MarketIdentity | null;
  mine: boolean;
  /** Client-only: shown the instant it is sent, before the server confirms. */
  pending?: boolean;
};

export type MarketDealer = MarketIdentity & {
  /** Seen in the last couple of minutes. */
  online: boolean;
};

/** One poll's worth of changes since the client's cursor. */
export type MarketPoll = {
  messages: MarketMessage[];
  deletedIds: string[];
  /** Only refreshed on heartbeat polls; undefined means "unchanged". */
  dealers?: MarketDealer[];
  open: boolean;
  /** Server clock at the time of the poll, echoed back as `since`. */
  now: string;
};

// ── admin views ──────────────────────────────────────────────────────────────

export type AdminMarketMessage = {
  id: string;
  seq: number;
  kind: MarketMessageKind;
  body: string;
  created_at: string;
  deleted_at: string | null;
  alias: string | null;
  full_name: string | null;
  email: string | null;
  /** Moderation key: identifies the dealer regardless of registration. */
  clerk_user_id: string | null;
  /** Whether this dealer has a Buildathon profile (and so can hold tickets). */
  registered: boolean;
  muted: boolean;
};

export type AdminTicketRow = Ticket & {
  holder_name: string | null;
  holder_email: string | null;
  holder_alias: string | null;
  /** The holder's team. Null if they are not on one. */
  holder_team: string | null;
  minted_by_name: string | null;
  /** The team that claimed the egg, which is who the ticket was minted for. */
  minted_by_team: string | null;
};
