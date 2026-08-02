"use client";

import { cn } from "@/app/_utils/cn";

const STEP_LABELS = ["Who You Are", "Your Details", "Your Team"];

/**
 * The three onboarding steps rendered as numbered LEGO studs joined by a
 * drafting rule. Buildathon has one division, so the sequence is fixed at
 * three: user type, personal details, team.
 */
export default function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <nav aria-label="Progress" className="mb-7">
      <ol className="flex items-start gap-1.5 sm:gap-3">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isComplete = stepNum < currentStep;
          const label = STEP_LABELS[i] ?? `Step ${stepNum}`;
          return (
            <li
              key={stepNum}
              aria-current={isActive ? "step" : undefined}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <div className="flex w-full items-center gap-1.5">
                <span
                  className={cn(
                    "font-blueprint flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isActive &&
                      "border-lego-yellow bg-lego-yellow text-[#0a2a55] shadow-[0_0.2rem_0_rgb(0_0_0/0.3)]",
                    isComplete &&
                      "border-lego-yellow/60 bg-lego-yellow/20 text-lego-yellow",
                    !isActive &&
                      !isComplete &&
                      "border-grid-major bg-white/5 text-ink-dim",
                  )}
                >
                  {isComplete ? (
                    <svg
                      aria-hidden
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    String(stepNum).padStart(2, "0")
                  )}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1 transition-colors",
                    isComplete ? "bg-lego-yellow/50" : "bg-grid-major",
                  )}
                />
              </div>
              <span
                className={cn(
                  "font-blueprint w-full text-left text-[0.6rem] leading-tight uppercase sm:text-[0.68rem]",
                  isActive ? "text-ink" : "text-ink-dim",
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
