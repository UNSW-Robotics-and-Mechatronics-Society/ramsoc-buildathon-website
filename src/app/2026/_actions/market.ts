"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { logError } from "@/app/_utils/errorLog";
import type {
  MarketDealer,
  MarketIdentity,
  MarketMessage,
  MarketMessageKind,
  MarketPoll,
  Ticket,
} from "@/app/_types/market";
import {
  MARKET_HISTORY,
  MARKET_MESSAGE_MAX,
  MARKET_PRESENCE_MS,
  MARKET_RATE_LIMIT_MS,
  randomAliasParts,
} from "@/app/2026/_data/market";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import {
  TICKET_CLASSES,
  TICKET_COLUMNS,
  sortTickets,
} from "@/app/2026/_data/tickets";

type SupabaseClient = ReturnType<typeof getSupabaseSecretClient>;

/**
 * A dealer, keyed by their Clerk account rather than a Buildathon profile: the
 * market is open to anyone signed in, registered or not. `profileId` is
 * filled in whenever the account has gone through onboarding, kept fresh on
 * every visit, it is what lets a dealer hold and trade tickets.
 */
type Member = {
  clerkUserId: string;
  profileId: string | null;
  alias: string | null;
  avatarSeed: number | null;
  muted: boolean;
};

/** Why someone can or cannot be in the market right now. */
export type MarketAccess =
  | { state: "signed-out" }
  | { state: "closed" }
  | { state: "muted" }
  | { state: "ok" };

const MESSAGE_SELECT =
  "id, seq, kind, body, created_at, author_id, author:market_identities(alias, avatar_seed)";

// ── access ───────────────────────────────────────────────────────────────────

async function isMarketOpen(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase
    .from("app_config")
    .select("market_open")
    .eq("competition_year", COMPETITION_YEAR)
    .maybeSingle();
  return (data?.market_open as boolean | undefined) ?? true;
}

/**
 * The full gate: signed in, market open, not muted. Nothing else. Whether a
 * Buildathon profile exists only changes what the dealer can do once inside
 * (namely, hold tickets), it never blocks the door.
 */
async function resolveAccess(): Promise<{
  access: MarketAccess;
  member?: Member;
  supabase: SupabaseClient;
}> {
  const supabase = getSupabaseSecretClient();

  const { userId } = await auth();
  if (!userId) return { access: { state: "signed-out" }, supabase };

  const [{ data: identity }, { data: profile }] = await Promise.all([
    supabase
      .from("market_identities")
      .select("alias, avatar_seed, muted")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle(),
  ]);

  if (identity?.muted) return { access: { state: "muted" }, supabase };
  if (!(await isMarketOpen(supabase))) {
    return { access: { state: "closed" }, supabase };
  }

  return {
    access: { state: "ok" },
    member: {
      clerkUserId: userId,
      profileId: (profile?.id as string | undefined) ?? null,
      alias: (identity?.alias as string | undefined) ?? null,
      avatarSeed: (identity?.avatar_seed as number | undefined) ?? null,
      muted: false,
    },
    supabase,
  };
}

// ── identity ─────────────────────────────────────────────────────────────────

/**
 * Assign a dealer name and avatar the first time someone walks in, and keep
 * `profile_id` fresh so a dealer who registers after their first visit can
 * hold tickets from then on. The alias column is unique, a collision just
 * rolls again; after a few tries a numeric suffix makes the space effectively
 * unbounded.
 */
async function ensureIdentity(
  supabase: SupabaseClient,
  member: Member,
): Promise<MarketIdentity> {
  const now = new Date().toISOString();

  if (member.alias && member.avatarSeed != null) {
    await supabase
      .from("market_identities")
      .update({ profile_id: member.profileId, last_seen: now })
      .eq("clerk_user_id", member.clerkUserId);
    return { alias: member.alias, avatarSeed: member.avatarSeed };
  }

  const seed = crypto.getRandomValues(new Uint32Array(1))[0];

  for (let attempt = 0; attempt < 8; attempt++) {
    const { adjective, noun } = randomAliasParts();
    const suffix =
      attempt < 3 ? "" : ` #${10 + Math.floor(Math.random() * 90)}`;
    const alias = `${adjective} ${noun}${suffix}`;

    const { error } = await supabase.from("market_identities").insert({
      clerk_user_id: member.clerkUserId,
      profile_id: member.profileId,
      alias,
      avatar_seed: seed,
      joined_at: now,
      last_seen: now,
    });

    if (!error) return { alias, avatarSeed: seed };
    // 23505 on clerk_user_id means a second tab won the race; on alias it
    // means try again with a different name.
    if (error.code !== "23505") {
      await logError("market.identity", "Failed to assign alias", {
        clerkUserId: member.clerkUserId,
        error: error.message,
      });
      throw new Error("Could not get you a dealer name. Try again.");
    }
  }

  // Re-read rather than trust the loop: a second tab may have won the race.
  const { data } = await supabase
    .from("market_identities")
    .select("alias, avatar_seed")
    .eq("clerk_user_id", member.clerkUserId)
    .single();

  if (!data?.alias) {
    throw new Error("Could not get you a dealer name. Try again.");
  }
  return {
    alias: data.alias as string,
    avatarSeed: (data.avatar_seed as number | null) ?? seed,
  };
}

