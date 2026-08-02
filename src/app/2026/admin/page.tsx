import Link from "next/link";
import type { Metadata } from "next";
import Path from "@/app/path";
import AdminLoginForm from "./_components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin · Buildathon 2026",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-5 w-full max-w-sm">
        <Link
          href={Path[2026].Root}
          className="font-main text-ink-dim hover:text-ink focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center gap-1.5 text-sm transition-colors outline-none focus-visible:ring-2"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Buildathon
        </Link>
      </div>

      <div className="w-full max-w-sm">
        {/* A yellow brick with studs, the one piece of set-dressing in the
            admin area, since the login screen has no data to compete with. */}
        <div className="lego-studs [--stud-color:var(--color-blueprint-900)]">
          <div className="brick drafting-frame bg-blueprint-900 p-6">
            <p className="spec-label">RAMSoc Buildathon 2026</p>
            <h1 className="mt-1 mb-1 text-3xl">Admin Console</h1>
            <p className="font-main text-ink-dim mb-6 text-sm">
              Organisers only. Enter the shared admin password.
            </p>
            <AdminLoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
