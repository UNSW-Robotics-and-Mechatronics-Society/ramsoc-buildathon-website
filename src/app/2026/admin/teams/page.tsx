import { getAllTeams } from "@/app/2026/admin/_actions/teams";
import AdminShell from "../_components/AdminShell";
import TeamsTable from "../_components/TeamsTable";

export default async function AdminTeamsPage() {
  const teams = await getAllTeams();

  return (
    <AdminShell title="Teams">
      <TeamsTable teams={teams} />
    </AdminShell>
  );
}
