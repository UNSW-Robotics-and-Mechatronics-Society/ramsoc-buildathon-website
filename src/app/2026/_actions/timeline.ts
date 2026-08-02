"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import {
  TIMELINE,
  type TimelineWeek,
  type TimelineAccent,
} from "@/app/2026/_data/timeline";

type WeekRow = {
  week: number;
  dates: string;
  title: string;
  summary: string | null;
  accent: string;
  timeline_sessions: {
    position: number;
    day: string;
    location: string;
    time: string;
  }[];
};

const ACCENTS: TimelineAccent[] = ["azure", "yellow", "orange", "green", "red"];

function toAccent(value: string): TimelineAccent {
  return (ACCENTS as string[]).includes(value)
    ? (value as TimelineAccent)
    : "azure";
}

/**
 * The published schedule.
 *
 * Falls back to the hardcoded TIMELINE if the table is empty or unreachable.
 * This renders on the homepage, so a database outage should cost us live edits,
 * not the whole page.
 */
export async function getTimeline(): Promise<TimelineWeek[]> {
  let rows: WeekRow[] | null = null;

  try {
    const supabase = getSupabaseSecretClient();
    const { data } = await supabase
      .from("timeline_weeks")
      .select(
        "week, dates, title, summary, accent, timeline_sessions(position, day, location, time)",
      )
      .eq("competition_year", COMPETITION_YEAR)
      .order("week", { ascending: true });
    rows = (data as WeekRow[] | null) ?? null;
  } catch {
    return TIMELINE;
  }

  if (!rows || rows.length === 0) return TIMELINE;

  return rows.map((row) => ({
    week: row.week,
    dates: row.dates,
    title: row.title,
    summary: row.summary ?? "",
    accent: toAccent(row.accent),
    sessions: [...(row.timeline_sessions ?? [])]
      // Postgres does not guarantee order inside an embedded select.
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ day: s.day, location: s.location, time: s.time })),
  }));
}
