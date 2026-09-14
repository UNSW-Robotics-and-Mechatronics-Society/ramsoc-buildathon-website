"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";
import { Button } from "@/app/2026/_components/ui/Button";

/**
 * Rambo, RAMSoc's mascot: a blueprint-blue robo-ram with beige horns and an
 * antenna. The artwork is /2026/brand/rambo.png; if it is missing the page
 * still stands up with a brick silhouette in his colours, so a deploy is
 * never broken by an asset.
 */

const RAMBO_SRC = "/2026/brand/rambo.png";

/** Mascot palette, sampled from the artwork. */
const RAMBO_BLUE = "#2f5c8a";
const RAMBO_NAVY = "#1e3f66";
const RAMBO_HORN = "#e8d3a5";

const LINES = [
  "Baa. You weren't supposed to find this.",
  "I'm the mascot. I don't get a kit. It's fine.",
  "Six weeks. One build. Zero sleep. Baa.",
  "The horns are Technic. Don't ask.",
  "Tell nobody. Take the ticket.",
];

/** Fallback: Rambo in bricks. Close enough to be him, not close enough to fool anyone. */
function BrickRambo() {
  return (
    <svg viewBox="0 0 160 180" className="h-full w-full" aria-hidden>
      {/* Antenna */}
      <rect x="77" y="4" width="6" height="26" rx="3" fill={RAMBO_NAVY} />
      <circle cx="80" cy="6" r="6" fill={RAMBO_NAVY} />
      {/* Horns */}
      <path
        d="M22 70 C 2 60, 4 28, 30 26 C 52 24, 58 48, 44 58 C 36 64, 26 60, 28 50"
        fill={RAMBO_HORN}
        stroke="#d8c08c"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M138 70 C 158 60, 156 28, 130 26 C 108 24, 102 48, 116 58 C 124 64, 134 60, 132 50"
        fill={RAMBO_HORN}
        stroke="#d8c08c"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Head, a cloud of wool */}
      <path
        d="M40 60 C 30 40, 60 26, 80 34 C 100 26, 130 40, 120 60 C 138 66, 134 96, 116 98 L 44 98 C 26 96, 22 66, 40 60 Z"
        fill={RAMBO_BLUE}
        stroke={RAMBO_NAVY}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Face plate */}
      <rect x="50" y="58" width="60" height="34" rx="14" fill="#f4f7fb" stroke={RAMBO_NAVY} strokeWidth="4" />
      <rect x="62" y="68" width="8" height="12" rx="2" fill={RAMBO_NAVY} />
      <rect x="90" y="68" width="8" height="12" rx="2" fill={RAMBO_NAVY} />
      <path d="M74 82 Q80 88 86 82" stroke={RAMBO_NAVY} strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Body */}
      <rect x="48" y="100" width="64" height="52" rx="18" fill="#f4f7fb" stroke={RAMBO_NAVY} strokeWidth="5" />
      <path d="M48 118 Q80 130 112 118 L112 134 Q80 146 48 134 Z" fill={RAMBO_BLUE} />
      {/* Feet */}
      <rect x="46" y="150" width="28" height="18" rx="8" fill={RAMBO_BLUE} stroke={RAMBO_NAVY} strokeWidth="4" />
      <rect x="86" y="150" width="28" height="18" rx="8" fill={RAMBO_BLUE} stroke={RAMBO_NAVY} strokeWidth="4" />
    </svg>
  );
}

export default function RamboStage() {
  const egg = useEgg();
  const opened = useRef(false);
  const [missing, setMissing] = useState(false);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (opened.current) return;
      opened.current = true;
      egg.open("rambo");
    }, 2800);
    return () => clearTimeout(timer);
  }, [egg]);

  useEffect(() => {
    const id = setInterval(() => setLine((l) => (l + 1) % LINES.length), 3200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      {/* Horn-coloured bricks drifting up behind him. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ y: 60, opacity: 0, rotate: 0 }}
            animate={{ y: -80, opacity: [0, 0.5, 0], rotate: i % 2 ? 25 : -25 }}
            transition={{
              duration: 7 + (i % 3),
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${(i * 79) % 100}%`,
              top: `${30 + ((i * 47) % 60)}%`,
              backgroundColor: i % 3 === 0 ? RAMBO_HORN : RAMBO_BLUE,
            }}
            className="lego-studs absolute block h-4 w-8 rounded-[3px]"
          />
        ))}
      </div>

      <p className="spec-label mb-6">Sheet ∞ · Personnel file</p>

      {/* Speech bubble */}
      <motion.div
        key={line}
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="drafting-frame bg-blueprint-900/90 relative mb-6 max-w-sm rounded-xl px-5 py-3"
      >
        <p className="font-main text-ink text-base">{LINES[line]}</p>
        <span
          aria-hidden
          className="bg-blueprint-900 border-grid-major absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r border-b"
        />
      </motion.div>

      {/* Rambo himself, bobbing, with the antenna tip blinking. */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, 1.5, 0, -1.5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative h-64 w-56 sm:h-80 sm:w-72"
      >
        {missing ? (
          <BrickRambo />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- falls back on error, which next/image cannot do
          <img
            src={RAMBO_SRC}
            alt="Rambo, RAMSoc's mascot: a blue robotic ram with beige horns and an antenna"
            className="h-full w-full object-contain drop-shadow-[0_12px_0_rgba(0,0,0,0.25)]"
            onError={() => setMissing(true)}
          />
        )}
        <motion.span
          aria-hidden
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="bg-lego-yellow absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full shadow-[0_0_14px_4px_rgba(255,207,0,0.55)]"
        />
      </motion.div>

      <h1 className="font-stud text-ink mt-8 lowercase">rambo</h1>
      <p className="text-ink-dim mt-3 max-w-md text-lg">
        RAMSoc&apos;s mascot. Blueprint blue, Technic horns, one antenna, no
        idea what the brief is either.
      </p>

      <Button
        size="lg"
        onClick={() => {
          opened.current = true;
          egg.open("rambo");
        }}
        className="font-display brick mt-8 text-lg font-bold tracking-wide uppercase"
      >
        Claim your Class B ticket
      </Button>
    </section>
  );
}
