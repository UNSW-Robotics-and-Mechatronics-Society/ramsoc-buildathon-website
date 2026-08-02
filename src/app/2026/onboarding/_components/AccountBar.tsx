"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/app/2026/_components/ui/Button";

export default function AccountBar() {
  const { user } = useUser();
  const clerk = useClerk();
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress;
  const initials = user.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : "?";

  return (
    <div className="font-main mb-5 flex items-center justify-between gap-2 rounded-lg border border-grid-major bg-white/6 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full"
          />
        ) : (
          <div className="font-blueprint flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lego-yellow/20 text-xs font-semibold text-lego-yellow">
            {initials}
          </div>
        )}
        <span className="font-blueprint truncate text-[0.7rem] text-ink-dim">
          {email ?? "Signed in"}
        </span>
      </div>

      {showConfirm ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="ghost"
            size="default"
            className="h-8 min-h-0 px-2 py-0 text-xs"
            onClick={() => setShowConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="default"
            className="h-8 min-h-0 px-2 py-0 text-xs"
            onClick={() => clerk.signOut()}
          >
            Sign Out
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="default"
          className="h-8 min-h-0 shrink-0 px-2 py-0 text-xs text-ink-dim hover:text-ink"
          onClick={() => setShowConfirm(true)}
        >
          Switch Account
        </Button>
      )}
    </div>
  );
}
