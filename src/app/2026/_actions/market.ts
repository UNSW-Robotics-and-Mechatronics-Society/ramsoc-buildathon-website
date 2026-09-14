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

type Member = {
  id: string;
  market_alias: string | null;
  market_avatar_seed: number | null;
  market_muted: boolean;
};

/** Why someone can or cannot be in the market right now. */
export type MarketAccess =
  | { state: "signed-out" }
  | { state: "no-profile" }
  | { state: "closed" }
  | { state: "muted" }
  | { state: "ok" };

const MESSAGE_SELECT =
  "id, seq, kind, body, created_at, profile_id, author:profiles(market_alias, market_avatar_seed)";

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
 * The full gate: signed in, registered, market is open, not muted. Open to
 * every registered participant regardless of team or payment status, the
 * market is not a perk of paying, it is just a room on the site.
 */
async function resolveAccess(): Promise<{
  access: MarketAccess;
  member?: Member;
  supabase: SupabaseClient;
}> {
  const supabase = getSupabaseSecretClient();

  const { userId } = await auth();
  if (!userId) return { access: { state: "signed-out" }, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, market_alias, market_avatar_seed, market_muted")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  if (!profile) return { access: { state: "no-profile" }, supabase };

  if (!(await isMarketOpen(supabase))) {
    return { access: { state: "closed" }, supabase };
  }
  if (profile.market_muted) {
    return { access: { state: "muted" }, supabase };
  }

  return { access: { state: "ok" }, member: profile as Member, supabase };
}

// ── identity ─────────────────────────────────────────────────────────────────

/**
 * Assign a dealer name and avatar the first time someone walks in. The alias
 * column is unique, so a collision just rolls again; after a few tries a
 * numeric suffix makes the space effectively unbounded.
 */
async function ensureIdentity(
  supabase: SupabaseClient,
  member: Member,
): Promise<MarketIdentity> {
  if (member.market_alias && member.market_avatar_seed != null) {
    return { alias: member.market_alias, avatarSeed: member.market_avatar_seed };
  }

  const seed =
    member.market_avatar_seed ?? crypto.getRandomValues(new Uint32Array(1))[0];
  const now = new Date().toISOString();

  for (let attempt = 0; attempt < 8; attempt++) {
    const { adjective, noun } = randomAliasParts();
    const suffix =
      attempt < 3 ? "" : ` #${10 + Math.floor(Math.random() * 90)}`;
    const alias = `${adjective} ${noun}${suffix}`;

    const { error } = await supabase
      .from("profiles")
      .update({
        market_alias: alias,
        market_avatar_seed: seed,
        market_joined_at: now,
        market_last_seen: now,
      })
      .eq("id", member.id)
      .is("market_alias", null);

    if (error && error.code !== "23505") {
      await logError("market.identity", "Failed to assign alias", {
        profileId: member.id,
        error: error.message,
      });
      throw new Error("Could not get you a dealer name. Try again.");
    }
    if (!error) break;
  }

  // Re-read rather than trust the loop: a second tab may have won the race.
  const { data } = await supabase
    .from("profiles")
    .select("market_alias, market_avatar_seed")
    .eq("id", member.id)
    .single();

  if (!data?.market_alias) {
    throw new Error("Could not get you a dealer name. Try again.");
  }
  return {
    alias: data.market_alias as string,
    avatarSeed: (data.market_avatar_seed as number | null) ?? seed,
  };
}

// ── reads ────────────────────────────────────────────────────────────────────

type MessageRow = {
  id: string;
  seq: number | string;
  kind: MarketMessageKind;
  body: string;
  created_at: string;
  profile_id: string | null;
  author:
    | { market_alias: string | null; market_avatar_seed: number | null }
    | { market_alias: string | null; market_avatar_seed: number | null }[]
    | null;
};

function toMessage(row: MessageRow, myId: string): MarketMessage {
  const author = Array.isArray(row.author) ? row.author[0] : row.author;
  return {
    id: row.id,
    seq: Number(row.seq),
    kind: row.kind,
    body: row.body,
    created_at: row.created_at,
    author:
      row.kind === "system" || !author?.market_alias
        ? null
        : {
            alias: author.market_alias,
            avatarSeed: author.market_avatar_seed ?? 0,
          },
    mine: row.profile_id === myId,
  };
}

async function getDealers(supabase: SupabaseClient): Promise<MarketDealer[]> {
  const cutoff = new Date(Date.now() - MARKET_PRESENCE_MS).toISOString();
  const { data } = await supabase
    .from("profiles")
    .select("market_alias, market_avatar_seed")
    .not("market_alias", "is", null)
    .eq("market_muted", false)
    .gte("market_last_seen", cutoff)
    .order("market_alias");

  return (data ?? []).map((d) => ({
    alias: d.market_alias as string,
    avatarSeed: (d.market_avatar_seed as number | null) ?? 0,
    online: true,
  }));
}

async function getHolderTickets(
  supabase: SupabaseClient,
  profileId: string,
): Promise<Ticket[]> {
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
  const now = new Date().toISOString();

  await supabase
    .from("profiles")
    .update({ market_last_seen: now })
    .eq("id", member.id);

  const [{ data: rows }, dealers, tickets] = await Promise.all([
    supabase
      .from("market_messages")
      .select(MESSAGE_SELECT)
      .is("deleted_at", null)
      .order("seq", { ascending: false })
      .limit(MARKET_HISTORY),
    getDealers(supabase),
    getHolderTickets(supabase, member.id),
  ]);

  const messages = ((rows ?? []) as MessageRow[])
    .map((r) => toMessage(r, member.id))
    .reverse();

  return {
    access: { state: "ok" },
    room: { identity, messages, dealers, tickets, now },
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
          .from("profiles")
          .update({ market_last_seen: now })
          .eq("id", member.id)
      : Promise.resolve(),
  ]);

  return {
    messages: ((rows ?? []) as MessageRow[]).map((r) => toMessage(r, member.id)),
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
    .eq("profile_id", member.id)
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
    .insert({ profile_id: member.id, kind, body })
    .select("id, seq, created_at")
    .single();

  if (error || !data) {
    await logError("market.send", "Failed to insert message", {
      profileId: member.id,
      error: error?.message,
    });
    return { success: false, error: "That did not go through. Try again." };
  }

  await supabase
    .from("profiles")
    .update({ market_last_seen: data.created_at })
    .eq("id", member.id);

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
    .eq("holder_id", member.id)
    .maybeSingle();
  if (!ticket) return { success: false, error: "That ticket is not yours." };

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, market_alias, market_muted")
    .ilike("market_alias", target)
    .maybeSingle();
  if (!recipient) {
    return { success: false, error: "No dealer by that name." };
  }
  if (recipient.market_muted) {
    return { success: false, error: "They are not in the market any more." };
  }

  // Guarding on holder_id makes the transfer atomic: two tabs racing to hand
  // the same ticket to two people can only have one of them succeed.
  const { data: moved, error } = await supabase
    .from("tickets")
    .update({
      holder_id: recipient.id,
      transfer_count: (ticket.transfer_count as number) + 1,
    })
    .eq("id", ticket.id)
    .eq("holder_id", member.id)
    .select("id");

  if (error || !moved || moved.length === 0) {
    return { success: false, error: "That ticket already changed hands." };
  }

  const cls = ticket.class as keyof typeof TICKET_CLASSES;
  await Promise.all([
    supabase.from("ticket_transfers").insert({
      ticket_id: ticket.id,
      from_id: member.id,
      to_id: recipient.id,
    }),
    supabase.from("market_messages").insert({
      profile_id: null,
      kind: "system",
      body: `${identity.alias} slid a ${TICKET_CLASSES[cls].label} ticket across the counter to ${recipient.market_alias}.`,
    }),
  ]);

  return { success: true, tickets: await getHolderTickets(supabase, member.id) };
}
