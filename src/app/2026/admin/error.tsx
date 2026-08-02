"use client";

import { useEffect } from "react";

/**
 * Every admin page reads live data, so a missing Supabase key or a database
 * outage takes the whole page down. Without this boundary that surfaces as a
 * bare 500, which looks like the admin console is broken rather than
 * misconfigured.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  const likelyMisconfigured = /supabase|environment variable/i.test(
    error.message,
  );

  return (
    <div className="bg-blueprint-950 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="border-grid-major bg-blueprint-900 w-full max-w-lg rounded-xl border p-6 sm:p-8">
        <p className="spec-label mb-2">Admin console</p>
        <h1 className="text-ink mb-3 text-2xl">Could not load this page</h1>

        <p className="text-ink-dim mb-4 text-sm">
          {likelyMisconfigured
            ? "The database connection is not configured. Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set, then restart the server."
            : "Something went wrong reading the data for this page."}
        </p>

        {error.digest && (
          <p className="font-blueprint text-ink-dim mb-5 text-xs">
            Reference: {error.digest}
          </p>
        )}

        <button type="button" onClick={reset} className="button text-base">
          Try again
        </button>
      </div>
    </div>
  );
}
