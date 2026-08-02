"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { createTeam } from "@/app/2026/_actions/team";
import { markOnboarded } from "@/app/2026/_actions/profile";
import Input from "@/app/2026/_components/ui/Input";
import { Button } from "@/app/2026/_components/ui/Button";
import {
  MEMBER_LIMITS,
  getEntryFeeCents,
  formatAud,
} from "@/app/2026/_data/teamConfig";
import { BRICK_CTA, DRAFTING_LABELS } from "./styles";

export default function CreateTeamForm({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = ((new FormData(e.currentTarget).get("team_name") as string) || "").trim();
    if (!name) {
      setError("Team name is required");
      return;
    }

    setLoading(true);
    setError("");

    const result = await createTeam(name);

    setLoading(false);

    if (result.success && result.joinCode) {
      setJoinCode(result.joinCode);
      await markOnboarded();
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the code is on
      // screen anyway, so there is nothing useful to say.
    }
  }

  if (joinCode) {
    return (
      <div className="flex flex-col gap-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="spec-label">Team registered</p>
          <h3 className="mt-1 mb-2">Team Created</h3>
          <p className="font-main text-sm text-ink-dim">
            Share this join code with your teammates. Teams need{" "}
            {MEMBER_LIMITS.min}–{MEMBER_LIMITS.max} people.
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={() => handleCopy(joinCode)}
          className="drafting-frame flex min-h-[44px] w-full flex-col items-center gap-1 rounded-lg bg-blueprint-900/70 px-4 py-6 transition-colors hover:border-lego-yellow"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <span className="font-blueprint text-3xl font-semibold tracking-[0.3em] text-lego-yellow sm:text-4xl">
            {joinCode}
          </span>
          <span className="font-blueprint text-[0.65rem] text-ink-dim uppercase">
            {copied ? "Copied" : "Tap to copy"}
          </span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
        >
          <Button size="full" className={BRICK_CTA} onClick={onComplete}>
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${DRAFTING_LABELS}`}>
      <div>
        <p className="spec-label">Step 03 / Create</p>
        <h3 className="mt-1">Name your team</h3>
      </div>

      <Input
        label="Team Name"
        name="team_name"
        required
        maxLength={60}
        autoComplete="off"
        placeholder="e.g. Studs & Sprockets"
        error={error || undefined}
        aria-describedby="team-name-help"
      />

      <p id="team-name-help" className="font-main text-xs text-ink-dim">
        Open to everyone: UNSW students, other universities and high schoolers
        can all be on the same team. {MEMBER_LIMITS.min}–
        {MEMBER_LIMITS.max} members, {formatAud(getEntryFeeCents())} per team,
        payable from the dashboard once your team is full enough.
      </p>

      <div className="mt-2">
        <Button
          type="submit"
          size="full"
          className={BRICK_CTA}
          disabled={loading}
          loading={loading}
        >
          {loading ? "Creating…" : "Create Team"}
        </Button>
      </div>
    </form>
  );
}
