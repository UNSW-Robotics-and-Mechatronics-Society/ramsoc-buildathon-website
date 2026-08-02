"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { adminLogout } from "@/app/2026/admin/_actions/auth";
import Path from "@/app/path";
import { cn } from "@/app/_utils/cn";

const tabs = [
  { label: "Teams", href: Path[2026].AdminTeams },
  { label: "Individuals", href: Path[2026].AdminIndividuals },
  { label: "Tasks", href: Path[2026].AdminTasks },
  { label: "Settings", href: Path[2026].AdminSettings },
  { label: "UI", href: Path[2026].AdminUi },
];

const exportLinks = [
  { label: "Teams CSV", href: "/2026/admin/api/export/teams" },
  { label: "Participants CSV", href: "/2026/admin/api/export/participants" },
];

export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await adminLogout();
      router.push(Path[2026].Admin);
    });
  }

  return (
    // The blueprint grid is suppressed across the admin area: this is a data
    // tool, and ruled lines behind small type make numbers hard to read.
    <div className="bg-blueprint-950 min-h-screen">
      <header className="border-lego-yellow bg-blueprint-950 sticky top-0 z-30 border-b-2">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href={Path[2026].Root}
              className="font-display text-ink text-lg leading-none tracking-wide uppercase"
            >
              Buildathon <span className="text-lego-yellow">2026</span>
            </Link>
            <span className="spec-label hidden sm:inline">Admin console</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {exportLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                download
                className="font-blueprint text-ink-dim hover:text-ink focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center rounded-md border border-white/20 px-3 py-1.5 text-xs uppercase transition-colors outline-none hover:border-white/40 focus-visible:ring-2"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="font-blueprint border-lego-yellow/70 text-lego-yellow hover:bg-lego-yellow/15 focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center rounded-md border px-3 py-1.5 text-xs uppercase transition-colors outline-none focus-visible:ring-2 disabled:opacity-50"
            >
              {isPending ? "Signing out…" : "Log out"}
            </button>
          </div>
        </div>

        <nav
          aria-label="Admin sections"
          className="no-scrollbar mx-auto flex max-w-[100rem] gap-1 overflow-x-auto px-4 pb-2"
        >
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-display focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center rounded-md px-3 text-sm tracking-wide whitespace-nowrap uppercase transition-colors outline-none focus-visible:ring-2",
                  active
                    ? "bg-lego-yellow font-bold text-[#0a2a55]"
                    : "text-ink-dim hover:text-ink hover:bg-white/10",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-[100rem] px-4 py-6">
        <h1 className="mb-4 text-3xl">{title}</h1>
        {children}
      </main>
    </div>
  );
}
