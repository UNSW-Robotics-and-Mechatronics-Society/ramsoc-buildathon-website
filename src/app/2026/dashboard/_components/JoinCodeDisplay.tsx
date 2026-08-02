"use client";

import { useState } from "react";
import Card from "@/app/2026/_components/ui/Card";

/**
 * The team's join code, stamped like a part number on a drawing: mono type,
 * wide tracking, inside a dashed drafting frame. Hidden until tapped so a
 * shoulder-surfer can't grab it off a laptop screen.
 */
export default function JoinCodeDisplay({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleClick() {
    if (!revealed) {
      setRevealed(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API is unavailable (insecure context, denied permission).
      setCopyFailed(true);
    }
  }

  const status = !revealed
    ? "Tap to reveal"
    : copyFailed
      ? "Copy it manually"
      : copied
        ? "Copied to clipboard"
        : "Tap to copy";

  return (
    <Card className="bg-blueprint-900/50 p-4 sm:p-5">
      <p className="spec-label">Part No. &middot; Join code</p>
      <p className="font-main text-ink-dim mt-1 mb-3 text-sm">
        {revealed
          ? "Share this code with your teammates so they can join."
          : "Your team's join code is hidden. Tap the plate to reveal it."}
      </p>

      <button
        type="button"
        onClick={handleClick}
        aria-label={
          revealed ? `Copy join code ${code}` : "Reveal your team join code"
        }
        className="drafting-frame bg-blueprint-950/70 hover:border-lego-yellow focus-visible:ring-ring/60 mx-auto flex min-h-[64px] w-full max-w-xs items-center justify-center rounded-lg px-4 py-3 transition-colors outline-none focus-visible:ring-2"
      >
        <span
          className={`font-blueprint text-2xl tracking-[0.35em] uppercase sm:text-3xl ${
            revealed ? "text-lego-yellow" : "text-ink-dim"
          }`}
        >
          {revealed ? code : "••••••"}
        </span>
      </button>

      <p
        aria-live="polite"
        className="font-blueprint text-ink-dim mt-2.5 text-center text-[0.65rem] uppercase"
      >
        {status}
      </p>
    </Card>
  );
}
