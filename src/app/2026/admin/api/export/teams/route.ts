import { NextResponse } from "next/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import type { Profile } from "@/app/_types/registration";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { isAdmin } from "@/app/2026/admin/_utils/adminAuth";
import { csvResponse, toCSV } from "@/app/2026/admin/_utils/csv";

type MemberRow = {
  id: string;
  team_id: string;
  profile_id: string;
  role: "captain" | "member";
  joined_at: string;
  profile: Profile;
};

export async function GET() {
  // Middleware already gates /2026/admin/api, but route handlers re-check so a
  // direct request can never reach the service-role client unauthenticated.
  if (!(await isAdmin())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseSecretClient();

  const { data: teams } = await supabase
    .from("teams")
    .select(
      "*, team_members(id, team_id, profile_id, role, joined_at, profile:profiles(*))",
    )
    .eq("competition_year", COMPETITION_YEAR)
    .order("created_at", { ascending: false });

  if (!teams) {
    return new NextResponse("Failed to fetch data", { status: 500 });
  }

  const headers = [
    "id",
    "name",
    "join_code",
    "paid",
    "member_count",
    "captain_name",
    "captain_email",
    "captain_zid",
    "member_names",
    "member_emails",
    "created_at",
    "updated_at",
  ];

  const rows = teams.map((t) => {
    const members: MemberRow[] = Array.isArray(t.team_members)
      ? (t.team_members as MemberRow[])
      : [];
    const captain = members.find((m) => m.role === "captain");

    return [
      t.id,
      t.name,
      t.join_code,
      t.paid,
      members.length,
      captain?.profile.full_name ?? "",
      captain?.profile.email ?? "",
      captain?.profile.zid ?? "",
      members.map((m) => m.profile.full_name).join("; "),
      members.map((m) => m.profile.email).join("; "),
      t.created_at,
      t.updated_at,
    ];
  });

  return csvResponse("buildathon-teams", toCSV(headers, rows));
}
