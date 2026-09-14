"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import {
  COMPETITION_YEAR,
  describeCapacity,
  type TeamCapacity,
} from "@/app/2026/_data/teamConfig";

/**
 * How many of the capped team slots are left.
 *
 * Like getAppConfig(), this is read on every marketing render, so a database
 * outage, or a local checkout with no Supabase credentials yet, degrades to
 * `null` — the scarcity notice simply does not appear. It never invents a
 * number, and it is never the thing that gates a payment: processPayment()
 * counts again itself and fails closed if it cannot.
 */
export async function getTeamCapacity(): Promise<TeamCapacity | null> {
  try {
    const supabase = getSupabaseSecretClient();
    const { count, error } = await supabase
      .from("teams")
      .select("id", { count: "exact", head: true })
      .eq("competition_year", COMPETITION_YEAR)
      .eq("paid", true);

    if (error || count === null) return null;
    return describeCapacity(count);
  } catch {
    return null;
  }
}
