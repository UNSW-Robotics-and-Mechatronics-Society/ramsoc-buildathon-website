"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import CreateTeamForm from "./CreateTeamForm";
import JoinTeamForm from "./JoinTeamForm";
import { markOnboarded } from "@/app/2026/_actions/profile";
import {
  MEMBER_LIMITS,
  getEntryFeeCents,
  formatAud,
} from "@/app/2026/_data/teamConfig";
import { CHOICE_CARD } from "./styles";
import FindTeamCallout from "@/app/2026/_components/FindTeamCallout";

export default function TeamStep({
  onComplete,
  hasTeam,
}: {
  onComplete: () => void;
  hasTeam: boolean;
}) {
  const [mode, setMode] = useState<"choose" | "create" | "join" | "find">(
    "choose",
  );
  const [delaying, setDelaying] = useState(false);
  const [delayError, setDelayError] = useState("");

  // Somebody who already has a team has nothing left to do here.
  useEffect(() => {
    if (hasTeam) onComplete();
  }, [hasTeam, onComplete]);

  if (hasTeam) return null;

  async function handleDecideLater() {
    setDelaying(true);
    setDelayError("");
    const result = await markOnboarded();
    if (result.success) {
      onComplete();
    } else {
      setDelaying(false);
      setDelayError(result.error || "Failed to skip team selection");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {mode === "choose" && (
        <motion.div
          key="choose"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col gap-4"
        >
          <div>
            <p className="spec-label">Step 03 / Team</p>
            <h2 className="mt-1 mb-2 text-2xl sm:text-3xl">Assemble your team</h2>
            <p className="font-main text-sm text-ink-dim">
              Teams are {MEMBER_LIMITS.min}–{MEMBER_LIMITS.max} people and pay a
              flat {formatAud(getEntryFeeCents())} entry fee per team. Start one,
              or join with a code from your captain.
            </p>
          </div>

          <button type="button" onClick={() => setMode("create")} className={CHOICE_CARD}>
            <span className="font-display text-lg leading-tight tracking-wide uppercase">
              Create a Team
            </span>
            <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
              Start a new team and invite others
            </span>
          </button>

          <button type="button" onClick={() => setMode("join")} className={CHOICE_CARD}>
            <span className="font-display text-lg leading-tight tracking-wide uppercase">
              Join a Team
            </span>
            <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
              Enter a join code from your captain
            </span>
          </button>

          <button type="button" onClick={() => setMode("find")} className={CHOICE_CARD}>
            <span className="font-display text-lg leading-tight tracking-wide uppercase">
              Find a Team
            </span>
            <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
              Signed up on your own? Pair up on Discord or at the kick-off
            </span>
          </button>

          <button
            type="button"
            onClick={handleDecideLater}
            disabled={delaying}
            className={CHOICE_CARD}
          >
            <span className="font-display text-lg leading-tight tracking-wide uppercase">
              {delaying ? "Saving…" : "Decide Later"}
            </span>
            <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
              Skip for now and set up your team from the dashboard
            </span>
          </button>

          {delayError && (
            <p role="alert" className="text-sm text-destructive">
              {delayError}
            </p>
          )}
        </motion.div>
      )}

      {mode !== "choose" && (
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="font-blueprint mb-4 inline-flex min-h-[44px] items-center text-xs text-ink-dim uppercase transition-colors hover:text-ink"
          >
            &larr; Back
          </button>
          {mode === "create" && <CreateTeamForm onComplete={onComplete} />}
          {mode === "join" && <JoinTeamForm onComplete={onComplete} />}
          {mode === "find" && (
            <div className="flex flex-col gap-4">
              <FindTeamCallout />
              <button
                type="button"
                onClick={handleDecideLater}
                disabled={delaying}
                className={CHOICE_CARD}
              >
                <span className="font-display text-lg leading-tight tracking-wide uppercase">
                  {delaying ? "Saving…" : "Continue for now"}
                </span>
                <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
                  Finish setup and join a team later from your dashboard
                </span>
              </button>
              {delayError && (
                <p role="alert" className="text-sm text-destructive">
                  {delayError}
                </p>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
