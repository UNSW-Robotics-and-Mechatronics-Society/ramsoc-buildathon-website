import { listSignupInvites } from "@/app/2026/admin/_actions/invites";
import type { SignupInvite } from "@/app/2026/admin/_utils/types";
import AdminShell from "../_components/AdminShell";
import InvitesPanel from "../_components/InvitesPanel";

export default async function AdminInvitesPage() {
  let invites: SignupInvite[] = [];
  let loadError: string | null = null;

  try {
    invites = await listSignupInvites();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Let a genuine auth failure fall through to the normal Unauthorized
    // handling rather than dressing it up as a data-load problem. Everything
    // else — most likely the migration not having run yet — is shown inline so
    // the whole admin console does not go down with it.
    if (message === "Unauthorized") throw error;
    loadError = message;
  }

  return (
    <AdminShell title="Late sign-up invites">
      <InvitesPanel initialInvites={invites} loadError={loadError} />
    </AdminShell>
  );
}
