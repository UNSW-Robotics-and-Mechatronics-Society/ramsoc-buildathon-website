"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import type { ProfileWithTeam } from "@/app/_types/registration";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";
import type { UnregisteredAccount } from "@/app/2026/admin/_utils/types";

export async function getAllProfiles(): Promise<ProfileWithTeam[]> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*, team_members(team_id, role, team:teams(name))")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load participants: ${error.message}`);
  if (!profiles) return [];

  return profiles.map((p) => {
    const membership = Array.isArray(p.team_members)
      ? p.team_members[0]
      : p.team_members;
    return {
      ...p,
      team_members: undefined,
      team_name: membership?.team?.name ?? null,
      team_id: membership?.team_id ?? null,
      team_role: membership?.role ?? null,
    } as ProfileWithTeam;
  });
}

export async function adminKickFromTeam(
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!membership) return { success: false, error: "Not on a team" };

  if (membership.role === "captain") {
    const { data: otherMembers } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", membership.team_id)
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

export async function adminDeleteProfile(
  profileId: string,
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin();
  const supabase = getSupabaseSecretClient();

  // First kick from team if needed (handles captain transfer)
  const { data: membership } = await supabase
    .from("team_members")
    .select("id, team_id, role")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (membership) {
    if (membership.role === "captain") {
      const { data: otherMembers } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", membership.team_id)
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
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

const CLERK_PAGE_SIZE = 500;

/**
 * Clerk accounts that have no profile row: people who created an account but
 * never finished onboarding. Profiles only exist once the details form is
 * submitted, so these never show up in `getAllProfiles` and have to be read
 * from Clerk itself and diffed against `profiles`.
 */
export async function getUnregisteredAccounts(): Promise<
  UnregisteredAccount[]
> {
  await assertAdmin();

  const client = await clerkClient();
  const users = [];
  for (let offset = 0; ; offset += CLERK_PAGE_SIZE) {
    const page = await client.users.getUserList({
      limit: CLERK_PAGE_SIZE,
      offset,
      orderBy: "-created_at",
    });
    users.push(...page.data);
    if (page.data.length < CLERK_PAGE_SIZE) break;
  }

  const supabase = getSupabaseSecretClient();
  const [{ data: profiles, error: profilesError }, { data: invites }] =
    await Promise.all([
      supabase.from("profiles").select("clerk_user_id"),
      supabase
        .from("signup_invites")
        .select("email")
        .is("revoked_at", null)
        .gt("expires_at", new Date().toISOString()),
    ]);

  if (profilesError) {
    throw new Error(`Could not load profiles: ${profilesError.message}`);
  }

  const registered = new Set((profiles ?? []).map((p) => p.clerk_user_id));
  // A missing invites table (migration not run) just means nobody is invited.
  const invited = new Set((invites ?? []).map((i) => i.email));

  return users
    .filter((u) => !registered.has(u.id))
    .map((u) => {
      const email = (
        u.primaryEmailAddress?.emailAddress ??
        u.emailAddresses[0]?.emailAddress ??
        ""
      ).toLowerCase();
      return {
        clerk_user_id: u.id,
        email,
        name: [u.firstName, u.lastName].filter(Boolean).join(" "),
        created_at: new Date(u.createdAt).toISOString(),
        invited: email !== "" && invited.has(email),
      };
    });
}
