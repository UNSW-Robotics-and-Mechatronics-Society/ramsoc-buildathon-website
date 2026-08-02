"use server";

import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { COMPETITION_YEAR } from "@/app/2026/_data/teamConfig";
import { assertAdmin } from "@/app/2026/admin/_utils/adminAuth";
import type { AdminTask } from "@/app/2026/admin/_utils/types";

export async function getAllTasks(): Promise<AdminTask[]> {
  await assertAdmin();
  const sb = getSupabaseSecretClient();
  const { data, error } = await sb
    .from("admin_tasks")
    .select("id, title, description, url, active, created_at")
    .eq("competition_year", COMPETITION_YEAR)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // description and url are nullable in the schema; normalise to "" so the
  // client components never have to null-check them.
  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    url: t.url ?? "",
    active: t.active,
    created_at: t.created_at,
  }));
}

export async function createTask(
  title: string,
  description: string,
  url: string,
): Promise<void> {
  await assertAdmin();
  const sb = getSupabaseSecretClient();
  const { error } = await sb.from("admin_tasks").insert({
    title,
    description,
    url,
    competition_year: COMPETITION_YEAR,
  });
  if (error) throw error;
}

export async function updateTask(
  taskId: string,
  fields: {
    title?: string;
    description?: string;
    url?: string;
    active?: boolean;
  },
): Promise<void> {
  await assertAdmin();
  const sb = getSupabaseSecretClient();
  const { error } = await sb
    .from("admin_tasks")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteTask(taskId: string): Promise<void> {
  await assertAdmin();
  const sb = getSupabaseSecretClient();
  const { error } = await sb.from("admin_tasks").delete().eq("id", taskId);
  if (error) throw error;
}
