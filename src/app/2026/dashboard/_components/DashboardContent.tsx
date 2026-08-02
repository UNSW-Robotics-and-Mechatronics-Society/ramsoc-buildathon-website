"use client";

import { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import type {
  Profile,
  TeamWithMembers,
  TeamBrowseItem,
} from "@/app/_types/registration";
import type { UserTask } from "@/app/2026/_actions/tasks";
import Card from "@/app/2026/_components/ui/Card";
import Badge from "@/app/2026/_components/ui/Badge";
import { completeTask } from "@/app/2026/_actions/tasks";
import TeamCard from "./TeamCard";
import MemberList from "./MemberList";
import JoinCodeDisplay from "./JoinCodeDisplay";
import NoTeamState from "./NoTeamState";
import LeaveTeamButton from "./LeaveTeamButton";
import ProfileTab from "./ProfileTab";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";
import Path from "@/app/path";

type Tab = "home" | "team" | "profile";

const TABS: Tab[] = ["home", "team", "profile"];

const TAB_LABELS: Record<Tab, string> = {
  home: "Home",
  team: "Team",
  profile: "Profile",
};

/* ------------------------------------------------------------------ */
/*  Small pieces                                                      */
/* ------------------------------------------------------------------ */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * A collapsible run of checklist items, presented as a numbered section of the
 * build sheet.
 */
function CollapsibleSection({
  title,
  index,
  total,
  completedCount,
  children,
}: {
  title: string;
  index: string;
  total: number;
  completedCount: number;
  children: React.ReactNode;
}) {
  const allDone = completedCount === total;
  const [expanded, setExpanded] = useState(!allDone);

  return (
    <Card className="bg-blueprint-900/50 p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="text-ink hover:text-lego-yellow flex min-h-[44px] w-full items-center justify-between gap-3 text-left transition-colors"
      >
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span className="font-blueprint text-ink-dim text-xs">{index}</span>
          <span className="font-display truncate text-lg font-bold uppercase">
            {title}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span
            className={`font-blueprint rounded-full px-2 py-0.5 text-[0.65rem] ${
              allDone
                ? "bg-lego-green/20 text-lego-green"
                : "text-ink-dim bg-white/10"
            }`}
          >
            {completedCount}/{total}
          </span>
          <Chevron open={expanded} />
        </span>
      </button>
      {expanded && <div className="mt-3 flex flex-col gap-2">{children}</div>}
    </Card>
  );
}

function ActionItem({
  label,
  description,
  url,
  done,
  onClick,
  onComplete,
}: {
  label: string;
  description?: string;
  url?: string;
  done: boolean;
  onClick?: () => void;
  onComplete?: () => void;
}) {
  const expandable = !!(description || url || onComplete);
  const [expanded, setExpanded] = useState(false);

  function handleClick() {
    if (expandable && !done) {
      setExpanded((v) => !v);
    } else if (onClick) {
      onClick();
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 transition-colors hover:border-white/20">
      <button
        type="button"
        onClick={handleClick}
        disabled={done && !expandable}
        aria-expanded={expandable ? expanded : undefined}
        className={`font-main flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors sm:px-4 ${
          done ? "text-ink-dim" : "text-ink"
        }`}
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-xs ${
            done
              ? "border-lego-green bg-lego-green text-white"
              : "border-white/30"
          }`}
          aria-hidden
        >
          {done ? "✓" : ""}
        </span>
        <span className={`flex-1 ${done ? "line-through" : ""}`}>{label}</span>
        {expandable && <Chevron open={expanded} />}
      </button>
      {expandable && expanded && (
        <div className="flex flex-col gap-2 px-3 pb-3 pl-11 sm:px-4 sm:pl-12">
          {description && (
            <p className="font-main text-ink-dim text-xs">{description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link font-main inline-flex min-h-[44px] items-center gap-1 text-xs"
              >
                Open link
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
            {onComplete && !done && (
              <button
                type="button"
                onClick={onComplete}
                className="font-blueprint text-lego-green border-lego-green/40 hover:bg-lego-green/10 inline-flex min-h-[44px] items-center rounded-md border px-3 text-[0.65rem] uppercase transition-colors"
              >
                Mark complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={active ? 2.5 : 1.75}
      aria-hidden
    >
      {tab === "home" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
        />
      )}
      {tab === "team" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      )}
      {tab === "profile" && (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      )}
    </svg>
  );
}

/** Mobile-only tab bar, portalled to <body> so it escapes any transformed parent. */
export function BottomTabBar({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="bg-blueprint-950/95 fixed inset-x-0 bottom-0 z-50 border-t border-white/15 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
    >
      <div className="mx-auto flex max-w-lg justify-around">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-current={tab === t ? "page" : undefined}
            className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              tab === t ? "text-lego-yellow" : "text-ink-dim hover:text-ink"
            }`}
          >
            <TabIcon tab={t} active={tab === t} />
            <span className="font-blueprint text-[0.65rem] uppercase">
              {TAB_LABELS[t]}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Desktop tab strip, a row of LEGO tiles. */
function TabStrip({
  tab,
  setTab,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
}) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="mb-6 hidden gap-2 sm:flex"
    >
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          aria-current={tab === t ? "page" : undefined}
          className={`font-display brick inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 px-4 text-base font-bold tracking-wide uppercase transition-colors ${
            tab === t
              ? "bg-lego-yellow text-[#0a2a55]"
              : "text-ink bg-white/8 hover:bg-white/15"
          }`}
        >
          <TabIcon tab={t} active={tab === t} />
          {TAB_LABELS[t]}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */

export default function DashboardContent({
  profile,
  team,
  browsableTeams,
  adminTasks = [],
}: {
  profile: Profile;
  team: TeamWithMembers | null;
  browsableTeams: TeamBrowseItem[];
  adminTasks?: UserTask[];
}) {
  const [tab, setTab] = useState<Tab>("home");
  const [mounted, setMounted] = useState(false);
  const [, startTaskTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleCompleteTask(taskId: string) {
    startTaskTransition(async () => {
      await completeTask(taskId);
      router.refresh();
    });
  }

  const isCaptain =
    team?.members.some(
      (m) => m.profile_id === profile.id && m.role === "captain",
    ) ?? false;

  const hasTeam = !!team;
  const memberCount = team?.members.length ?? 0;
  const hasEnoughMembers = memberCount >= MEMBER_LIMITS.min;
  const isPaid = team?.paid ?? false;
  const firstName = profile.full_name?.split(" ")[0] || "builder";

  return (
    <>
      <TabStrip tab={tab} setTab={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* ── Home ── */}
          {tab === "home" && (
            <div className="flex flex-col gap-4 sm:gap-5">
              <Card className="bg-blueprint-900/50 p-4 sm:p-5">
                <p className="spec-label">Entrant</p>
                <h2 className="mt-1 text-2xl sm:text-3xl">
                  Welcome, {firstName}
                </h2>
                <p className="font-main text-ink-dim mt-1.5 text-sm">
                  {hasTeam && isPaid
                    ? "Your team is registered and active. Nothing left to do, so start planning your build."
                    : "Work through the checklist below to get your team on the floor."}
                </p>
              </Card>

              <CollapsibleSection
                title="Getting Started"
                index="01"
                total={3}
                completedCount={
                  [hasTeam, hasEnoughMembers, isPaid].filter(Boolean).length
                }
              >
                <ActionItem
                  label="Create or join a team"
                  done={hasTeam}
                  onClick={() => !hasTeam && setTab("team")}
                />
                <ActionItem
                  label={`Get at least ${MEMBER_LIMITS.min} team members`}
                  done={hasEnoughMembers}
                  onClick={() => hasTeam && !hasEnoughMembers && setTab("team")}
                />
                <ActionItem
                  label="Pay the $50 entry fee to activate your team"
                  done={isPaid}
                  onClick={() =>
                    hasTeam && hasEnoughMembers && !isPaid && setTab("team")
                  }
                />
              </CollapsibleSection>

              {adminTasks.length > 0 && (
                <CollapsibleSection
                  title="Tasks"
                  index="02"
                  total={adminTasks.length}
                  completedCount={adminTasks.filter((t) => t.completed).length}
                >
                  {adminTasks.map((task) => (
                    <ActionItem
                      key={task.id}
                      label={task.title}
                      description={task.description || undefined}
                      url={task.url || undefined}
                      done={task.completed}
                      onComplete={() => handleCompleteTask(task.id)}
                    />
                  ))}
                </CollapsibleSection>
              )}

              {/* Schedule pointer, the full timeline lives on the homepage. */}
              <Card className="bg-blueprint-900/50 p-4 sm:p-5">
                <p className="spec-label">Schedule</p>
                <h3 className="mt-1 text-lg">Six weeks, one build</h3>
                <p className="font-main text-ink-dim mt-1.5 text-sm">
                  Key dates, build sessions and the final showcase are all laid
                  out on the event timeline.
                </p>
                <Link
                  href={Path[2026].Timeline}
                  className="text-link font-main mt-3 inline-flex min-h-[44px] items-center text-sm"
                >
                  View the full timeline &rarr;
                </Link>
              </Card>

              {hasTeam && (
                <Card className="bg-blueprint-900/50 p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="spec-label">Your team</p>
                      <h3 className="mt-0.5 truncate text-lg">{team.name}</h3>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge variant={isPaid ? "success" : "warning"}>
                        {isPaid ? "Active" : "Not active"}
                      </Badge>
                      <span className="font-blueprint text-ink-dim text-xs">
                        {memberCount}/{MEMBER_LIMITS.max} members
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab("team")}
                    className="text-link font-main mt-2 inline-flex min-h-[44px] items-center text-sm"
                  >
                    View team details &rarr;
                  </button>
                </Card>
              )}
            </div>
          )}

          {/* ── Team ── */}
          {tab === "team" && (
            <div className="flex flex-col gap-4 sm:gap-5">
              {team ? (
                <>
                  <TeamCard team={team} isCaptain={isCaptain} />
                  <JoinCodeDisplay code={team.join_code} />
                  <MemberList
                    members={team.members}
                    isCaptain={isCaptain}
                    currentProfileId={profile.id}
                  />
                  <LeaveTeamButton />
                </>
              ) : (
                <NoTeamState teams={browsableTeams} />
              )}
            </div>
          )}

          {/* ── Profile ── */}
          {tab === "profile" && <ProfileTab profile={profile} />}
        </motion.div>
      </AnimatePresence>

      {mounted &&
        createPortal(<BottomTabBar tab={tab} setTab={setTab} />, document.body)}
    </>
  );
}
