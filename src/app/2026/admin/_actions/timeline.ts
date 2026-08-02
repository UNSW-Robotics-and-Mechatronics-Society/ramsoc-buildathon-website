"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import Path from "@/app/path";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import type { TimelineAccent } from "@/app/2026/_data/timeline";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";
import type {
  AdminTimelineSession,
  AdminTimelineWeek,
  TimelineSessionInput,
  TimelineWeekInput,
} from "@/app/2026/admin/_utils/types";

/**
 * The organiser-side editor for the public schedule.
 *
 * Rooms and times are confirmed with the venue week by week, so the timeline
 * has to be editable without a redeploy. Every mutation revalidates the public
 * homepage as well as this page, otherwise an edit would sit in the database
 * until the next deploy flushed the route cache.
 */

type Result = { success: boolean; error?: string };

const ACCENTS: TimelineAccent[] = ["azure", "yellow", "orange", "green", "red"];

/** Postgres unique_violation. Raised by the (competition_year, week) index. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === UNIQUE_VIOLATION;
}

function revalidateTimeline(): void {
  revalidatePath(Path[2026].Root);
  revalidatePath(Path[2026].AdminTimeline);
}

function validateWeek(input: TimelineWeekInput): string | null {
  if (!Number.isInteger(input.week) || input.week < 1 || input.week > 99) {
    return "Week must be a whole number between 1 and 99";
  }
  if (!input.dates.trim()) return "Dates are required";
  if (!input.title.trim()) return "Title is required";
  if (!ACCENTS.includes(input.accent)) return "Pick a valid accent colour";
  return null;
}

function cleanWeek(input: TimelineWeekInput) {
  return {
    week: input.week,
    dates: input.dates.trim(),
    title: input.title.trim(),
    // summary is nullable; an empty box should clear it rather than store "".
    summary: input.summary.trim() || null,
    accent: input.accent,
  };
}

// ------------------------------------------------------------------- read --

type WeekRow = {
  id: string;
  week: number;
  dates: string;
  title: string;
  summary: string | null;
  accent: string;
  timeline_sessions: {
    id: string;
    week_id: string;
    position: number;
    day: string;
    location: string;
    time: string;
  }[];
};

export async function getAdminTimeline(): Promise<AdminTimelineWeek[]> {
  await assertAdmin();
  const sb = getSupabaseSecretClient();

  const { data, error } = await sb
    .from("timeline_weeks")
    .select(
      "id, week, dates, title, summary, accent, timeline_sessions(id, week_id, position, day, location, time)",
    )
    .eq("competition_year", COMPETITION_YEAR)
    .order("week", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data as WeekRow[] | null) ?? []).map((row) => ({
    id: row.id,
    week: row.week,
    dates: row.dates,
    title: row.title,
    summary: row.summary ?? "",
    accent: (ACCENTS as string[]).includes(row.accent)
      ? (row.accent as TimelineAccent)
      : "azure",
    // Postgres gives no ordering guarantee inside an embedded select, so the
    // session order is applied here rather than trusted from the query.
    sessions: [...(row.timeline_sessions ?? [])]
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
      .map((s): AdminTimelineSession => ({
        id: s.id,
        week_id: s.week_id,
        position: s.position,
        day: s.day,
        location: s.location,
        time: s.time,
      })),
  }));
}

// ------------------------------------------------------------------ weeks --

export async function createWeek(input: TimelineWeekInput): Promise<Result> {
  await assertAdmin();

  const invalid = validateWeek(input);
  if (invalid) return { success: false, error: invalid };

  const sb = getSupabaseSecretClient();
  const { error } = await sb
    .from("timeline_weeks")
    .insert({ ...cleanWeek(input), competition_year: COMPETITION_YEAR });

  if (isUniqueViolation(error)) {
    return { success: false, error: `Week ${input.week} already exists` };
  }
  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

export async function updateWeek(
  id: string,
  input: TimelineWeekInput,
): Promise<Result> {
  await assertAdmin();

  const invalid = validateWeek(input);
  if (invalid) return { success: false, error: invalid };

  const sb = getSupabaseSecretClient();
  const { error } = await sb
    .from("timeline_weeks")
    .update(cleanWeek(input))
    .eq("id", id);

  if (isUniqueViolation(error)) {
    return {
      success: false,
      error: `Week ${input.week} is already taken by another entry`,
    };
  }
  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

export async function deleteWeek(id: string): Promise<Result> {
  await assertAdmin();

  const sb = getSupabaseSecretClient();
  // Sessions go with it: timeline_sessions.week_id cascades on delete.
  const { error } = await sb.from("timeline_weeks").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

// --------------------------------------------------------------- sessions --

/**
 * Appends a blank session to a week. day/location/time are all NOT NULL, so a
 * new row is seeded with placeholders rather than empty strings, which is also
 * what organisers want while a room is unconfirmed.
 */
