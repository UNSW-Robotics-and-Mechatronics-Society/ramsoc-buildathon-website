"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addSession,
  createWeek,
  deleteSession,
  deleteWeek,
  moveSession,
  updateSession,
  updateWeek,
} from "@/app/2026/admin/_actions/timeline";
import {
  TIMELINE_ACCENT_OPTIONS,
  type AdminTimelineWeek,
  type TimelineAccent,
} from "@/app/2026/admin/_utils/types";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  EmptyRow,
  FilterSelect,
  Panel,
  TableFrame,
  Th,
} from "./AdminUI";

/**
 * Editor for the public schedule.
 *
 * Each week is a card holding its own draft. "Save week" writes the week's
 * fields and every one of its sessions in one go, so an organiser confirming a
 * room and its time makes one round trip, not three. Structural changes (add,
 * delete, reorder) write immediately, because there is nothing to type.
 *
 * After any write the page refreshes and the drafts are rebuilt from the
 * server, which is the single source of truth. Edit one week at a time.
 */

const SESSION_COLUMNS = 5;

const ACCENT_BG: Record<TimelineAccent, string> = {
  azure: "bg-lego-azure",
  yellow: "bg-lego-yellow",
  orange: "bg-lego-orange",
  green: "bg-lego-green",
  red: "bg-lego-red",
};

