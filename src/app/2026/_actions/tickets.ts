"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { logError } from "@/app/_utils/errorLog";
import type { Ticket, TicketClass } from "@/app/_types/market";
import {
  EGGS,
  TICKET_COLUMNS,
  isEggSource,
  sortTickets,
} from "@/app/2026/_data/tickets";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";

/** Unique-violation code from Postgres. */
const UNIQUE_VIOLATION = "23505";

/** No 0/O or 1/I, so a serial read aloud at a stall is unambiguous. */
const SERIAL_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function makeSerial(cls: TicketClass): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const letters = Array.from(bytes.slice(0, 4), (b) =>
    SERIAL_ALPHABET.charAt(b % SERIAL_ALPHABET.length),
  ).join("");
  const digits = String(((bytes[4] << 8) | bytes[5]) % 100).padStart(2, "0");
  return `${cls}-${letters}-${digits}`;
}

async function myProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const supabase = getSupabaseSecretClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Who I am and which team I claim for. Eggs are once per team, so the team is
 * what the claim is keyed on; the profile is recorded as the finder.
 */
async function myMembership(): Promise<{
  profileId: string;
  teamId: string | null;
} | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseSecretClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, team_members(team_id)")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const membership = Array.isArray(data.team_members)
    ? data.team_members[0]
    : data.team_members;

  return {
    profileId: data.id as string,
    teamId: (membership?.team_id as string | undefined) ?? null,
  };
}

export async function getMyTickets(): Promise<Ticket[]> {
  const profileId = await myProfileId();
  if (!profileId) return [];

  const supabase = getSupabaseSecretClient();
  const { data } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("holder_id", profileId);

  return sortTickets((data ?? []) as Ticket[]);
}

export type EggStatus =
  | { state: "signed-out" }
  | { state: "no-profile" }
  | { state: "no-team" }
  | { state: "unclaimed" }
  | {
      state: "claimed";
      /** The ticket I hold from it. Null if a teammate found it, or I traded it. */
      ticket: Ticket | null;
      /** True when I am the one who found it. */
      mine: boolean;
      /** Who found it, when that was not me. */
      finder: string | null;
    };

export async function getEggStatus(source: string): Promise<EggStatus> {
  if (!isEggSource(source)) throw new Error("Unknown easter egg");

  const { userId } = await auth();
  if (!userId) return { state: "signed-out" };

  const me = await myMembership();
  if (!me) return { state: "no-profile" };
  if (!me.teamId) return { state: "no-team" };

  const supabase = getSupabaseSecretClient();
  const { data: claim } = await supabase
    .from("ticket_claims")
    .select("profile_id, finder:profiles(full_name)")
    .eq("team_id", me.teamId)
    .eq("source", source)
    .maybeSingle();

  if (!claim) return { state: "unclaimed" };

  const mine = claim.profile_id === me.profileId;
  const finderRow = Array.isArray(claim.finder) ? claim.finder[0] : claim.finder;

  if (!mine) {
    return {
      state: "claimed",
      ticket: null,
      mine: false,
      finder: (finderRow?.full_name as string | undefined) ?? null,
    };
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select(TICKET_COLUMNS)
    .eq("holder_id", me.profileId)
    .eq("minted_by", me.profileId)
    .eq("source", source)
    .maybeSingle();

  return {
    state: "claimed",
    ticket: (ticket as Ticket | null) ?? null,
    mine: true,
    finder: null,
  };
}

export type ClaimResult =
  | { success: true; ticket: Ticket }
  | {
      success: false;
      error: string;
      state?: "signed-out" | "no-profile" | "no-team" | "already-claimed";
    };

/**
 * Mint the ticket for an easter egg. The claim row is inserted first: its
 * primary key is (team_id, source), so the whole team gets one between them
 * and two tabs racing, or two teammates racing, can only mint one.
 */
export async function claimEggTicket(source: string): Promise<ClaimResult> {
  if (!isEggSource(source)) {
    return { success: false, error: "That is not a real ticket." };
  }

  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "Sign in to claim it.", state: "signed-out" };
  }

  const me = await myMembership();
  if (!me) {
    return {
      success: false,
      error: "Finish registering first, then come back for it.",
      state: "no-profile",
    };
  }
  if (!me.teamId) {
    return {
      success: false,
      error: "Tickets are earned per team, so you need to be on one to claim.",
      state: "no-team",
    };
  }

  const profileId = me.profileId;
  const supabase = getSupabaseSecretClient();
  const cls = EGGS[source].class;

  const { error: claimError } = await supabase
    .from("ticket_claims")
    .insert({ team_id: me.teamId, profile_id: profileId, source });

  if (claimError) {
    if (claimError.code === UNIQUE_VIOLATION) {
      return {
        success: false,
        error: "Your team has already claimed this one.",
        state: "already-claimed",
      };
    }
    await logError("tickets.claim", "Failed to record claim", {
      profileId,
      teamId: me.teamId,
      source,
      error: claimError.message,
    });
    return { success: false, error: "Could not claim the ticket. Try again." };
  }

  // Serial collisions are astronomically unlikely, but a retry is cheap.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("tickets")
      .insert({
        serial: makeSerial(cls),
        class: cls,
        source,
        holder_id: profileId,
        minted_by: profileId,
        competition_year: COMPETITION_YEAR,
      })
      .select(TICKET_COLUMNS)
      .single();

    if (!error && data) return { success: true, ticket: data as Ticket };
    if (error?.code === UNIQUE_VIOLATION) continue;

    // Minting failed after the claim was recorded. Release the claim so the
    // team is not locked out of an egg nobody ever got a ticket for.
    await supabase
      .from("ticket_claims")
      .delete()
      .eq("team_id", me.teamId)
      .eq("source", source);
    await logError("tickets.claim", "Failed to mint ticket", {
      profileId,
      teamId: me.teamId,
      source,
      error: error?.message,
    });
    return { success: false, error: "Could not print the ticket. Try again." };
  }

  await supabase
    .from("ticket_claims")
    .delete()
    .eq("team_id", me.teamId)
    .eq("source", source);
  return { success: false, error: "Could not print the ticket. Try again." };
}
