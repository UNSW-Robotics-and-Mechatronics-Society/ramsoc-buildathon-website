import { getAllTasks } from "@/app/2026/admin/_actions/tasks";
import AdminShell from "../_components/AdminShell";
import TasksTable from "../_components/TasksTable";

export default async function AdminTasksPage() {
  const tasks = await getAllTasks();

  return (
    <AdminShell title="Tasks">
      <TasksTable tasks={tasks} />
    </AdminShell>
  );
}
