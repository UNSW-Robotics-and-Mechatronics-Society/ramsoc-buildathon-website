"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember, Profile } from "@/app/_types/registration";
import Card from "@/app/2026/_components/ui/Card";
import { Button } from "@/app/2026/_components/ui/Button";
import { promoteMember, kickMember } from "@/app/2026/_actions/team";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";

type MemberWithProfile = TeamMember & { profile: Profile };

/**
 * Brick colourways: solid, like real bricks. A filled seat should look filled,
 * and the earlier translucent tints read as disabled. Empty seats are the ones
 * that get the greyed-out treatment, further down.
 *
 * Written as literal class strings so Tailwind's scanner keeps them, never
 * build these names by interpolation.
 */
const BRICK_INK = "text-[#06264d]";
const CAPTAIN_BRICK = "bg-lego-yellow";

/*
 * Five colourways, one per non-captain seat. Coral stands in for LEGO red:
 * the real red is too dark for the shared brick ink, so it would need white
 * text and be the one brick that reads differently.
 */
const MEMBER_BRICKS = [
  "bg-lego-azure",
  "bg-lego-coral",
  "bg-lego-lime",
  "bg-lego-purple",
  "bg-lego-orange",
];

/**
 * Roster actions sit on top of a saturated brick. A translucent black wash
 * reads as a darker shade of whichever brick is underneath, so one class works
 * across the whole rotation without picking a colour per brick.
 */
const ROSTER_ACTION =
  "font-display inline-flex min-h-[36px] items-center justify-center rounded-md bg-black/20 px-3 text-xs font-bold tracking-wide text-current uppercase transition-colors hover:bg-black/30 focus-visible:ring-2 focus-visible:ring-white/70 outline-none";

/** Keeps filled bricks and empty slots the same height so the stack lines up. */
const BRICK_HEIGHT = "min-h-[4rem]";

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
              {/* The stud row above inherits this brick’s background colour. */}
              <div
                className={`lego-studs brick ${BRICK_HEIGHT} ${BRICK_INK} flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4 ${brick}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-main truncate text-sm font-semibold text-current">
                    {member.profile.full_name}
                  </p>
                  {sub && (
                    <p className="font-blueprint truncate text-[0.65rem] text-current uppercase opacity-75">
                      {sub}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {member.role === "captain" && (
                    <span className="font-blueprint text-lego-yellow rounded-full bg-[#0a2a55] px-2.5 py-1 text-[0.65rem] uppercase">
                      Captain
                    </span>
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
                        className={ROSTER_ACTION}
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
                        className={`${ROSTER_ACTION} hover:!bg-lego-red hover:text-white`}
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

        {/* Unfilled seats: greyed, see-through bricks so the roster reads as
            a part-built stack rather than a finished one. */}
        {Array.from({ length: slotsLeft }, (_, i) => (
          <li key={`slot-${i}`}>
            <div className={`lego-studs ${BRICK_HEIGHT} flex items-center gap-3 rounded-lg border border-dashed border-white/25 bg-white/5 px-3 py-3 sm:px-4 [--stud-color:rgba(255,255,255,0.14)]`}>
              <span className="font-blueprint text-ink-dim text-[0.65rem] uppercase opacity-80">
                Empty slot
              </span>
            </div>
          </li>
        ))}
      </ul>

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
