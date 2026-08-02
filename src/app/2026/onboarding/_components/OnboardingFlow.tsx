"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import StepIndicator from "./StepIndicator";
import AccountBar from "./AccountBar";
import UserTypeStep from "./UserTypeStep";
import StudentDetailsForm from "./StudentDetailsForm";
import TeamStep from "./TeamStep";
import { Button } from "@/app/2026/_components/ui/Button";
import Path from "@/app/path";
import { MEMBER_LIMITS, getEntryFeeCents, formatAud } from "@/app/2026/_data/teamConfig";
import { BRICK_CTA } from "./styles";
import type { UserType } from "@/app/_types/registration";

/**
 * Buildathon onboarding is three steps, there is no division picker, because
 * there is only one division:
 *
 *   1. Who you are (UNSW / other uni / high school)
 *   2. Your details
 *   3. Your team (create or join)
 */
const TOTAL_STEPS = 3;

const stepVariants = {
  enter: { opacity: 0, y: 30 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const stepTransition = {
  duration: 0.35,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
};

export default function OnboardingFlow({
  hasProfile,
  hasTeam,
  registrationOpen = true,
}: {
  hasProfile: boolean;
  hasTeam: boolean;
  registrationOpen?: boolean;
}) {
  const router = useRouter();
  // Someone who already has a profile resumes at the team step.
  const [step, setStep] = useState(hasProfile ? 3 : 0);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Stable identity: TeamStep fires this from an effect when the user already
  // has a team, and a fresh function each render would re-trigger it.
  const handleTeamComplete = useCallback(() => {
    router.push(Path[2026].Dashboard);
  }, [router]);

  const fee = formatAud(getEntryFeeCents());

  return (
    <div>
      <AccountBar />
      {step > 0 && <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col py-2"
          >
            <motion.p
              className="spec-label"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              RAMSoc UNSW presents
            </motion.p>
            <motion.h1
              className="mt-2 mb-4 text-4xl sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Buildathon 2026
            </motion.h1>
            <motion.p
              className="font-main mb-6 text-sm text-ink-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Six weeks. One brief. Design, build and pitch a working prototype
              with your team. Register below to get started.
            </motion.p>

            <motion.dl
              className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              {[
                { label: "Team size", value: `${MEMBER_LIMITS.min}–${MEMBER_LIMITS.max}` },
                { label: "Entry fee", value: `${fee} / team` },
                { label: "Duration", value: "Week 1–6" },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="rounded-lg border border-grid-major bg-white/6 px-3 py-2.5"
                >
                  <dt className="spec-label">{spec.label}</dt>
                  <dd className="font-display mt-0.5 text-lg tracking-wide uppercase">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </motion.dl>

            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <Button size="full" className={BRICK_CTA} onClick={() => setStep(1)}>
                Get Started
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
          >
            <UserTypeStep
              onSelect={(type) => {
                setUserType(type);
                setStep(2);
              }}
              registrationOpen={registrationOpen}
            />
          </motion.div>
        )}

        {step === 2 && userType && (
          <motion.div
            key="step-2"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
          >
            <StudentDetailsForm
              onComplete={() => setStep(3)}
              onBack={() => {
                setUserType(null);
                setStep(1);
              }}
              userType={userType}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
          >
            <TeamStep onComplete={handleTeamComplete} hasTeam={hasTeam} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
