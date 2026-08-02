"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { logError } from "@/app/_utils/errorLog";
import { MEMBER_LIMITS, COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { getLiveRegistrationStatus } from "@/app/2026/_actions/appConfig";
import type { TeamWithMembers, TeamBrowseItem } from "@/app/_types/registration";

/**
 * Buildathon runs a single division, there is no standard/open split, no
 * category column, and no season-phase locking. Teams are 2-6 people and are
 * open to UNSW students, students at other universities, and high schoolers
 * alike. The only gate on forming or joining a team is the registration window.
 */

// Unambiguous alphabet, no O/0 or I/1 to mistype off a slide or whiteboard.
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LENGTH = 6;

/** Postgres unique-violation SQLSTATE. */
const PG_UNIQUE_VIOLATION = "23505";

// Basic profanity word list for team name censorship.
const BLOCKED_WORDS = [
  "fuck", "shit", "ass", "bitch", "dick", "cock", "pussy", "cunt",
  "damn", "bastard", "slut", "whore", "nigger", "nigga", "faggot",
  "retard", "rape", "nazi", "hitler", "penis", "vagina", "porn",
  "sex", "hentai", "cum", "dildo", "anal", "anus",
];

function containsProfanity(name: string): boolean {
  const lower = name.toLowerCase().replace(/[^a-z]/g, " ");
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (BLOCKED_WORDS.includes(word)) return true;
  }
  // Also check substrings for common evasion (e.g. "teamfuck").
  const stripped = lower.replace(/\s+/g, "");
  for (const blocked of BLOCKED_WORDS) {
    if (stripped.includes(blocked)) return true;
  }
  return false;
}

function generateJoinCode(): string {
  const array = new Uint8Array(JOIN_CODE_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => JOIN_CODE_CHARS[b % JOIN_CODE_CHARS.length])
    .join("");
}

/**
 * Narrow a Supabase error to a unique-constraint violation, optionally on one
 * specific index. Lets us turn a raw 23505 into a sentence a human can act on.
 */
function isUniqueViolation(
  error: { code?: string; message?: string } | null,
  constraint?: string,
): boolean {
  if (error?.code !== PG_UNIQUE_VIOLATION) return false;
  if (!constraint) return true;
  return (error.message ?? "").includes(constraint);
}

/**
 * Escape LIKE wildcards so a name containing % or _ is matched literally by the
 * case-insensitive duplicate-name lookups below.
 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

async function getProfileId(userId: string): Promise<string | undefined> {
  const supabase = getSupabaseSecretClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();
  return data?.id as string | undefined;
}

/**
 * Registration window guard. Returns an error message when the window is shut,
 * or null when teams may still be created and joined.
 */
async function registrationClosedError(): Promise<string | null> {
  const status = await getLiveRegistrationStatus();
  if (status.isOpen) return null;
  return status.isUpcoming
    ? "Registration hasn't opened yet"
    : "Registration has closed";
}

// ── createTeam ───────────────────────────────────────────────────────────────

export async function createTeam(
  name: string,
): Promise<{ success: boolean; error?: string; joinCode?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const closed = await registrationClosedError();
  if (closed) return { success: false, error: closed };

  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Team name is required" };

  if (containsProfanity(trimmed)) {
    return {
      success: false,
      error:
        "Team name contains inappropriate language. Please choose another name.",
    };
  }

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  // One team per person. The database enforces this too
  // (team_members_one_team_per_profile_idx), this check exists purely to give
  // a friendlier message than a constraint violation would.
  const { data: existingMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingMembership) {
    return { success: false, error: "You are already on a team" };
  }

  // Team names are unique per year, case-insensitively (teams_name_year_idx).
  const { data: nameClash } = await supabase
    .from("teams")
    .select("id")
    .ilike("name", escapeLike(trimmed))
    .eq("competition_year", COMPETITION_YEAR)
    .limit(1)
    .maybeSingle();

  if (nameClash) {
    return { success: false, error: "A team with that name already exists" };
  }

  // Generate a unique join code, retrying on collision.
  let joinCode = generateJoinCode();
  for (let i = 0; i < 5; i++) {
    const { data: existing } = await supabase
      .from("teams")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (!existing) break;
    joinCode = generateJoinCode();
  }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      name: trimmed,
      join_code: joinCode,
      competition_year: COMPETITION_YEAR,
      created_by: profileId,
    })
    .select("id, join_code")
    .single();

  if (teamError || !team) {
    // Lost a race between the checks above and this insert.
    if (isUniqueViolation(teamError, "teams_name_year_idx")) {
      return { success: false, error: "A team with that name already exists" };
    }
    if (isUniqueViolation(teamError)) {
      // Join-code collision that survived the retry loop, most likely.
      return {
        success: false,
        error: "Something went wrong creating your team. Please try again.",
      };
    }
    await logError("team.createTeam", "Failed to create team", {
      userId,
      profileId,
      error: teamError?.message,
    });
    return { success: false, error: "Failed to create team" };
  }

  // Add the creator as captain.
  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: profileId,
    role: "captain",
  });

  if (memberError) {
    // Roll back the team so we never leave a captain-less orphan behind.
    await supabase.from("teams").delete().eq("id", team.id);

    if (isUniqueViolation(memberError)) {
      return { success: false, error: "You are already on a team" };
    }

    await logError("team.createTeam", "Failed to add captain", {
      userId,
      profileId,
      teamId: team.id,
      error: memberError.message,
    });
    return { success: false, error: "Failed to create team" };
  }

  return { success: true, joinCode: team.join_code as string };
}

