"use client";

import { motion } from "motion/react";

import type { UserType } from "@/app/_types/registration";
import { CHOICE_CARD } from "./styles";

const USER_TYPE_OPTIONS: {
  value: UserType;
  title: string;
  description: string;
}[] = [
  {
    value: "unsw",
    title: "UNSW Student",
    description: "Currently enrolled at UNSW",
  },
  {
    value: "other_uni",
    title: "Other University",
    description: "Enrolled at another university",
  },
  {
    value: "high_school",
    title: "High School Student",
    description: "Currently attending high school",
  },
];

/**
 * Buildathon runs a single division open to everyone, so this step only
 * decides which set of detail fields to show next — it never gates entry.
 */
export default function UserTypeStep({
  onSelect,
  registrationOpen = true,
}: {
  onSelect: (type: UserType) => void;
  registrationOpen?: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="spec-label">Step 01 / Entrant</p>
        <h2 className="mt-1 mb-2 text-2xl sm:text-3xl">Who are you?</h2>
        <p className="font-main text-sm text-ink-dim">
          Everyone competes in the same division — this just tells us which
          details to ask for.
        </p>
      </motion.div>

      <div className="flex w-full flex-col gap-3">
        {USER_TYPE_OPTIONS.map((opt, i) => (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => registrationOpen && onSelect(opt.value)}
            disabled={!registrationOpen}
            className={CHOICE_CARD}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.15 + i * 0.08,
              duration: 0.35,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <span className="font-display text-lg leading-tight tracking-wide uppercase">
              {opt.title}
            </span>
            <span className="font-blueprint text-[0.7rem] text-ink-dim uppercase">
              {registrationOpen ? opt.description : "Registration closed"}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