// ── reads ────────────────────────────────────────────────────────────────────

type MessageRow = {
  id: string;
  seq: number | string;
  kind: MarketMessageKind;
  body: string;
  created_at: string;
  author_id: string | null;
  author:
    | { alias: string | null; avatar_seed: number | null }
    | { alias: string | null; avatar_seed: number | null }[]
    | null;
};

function toMessage(row: MessageRow, myClerkUserId: string): MarketMessage {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    seq: Number(row.seq),
    kind: row.kind,
    body: row.body,
    created_at: row.created_at,
    author:
      row.kind === "system" || !author?.alias
        ? null
        : { alias: author.alias, avatarSeed: author.avatar_seed ?? 0 },
    mine: row.author_id === myClerkUserId,
  };
}

async function getDealers(supabase: SupabaseClient): Promise<MarketDealer[]> {
  const cutoff = new Date(Date.now() - MARKET_PRESENCE_MS).toISOString();
  const { data } = await supabase
    .from("market_identities")
    .select("alias, avatar_seed")
    .eq("muted", false)
    .gte("last_seen", cutoff)
    .order("alias");

  return (data ?? []).map((d) => ({
    alias: d.alias as string,
    avatarSeed: (d.avatar_seed as number | null) ?? 0,
    online: true,
  }));
}

async function getHolderTickets(
  supabase: SupabaseClient,
  profileId: string | null,
): Promise<Ticket[]> {
  if (!profileId) return [];
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("holder_id", profileId);
  return sortTickets((data ?? []) as Ticket[]);
}

export type MarketRoom = {
  identity: MarketIdentity;
  messages: MarketMessage[];
  dealers: MarketDealer[];
  tickets: Ticket[];
  /** False once signed in but never onboarded: can chat, cannot hold tickets. */
  registered: boolean;
  now: string;
};

/**
 * Walk in. Assigns an identity if this is the first visit, then returns the
 * recent history and who else is around. The page calls this on the server;
 * the client keeps up with `pollMarket` from there.
 */
export async function enterMarket(): Promise<
  { access: Exclude<MarketAccess, { state: "ok" }> } | { access: { state: "ok" }; room: MarketRoom }
> {
  const { access, member, supabase } = await resolveAccess();
  if (access.state !== "ok" || !member) {
    return { access: access as Exclude<MarketAccess, { state: "ok" }> };
  }

  const identity = await ensureIdentity(supabase, member);

  const [{ data: rows }, dealers, tickets] = await Promise.all([
    supabase
      .from("market_messages")
      .select(MESSAGE_SELECT)
      .is("deleted_at", null)
      .order("seq", { ascending: false })
      .limit(MARKET_HISTORY),
    getDealers(supabase),
    getHolderTickets(supabase, member.profileId),
  ]);

  const messages = ((rows ?? []) as MessageRow[])
    .map((r) => toMessage(r, member.clerkUserId))
    .reverse();

  return {
    access: { state: "ok" },
    room: {
      identity,
      messages,
      dealers,
      tickets,
      registered: member.profileId !== null,
      now: new Date().toISOString(),
    },
  };
}

/**
 * Everything since the client's cursor: new messages by `seq`, moderated
 * messages by `deleted_at`, and who is around. `heartbeat` marks the caller
 * present; the client sends it every few polls rather than every one.
 */
export async function pollMarket(input: {
  afterSeq: number;
  since: string;
  heartbeat?: boolean;
}): Promise<MarketPoll & { reason?: MarketAccess["state"] }> {
  const now = new Date().toISOString();
  const { access, member, supabase } = await resolveAccess();
  if (access.state !== "ok" || !member) {
    return {
      messages: [],
      deletedIds: [],
      dealers: [],
      open: false,
      reason: access.state,
      now,
    };
  }

  const since = Number.isNaN(Date.parse(input.since)) ? now : input.since;

  const [{ data: rows }, { data: deleted }, dealers] = await Promise.all([
    supabase
      .from("market_messages")
      .select(MESSAGE_SELECT)
      .is("deleted_at", null)
      .gt("seq", Math.max(0, Math.floor(input.afterSeq)))
      .order("seq", { ascending: true })
      .limit(MARKET_HISTORY),
    supabase
      .from("market_messages")
      .select("id")
      .gte("deleted_at", since),
    getDealers(supabase),
    input.heartbeat
      ? supabase
          .from("market_identities")
          .update({ last_seen: now })
          .eq("clerk_user_id", member.clerkUserId)
      : Promise.resolve(),
  ]);

  return {
    messages: ((rows ?? []) as MessageRow[]).map((r) =>
      toMessage(r, member.clerkUserId),
    ),
    deletedIds: (deleted ?? []).map((d) => d.id as string),
    dealers,
    open: true,
    now,
  };
}

