import type { Metadata } from "next";
import { enterMarket } from "@/app/2026/_actions/market";
import { logError } from "@/app/_utils/errorLog";
import LockedDoor from "./_components/LockedDoor";
import MarketRoom from "./_components/MarketRoom";

export const metadata: Metadata = {
  title: "Black Market",
  robots: { index: false, follow: false },
};

/** Live room, never cached: who is in and what was said changes by the second. */
export const dynamic = "force-dynamic";

export default async function MarketPage() {
  // The tab is on the public nav, so a database outage (or a schema not yet
  // migrated) shows a locked door, not a bare 500. This is a real failure,
  // though, distinct from "closed" (an admin decision) and "signed-out" /
  // "muted" (this visitor specifically) — the sign says so honestly.
  let result: Awaited<ReturnType<typeof enterMarket>>;
  try {
    result = await enterMarket();
  } catch (err) {
    await logError("market.enter", "Market unavailable", {
      error: err instanceof Error ? err.message : String(err),
    });
    return <LockedDoor access={{ state: "error" }} />;
  }

  if (!("room" in result)) {
    return <LockedDoor access={result.access} />;
  }

  return <MarketRoom initial={result.room} />;
}