// ── previewTeam ──────────────────────────────────────────────────────────────

/** Look up a team by join code so the joiner can confirm before committing. */
export async function previewTeam(joinCode: string): Promise<{
  success: boolean;
  error?: string;
  team?: { name: string; memberCount: number };
}> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const code = joinCode.trim().toUpperCase();
  if (code.length !== JOIN_CODE_LENGTH) {
    return {
      success: false,
      error: `Join code must be ${JOIN_CODE_LENGTH} characters`,
    };
  }

  const supabase = getSupabaseSecretClient();
  const { data: team } = await supabase
    .from("teams")
    .select("id, name")
    .eq("join_code", code)
    .eq("competition_year", COMPETITION_YEAR)
    .maybeSingle();

  if (!team) return { success: false, error: "Invalid join code" };

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  return {
    success: true,
    team: { name: team.name as string, memberCount: count ?? 0 },
  };
}

// ── joinTeam ─────────────────────────────────────────────────────────────────

export async function joinTeam(
  joinCode: string,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const closed = await registrationClosedError();
  if (closed) return { success: false, error: closed };

  const code = joinCode.trim().toUpperCase();
  if (code.length !== JOIN_CODE_LENGTH) {
    return {
      success: false,
      error: `Join code must be ${JOIN_CODE_LENGTH} characters`,
    };
  }

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  const { data: existingMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existingMembership) {
    return { success: false, error: "You are already on a team" };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("join_code", code)
    .eq("competition_year", COMPETITION_YEAR)
    .maybeSingle();

  if (!team) return { success: false, error: "Invalid join code" };

  // Same cap for every team, Buildathon has one division.
  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  if ((count ?? 0) >= MEMBER_LIMITS.max) {
    return { success: false, error: "This team is full" };
  }

  const { error } = await supabase.from("team_members").insert({
    team_id: team.id,
    profile_id: profileId,
    role: "member",
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return { success: false, error: "You are already on a team" };
    }
    await logError("team.joinTeam", "Failed to join team", {
      userId,
      profileId,
      teamId: team.id,
      error: error.message,
    });
    return { success: false, error: "Failed to join team" };
  }

  return { success: true };
}

// ── leaveTeam ────────────────────────────────────────────────────────────────

/**
 * Leaving is allowed regardless of the registration window, someone who can
 * no longer take part should always be able to free up their spot.
 */
export async function leaveTeam(): Promise<{
  success: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) return { success: false, error: "You are not on a team" };

  if (membership.role === "captain") {
    const { data: otherMembers } = await supabase
      .from("team_members")
      .select("id, profile_id, joined_at")
      .eq("team_id", membership.team_id)
      .neq("profile_id", profileId)
      .order("joined_at", { ascending: true });

    if (otherMembers && otherMembers.length > 0) {
      // Step down first: team_members_one_captain_idx allows only one captain
      // per team, so promoting before demoting would violate it.
      const { error: demoteError } = await supabase
        .from("team_members")
        .update({ role: "member" })
        .eq("id", membership.id);

      if (demoteError) {
        await logError("team.leaveTeam", "Failed to step down as captain", {
          userId,
          teamId: membership.team_id,
          error: demoteError.message,
        });
        return { success: false, error: "Failed to leave team" };
      }

      // Captaincy passes to the earliest-joined remaining member.
      const { error: promoteError } = await supabase
        .from("team_members")
        .update({ role: "captain" })
        .eq("id", otherMembers[0].id);

      if (promoteError) {
        // Roll back so the team is never left without a captain.
        await supabase
          .from("team_members")
          .update({ role: "captain" })
          .eq("id", membership.id);
        await logError("team.leaveTeam", "Failed to promote new captain", {
          userId,
          teamId: membership.team_id,
          error: promoteError.message,
        });
        return { success: false, error: "Failed to leave team" };
      }
    } else {
      // Solo captain, delete the team (CASCADE cleans up team_members).
      const { error: deleteError } = await supabase
        .from("teams")
        .delete()
        .eq("id", membership.team_id);

      if (deleteError) {
        await logError("team.leaveTeam", "Failed to delete solo team", {
          userId,
          teamId: membership.team_id,
          error: deleteError.message,
        });
        return { success: false, error: "Failed to leave team" };
      }
      return { success: true };
    }
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", membership.id);

  if (error) {
    await logError("team.leaveTeam", "Failed to remove membership", {
      userId,
      teamId: membership.team_id,
      error: error.message,
    });
    return { success: false, error: "Failed to leave team" };
  }

  return { success: true };
}

// ── browseTeams ──────────────────────────────────────────────────────────────

/** Roster of this year's teams, used by the "find a team" view. */
export async function browseTeams(): Promise<TeamBrowseItem[]> {
  const supabase = getSupabaseSecretClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("name, team_members(id)")
    .eq("competition_year", COMPETITION_YEAR)
    .order("name", { ascending: true });

  if (!teams) return [];

  return teams.map((t) => ({
    name: t.name as string,
    member_count: Array.isArray(t.team_members) ? t.team_members.length : 0,
  }));
}

// ── getMyTeam ────────────────────────────────────────────────────────────────

export async function getMyTeam(): Promise<TeamWithMembers | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profileId = await getProfileId(userId);
  if (!profileId) return null;

  const supabase = getSupabaseSecretClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) return null;

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .maybeSingle();

  if (!team) return null;

  const { data: members } = await supabase
    .from("team_members")
    .select("*, profile:profiles(*)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  return { ...team, members: members ?? [] } as TeamWithMembers;
}

