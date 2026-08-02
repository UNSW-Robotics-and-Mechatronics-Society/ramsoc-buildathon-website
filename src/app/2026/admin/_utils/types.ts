/**
 * Types shared between the admin server actions and the client components that
 * render their results. They live here rather than in an `_actions` file
 * because a `"use server"` module may only export async functions.
 */

import type { TimelineAccent } from "@/app/2026/_data/timeline";

export type { TimelineAccent };

/**
 * The editable slice of `app_config`. Buildathon has no season/phase system ,
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

/**
 * The timeline as the editor sees it. The public site gets the same schedule
 * through `_actions/timeline.ts`, but that shape drops the ids and flattens
 * `summary` to a string; the editor needs the ids to address rows.
 */
export type AdminTimelineSession = {
  id: string;
  week_id: string;
  position: number;
  day: string;
  location: string;
  /** Display string, for example "6:00 - 8:00pm". Free text, not a timestamp. */
  time: string;
};

export type AdminTimelineWeek = {
  id: string;
  week: number;
  dates: string;
  title: string;
  /** Nullable in the database, normalised to "" for the form fields. */
  summary: string;
  accent: TimelineAccent;
  sessions: AdminTimelineSession[];
};

/** The editable fields of a week, as submitted by the editor. */
export type TimelineWeekInput = {
  week: number;
  dates: string;
  title: string;
  summary: string;
  accent: TimelineAccent;
};

export type TimelineSessionInput = {
  day: string;
  location: string;
  time: string;
};

/** Options for the accent select, in the order the bricks run on the site. */
export const TIMELINE_ACCENT_OPTIONS: {
  value: TimelineAccent;
  label: string;
}[] = [
  { value: "azure", label: "Azure" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "red", label: "Red" },
];
