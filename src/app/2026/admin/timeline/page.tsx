import { getAdminTimeline } from "@/app/2026/admin/_actions/timeline";
import AdminShell from "../_components/AdminShell";
import TimelineEditor from "../_components/TimelineEditor";

export default async function AdminTimelinePage() {
  const weeks = await getAdminTimeline();

  return (
    <AdminShell title="Timeline">
      <TimelineEditor weeks={weeks} />
    </AdminShell>
  );
}