// ── promoteMember ────────────────────────────────────────────────────────────

/** Hand captaincy to another member. Captain-only. */
export async function promoteMember(
  teamMemberId: string,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  const { data: target } = await supabase
    .from("team_members")
    .select("id, team_id, role")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (!target) return { success: false, error: "Member not found" };
  if (target.role === "captain") {
    return { success: false, error: "That member is already the captain" };
  }

  // The caller must be the captain of the target's team.
  const { data: callerMembership } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", target.team_id)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!callerMembership || callerMembership.role !== "captain") {
    return { success: false, error: "Only the captain can promote members" };
  }

  // Demote first, one captain per team is a unique index, so the reverse
  // order would be rejected.
  const { error: demoteError } = await supabase
    .from("team_members")
    .update({ role: "member" })
    .eq("id", callerMembership.id);

  if (demoteError) {
    await logError("team.promoteMember", "Failed to demote captain", {
      userId,
      teamId: target.team_id,
      error: demoteError.message,
    });
    return { success: false, error: "Failed to promote member" };
  }

  const { error: promoteError } = await supabase
    .from("team_members")
    .update({ role: "captain" })
    .eq("id", teamMemberId);

  if (promoteError) {
    // Roll back so the team keeps a captain.
    await supabase
      .from("team_members")
      .update({ role: "captain" })
      .eq("id", callerMembership.id);
    await logError("team.promoteMember", "Failed to promote member", {
      userId,
      teamId: target.team_id,
      teamMemberId,
      error: promoteError.message,
    });
    return { success: false, error: "Failed to promote member" };
  }

  return { success: true };
}

// ── renameTeam ───────────────────────────────────────────────────────────────

export async function renameTeam(
  newName: string,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const trimmed = newName.trim();
  if (!trimmed) return { success: false, error: "Team name is required" };

  if (containsProfanity(trimmed)) {
    return {
      success: false,
      error:
        "Team name contains inappropriate language. Please choose another name.",
    };
  }

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) return { success: false, error: "You are not on a team" };
  if (membership.role !== "captain") {
    return { success: false, error: "Only the captain can rename the team" };
  }

  // Case-insensitive uniqueness per year, checked here for a clear message,
  // and caught below if another request wins the race.
  const { data: nameClash } = await supabase
    .from("teams")
    .select("id")
    .ilike("name", escapeLike(trimmed))
    .eq("competition_year", COMPETITION_YEAR)
    .neq("id", membership.team_id)
    .limit(1)
    .maybeSingle();

  if (nameClash) {
    return { success: false, error: "A team with that name already exists" };
  }

  const { error } = await supabase
    .from("teams")
    .update({ name: trimmed })
    .eq("id", membership.team_id);

  if (error) {
    if (isUniqueViolation(error, "teams_name_year_idx")) {
      return { success: false, error: "A team with that name already exists" };
    }
    await logError("team.renameTeam", "Failed to rename team", {
      userId,
      teamId: membership.team_id,
      error: error.message,
    });
    return { success: false, error: "Failed to rename team" };
  }

  return { success: true };
}

// ── kickMember ───────────────────────────────────────────────────────────────

export async function kickMember(
  teamMemberId: string,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const profileId = await getProfileId(userId);
  if (!profileId) return { success: false, error: "Profile not found" };

  const supabase = getSupabaseSecretClient();

  const { data: target } = await supabase
    .from("team_members")
    .select("id, team_id, profile_id, role")
    .eq("id", teamMemberId)
    .maybeSingle();

  if (!target) return { success: false, error: "Member not found" };

  if (target.profile_id === profileId) {
    return { success: false, error: "You cannot kick yourself" };
  }

  if (target.role === "captain") {
    return { success: false, error: "You cannot kick the captain" };
  }

  // The caller must be the captain of the target's team.
  const { data: callerMembership } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", target.team_id)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!callerMembership || callerMembership.role !== "captain") {
    return { success: false, error: "Only the captain can kick members" };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", teamMemberId);

  if (error) {
    await logError("team.kickMember", "Failed to kick member", {
      userId,
      teamId: target.team_id,
      teamMemberId,
      error: error.message,
    });
    return { success: false, error: "Failed to kick member" };
  }

  return { success: true };
}