const inputClass =
  "font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] w-full rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2";

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  labelHidden = false,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
  /** Hides the label visually only. Used where a column header names the field. */
  labelHidden?: boolean;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-col gap-1"}>
      <label htmlFor={id} className={labelHidden ? "sr-only" : "spec-label"}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        min={type === "number" ? 1 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

// ----------------------------------------------------------------- drafts --

type SessionDraft = {
  id: string;
  day: string;
  location: string;
  time: string;
};

type WeekDraft = {
  week: string;
  dates: string;
  title: string;
  summary: string;
  accent: TimelineAccent;
  sessions: SessionDraft[];
};

type Status = { tone: "success" | "error"; message: string };

function toDrafts(weeks: AdminTimelineWeek[]): Record<string, WeekDraft> {
  const drafts: Record<string, WeekDraft> = {};
  for (const week of weeks) {
    drafts[week.id] = {
      week: String(week.week),
      dates: week.dates,
      title: week.title,
      summary: week.summary,
      accent: week.accent,
      sessions: week.sessions.map((s) => ({
        id: s.id,
        day: s.day,
        location: s.location,
        time: s.time,
      })),
    };
  }
  return drafts;
}

const emptyNewWeek = {
  week: "",
  dates: "",
  title: "",
  summary: "",
  accent: "azure" as TimelineAccent,
};

// ------------------------------------------------------------------ editor --

export default function TimelineEditor({
  weeks,
}: {
  weeks: AdminTimelineWeek[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, WeekDraft>>(() =>
    toDrafts(weeks),
  );
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newWeek, setNewWeek] = useState(emptyNewWeek);
  const [createStatus, setCreateStatus] = useState<Status | null>(null);

  useEffect(() => {
    setDrafts(toDrafts(weeks));
  }, [weeks]);

  const sessionCount = weeks.reduce((n, w) => n + w.sessions.length, 0);

  function setStatus(weekId: string, status: Status | null) {
    setStatuses((current) => {
      const next = { ...current };
      if (status) next[weekId] = status;
      else delete next[weekId];
      return next;
    });
  }

  function patch(weekId: string, fields: Partial<WeekDraft>) {
    setDrafts((current) => ({
      ...current,
      [weekId]: { ...current[weekId], ...fields },
    }));
    setStatus(weekId, null);
  }

  function patchSession(
    weekId: string,
    sessionId: string,
    fields: Partial<SessionDraft>,
  ) {
    setDrafts((current) => ({
      ...current,
      [weekId]: {
        ...current[weekId],
        sessions: current[weekId].sessions.map((s) =>
          s.id === sessionId ? { ...s, ...fields } : s,
        ),
      },
    }));
    setStatus(weekId, null);
  }

  /** Runs one action, reports it against a week, and refreshes on success. */
  function run(
    weekId: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) {
    startTransition(async () => {
      setStatus(weekId, null);
      try {
        const result = await action();
        if (!result.success) {
          setStatus(weekId, {
            tone: "error",
            message: result.error ?? "Action failed",
          });
          return;
        }
        setStatus(weekId, { tone: "success", message: successMessage });
        router.refresh();
      } catch (e) {
        setStatus(weekId, {
          tone: "error",
          message: e instanceof Error ? e.message : "Action failed",
        });
      }
    });
  }

  function handleSaveWeek(week: AdminTimelineWeek) {
    const draft = drafts[week.id];
    if (!draft) return;

    const weekNumber = Number(draft.week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      setStatus(week.id, {
        tone: "error",
        message: "Week must be a whole number of 1 or more",
      });
      return;
    }

    run(
      week.id,
      async () => {
        const weekResult = await updateWeek(week.id, {
          week: weekNumber,
          dates: draft.dates,
          title: draft.title,
          summary: draft.summary,
          accent: draft.accent,
        });
        if (!weekResult.success) return weekResult;

        // Only the sessions whose text actually changed are written back.
        for (const session of draft.sessions) {
          const original = week.sessions.find((s) => s.id === session.id);
          if (
            original &&
            original.day === session.day &&
            original.location === session.location &&
            original.time === session.time
          ) {
            continue;
          }
          const result = await updateSession(session.id, {
            day: session.day,
            location: session.location,
            time: session.time,
          });
          if (!result.success) return result;
        }
        return { success: true };
      },
      "Saved.",
    );
  }

  function handleCreateWeek() {
    const weekNumber = Number(newWeek.week);
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      setCreateStatus({
        tone: "error",
        message: "Week must be a whole number of 1 or more",
      });
      return;
    }

    startTransition(async () => {
      setCreateStatus(null);
      const result = await createWeek({
        week: weekNumber,
        dates: newWeek.dates,
        title: newWeek.title,
        summary: newWeek.summary,
        accent: newWeek.accent,
      });
      if (result.success) {
        setNewWeek(emptyNewWeek);
        setShowCreate(false);
        router.refresh();
      } else {
        setCreateStatus({
          tone: "error",
          message: result.error ?? "Could not create the week",
        });
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-blueprint text-ink-dim text-xs uppercase">
          {weeks.length} week{weeks.length !== 1 ? "s" : ""} · {sessionCount}{" "}
          session{sessionCount !== 1 ? "s" : ""}
        </p>
        <ActionButton
          tone="primary"
          aria-expanded={showCreate}
          onClick={() => {
            setShowCreate((v) => !v);
            setCreateStatus(null);
          }}
        >
          {showCreate ? "Cancel" : "Add week"}
        </ActionButton>
      </div>

      <p className="font-main text-ink-dim max-w-prose text-sm">
        These rows are the Timeline section on the public homepage. Saving a
        week publishes it straight away, so leave a room as TBC until the venue
        confirms it.
      </p>

      {showCreate && (
        <Panel className="flex flex-col gap-3 p-4">
          <h3 className="font-display text-lg">New week</h3>
          {createStatus && (
            <Alert tone={createStatus.tone}>{createStatus.message}</Alert>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              id="new-week-number"
              label="Week"
              type="number"
              value={newWeek.week}
              onChange={(v) => setNewWeek({ ...newWeek, week: v })}
              placeholder="7"
            />
            <TextField
              id="new-week-dates"
              label="Dates"
              value={newWeek.dates}
              onChange={(v) => setNewWeek({ ...newWeek, dates: v })}
              placeholder="27 - 28 Oct"
            />
            <TextField
              id="new-week-title"
              label="Title"
              value={newWeek.title}
              onChange={(v) => setNewWeek({ ...newWeek, title: v })}
              placeholder="Build Session"
            />
            <FilterSelect
              label="Accent"
              value={newWeek.accent}
              onChange={(v) =>
                setNewWeek({ ...newWeek, accent: v as TimelineAccent })
              }
              options={TIMELINE_ACCENT_OPTIONS}
            />
          </div>
          <TextField
            id="new-week-summary"
            label="Summary (optional)"
            value={newWeek.summary}
            onChange={(v) => setNewWeek({ ...newWeek, summary: v })}
            placeholder="Short blurb shown under the title."
          />
          <ActionButton
            tone="primary"
            className="self-start"
            onClick={handleCreateWeek}
            disabled={isPending}
          >
            {isPending ? "Creating…" : "Create week"}
          </ActionButton>
        </Panel>
      )}

      {weeks.length === 0 && (
        <Panel className="p-6">
          <p className="font-main text-ink-dim text-sm">
            No weeks in the database yet, so the homepage is showing the
            hardcoded fallback schedule. Use “Add week” to take over.
          </p>
        </Panel>
      )}

      {weeks.map((week) => {
        const draft = drafts[week.id];
        if (!draft) return null;
        const status = statuses[week.id];

        return (
          <Panel key={week.id} className="min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`brick font-display flex h-10 w-10 shrink-0 items-center justify-center text-lg font-extrabold text-[#0a2a55] ${ACCENT_BG[draft.accent]}`}
                >
                  {draft.week || "?"}
                </span>
                <div>
                  <p className="spec-label">Week {draft.week || "?"}</p>
                  <h3 className="font-display text-lg leading-tight">
                    {draft.title || "Untitled week"}
                  </h3>
                </div>
              </div>
              <ConfirmButton
                label="Delete week"
                confirmLabel="Confirm delete?"
                disabled={isPending}
                onConfirm={() =>
                  run(week.id, () => deleteWeek(week.id), "Week deleted.")
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField
                id={`week-${week.id}-number`}
                label="Week"
                type="number"
                value={draft.week}
                onChange={(v) => patch(week.id, { week: v })}
              />
              <TextField
                id={`week-${week.id}-dates`}
                label="Dates"
                value={draft.dates}
                onChange={(v) => patch(week.id, { dates: v })}
                placeholder="22 - 23 Sep"
              />
              <TextField
                id={`week-${week.id}-title`}
                label="Title"
                value={draft.title}
                onChange={(v) => patch(week.id, { title: v })}
              />
              <FilterSelect
                label="Accent"
                value={draft.accent}
                onChange={(v) =>
                  patch(week.id, { accent: v as TimelineAccent })
                }
                options={TIMELINE_ACCENT_OPTIONS}
              />
            </div>

            <div className="mt-3">
              <TextField
                id={`week-${week.id}-summary`}
                label="Summary"
                value={draft.summary}
                onChange={(v) => patch(week.id, { summary: v })}
                placeholder="Short blurb shown under the title."
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="spec-label">Sessions</p>
                <ActionButton
                  disabled={isPending}
                  onClick={() =>
                    run(week.id, () => addSession(week.id), "Session added.")
                  }
                >
                  Add session
                </ActionButton>
              </div>

              <TableFrame>
                <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left">
                  <caption className="sr-only">
                    Sessions in week {draft.week || "?"}, in the order they
                    appear on the public site.
                  </caption>
                  <thead>
                    <tr>
                      <Th className="w-12">#</Th>
                      <Th>Day</Th>
                      <Th>Location</Th>
                      <Th>Time</Th>
                      <Th>Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {draft.sessions.length === 0 && (
                      <EmptyRow colSpan={SESSION_COLUMNS}>
                        No sessions for this week yet.
                      </EmptyRow>
                    )}

                    {draft.sessions.map((session, index) => (
                      <tr
                        key={session.id}
                        className="align-top [&>*]:border-b [&>*]:border-white/10"
                      >
                        <th
                          scope="row"
                          className="font-blueprint text-ink-dim px-3 py-2.5 text-left text-xs font-normal tabular-nums"
                        >
                          {index + 1}
                        </th>
                        <td className="px-3 py-2.5">
                          <TextField
                            id={`session-${session.id}-day`}
                            label={`Day for session ${index + 1}`}
                            labelHidden
                            value={session.day}
                            onChange={(v) =>
                              patchSession(week.id, session.id, { day: v })
                            }
                            placeholder="Tuesday"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <TextField
                            id={`session-${session.id}-location`}
                            label={`Location for session ${index + 1}`}
                            labelHidden
                            value={session.location}
                            onChange={(v) =>
                              patchSession(week.id, session.id, { location: v })
                            }
                            placeholder="TBC"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <TextField
                            id={`session-${session.id}-time`}
                            label={`Time for session ${index + 1}`}
                            labelHidden
                            value={session.time}
                            onChange={(v) =>
                              patchSession(week.id, session.id, { time: v })
                            }
                            placeholder="6:00 - 8:00pm"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-wrap gap-2">
                            <ActionButton
                              aria-label={`Move session ${index + 1} up`}
                              disabled={isPending || index === 0}
                              onClick={() =>
                                run(
                                  week.id,
                                  () => moveSession(session.id, "up"),
                                  "Order updated.",
                                )
                              }
                            >
                              Up
                            </ActionButton>
                            <ActionButton
                              aria-label={`Move session ${index + 1} down`}
                              disabled={
                                isPending || index === draft.sessions.length - 1
                              }
                              onClick={() =>
                                run(
                                  week.id,
                                  () => moveSession(session.id, "down"),
                                  "Order updated.",
                                )
                              }
                            >
                              Down
                            </ActionButton>
                            <ConfirmButton
                              label="Delete"
                              confirmLabel="Confirm?"
                              disabled={isPending}
                              onConfirm={() =>
                                run(
                                  week.id,
                                  () => deleteSession(session.id),
                                  "Session deleted.",
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableFrame>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ActionButton
                tone="primary"
                disabled={isPending}
                onClick={() => handleSaveWeek(week)}
              >
                {isPending ? "Saving…" : "Save week"}
              </ActionButton>
              {status && (
                <p
                  role={status.tone === "error" ? "alert" : "status"}
                  className={`font-blueprint text-xs uppercase ${
                    status.tone === "error"
                      ? "text-[#ffb0b4]"
                      : "text-[#b6e8a0]"
                  }`}
                >
                  {status.message}
                </p>
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
