"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import type { Ticket } from "@/app/_types/market";
import { Button } from "@/app/2026/_components/ui/Button";
import TicketCard from "@/app/2026/_components/tickets/TicketCard";
import {
  CLAIM_PARAM,
  EGGS,
  TICKET_CLASSES,
  type EggSource,
} from "@/app/2026/_data/tickets";
import Path from "@/app/path";

export type EggPhase =
  | { state: "loading" }
  | { state: "unclaimed" }
  | { state: "claiming" }
  | { state: "claimed"; ticket: Ticket | null; fresh: boolean }
  | { state: "signed-out" }
  | { state: "no-profile" }
  | { state: "error"; message: string };

/** Brick confetti: a handful of studded tiles tumbling past the ticket. */
const CONFETTI = [
  "#ffcf00",
  "#d9202a",
  "#35a3e0",
  "#4c9f38",
  "#f57c20",
  "#b18cf0",
  "#ff6f61",
  "#c2e02c",
];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 16 }, (_, i) => {
        const colour = CONFETTI[i % CONFETTI.length];
        const left = (i * 61) % 100;
        const delay = (i % 5) * 0.12;
        const drift = ((i * 37) % 60) - 30;
        return (
          <motion.span
            key={i}
            initial={{ y: -40, x: 0, rotate: 0, opacity: 0 }}
            animate={{ y: 520, x: drift, rotate: 540 + i * 40, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.4 + (i % 3) * 0.4, delay, ease: "easeIn" }}
            style={{ left: `${left}%`, backgroundColor: colour }}
            className="lego-studs absolute top-0 block h-3 w-5 rounded-[2px]"
          />
        );
      })}
    </div>
  );
}

export default function EggPopup({
  source,
  phase,
  onClaim,
  onClose,
}: {
  source: EggSource;
  phase: EggPhase;
  onClaim: () => void;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const egg = EGGS[source];
  const spec = TICKET_CLASSES[egg.class];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const claimed = phase.state === "claimed";
  const celebrate = claimed && phase.fresh;

  const signInHref = `${Path[2026].SignIn}?redirect_url=${encodeURIComponent(
    `${pathname}?${CLAIM_PARAM}=${source}`,
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="egg-heading"
      className="bg-blueprint-950/85 fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="drafting-frame bg-blueprint-900 relative w-full max-w-md rounded-xl p-6 shadow-2xl sm:p-7"
      >
        {celebrate && <Confetti />}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="font-blueprint text-ink-dim hover:text-ink absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-md text-lg"
        >
          ×
        </button>

        <p className="spec-label">Easter egg · {egg.title}</p>
        <h2 id="egg-heading" className="mt-1 text-2xl sm:text-3xl">
          {claimed
            ? phase.fresh
              ? "Ticket printed"
              : "Already claimed"
            : "You found something"}
        </h2>
        <p className="font-main text-ink-dim mt-2 text-sm">
          {claimed
            ? phase.ticket
              ? phase.fresh
                ? `A ${spec.label} component-shop ticket, saved to your account. Show it at a workshop, or take it to the Black Market.`
                : "This one is already in your account."
              : "You claimed this one before and have since traded it away."
            : `${egg.blurb} That's worth a ${spec.label} component-shop ticket.`}
        </p>

        {/* The reveal: a claimed ticket prints out, an unclaimed one sits
            behind a slot as a silhouette in its class colour. */}
        <div className="relative mt-5">
          {claimed && phase.ticket ? (
            <TicketCard ticket={phase.ticket} animate={phase.fresh} />
          ) : (
            <div
              aria-hidden
              style={{ backgroundColor: spec.brick, color: spec.ink }}
              className="lego-studs flex items-center gap-5 rounded-lg px-5 py-4 opacity-60"
            >
              <span className="font-display text-6xl leading-none font-bold">
                {egg.class}
              </span>
              <span className="font-display text-xl leading-tight font-bold uppercase">
                Bonus ticket · {spec.label}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          {phase.state === "loading" && (
            <p className="font-blueprint text-ink-dim text-center text-xs uppercase">
              Checking the ledger…
            </p>
          )}

          {(phase.state === "unclaimed" ||
            phase.state === "claiming" ||
            phase.state === "error") && (
            <Button
              size="full"
              onClick={onClaim}
              loading={phase.state === "claiming"}
              disabled={phase.state === "claiming"}
              className="font-display brick text-lg font-bold tracking-wide uppercase"
            >
              {phase.state === "claiming" ? "Printing…" : "Claim the ticket"}
            </Button>
          )}

          {phase.state === "error" && (
            <p role="alert" className="font-main text-center text-sm text-[#ffc9c9]">
              {phase.message}
            </p>
          )}

          {phase.state === "signed-out" && (
            <>
              <Link href={signInHref} className="button w-full text-base">
                Sign in to claim it
              </Link>
              <p className="font-main text-ink-dim text-center text-xs">
                Tickets are saved to your Buildathon account. We&apos;ll bring
                you straight back here.
              </p>
            </>
          )}

          {phase.state === "no-profile" && (
            <>
              <Link href={Path[2026].Onboarding} className="button w-full text-base">
                Finish registering
              </Link>
              <p className="font-main text-ink-dim text-center text-xs">
                Come back to this page afterwards and the ticket is yours.
              </p>
            </>
          )}

          {claimed && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`${Path[2026].Dashboard}#profile`}
                className="button-outline flex-1 text-base"
              >
                My tickets
              </Link>
              <Link href={Path[2026].Market} className="button flex-1 text-base">
                Black Market
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
