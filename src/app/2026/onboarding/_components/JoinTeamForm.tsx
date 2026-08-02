"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { previewTeam, joinTeam } from "@/app/2026/_actions/team";
import { markOnboarded } from "@/app/2026/_actions/profile";
import Input from "@/app/2026/_components/ui/Input";
import { Button } from "@/app/2026/_components/ui/Button";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";
import { BRICK_CTA, DRAFTING_LABELS } from "./styles";

export default function JoinTeamForm({ onComplete }: { onComplete: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    name: string;
    memberCount: number;
  } | null>(null);

  async function handlePreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Join code must be 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const result = await previewTeam(code);
    setLoading(false);

    if (result.success && result.team) {
      setPreview(result.team);
    } else {
      setError(result.error || "Invalid code");
    }
  }

  async function handleJoin() {
    setLoading(true);
    setError("");

    const result = await joinTeam(code);
    setLoading(false);

    if (result.success) {
      await markOnboarded();
      onComplete();
    } else {
      setError(result.error || "Failed to join team");
    }
  }

  if (preview) {
    const full = preview.memberCount >= MEMBER_LIMITS.max;
    return (
      <div className="flex flex-col gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="drafting-frame rounded-lg bg-blueprint-900/70 p-5"
        >
          <p className="spec-label">Team found</p>
          <h3 className="mt-1 mb-2">{preview.name}</h3>
          <p className="font-blueprint text-xs text-ink-dim uppercase">
            {preview.memberCount} / {MEMBER_LIMITS.max} members
          </p>
        </motion.div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {full && (
          <p role="alert" className="text-sm text-destructive">
            This team already has the maximum of {MEMBER_LIMITS.max} members.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="secondary"
            size="full"
            onClick={() => {
              setPreview(null);
              setError("");
              setCode("");
            }}
          >
            Cancel
          </Button>
          <Button
            size="full"
            className={BRICK_CTA}
            onClick={handleJoin}
            disabled={loading || full}
            loading={loading}
          >
            {loading ? "Joining…" : "Join Team"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePreview} className={`flex flex-col gap-4 ${DRAFTING_LABELS}`}>
      <div>
        <p className="spec-label">Step 03 / Join</p>
        <h3 className="mt-1">Enter your join code</h3>
      </div>

      <Input
        label="Join Code"
        name="join_code"
        value={code}
        onChange={(e) => {
          setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
          if (error) setError("");
        }}
        placeholder="ABCDEF"
        maxLength={6}
        inputMode="text"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        className="font-blueprint text-center text-2xl tracking-[0.3em] uppercase"
        error={error || undefined}
        aria-describedby="join-code-help"
      />

      <p id="join-code-help" className="font-main text-xs text-ink-dim">
        Your captain gets a six-character code when they create the team. Teams
        are {MEMBER_LIMITS.min}–{MEMBER_LIMITS.max} people.
      </p>

      <div className="mt-2">
        <Button
          type="submit"
          size="full"
          className={BRICK_CTA}
          disabled={loading || code.length !== 6}
          loading={loading}
        >
          {loading ? "Looking up…" : "Find Team"}
        </Button>
      </div>
    </form>
  );
}
