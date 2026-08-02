"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminTeamRow, TeamWithMembers } from "@/app/_types/registration";
import {
  MEMBER_LIMITS,
  formatAud,
  getEntryFeeCents,
} from "@/app/2026/_data/teamConfig";
import {
  getTeamDetail,
  updateTeamPaid,
  updateTeamName,
  transferCaptain,
  adminRemoveMember,
  adminDeleteTeam,
  adminMoveToTeam,
} from "@/app/2026/admin/_actions/teams";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  EmptyRow,
  FilterSelect,
  SearchField,
  StatusPill,
  TableFrame,
  Th,
} from "./AdminUI";

const COLUMN_COUNT = 6;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blueprint-900 rounded-md border border-white/15 px-4 py-2.5">
      <p className="spec-label">{label}</p>
      <p className="font-blueprint text-ink mt-0.5 text-xl tabular-nums">
        {value}
      </p>
    </div>
  );
}

export default function TeamsTable({ teams }: { teams: AdminTeamRow[] }) {
  const [search, setSearch] = useState("");
  const [paidFilter, setPaidFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamWithMembers | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [movingMember, setMovingMember] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const entryFeeCents = getEntryFeeCents();
  const paidCount = teams.filter((t) => t.paid).length;

  const filtered = teams.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        t.name.toLowerCase().includes(q) ||
        t.join_code.toLowerCase().includes(q) ||
        t.member_names.some((n) => n?.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (paidFilter === "paid" && !t.paid) return false;
    if (paidFilter === "unpaid" && t.paid) return false;
    return true;
  });

  function toggleExpand(teamId: string) {
    if (expandedId === teamId) {
      setExpandedId(null);
      setDetail(null);
      setEditingName(null);
      setMovingMember(null);
      return;
    }
    setExpandedId(teamId);
    setDetail(null);
    setEditingName(null);
    setMovingMember(null);
    startTransition(async () => {
      setDetail(await getTeamDetail(teamId));
    });
  }

  function handleAction(
    action: () => Promise<{ success: boolean; error?: string } | unknown>,
  ) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        result.success === false
      ) {
        setError((result as { error?: string }).error ?? "Action failed");
      }
      setEditingName(null);
      setMovingMember(null);
      router.refresh();
      if (expandedId) setDetail(await getTeamDetail(expandedId));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Teams" value={String(teams.length)} />
        <Stat label="Paid" value={String(paidCount)} />
        <Stat label="Unpaid" value={String(teams.length - paidCount)} />
        <Stat
          label={`Collected @ ${formatAud(entryFeeCents)}`}
          value={formatAud(paidCount * entryFeeCents)}
        />
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Team, join code, or member"
          className="min-w-[16rem] flex-1 sm:max-w-sm"
        />
        <FilterSelect
          label="Payment"
          value={paidFilter}
          onChange={setPaidFilter}
          options={[
            { value: "all", label: "All teams" },
            { value: "paid", label: "Paid only" },
            { value: "unpaid", label: "Unpaid only" },
          ]}
        />
        <p className="font-blueprint text-ink-dim pb-3 text-xs uppercase">
          {filtered.length} of {teams.length} shown
        </p>
      </div>

      <TableFrame>
        {/* border-separate keeps the sticky header's bottom border painted
            while rows scroll underneath it. */}
        <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-left">
          <caption className="sr-only">
            Buildathon 2026 teams. Select a team to expand its roster and admin
            actions.
          </caption>
          <thead>
            <tr>
              <Th>Team</Th>
              <Th>Payment</Th>
              <Th align="right">Members</Th>
              <Th>Join code</Th>
              <Th>Captain</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <EmptyRow colSpan={COLUMN_COUNT}>
                {teams.length === 0
                  ? "No teams have registered yet."
                  : "No teams match those filters."}
              </EmptyRow>
            )}

            {filtered.map((team) => {
              const expanded = expandedId === team.id;
              const short = team.member_count < MEMBER_LIMITS.min;
              return (
                <Fragment key={team.id}>
                  <tr className="hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10">
                    <th scope="row" className="px-3 py-2 text-left font-normal">
                      <button
                        type="button"
                        onClick={() => toggleExpand(team.id)}
                        aria-expanded={expanded}
                        className="font-main text-ink hover:text-lego-yellow focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center gap-2 text-sm outline-none focus-visible:ring-2"
                      >
                        <span
                          aria-hidden
                          className={`font-blueprint text-ink-dim transition-transform ${expanded ? "rotate-90" : ""}`}
                        >
                          ›
                        </span>
                        {team.name}
                      </button>
                    </th>
                    <td className="px-3 py-2">
                      <StatusPill tone={team.paid ? "paid" : "unpaid"}>
                        {team.paid ? "Paid" : "Unpaid"}
                      </StatusPill>
                    </td>
                    <td className="font-blueprint px-3 py-2 text-right text-sm tabular-nums">
                      <span className={short ? "text-[#ff9ca2]" : "text-ink"}>
                        {team.member_count}
                      </span>
                      <span className="text-ink-dim">/{MEMBER_LIMITS.max}</span>
                    </td>
                    <td className="font-blueprint text-ink-dim px-3 py-2 text-sm">
                      {team.join_code}
                    </td>
                    <td className="font-main text-ink-dim px-3 py-2 text-sm">
                      {team.member_names[0] ?? "—"}
                    </td>
                    <td className="font-blueprint text-ink-dim px-3 py-2 text-xs tabular-nums">
                      {new Date(team.created_at).toLocaleDateString("en-AU")}
                    </td>
                  </tr>

                  {expanded && (
                    <tr className="bg-blueprint-950">
                      <td
                        colSpan={COLUMN_COUNT}
                        className="border-b border-white/15 px-3 py-4"
                      >
                        {!detail ? (
                          <p className="font-main text-ink-dim text-sm">
                            Loading team…
                          </p>
                        ) : (
                          <div className="flex flex-col gap-4">
                            <div>
                              <h4 className="spec-label mb-2">
                                Roster ({detail.members.length} of{" "}
                                {MEMBER_LIMITS.max})
                              </h4>
                              <ul className="flex flex-col gap-2">
                                {detail.members.map((m) => (
                                  <li
                                    key={m.id}
                                    className="bg-blueprint-900 flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 px-3 py-2"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-main text-ink flex items-center gap-2 text-sm">
                                        {m.profile.full_name}
                                        {m.role === "captain" && (
                                          <StatusPill tone="captain">
                                            Captain
                                          </StatusPill>
                                        )}
                                      </p>
                                      <p className="font-blueprint text-ink-dim mt-0.5 text-xs break-all">
                                        {m.profile.email}
                                        {m.profile.zid && ` · ${m.profile.zid}`}
                                        {m.profile.university &&
                                          ` · ${m.profile.university}`}
                                      </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {m.role !== "captain" && (
                                        <ConfirmButton
                                          tone="neutral"
                                          label="Make captain"
                                          confirmLabel="Confirm captain?"
                                          disabled={isPending}
                                          onConfirm={() =>
                                            handleAction(() =>
                                              transferCaptain(
                                                team.id,
                                                m.profile_id,
                                              ),
                                            )
                                          }
                                        />
                                      )}

                                      {movingMember === m.profile_id ? (
                                        <div className="flex items-center gap-2">
                                          <label
                                            htmlFor={`move-${m.profile_id}`}
                                            className="sr-only"
                                          >
                                            Move {m.profile.full_name} to team
                                          </label>
                                          <select
                                            id={`move-${m.profile_id}`}
                                            defaultValue=""
                                            className="font-main bg-blueprint-950 text-ink focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] rounded-md border border-white/20 px-2 py-1 text-xs outline-none focus-visible:ring-2"
                                            onChange={(e) => {
                                              const targetId = e.target.value;
                                              if (!targetId) return;
                                              handleAction(() =>
                                                adminMoveToTeam(
                                                  m.profile_id,
                                                  targetId,
                                                ),
                                              );
                                            }}
                                          >
                                            <option value="" disabled>
                                              Move to…
                                            </option>
                                            {teams
                                              .filter((t) => t.id !== team.id)
                                              .map((t) => (
                                                <option key={t.id} value={t.id}>
                                                  {t.name}
                                                </option>
                                              ))}
                                          </select>
                                          <ActionButton
                                            onClick={() =>
                                              setMovingMember(null)
                                            }
                                          >
                                            Cancel
                                          </ActionButton>
                                        </div>
                                      ) : (
                                        <ActionButton
                                          disabled={isPending}
                                          onClick={() =>
                                            setMovingMember(m.profile_id)
                                          }
                                        >
                                          Move
                                        </ActionButton>
                                      )}

                                      <ConfirmButton
                                        label="Remove"
                                        confirmLabel="Confirm remove?"
                                        disabled={isPending}
                                        onConfirm={() =>
                                          handleAction(() =>
                                            adminRemoveMember(
                                              team.id,
                                              m.profile_id,
                                            ),
                                          )
                                        }
                                      />
                                    </div>
                                  </li>
                                ))}
                                {detail.members.length === 0 && (
                                  <li className="font-main text-ink-dim text-sm">
                                    This team has no members.
                                  </li>
                                )}
                              </ul>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 border-t border-white/15 pt-4">
                              <ActionButton
                                tone={team.paid ? "neutral" : "primary"}
                                disabled={isPending}
                                onClick={() =>
                                  handleAction(() =>
                                    updateTeamPaid(team.id, !team.paid),
                                  )
                                }
                              >
                                {team.paid ? "Mark unpaid" : "Mark paid"}
                              </ActionButton>

                              {editingName === team.id ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <label
                                    htmlFor={`rename-${team.id}`}
                                    className="sr-only"
                                  >
                                    New team name
                                  </label>
                                  <input
                                    id={`rename-${team.id}`}
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="font-main bg-blueprint-950 text-ink focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] w-56 rounded-md border border-white/20 px-3 py-1.5 text-sm outline-none focus-visible:ring-2"
                                  />
                                  <ActionButton
                                    tone="primary"
                                    disabled={isPending || !newName.trim()}
                                    onClick={() =>
                                      handleAction(() =>
                                        updateTeamName(team.id, newName),
                                      )
                                    }
                                  >
                                    Save
                                  </ActionButton>
                                  <ActionButton
                                    onClick={() => setEditingName(null)}
                                  >
                                    Cancel
                                  </ActionButton>
                                </div>
                              ) : (
                                <ActionButton
                                  onClick={() => {
                                    setEditingName(team.id);
                                    setNewName(team.name);
                                  }}
                                >
                                  Rename team
                                </ActionButton>
                              )}

                              <ConfirmButton
                                label="Delete team"
                                confirmLabel="Confirm delete?"
                                disabled={isPending}
                                onConfirm={() =>
                                  handleAction(() => adminDeleteTeam(team.id))
                                }
                                className="ml-auto"
                              />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </TableFrame>
    </div>
  );
}
