"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProfileWithTeam, AdminTeamRow } from "@/app/_types/registration";
import type { UnregisteredAccount } from "@/app/2026/admin/_utils/types";
import { createSignupInvite } from "@/app/2026/admin/_actions/invites";
import { cn } from "@/app/_utils/cn";
import {
  adminKickFromTeam,
  adminDeleteProfile,
} from "@/app/2026/admin/_actions/individuals";
import {
  adminAddToTeam,
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

const COLUMN_COUNT = 5;

const USER_TYPE_LABELS: Record<string, string> = {
  unsw: "UNSW",
  other_uni: "Other uni",
  high_school: "High school",
};

/** Where the person studies, whichever cohort they belong to. */
function institution(p: ProfileWithTeam): string {
  if (p.user_type === "unsw") return "UNSW";
  if (p.user_type === "high_school") return p.high_school || "High school";
  return p.university || "-";
}

function studentId(p: ProfileWithTeam): string {
  return p.zid || p.uni_id || "";
}

/**
 * Which slice of people the tab shows. "onboarded" and "in comp" are profiles;
 * "unregistered" is Clerk accounts with no profile at all, which live in a
 * different table because they have nothing but an email to show.
 */
type View = "all" | "onboarded" | "in_comp" | "unregistered";

export default function IndividualsTable({
  profiles,
  teams,
  unregistered,
  unregisteredError,
}: {
  profiles: ProfileWithTeam[];
  teams: AdminTeamRow[];
  unregistered: UnregisteredAccount[];
  unregisteredError: string | null;
}) {
  const [view, setView] = useState<View>("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const filtered = profiles.filter((p) => {
    if (view === "onboarded" && !p.onboarded) return false;
    if (view === "in_comp" && !p.team_id) return false;
    if (teamFilter === "on" && !p.team_id) return false;
    if (teamFilter === "off" && p.team_id) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q) ||
      studentId(p).toLowerCase().includes(q) ||
      (p.team_name ?? "").toLowerCase().includes(q)
    );
  });

  const unassigned = profiles.filter((p) => !p.team_id).length;

  const q = search.toLowerCase();
  const filteredUnregistered = unregistered.filter(
    (u) => !q || u.email.includes(q) || u.name.toLowerCase().includes(q),
  );

  const views: { value: View; label: string; count: number }[] = [
    { value: "all", label: "All", count: profiles.length },
    {
      value: "onboarded",
      label: "Onboarded",
      count: profiles.filter((p) => p.onboarded).length,
    },
    {
      value: "in_comp",
      label: "In comp",
      count: profiles.filter((p) => p.team_id).length,
    },
    {
      value: "unregistered",
      label: "Unregistered",
      count: unregistered.length,
    },
  ];

  function handleAction(
    action: () => Promise<{ success: boolean; error?: string }>,
  ) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.success) setError(result.error ?? "Action failed");
      setAssigning(null);
      router.refresh();
    });
  }

  function invite(email: string) {
    handleAction(async () => {
      const result = await createSignupInvite(email);
      return { success: result.success, error: result.error };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div
        role="tablist"
        aria-label="Which people to show"
        className="flex flex-wrap gap-1"
      >
        {views.map((v) => (
          <button
            key={v.value}
            type="button"
            role="tab"
            aria-selected={view === v.value}
            onClick={() => setView(v.value)}
            className={cn(
              "font-display focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center gap-2 rounded-md border px-3 text-sm tracking-wide uppercase transition-colors outline-none focus-visible:ring-2",
              view === v.value
                ? "bg-lego-yellow border-lego-yellow font-bold text-[#0a2a55]"
                : "text-ink-dim hover:text-ink border-white/20 hover:bg-white/10",
            )}
          >
            {v.label}
            <span className="font-blueprint text-xs tabular-nums">
              {v.count}
            </span>
          </button>
        ))}
      </div>

      {view === "unregistered" ? (
        <UnregisteredTable
          accounts={filteredUnregistered}
          total={unregistered.length}
          loadError={unregisteredError}
          search={search}
          onSearch={setSearch}
          onInvite={invite}
          pending={isPending}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <SearchField
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="Name, email, student ID, or team"
              className="min-w-[16rem] flex-1 sm:max-w-sm"
            />
            <FilterSelect
              label="Team status"
              value={teamFilter}
              onChange={setTeamFilter}
              options={[
                { value: "all", label: "Everyone" },
                { value: "on", label: "On a team" },
                { value: "off", label: "Unassigned" },
              ]}
            />
            <p className="font-blueprint text-ink-dim pb-3 text-xs uppercase">
              {filtered.length} of {profiles.length} shown · {unassigned}{" "}
              unassigned
            </p>
          </div>

          <TableFrame>
            <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-left">
              <caption className="sr-only">
                Registered Buildathon 2026 participants and their team
                assignments.
              </caption>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Contact</Th>
                  <Th>Institution</Th>
                  <Th>Team</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <EmptyRow colSpan={COLUMN_COUNT}>
                    {profiles.length === 0
                      ? "Nobody has registered yet."
                      : "No participants match those filters."}
                  </EmptyRow>
                )}

                {filtered.map((p) => {
                  const id = studentId(p);
                  return (
                    <tr
                      key={p.id}
                      className="align-top hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10"
                    >
                      <th
                        scope="row"
                        className="font-main text-ink px-3 py-2.5 text-left text-sm font-normal"
                      >
                        {p.full_name || "-"}
                        {!p.onboarded && (
                          <span className="mt-1 block">
                            <StatusPill tone="neutral">Onboarding</StatusPill>
                          </span>
                        )}
                      </th>
                      <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs break-all">
                        {p.email}
                        {p.phone && (
                          <span className="mt-0.5 block tabular-nums">
                            {p.phone}
                          </span>
                        )}
                      </td>
                      <td className="font-main text-ink-dim px-3 py-2.5 text-sm">
                        {institution(p)}
                        {id && (
                          <span className="font-blueprint mt-0.5 block text-xs">
                            {id}
                          </span>
                        )}
                        <span className="font-blueprint text-ink-dim/70 mt-0.5 block text-[11px] uppercase">
                          {USER_TYPE_LABELS[p.user_type] ?? "-"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.team_name ? (
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-main text-ink text-sm">
                              {p.team_name}
                            </span>
                            {p.team_role === "captain" && (
                              <StatusPill tone="captain">Captain</StatusPill>
                            )}
                          </span>
                        ) : (
                          <StatusPill tone="neutral">No team</StatusPill>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {assigning === p.id ? (
                            <div className="flex items-center gap-2">
                              <label
                                htmlFor={`assign-${p.id}`}
                                className="sr-only"
                              >
                                {p.team_id ? "Move" : "Add"} {p.full_name} to
                                team
                              </label>
                              <select
                                id={`assign-${p.id}`}
                                defaultValue=""
                                className="font-main bg-blueprint-950 text-ink focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] rounded-md border border-white/20 px-2 py-1 text-xs outline-none focus-visible:ring-2"
                                onChange={(e) => {
                                  const targetId = e.target.value;
                                  if (!targetId) return;
                                  handleAction(() =>
                                    p.team_id
                                      ? adminMoveToTeam(p.id, targetId)
                                      : adminAddToTeam(p.id, targetId),
                                  );
                                }}
                              >
                                <option value="" disabled>
                                  {p.team_id ? "Move to…" : "Add to…"}
                                </option>
                                {teams
                                  .filter((t) => t.id !== p.team_id)
                                  .map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name}
                                    </option>
                                  ))}
                              </select>
                              <ActionButton onClick={() => setAssigning(null)}>
                                Cancel
                              </ActionButton>
                            </div>
                          ) : (
                            <ActionButton
                              tone={p.team_id ? "neutral" : "primary"}
                              disabled={isPending || teams.length === 0}
                              onClick={() => setAssigning(p.id)}
                            >
                              {p.team_id ? "Move" : "Add to team"}
                            </ActionButton>
                          )}

                          {p.team_id && (
                            <ConfirmButton
                              tone="neutral"
                              label="Kick"
                              confirmLabel="Confirm kick?"
                              disabled={isPending}
                              onConfirm={() =>
                                handleAction(() => adminKickFromTeam(p.id))
                              }
                            />
                          )}

                          <ConfirmButton
                            label="Delete"
                            confirmLabel="Confirm delete?"
                            disabled={isPending}
                            onConfirm={() =>
                              handleAction(() => adminDeleteProfile(p.id))
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableFrame>
        </>
      )}
    </div>
  );
}

function UnregisteredTable({
  accounts,
  total,
  loadError,
  search,
  onSearch,
  onInvite,
  pending,
}: {
  accounts: UnregisteredAccount[];
  total: number;
  loadError: string | null;
  search: string;
  onSearch: (value: string) => void;
  onInvite: (email: string) => void;
  pending: boolean;
}) {
  return (
    <>
      {loadError && (
        <Alert tone="error">
          Could not load accounts from Clerk. ({loadError})
        </Alert>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          label="Search"
          value={search}
          onChange={onSearch}
          placeholder="Name or email"
          className="min-w-[16rem] flex-1 sm:max-w-sm"
        />
        <p className="font-blueprint text-ink-dim pb-3 text-xs uppercase">
          {accounts.length} of {total} shown · Clerk accounts with no profile
        </p>
      </div>

      <TableFrame>
        <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left">
          <caption className="sr-only">
            Clerk accounts that have not started Buildathon onboarding.
          </caption>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Account created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <EmptyRow colSpan={4}>
                {total === 0
                  ? "Every account has started onboarding."
                  : "No accounts match that search."}
              </EmptyRow>
            )}
            {accounts.map((u) => (
              <tr
                key={u.clerk_user_id}
                className="align-top hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10"
              >
                <th
                  scope="row"
                  className="font-main text-ink px-3 py-2.5 text-left text-sm font-normal"
                >
                  {u.name || "-"}
                </th>
                <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs break-all">
                  {u.email || "-"}
                </td>
                <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs whitespace-nowrap">
                  <time suppressHydrationWarning dateTime={u.created_at}>
                    {new Date(u.created_at).toLocaleDateString("en-AU")}
                  </time>
                </td>
                <td className="px-3 py-2.5">
                  {u.invited ? (
                    <StatusPill tone="info">Invited</StatusPill>
                  ) : (
                    <ActionButton
                      tone="primary"
                      disabled={pending || !u.email}
                      onClick={() => onInvite(u.email)}
                    >
                      Invite
                    </ActionButton>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableFrame>
    </>
  );
}