export async function addSession(weekId: string): Promise<Result> {
  await assertAdmin();

  const sb = getSupabaseSecretClient();

  const { data: existing, error: readError } = await sb
    .from("timeline_sessions")
    .select("id")
    .eq("week_id", weekId);

  if (readError) return { success: false, error: readError.message };

  const { error } = await sb.from("timeline_sessions").insert({
    week_id: weekId,
    position: existing?.length ?? 0,
    day: "Tuesday",
    location: "TBC",
    time: "TBC",
  });

  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

export async function updateSession(
  id: string,
  input: TimelineSessionInput,
): Promise<Result> {
  await assertAdmin();

  const day = input.day.trim();
  const location = input.location.trim();
  const time = input.time.trim();

  if (!day) return { success: false, error: "Day is required" };
  if (!location) return { success: false, error: "Location is required" };
  if (!time) return { success: false, error: "Time is required" };

  const sb = getSupabaseSecretClient();
  const { error } = await sb
    .from("timeline_sessions")
    // "time" is a reserved word in SQL, but this goes through PostgREST as a
    // JSON key, so no quoting is needed here.
    .update({ day, location, time })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

export async function deleteSession(id: string): Promise<Result> {
  await assertAdmin();

  const sb = getSupabaseSecretClient();
  const { error } = await sb.from("timeline_sessions").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateTimeline();
  return { success: true };
}

/**
 * Swaps a session with its neighbour inside the same week.
 *
 * The whole week is renumbered from zero afterwards rather than just trading
 * two values: nothing stops positions being duplicated (the default is 0), and
 * a plain swap would leave those rows stuck against each other forever.
 */
export async function moveSession(
  id: string,
  direction: "up" | "down",
): Promise<Result> {
  await assertAdmin();

  const sb = getSupabaseSecretClient();

  const { data: session, error: sessionError } = await sb
    .from("timeline_sessions")
    .select("id, week_id")
    .eq("id", id)
    .maybeSingle();

  if (sessionError) return { success: false, error: sessionError.message };
  if (!session) return { success: false, error: "Session not found" };

  const { data: siblings, error: siblingError } = await sb
    .from("timeline_sessions")
    .select("id, position")
    .eq("week_id", session.week_id)
    .order("position", { ascending: true })
    .order("id", { ascending: true });

  if (siblingError) return { success: false, error: siblingError.message };
  if (!siblings) return { success: false, error: "Sessions not found" };

  const index = siblings.findIndex((s) => s.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= siblings.length) {
    // Already at the end of the list. Not an error, just nothing to do.
    return { success: true };
  }

  const ordered = [...siblings];
  [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

  for (const [position, row] of ordered.entries()) {
    if (row.position === position) continue;
    const { error } = await sb
      .from("timeline_sessions")
      .update({ position })
      .eq("id", row.id);
    if (error) return { success: false, error: error.message };
  }

  revalidateTimeline();
  return { success: true };
}
