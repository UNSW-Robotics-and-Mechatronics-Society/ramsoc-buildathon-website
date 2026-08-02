"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import type { AdminTeamRow, TeamWithMembers } from "@/app/_types/registration";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";

export async function getAllTeams(): Promise<AdminTeamRow[]> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(id, role, joined_at, profile:profiles(full_name))")
    .eq("competition_year", COMPETITION_YEAR)
    .order("created_at", { ascending: false });

  if (!teams) return [];

  type MemberRow = {
    role: "captain" | "member";
    joined_at: string;
    profile: { full_name: string | null } | null;
  };

  return teams.map((t) => {
    const members: MemberRow[] = Array.isArray(t.team_members)
      ? t.team_members
      : [];

    // member_names is ordered captain-first, then by join time, so the teams
    // table can show the captain without a second round trip.
    const ordered = [...members].sort((a, b) => {
      if (a.role !== b.role) return a.role === "captain" ? -1 : 1;
      return a.joined_at.localeCompare(b.joined_at);
    });

    return {
      ...t,
      team_members: undefined,
      member_count: members.length,
      member_names: ordered.map((m) => m.profile?.full_name ?? "-"),
    } as AdminTeamRow;
  });
}

export async function getTeamDetail(
  teamId: string,
): Promise<TeamWithMembers | null> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) return null;

  const { data: members } = await supabase
    .from("team_members")
    .select("*, profile:profiles(*)")
    .eq("team_id", team.id)
    .order("joined_at", { ascending: true });

  return { ...team, members: members ?? [] } as TeamWithMembers;
}

export async function updateTeamPaid(
  teamId: string,
  paid: boolean,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { error } = await supabase
    .from("teams")
    .update({ paid })
    .eq("id", teamId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTeamName(
  teamId: string,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  if (!name.trim()) return { success: false, error: "Name is required" };

  const supabase = getSupabaseSecretClient();
  const { error } = await supabase
    .from("teams")
    .update({ name: name.trim() })
    .eq("id", teamId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function transferCaptain(
  teamId: string,
  newCaptainProfileId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  // Demote current captain
  const { error: demoteError } = await supabase
    .from("team_members")
    .update({ role: "member" })
    .eq("team_id", teamId)
    .eq("role", "captain");

  if (demoteError) return { success: false, error: demoteError.message };

  // Promote new captain
  const { error: promoteError } = await supabase
    .from("team_members")
    .update({ role: "captain" })
    .eq("team_id", teamId)
    .eq("profile_id", newCaptainProfileId);

  if (promoteError) return { success: false, error: promoteError.message };
  return { success: true };
}

export async function adminRemoveMember(
  teamId: string,
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  // Check if this member is the captain
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", teamId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) return { success: false, error: "Member not found" };

  if (membership.role === "captain") {
    // Find next member to promote
    const { data: otherMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .neq("profile_id", profileId)
      .order("joined_at", { ascending: true })
      .limit(1);

    if (otherMembers && otherMembers.length > 0) {
      await supabase
        .from("team_members")
        .update({ role: "captain" })
        .eq("id", otherMembers[0].id);
    }
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", membership.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminDeleteTeam(
  teamId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminMoveToTeam(
  profileId: string,
  targetTeamId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  // Verify the target team exists. Buildathon runs a single division, so
  // there is no category compatibility check to make here.
  const { data: targetTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("id", targetTeamId)
    .maybeSingle();

  if (!targetTeam) return { success: false, error: "Target team not found" };

  // Remove from current team (handles captain promotion automatically)
  const { data: currentMembership } = await supabase
    .from("team_members")
    .select("id, team_id, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (currentMembership) {
    if (currentMembership.role === "captain") {
      // Promote next member to captain before removing
      const { data: others } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", currentMembership.team_id)
        .neq("profile_id", profileId)
        .order("joined_at", { ascending: true })
        .limit(1);

      if (others && others.length > 0) {
        await supabase
          .from("team_members")
          .update({ role: "captain" })
          .eq("id", others[0].id);
      } else {
        // Solo captain, delete the empty team
        await supabase
          .from("teams")
          .delete()
          .eq("id", currentMembership.team_id);
      }
    }
    await supabase.from("team_members").delete().eq("id", currentMembership.id);
  }

  // Add to new team as member
  const { error } = await supabase.from("team_members").insert({
    team_id: targetTeamId,
    profile_id: profileId,
    role: "member",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminAddToTeam(
  profileId: string,
  targetTeamId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  // Check they're not already on a team
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (existing)
    return {
      success: false,
      error: "Person is already on a team. Use Move instead.",
    };

  const { data: targetTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("id", targetTeamId)
    .maybeSingle();

  if (!targetTeam) return { success: false, error: "Target team not found" };

  const { error } = await supabase.from("team_members").insert({
    team_id: targetTeamId,
    profile_id: profileId,
    role: "member",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
