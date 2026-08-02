"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import {
  REGISTRATION,
  getRegistrationStatus,
  type RegistrationDates,
  type RegistrationStatus,
} from "@/app/2026/_data/registrationConfig";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";

/**
 * Live registration dates from app_config, falling back to the hardcoded
 * defaults if the row is missing or the table is unreachable, the marketing
 * site should still render if the database is down.
 */
export async function getAppConfig(): Promise<RegistrationDates> {
  // The marketing site reads this on every render, so a database outage, or a
  // local checkout with no Supabase credentials yet, must degrade to the
  // hardcoded dates rather than blanking the page.
  let data: {
    registration_opens: string | null;
    registration_closes: string | null;
    payment_deadline: string | null;
  } | null = null;

  try {
    const supabase = getSupabaseSecretClient();
    ({ data } = await supabase
      .from("app_config")
      .select("registration_opens, registration_closes, payment_deadline")
      .eq("competition_year", COMPETITION_YEAR)
      .maybeSingle());
  } catch {
    return { ...REGISTRATION };
  }

  if (!data) return { ...REGISTRATION };

  return {
    opens: data.registration_opens
      ? new Date(data.registration_opens)
      : REGISTRATION.opens,
    closes: data.registration_closes
      ? new Date(data.registration_closes)
      : REGISTRATION.closes,
    paymentDeadline: data.payment_deadline
      ? new Date(data.payment_deadline)
      : REGISTRATION.paymentDeadline,
  };
}

export async function getLiveRegistrationStatus(): Promise<RegistrationStatus> {
  return getRegistrationStatus(new Date(), await getAppConfig());
}
