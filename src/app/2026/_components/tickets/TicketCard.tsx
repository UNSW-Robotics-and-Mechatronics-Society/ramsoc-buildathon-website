"use client";

import { motion } from "motion/react";
import type { Ticket } from "@/app/_types/market";
import { EGGS, TICKET_CLASSES, isEggSource } from "@/app/2026/_data/tickets";
import { cn } from "@/app/_utils/cn";

/**
 * A component-shop ticket, drawn as an arcade stub in a LEGO brick colour:
 * studs along the top, perforations down both ends, the class letter big
 * enough to read across a table. This is the thing people screenshot and
 * show at a workshop, so the class colour and letter carry the meaning and
 * everything else is supporting detail.
 */

/** Perforated ends. A repeating radial mask punches holes out of both edges. */
const PERFORATION = {
  WebkitMaskImage:
    "radial-gradient(circle 5px at 0 50%, transparent 97%, #000 100%), radial-gradient(circle 5px at 100% 50%, transparent 97%, #000 100%)",
  maskImage:
    "radial-gradient(circle 5px at 0 50%, transparent 97%, #000 100%), radial-gradient(circle 5px at 100% 50%, transparent 97%, #000 100%)",
  WebkitMaskSize: "51% 18px",
  maskSize: "51% 18px",
  WebkitMaskPosition: "left top, right top",
  maskPosition: "left top, right top",
  WebkitMaskRepeat: "repeat-y",
  maskRepeat: "repeat-y",
} as const;

export default function TicketCard({
  ticket,
  holderName,
  size = "md",
  animate = false,
  className,
}: {
  ticket: Ticket;
  /** Shown on the face when the ticket is being presented, never in the market. */
  holderName?: string;
  size?: "sm" | "md" | "lg";
  /** Play the "printed from a slot" entrance. */
  animate?: boolean;
  className?: string;
}) {
  const spec = TICKET_CLASSES[ticket.class];
  const origin = isEggSource(ticket.source) ? EGGS[ticket.source].title : "Bonus";
  const traded = ticket.transfer_count > 0;

  const sizes = {
    sm: { pad: "px-4 py-3", letter: "text-4xl", meta: "text-[0.55rem]" },
    md: { pad: "px-5 py-4", letter: "text-6xl", meta: "text-[0.65rem]" },
    lg: { pad: "px-6 py-5 sm:px-8 sm:py-6", letter: "text-7xl sm:text-8xl", meta: "text-xs" },
  }[size];

  return (
    <motion.div
      initial={animate ? { y: -48, opacity: 0, scaleY: 0.6 } : false}
      animate={{ y: 0, opacity: 1, scaleY: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
      style={{ transformOrigin: "top center" }}
      className={cn("relative", className)}
    >
      <div
        role="img"
        aria-label={`${spec.label} component-shop ticket, serial ${ticket.serial}${holderName ? `, held by ${holderName}` : ""}`}
        style={{ backgroundColor: spec.brick, color: spec.ink, ...PERFORATION }}
        className={cn(
          "lego-studs relative overflow-hidden rounded-lg",
          sizes.pad,
        )}
      >
        {/* Shimmer sweep so a freshly claimed ticket reads as just printed. */}
        {animate && (
          <motion.div
            aria-hidden
            initial={{ x: "-120%" }}
            animate={{ x: "220%" }}
            transition={{ duration: 1.1, delay: 0.45, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-y-0 w-1/3 skew-x-[-20deg] bg-white/30"
          />
        )}

        <div className="flex items-center gap-5">
          {/* Class letter, the one thing a staff member needs to read. */}
          <div
            className={cn(
              "font-display shrink-0 leading-none font-bold tracking-tight",
              sizes.letter,
            )}
          >
            {ticket.class}
          </div>

          <div className="min-w-0 flex-1 border-l border-current/30 pl-5">
            <p
              className={cn(
                "font-blueprint uppercase opacity-80",
                sizes.meta,
              )}
            >
              RAMSoc Buildathon 2026 · Component shop
            </p>
            <p className="font-display mt-0.5 text-xl leading-tight font-bold uppercase sm:text-2xl">
              Bonus ticket · {spec.label}
            </p>
            <dl
              className={cn(
                "font-blueprint mt-2 flex flex-wrap gap-x-4 gap-y-0.5 uppercase",
                sizes.meta,
              )}
            >
              <div className="flex gap-1.5">
                <dt className="opacity-70">No.</dt>
                <dd className="tabular-nums">{ticket.serial}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="opacity-70">From</dt>
                <dd>{origin}</dd>
              </div>
              {traded && (
                <div className="flex gap-1.5">
                  <dt className="opacity-70">Traded</dt>
                  <dd>×{ticket.transfer_count}</dd>
                </div>
              )}
            </dl>
            {holderName && (
              <p className="font-main mt-2 truncate text-sm font-semibold">
                {holderName}
              </p>
            )}
          </div>
        </div>

        <p
          className={cn(
            "font-blueprint mt-3 border-t border-current/30 pt-2 uppercase opacity-80",
            sizes.meta,
          )}
        >
          Show this to a RAMSoc organiser at a workshop. One use.
        </p>
      </div>
    </motion.div>
  );
}
