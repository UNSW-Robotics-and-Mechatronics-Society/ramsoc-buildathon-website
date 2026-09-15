"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import type { AdminMarketMessage, AdminTicketRow } from "@/app/_types/market";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";

type Result = { success: boolean; error?: string };

/** The most recent messages the console shows, deleted ones included. */
const ADMIN_HISTORY = 400;

export async function getAdminMarket(): Promise<{
  open: boolean;
  messages: AdminMarketMessage[];
  tickets: AdminTicketRow[];
}> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const [config, messages, tickets] = await Promise.all([
    supabase
      .from("app_config")
      .select("market_open")
      .eq("competition_year", COMPETITION_YEAR)
      .maybeSingle(),
    supabase
      .from("market_messages")
      .select(
        "id, seq, kind, body, created_at, deleted_at, author_id, dealer:market_identities(clerk_user_id, alias, muted, profile:profiles(full_name, email))",
      )
      .order("seq", { ascending: false })
      .limit(ADMIN_HISTORY),
    supabase
      .from("tickets")
      .select(
        "id, serial, class, source, minted_at, transfer_count, holder:profiles!tickets_holder_id_fkey(full_name, email, market_identities(alias), team_members(team:teams(name))), minter:profiles!tickets_minted_by_fkey(full_name, team_members(team:teams(name)))",
      )
      .eq("competition_year", COMPETITION_YEAR)
      .order("minted_at", { ascending: false }),
  ]);

  if (messages.error) {
    throw new Error(`Could not load the market: ${messages.error.message}`);
  }
  if (tickets.error) {
    throw new Error(`Could not load tickets: ${tickets.error.message}`);
  }

  const one = <T>(v: T | T[] | null | undefined): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

  return {
    open: (config.data?.market_open as boolean | undefined) ?? true,
    messages: (messages.data ?? []).map((m) => {
      const dealer = one(m.dealer);
      const profile = one(dealer?.profile);
      return {
        id: m.id,
        seq: Number(m.seq),
        kind: m.kind,
        body: m.body,
        created_at: m.created_at,
        deleted_at: m.deleted_at ?? null,
        alias: dealer?.alias ?? null,
        full_name: profile?.full_name ?? null,
        email: profile?.email ?? null,
        clerk_user_id: dealer?.clerk_user_id ?? m.author_id ?? null,
        registered: Boolean(profile),
        muted: Boolean(dealer?.muted),
      } as AdminMarketMessage;
    }),
    tickets: (tickets.data ?? []).map((t) => {
      const holder = one(t.holder);
      const minter = one(t.minter);
      const holderDealer = one(holder?.market_identities);
      // One team per person, so the first membership is the only one.
      type WithTeam = { team_members?: { team?: { name?: string }[] | { name?: string } | null }[] | null } | null;
      const teamOf = (p: WithTeam): string | null =>
        one(one(p?.team_members)?.team)?.name ?? null;

      return {
        id: t.id,
        serial: t.serial,
        class: t.class,
        source: t.source,
        minted_at: t.minted_at,
        transfer_count: t.transfer_count,
        holder_name: holder?.full_name ?? null,
        holder_email: holder?.email ?? null,
        holder_alias: holderDealer?.alias ?? null,
        holder_team: teamOf(holder),
        minted_by_name: minter?.full_name ?? null,
        minted_by_team: teamOf(minter),
      } as AdminTicketRow;
    }),
  };
}

export async function adminDeleteMarketMessage(id: string): Promise<Result> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();
  const { error } = await supabase
    .from("market_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminSetMarketOpen(open: boolean): Promise<Result> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { error } = await supabase
    .from("app_config")
    .update({ market_open: open })
    .eq("competition_year", COMPETITION_YEAR);
  if (error) return { success: false, error: error.message };

  await supabase.from("market_messages").insert({
    author_id: null,
    kind: "system",
    body: open
      ? "The shutters are up. The market is open."
      : "The shutters came down. Management closed the market.",
  });
  return { success: true };
}

/** Muted dealers can still read; they cannot post or trade. Keyed by Clerk id. */
export async function adminSetMarketMuted(
  clerkUserId: string,
  muted: boolean,
): Promise<Result> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();
  const { error } = await supabase
    .from("market_identities")
    .update({ muted })
    .eq("clerk_user_id", clerkUserId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminRevokeTicket(ticketId: string): Promise<Result> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();
  const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
