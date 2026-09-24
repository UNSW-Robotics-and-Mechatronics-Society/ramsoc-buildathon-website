import { listSignupInvites } from "@/app/2026/admin/_actions/invites";
import AdminShell from "../_components/AdminShell";
import InvitesPanel from "../_components/InvitesPanel";

export default async function AdminInvitesPage() {
  const invites = await listSignupInvites();

  return (
    <AdminShell title="Late sign-up invites">
      <InvitesPanel initialInvites={invites} />
    </AdminShell>
  );
}
