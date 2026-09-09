"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";
import type { AdminAppConfig } from "@/app/2026/admin/_utils/types";

const COLUMNS =
  "competition_year, registration_opens, registration_closes, payment_deadline, competition_starts, project_deadline, updated_at";

/**
 * Buildathon has no season/phase system and no per-division settings, so
 * `app_config` holds nothing but the competition year and five dates. The
 * settings panel edits those five dates and nothing else.
 */
export async function getAdminAppConfig(): Promise<AdminAppConfig> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data, error } = await supabase
    .from("app_config")
    .select(COLUMNS)
    .eq("competition_year", COMPETITION_YEAR)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("App config not found");

  return {
    competition_year: data.competition_year,
    registration_opens: data.registration_opens ?? null,
    registration_closes: data.registration_closes ?? null,
    payment_deadline: data.payment_deadline ?? null,
    competition_starts: data.competition_starts ?? null,
    project_deadline: data.project_deadline ?? null,
    updated_at: data.updated_at ?? null,
  };
}

const DATE_LABELS: Record<string, string> = {
  registration_opens: "Registration opens",
  registration_closes: "Registration closes",
  payment_deadline: "Payment deadline",
  competition_starts: "Competition begins",
  project_deadline: "Project deadline",
};

export async function updateRegistrationDates(dates: {
  registration_opens: string;
  registration_closes: string;
  payment_deadline: string;
  competition_starts: string;
  project_deadline: string;
}): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();

  const parsed: Record<string, Date> = {
    registration_opens: new Date(dates.registration_opens),
    registration_closes: new Date(dates.registration_closes),
    payment_deadline: new Date(dates.payment_deadline),
    competition_starts: new Date(dates.competition_starts),
    project_deadline: new Date(dates.project_deadline),
  };

  for (const [key, value] of Object.entries(parsed)) {
    if (Number.isNaN(value.getTime())) {
      return { success: false, error: `Invalid date for ${DATE_LABELS[key]}` };
    }
  }

  if (parsed.registration_closes <= parsed.registration_opens) {
    return { success: false, error: "Registration must close after it opens" };
  }

  if (parsed.payment_deadline < parsed.registration_opens) {
    return {
      success: false,
      error: "The payment deadline cannot fall before registration opens",
    };
  }

  // The hero countdown runs these three as a chain, one timer at a time. Out
  // of order, a stage would sit queued behind a date that has already passed
  // and never count down at all, so reject it here rather than ship a hero
  // that quietly stops working.
  if (parsed.competition_starts <= parsed.registration_closes) {
    return {
      success: false,
      error: "The competition must begin after registration closes",
    };
  }

  if (parsed.project_deadline <= parsed.competition_starts) {
    return {
      success: false,
      error: "The project deadline must fall after the competition begins",
    };
  }

  const supabase = getSupabaseSecretClient();
  const { error } = await supabase
    .from("app_config")
    .update({
      registration_opens: parsed.registration_opens.toISOString(),
      registration_closes: parsed.registration_closes.toISOString(),
      payment_deadline: parsed.payment_deadline.toISOString(),
      competition_starts: parsed.competition_starts.toISOString(),
      project_deadline: parsed.project_deadline.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("competition_year", COMPETITION_YEAR);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
