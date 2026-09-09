"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import {
  KEY_DATES,
  getRegistrationStatus,
  type KeyDates,
  type RegistrationStatus,
} from "@/app/2026/_data/registrationConfig";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";

/**
 * Live key dates from app_config, falling back to the hardcoded defaults if
 * the row is missing or the table is unreachable, the marketing site should
 * still render if the database is down.
 */
export async function getAppConfig(): Promise<KeyDates> {
  // The marketing site reads this on every render, so a database outage, or a
  // local checkout with no Supabase credentials yet, must degrade to the
  // hardcoded dates rather than blanking the page.
  let data: {
    registration_opens: string | null;
    registration_closes: string | null;
    payment_deadline: string | null;
    competition_starts: string | null;
    project_deadline: string | null;
  } | null = null;

  try {
    const supabase = getSupabaseSecretClient();
    ({ data } = await supabase
      .from("app_config")
      .select(
        "registration_opens, registration_closes, payment_deadline, competition_starts, project_deadline",
      )
      .eq("competition_year", COMPETITION_YEAR)
      .maybeSingle());
  } catch {
    return { ...KEY_DATES };
  }

  if (!data) return { ...KEY_DATES };

  return {
    opens: data.registration_opens
      ? new Date(data.registration_opens)
      : KEY_DATES.opens,
    closes: data.registration_closes
      ? new Date(data.registration_closes)
      : KEY_DATES.closes,
    paymentDeadline: data.payment_deadline
      ? new Date(data.payment_deadline)
      : KEY_DATES.paymentDeadline,
    competitionStarts: data.competition_starts
      ? new Date(data.competition_starts)
      : KEY_DATES.competitionStarts,
    projectDeadline: data.project_deadline
      ? new Date(data.project_deadline)
      : KEY_DATES.projectDeadline,
  };
}

export async function getLiveRegistrationStatus(): Promise<RegistrationStatus> {
  return getRegistrationStatus(new Date(), await getAppConfig());
}
