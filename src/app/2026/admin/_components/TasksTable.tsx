"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";
import {
  createTask,
  updateTask,
  deleteTask,
} from "@/app/2026/admin/_actions/tasks";
import type { AdminTask } from "@/app/2026/admin/_utils/types";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  EmptyRow,
  Panel,
  StatusPill,
  TableFrame,
  Th,
} from "./AdminUI";

const COLUMN_COUNT = 4;

function TaskField({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="spec-label">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2"
      />
    </div>
  );
}

export default function TasksTable({ tasks }: { tasks: AdminTask[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    url: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ title: "", description: "", url: "" });
  const router = useRouter();

  const activeTasks = tasks.filter((t) => t.active);

  function run(action: () => Promise<void>, after?: () => void) {
    startTransition(async () => {
      setError(null);
      try {
        await action();
        after?.();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function handleCreate() {
    const title = newTask.title.trim();
    if (!title) return;
    run(
      () => createTask(title, newTask.description.trim(), newTask.url.trim()),
      () => {
        setNewTask({ title: "", description: "", url: "" });
        setShowCreate(false);
      },
    );
  }

  function handleSaveEdit() {
    if (!editingId || !edit.title.trim()) return;
    run(
      () =>
        updateTask(editingId, {
          title: edit.title.trim(),
          description: edit.description.trim(),
          url: edit.url.trim(),
        }),
      () => setEditingId(null),
    );
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-blueprint text-ink-dim text-xs uppercase">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} ·{" "}
            {activeTasks.length} active
          </p>
          <ActionButton
            tone="primary"
            onClick={() => setShowCreate((v) => !v)}
            aria-expanded={showCreate}
          >
            {showCreate ? "Cancel" : "Add task"}
          </ActionButton>
        </div>

        {showCreate && (
          <Panel className="flex flex-col gap-3 p-4">
            <TaskField
              id="new-task-title"
              label="Title"
              value={newTask.title}
              onChange={(v) => setNewTask({ ...newTask, title: v })}
              placeholder="e.g. Complete the workshop safety briefing"
            />
            <TaskField
              id="new-task-description"
              label="Description (optional)"
              value={newTask.description}
              onChange={(v) => setNewTask({ ...newTask, description: v })}
              placeholder="e.g. Every member must sign the acknowledgement"
            />
            <TaskField
              id="new-task-url"
              label="URL (optional)"
              value={newTask.url}
              onChange={(v) => setNewTask({ ...newTask, url: v })}
              placeholder="e.g. https://docs.google.com/forms/…"
            />
            <ActionButton
              tone="primary"
              className="self-start"
              onClick={handleCreate}
              disabled={isPending || !newTask.title.trim()}
            >
              {isPending ? "Creating…" : "Create task"}
            </ActionButton>
          </Panel>
        )}

        <TableFrame>
          <table className="w-full min-w-[42rem] border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              Tasks shown to participants on their Buildathon dashboard.
            </caption>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <EmptyRow colSpan={COLUMN_COUNT}>
                  No tasks yet. Use “Add task” to create one.
                </EmptyRow>
              )}

              {tasks.map((task) => (
                <tr
                  key={task.id}
                  className="align-top hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10"
                >
                  {editingId === task.id ? (
                    <td colSpan={COLUMN_COUNT} className="px-3 py-3">
                      <div className="flex flex-col gap-3">
                        <TaskField
                          id={`edit-title-${task.id}`}
                          label="Title"
                          value={edit.title}
                          onChange={(v) => setEdit({ ...edit, title: v })}
                        />
                        <TaskField
                          id={`edit-description-${task.id}`}
                          label="Description"
                          value={edit.description}
                          onChange={(v) => setEdit({ ...edit, description: v })}
                        />
                        <TaskField
                          id={`edit-url-${task.id}`}
                          label="URL"
                          value={edit.url}
                          onChange={(v) => setEdit({ ...edit, url: v })}
                        />
                        <div className="flex gap-2">
                          <ActionButton
                            tone="primary"
                            onClick={handleSaveEdit}
                            disabled={isPending || !edit.title.trim()}
                          >
                            Save
                          </ActionButton>
                          <ActionButton onClick={() => setEditingId(null)}>
                            Cancel
                          </ActionButton>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <th
                        scope="row"
                        className="font-main text-ink px-3 py-2.5 text-left text-sm font-normal"
                      >
                        {task.title}
                        {task.url && (
                          <a
                            href={task.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link font-blueprint ml-2 text-xs"
                          >
                            link
                          </a>
                        )}
                      </th>
                      <td className="font-main text-ink-dim max-w-sm px-3 py-2.5 text-sm">
                        {task.description || "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={task.active ? "paid" : "neutral"}>
                          {task.active ? "Active" : "Hidden"}
                        </StatusPill>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            onClick={() => {
                              setEditingId(task.id);
                              setEdit({
                                title: task.title,
                                description: task.description,
                                url: task.url,
                              });
                            }}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            disabled={isPending}
                            onClick={() =>
                              run(() =>
                                updateTask(task.id, { active: !task.active }),
                              )
                            }
                          >
                            {task.active ? "Hide" : "Show"}
                          </ActionButton>
                          <ConfirmButton
                            label="Delete"
                            confirmLabel="Confirm delete?"
                            disabled={isPending}
                            onConfirm={() => run(() => deleteTask(task.id))}
                          />
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </div>

      {/* Participant-side preview */}
      <aside className="w-full shrink-0 xl:w-80">
        <Panel className="sticky top-36 p-4">
          <p className="spec-label">Dashboard preview</p>
          <p className="font-main text-ink-dim mt-0.5 mb-3 text-xs">
            How these appear to participants.
          </p>

          <div className="bg-blueprint-950 rounded-md border border-white/10 p-3">
            <h4 className="font-display text-base">Getting started</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              <li className="font-main text-ink-dim flex items-center gap-2 rounded-sm bg-white/5 px-3 py-2 text-xs line-through">
                <span
                  aria-hidden
                  className="border-lego-green/60 bg-lego-green/25 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] text-[#b6e8a0]"
                >
                  ✓
                </span>
                Create or join a team
              </li>
              <li className="font-main text-ink flex items-center gap-2 rounded-sm bg-white/5 px-3 py-2 text-xs">
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-full border border-white/25"
                />
                Get at least {MEMBER_LIMITS.min} team members
              </li>
              <li className="font-main text-ink flex items-center gap-2 rounded-sm bg-white/5 px-3 py-2 text-xs">
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-full border border-white/25"
                />
                Pay the entry fee
              </li>
            </ul>
          </div>

          {activeTasks.length > 0 ? (
            <div className="bg-blueprint-950 mt-3 rounded-md border border-white/10 p-3">
              <h4 className="font-display text-base">Tasks</h4>
              <ul className="mt-2 flex flex-col gap-1.5">
                {activeTasks.map((task) => (
                  <li
                    key={task.id}
                    className="font-main text-ink flex items-center gap-2 rounded-sm bg-white/5 px-3 py-2 text-xs"
                  >
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full border border-white/25"
                    />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="font-main text-ink-dim mt-3 text-xs">
              No active tasks. The Tasks card is hidden on the dashboard.
            </p>
          )}
        </Panel>
      </aside>
    </div>
  );
}