// ── writes ───────────────────────────────────────────────────────────────────

export async function sendMarketMessage(
  rawBody: string,
  kind: Exclude<MarketMessageKind, "system"> = "chat",
): Promise<
  { success: true; message: MarketMessage } | { success: false; error: string }
> {
  const body = rawBody.replace(/\s+/g, " ").trim();
  if (!body) return { success: false, error: "Say something first." };
  if (body.length > MARKET_MESSAGE_MAX) {
    return {
      success: false,
      error: `Keep it under ${MARKET_MESSAGE_MAX} characters.`,
    };
  }
  if (kind !== "chat" && kind !== "offer") {
    return { success: false, error: "Unknown message type." };
  }

  const { access, member, supabase } = await resolveAccess();
  if (access.state !== "ok" || !member) {
    return { success: false, error: "You are not in the market." };
  }
  const identity = await ensureIdentity(supabase, member);

  const { data: last } = await supabase
    .from("market_messages")
    .select("created_at")
    .eq("author_id", member.clerkUserId)
    .order("seq", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    last &&
    Date.now() - Date.parse(last.created_at as string) < MARKET_RATE_LIMIT_MS
  ) {
    return { success: false, error: "Easy. One at a time." };
  }

  const { data, error } = await supabase
    .from("market_messages")
    .insert({
      author_id: member.clerkUserId,
      profile_id: member.profileId,
      kind,
      body,
    })
    .select("id, seq, created_at")
    .single();

  if (error || !data) {
    await logError("market.send", "Failed to insert message", {
      clerkUserId: member.clerkUserId,
      error: error?.message,
    });
    return { success: false, error: "That did not go through. Try again." };
  }

  await supabase
    .from("market_identities")
    .update({ last_seen: data.created_at })
    .eq("clerk_user_id", member.clerkUserId);

  return {
    success: true,
    message: {
      id: data.id as string,
      seq: Number(data.seq),
      kind,
      body,
      created_at: data.created_at as string,
      author: identity,
      mine: true,
    },
  };
}

/**
 * Move one of my tickets to another dealer, by alias. Posts a system notice
 * so the room sees the trade happen. Aliases are the only handle exposed, so
 * nothing here ever reveals who either party is.
 *
 * Both sides need a Buildathon profile: tickets are only meaningful once they
 * can be shown at a workshop against a real, registered person.
 */
export async function handOverTicket(
  ticketId: string,
  toAlias: string,
): Promise<
  { success: true; tickets: Ticket[] } | { success: false; error: string }
> {
  const { access, member, supabase } = await resolveAccess();
  if (access.state !== "ok" || !member) {
    return { success: false, error: "You are not in the market." };
  }
  if (!member.profileId) {
    return {
      success: false,
      error: "Finish registering before you can hold or trade tickets.",
    };
  }
  const identity = await ensureIdentity(supabase, member);

  const target = toAlias.trim();
  if (!target) return { success: false, error: "Who is it going to?" };
  if (target.toLowerCase() === identity.alias.toLowerCase()) {
    return { success: false, error: "That is you." };
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, class, transfer_count")
    .eq("id", ticketId)
    .eq("holder_id", member.profileId)
    .maybeSingle();
  if (!ticket) return { success: false, error: "That ticket is not yours." };

  const { data: recipient } = await supabase
    .from("market_identities")
    .select("alias, profile_id, muted")
    .ilike("alias", target)
    .maybeSingle();
  if (!recipient) {
    return { success: false, error: "No dealer by that name." };
  }
  if (recipient.muted) {
    return { success: false, error: "They are not in the market any more." };
  }
  if (!recipient.profile_id) {
    return {
      success: false,
      error: "They haven't finished registering, so they can't hold tickets yet.",
    };
  }

  // Guarding on holder_id makes the transfer atomic: two tabs racing to hand
  // the same ticket to two people can only have one of them succeed.
  const { data: moved, error } = await supabase
    .from("tickets")
    .update({
      holder_id: recipient.profile_id,
      transfer_count: (ticket.transfer_count as number) + 1,
    })
    .eq("id", ticket.id)
    .eq("holder_id", member.profileId)
    .select("id");

  if (error || !moved || moved.length === 0) {
    return { success: false, error: "That ticket already changed hands." };
  }

  const cls = ticket.class as keyof typeof TICKET_CLASSES;
  await Promise.all([
    supabase.from("ticket_transfers").insert({
      ticket_id: ticket.id,
      from_id: member.profileId,
      to_id: recipient.profile_id,
    }),
    supabase.from("market_messages").insert({
      author_id: null,
      kind: "system",
      body: `${identity.alias} slid a ${TICKET_CLASSES[cls].label} ticket across the counter to ${recipient.alias}.`,
    }),
  ]);

  return {
    success: true,
    tickets: await getHolderTickets(supabase, member.profileId),
  };
}
