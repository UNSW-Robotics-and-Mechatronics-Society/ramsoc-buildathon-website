"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";
import { Button } from "@/app/2026/_components/ui/Button";

/**
 * Six. Seven. The digits are built from 1×1 bricks on a 5×7 grid, and the
 * hands do the thing: palms up, one then the other, weighing nothing in
 * particular. Everything is drawn here; there are no meme assets to license.
 */

const SIX = [
  "01110",
  "10001",
  "10000",
  "11110",
  "10001",
  "10001",
  "01110",
];

const SEVEN = [
  "11111",
  "00001",
  "00010",
  "00100",
  "00100",
  "00100",
  "00100",
];

function BrickDigit({
  rows,
  colour,
  delay,
}: {
  rows: string[];
  colour: string;
  delay: number;
}) {
  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
      aria-hidden
    >
      {rows.flatMap((row, y) =>
        row.split("").map((cell, x) => {
          const on = cell === "1";
          const i = y * 5 + x;
          return (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={on ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 0.08 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 24,
                delay: delay + (on ? i * 0.025 : 0),
              }}
              style={{ backgroundColor: on ? colour : "#ffffff" }}
              className="relative block aspect-square w-6 rounded-[3px] sm:w-9 md:w-11"
            >
              {/* One stud per brick. */}
              {on && (
                <span
                  className="absolute top-1/2 left-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    backgroundColor: colour,
                    boxShadow:
                      "inset 0 -2px 0 rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                />
              )}
            </motion.span>
          );
        }),
      )}
    </div>
  );
}

/** An open minifig hand, palm up: a C-clamp on a wrist, seen from the front. */
function Hand({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-20 w-20 sm:h-28 sm:w-28"
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      {/* Wrist */}
      <rect x="26" y="40" width="12" height="20" rx="3" fill="#e0b900" />
      {/* Palm: a ring with the gap at the top, the classic LEGO hand. */}
      <path
        d="M32 8 a18 18 0 1 0 0.01 0 Z"
        fill="none"
        stroke="#f7d117"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray="88 30"
        strokeDashoffset="-14"
      />
      {/* Highlight */}
      <path
        d="M20 22 a14 14 0 0 1 8 -8"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export default function SixSeven() {
  const egg = useEgg();
  const opened = useRef(false);
  const [beat, setBeat] = useState<"six" | "seven">("six");

  // The digits land, the hands do two rounds, then the ticket appears on its
  // own. The button stays for anyone who closes it.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (opened.current) return;
      opened.current = true;
      egg.open("67");
    }, 2600);
    return () => clearTimeout(timer);
  }, [egg]);

  useEffect(() => {
    const id = setInterval(
      () => setBeat((b) => (b === "six" ? "seven" : "six")),
      700,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      {/* Floating loose studs in the background. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: [40, -30, 40], opacity: [0, 0.35, 0] }}
            transition={{
              duration: 6 + (i % 4),
              delay: i * 0.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ left: `${(i * 73) % 100}%`, top: `${(i * 41) % 100}%` }}
            className="absolute h-3 w-3 rounded-full bg-white/60"
          />
        ))}
      </div>

      <p className="spec-label mb-6">Sheet ∞ · Unlisted</p>

      <div className="flex items-end gap-6 sm:gap-10">
        <motion.div
          animate={{ y: beat === "six" ? -14 : 0, scale: beat === "six" ? 1.03 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <BrickDigit rows={SIX} colour="#ffcf00" delay={0.2} />
        </motion.div>
        <motion.div
          animate={{ y: beat === "seven" ? -14 : 0, scale: beat === "seven" ? 1.03 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          <BrickDigit rows={SEVEN} colour="#35a3e0" delay={0.7} />
        </motion.div>
      </div>

      {/* The gesture. */}
      <div className="mt-8 flex items-center gap-10 sm:gap-20">
        <motion.div
          animate={{ y: beat === "six" ? -18 : 6, rotate: beat === "six" ? -8 : 4 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <Hand />
        </motion.div>
        <motion.div
          animate={{ y: beat === "seven" ? -18 : 6, rotate: beat === "seven" ? 8 : -4 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
        >
          <Hand flip />
        </motion.div>
      </div>

      <h1 className="font-stud text-ink mt-10 lowercase">
        six
        <span className="text-lego-azure ml-3">seven</span>
      </h1>
      <p className="text-ink-dim mt-3 max-w-md text-lg">
        Not six. Not seven. Somewhere in between, weighed by hand. You typed
        this URL on purpose and we both know it.
      </p>

      <Button
        size="lg"
        onClick={() => {
          opened.current = true;
          egg.open("67");
        }}
        className="font-display brick mt-8 text-lg font-bold tracking-wide uppercase"
      >
        Claim your Class C ticket
      </Button>
    </section>
  );
}
