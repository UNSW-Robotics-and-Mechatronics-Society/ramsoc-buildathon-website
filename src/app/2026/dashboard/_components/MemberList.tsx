"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember, Profile } from "@/app/_types/registration";
import Card from "@/app/2026/_components/ui/Card";
import Badge from "@/app/2026/_components/ui/Badge";
import { Button } from "@/app/2026/_components/ui/Button";
import { promoteMember, kickMember } from "@/app/2026/_actions/team";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";

type MemberWithProfile = TeamMember & { profile: Profile };

/**
 * Brick colourways. Written as literal class strings so Tailwind's scanner
 * keeps them, never build these names by interpolation.
 */
const CAPTAIN_BRICK = "bg-lego-yellow/20 text-lego-yellow";
const MEMBER_BRICKS = [
  "bg-lego-azure/20 text-lego-azure",
  "bg-lego-green/20 text-lego-green",
  "bg-lego-orange/20 text-lego-orange",
  "bg-lego-red/20 text-lego-red",
  "bg-lego-azure/20 text-lego-azure",
];

/** What to show under a member's name, depending on their cohort. */
function affiliation(profile: Profile): string {
  if (profile.user_type === "unsw") {
    return profile.zid ? `UNSW · ${profile.zid}` : "UNSW";
  }
  if (profile.user_type === "high_school") {
    return profile.high_school || "High school";
  }
  return profile.university || "";
}

export default function MemberList({
  members,
  isCaptain = false,
  currentProfileId,
}: {
  members: MemberWithProfile[];
  isCaptain?: boolean;
  currentProfileId?: string;
}) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "kick" | "promote";
    memberId: string;
    name: string;
  } | null>(null);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const slotsLeft = Math.max(0, MEMBER_LIMITS.max - members.length);

  function handleConfirm() {
    if (!confirmAction) return;
    startTransition(async () => {
      const result =
        confirmAction.type === "kick"
          ? await kickMember(confirmAction.memberId)
          : await promoteMember(confirmAction.memberId);

      if (result.success) {
        setConfirmAction(null);
        setError(undefined);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Card className="bg-blueprint-900/50 p-4 sm:p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <p className="spec-label">Roster</p>
        <span className="font-blueprint text-ink-dim text-xs">
          {members.length}/{MEMBER_LIMITS.max}
        </span>
      </div>
      <h3 className="mb-4 text-lg">Members</h3>

      <ul className="flex flex-col gap-4 pt-1">
        {members.map((member, i) => {
          const brick =
            member.role === "captain"
              ? CAPTAIN_BRICK
              : MEMBER_BRICKS[i % MEMBER_BRICKS.length];
          const canManage =
            isCaptain &&
            member.profile_id !== currentProfileId &&
            member.role !== "captain";
          const sub = affiliation(member.profile);

          return (
            <li key={member.id}>
              {/* The brick itself: currentColor drives the stud row above it. */}
              <div
                className={`lego-studs brick flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 ${brick}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-main text-ink truncate text-sm font-semibold">
                    {member.profile.full_name}
                  </p>
                  {sub && (
                    <p className="font-blueprint text-ink-dim truncate text-[0.65rem] uppercase">
                      {sub}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {member.role === "captain" && (
                    <Badge variant="warning">Captain</Badge>
                  )}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: "promote",
                            memberId: member.id,
                            name: member.profile.full_name,
                          })
                        }
                        className="font-blueprint text-ink-dim hover:text-ink inline-flex min-h-[44px] items-center rounded px-2 text-[0.65rem] uppercase transition-colors hover:bg-white/10"
                      >
                        Promote
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            type: "kick",
                            memberId: member.id,
                            name: member.profile.full_name,
                          })
                        }
                        className="font-blueprint text-lego-red inline-flex min-h-[44px] items-center rounded px-2 text-[0.65rem] uppercase transition-colors hover:bg-white/10 hover:brightness-125"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {slotsLeft > 0 && (
        <p className="font-blueprint text-ink-dim mt-4 rounded-lg border border-dashed border-white/20 px-3 py-2.5 text-center text-[0.65rem] uppercase">
          {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining
        </p>
      )}

      {confirmAction && (
        <div
          role="alertdialog"
          aria-label="Confirm roster change"
          className="border-grid-major bg-blueprint-950/70 mt-4 rounded-lg border p-4"
        >
          <p className="font-main text-ink-dim mb-3 text-center text-sm">
            {confirmAction.type === "kick" ? (
              <>
                Remove <b className="text-ink">{confirmAction.name}</b> from the
                team?
              </>
            ) : (
              <>
                Make <b className="text-ink">{confirmAction.name}</b> the new
                captain? You will become a regular member.
              </>
            )}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="secondary"
              size="full"
              onClick={() => {
                setConfirmAction(null);
                setError(undefined);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="full"
              className={
                confirmAction.type === "kick"
                  ? "bg-lego-red text-white hover:bg-lego-red/85"
                  : undefined
              }
              onClick={handleConfirm}
              disabled={isPending}
              loading={isPending}
            >
              {confirmAction.type === "kick" ? "Remove" : "Promote"}
            </Button>
          </div>
          {error && (
            <p className="font-main text-lego-red mt-2 text-center text-xs">
              {error}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
