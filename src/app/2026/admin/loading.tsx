/**
 * Every admin page is `force-dynamic` and reads live data server-side, so
 * navigating between tabs (Teams, Settings, ...) is a real round trip with
 * no cached shell to show in the meantime. Without this boundary, Next.js
 * waits for that round trip to finish before swapping the page, which reads
 * as an unresponsive click, not a page that's merely loading.
 */
export default function AdminLoading() {
  return (
    <div className="bg-blueprint-950 flex min-h-screen items-center justify-center px-4 py-12">
      <div className="border-grid-major bg-blueprint-900 flex w-full max-w-lg flex-col items-center gap-3 rounded-xl border p-6 text-center sm:p-8">
        <svg
          className="text-lego-yellow h-8 w-8 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="spec-label">Admin console</p>
        <p className="text-ink-dim text-sm">Loading…</p>
      </div>
    </div>
  );
}
