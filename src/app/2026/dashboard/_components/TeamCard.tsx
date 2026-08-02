"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TeamWithMembers } from "@/app/_types/registration";
import Card from "@/app/2026/_components/ui/Card";
import Badge from "@/app/2026/_components/ui/Badge";
import { Button } from "@/app/2026/_components/ui/Button";
import { renameTeam } from "@/app/2026/_actions/team";
import {
  MEMBER_LIMITS,
  getEntryFeeCents,
  formatAud,
} from "@/app/2026/_data/teamConfig";
import Path from "@/app/path";

export default function TeamCard({
  team,
  isCaptain = false,
}: {
  team: TeamWithMembers;
  isCaptain?: boolean;
}) {
  const memberCount = team.members.length;
  const canActivate = !team.paid && memberCount >= MEMBER_LIMITS.min;
  const membersNeeded = MEMBER_LIMITS.min - memberCount;
  const needsMoreMembers = !team.paid && membersNeeded > 0;
  // Base entry fee only. The Square processing gross-up is computed once, on
  // the server (getPaymentQuote), and shown on the payment page — it is never
  // recomputed in the UI.
  const entryFee = formatAud(getEntryFeeCents());

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === team.name) {
      setEditing(false);
      setName(team.name);
      return;
    }
    startTransition(async () => {
      const result = await renameTeam(trimmed);
      if (result.success) {
        setEditing(false);
        setError(undefined);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setEditing(false);
      setName(team.name);
      setError(undefined);
    }
  }

  return (
    <Card className="bg-blueprint-900/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="spec-label">Team</p>
          <h3 className="mt-0.5 truncate text-xl sm:text-2xl">{team.name}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={team.paid ? "success" : "warning"}>
            {team.paid ? "Active" : "Not active"}
          </Badge>
          <span className="font-blueprint text-ink-dim text-xs">
            {memberCount}/{MEMBER_LIMITS.max} members
          </span>
        </div>
      </div>

      {isCaptain && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-blueprint text-ink-dim hover:text-ink -ml-1 mt-1 inline-flex min-h-[44px] items-center rounded px-1 text-xs uppercase transition-colors"
        >
          Rename team
        </button>
      )}

      {editing && (
        <div className="mt-3 flex flex-col gap-2">
          <label htmlFor="team-name" className="spec-label">
            Team name
          </label>
          <input
            id="team-name"
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="font-display text-ink focus-visible:border-ring focus-visible:ring-ring/50 min-h-[44px] w-full rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xl uppercase outline-none focus-visible:ring-2"
            autoFocus
            disabled={isPending}
          />
          {error && <p className="font-main text-lego-red text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="full"
              onClick={() => {
                setEditing(false);
                setName(team.name);
                setError(undefined);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              onClick={handleSave}
              disabled={isPending}
              loading={isPending}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {!team.paid && (
        <div className="border-grid-major mt-4 border-t pt-4">
          <div className="font-blueprint text-ink-dim mb-2 flex items-baseline justify-between text-xs uppercase">
            <span>Entry fee</span>
            <span className="text-ink font-display text-lg">
              {entryFee} / team
            </span>
          </div>
          <p className="font-main text-ink-dim mb-3 text-sm">
            Your team is not active yet. The captain pays the flat entry fee
            once to lock in your place.
          </p>

          {canActivate && isCaptain ? (
            <Button
              size="full"
              loading={navigating}
              disabled={navigating}
              onClick={() => {
                setNavigating(true);
                router.push(Path[2026].Payment);
              }}
            >
              {navigating ? "Opening checkout…" : `Pay ${entryFee} entry fee`}
            </Button>
          ) : (
            <Button size="full" disabled className="cursor-not-allowed">
              {!isCaptain ? "Only the captain can pay" : "Pay entry fee"}
            </Button>
          )}

          {needsMoreMembers && (
            <p className="font-main text-ink-dim mt-2 text-center text-xs">
              {membersNeeded} more member{membersNeeded !== 1 ? "s" : ""} needed
              to activate (minimum {MEMBER_LIMITS.min}).
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
