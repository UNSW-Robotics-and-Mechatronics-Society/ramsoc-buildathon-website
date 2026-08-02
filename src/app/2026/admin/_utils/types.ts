/**
 * Types shared between the admin server actions and the client components that
 * render their results. They live here rather than in an `_actions` file
 * because a `"use server"` module may only export async functions.
 */

/**
 * The editable slice of `app_config`. Buildathon has no season/phase system —
 * a single registration window plus a payment deadline is the whole of it.
 * Dates are carried as ISO strings so they cross the server/client boundary
 * unambiguously.
 */
export type AdminAppConfig = {
  competition_year: number;
  registration_opens: string | null;
  registration_closes: string | null;
  payment_deadline: string | null;
  updated_at: string | null;
};

/** A row of `admin_tasks`, as shown on the Tasks tab. */
export type AdminTask = {
  id: string;
  title: string;
  description: string;
  url: string;
  active: boolean;
  created_at: string;
};
