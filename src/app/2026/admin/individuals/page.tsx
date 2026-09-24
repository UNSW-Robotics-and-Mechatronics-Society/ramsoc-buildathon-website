import {
  getAllProfiles,
  getUnregisteredAccounts,
} from "@/app/2026/admin/_actions/individuals";
import { getAllTeams } from "@/app/2026/admin/_actions/teams";
import type { UnregisteredAccount } from "@/app/2026/admin/_utils/types";
import AdminShell from "../_components/AdminShell";
import IndividualsTable from "../_components/IndividualsTable";

export default async function AdminIndividualsPage() {
  const [profiles, teams] = await Promise.all([
    getAllProfiles(),
    getAllTeams(),
  ]);

  // Clerk is a separate service: if it is unreachable, the rest of the tab
  // still works and the Unregistered view says why it is empty.
  let unregistered: UnregisteredAccount[] = [];
  let unregisteredError: string | null = null;
  try {
    unregistered = await getUnregisteredAccounts();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === "Unauthorized") throw error;
    unregisteredError = message;
  }

  return (
    <AdminShell title="Individuals">
      <IndividualsTable
        profiles={profiles}
        teams={teams}
        unregistered={unregistered}
        unregisteredError={unregisteredError}
      />
    </AdminShell>
  );
}
