"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/2026/_components/ui/Button";
import { leaveTeam } from "@/app/2026/_actions/team";

export default function LeaveTeamButton() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleLeave() {
    startTransition(async () => {
      const result = await leaveTeam();
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="border-grid-major flex flex-col items-center gap-3 rounded-lg border border-dashed p-4">
        <p className="font-main text-ink text-sm">
          Leave this team? You will lose your place on the roster.
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            onClick={() => setConfirming(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-lego-red hover:bg-lego-red/85 text-white"
            onClick={handleLeave}
            disabled={isPending}
            loading={isPending}
          >
            {isPending ? "Leaving…" : "Confirm"}
          </Button>
        </div>
        {error && <p className="font-main text-lego-red text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        className="text-lego-red hover:text-lego-red hover:bg-lego-red/10"
        onClick={() => setConfirming(true)}
      >
        Leave team
      </Button>
      {error && <p className="font-main text-lego-red text-xs">{error}</p>}
    </div>
  );
}
