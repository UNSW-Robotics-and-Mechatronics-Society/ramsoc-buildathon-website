"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import EggPopup, { type EggPhase } from "./EggPopup";
import type { Ticket } from "@/app/_types/market";
import { claimEggTicket, getEggStatus } from "@/app/2026/_actions/tickets";
import {
  CLAIM_PARAM,
  type EggSource,
  isEggSource,
} from "@/app/2026/_data/tickets";

type EggContextValue = {
  /** Open the reveal for an egg the visitor just found. */
  open: (source: EggSource) => void;
};

const EggContext = createContext<EggContextValue | null>(null);

export function useEgg(): EggContextValue {
  const ctx = useContext(EggContext);
  if (!ctx) throw new Error("useEgg must be used inside <EggProvider>");
  return ctx;
}

/**
 * One popup for every easter egg on the site. Lives in the 2026 layout so
 * the nav logo, the hidden pages and anything added later all share it.
 *
 * A visitor who finds an egg while signed out is sent to sign in with
 * `?claim=<source>` on the return URL; on the way back the provider sees the
 * flag, reopens the popup and claims automatically, then strips the flag.
 */
export default function EggProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [source, setSource] = useState<EggSource | null>(null);
  const [phase, setPhase] = useState<EggPhase>({ state: "loading" });
  const claiming = useRef(false);

  const claim = useCallback(async (egg: EggSource) => {
    if (claiming.current) return;
    claiming.current = true;
    setPhase({ state: "claiming" });
    try {
      const result = await claimEggTicket(egg);
      if (result.success) {
        setPhase({
          state: "claimed",
          ticket: result.ticket,
          fresh: true,
          mine: true,
          finder: null,
        });
      } else if (result.state === "signed-out") {
        setPhase({ state: "signed-out" });
      } else if (result.state === "no-profile") {
        setPhase({ state: "no-profile" });
      } else if (result.state === "no-team") {
        setPhase({ state: "no-team" });
      } else if (result.state === "already-claimed") {
        // Double click, a second tab, or a teammate got there first. Show who
        // holds it rather than an error.
        const status = await getEggStatus(egg);
        setPhase(
          status.state === "claimed"
            ? {
                state: "claimed",
                ticket: status.ticket,
                fresh: false,
                mine: status.mine,
                finder: status.finder,
              }
            : { state: "error", message: result.error },
        );
      } else {
        setPhase({ state: "error", message: result.error });
      }
    } catch {
      setPhase({ state: "error", message: "Something jammed. Try again." });
    } finally {
      claiming.current = false;
    }
  }, []);

  const open = useCallback(
    async (egg: EggSource, autoClaim = false) => {
      setSource(egg);
      setPhase({ state: "loading" });
      try {
        const status = await getEggStatus(egg);
        if (status.state === "signed-out") setPhase({ state: "signed-out" });
        else if (status.state === "no-profile") setPhase({ state: "no-profile" });
        else if (status.state === "no-team") setPhase({ state: "no-team" });
        else if (status.state === "claimed") {
          setPhase({
            state: "claimed",
            ticket: status.ticket,
            fresh: false,
            mine: status.mine,
            finder: status.finder,
          });
        } else if (autoClaim) {
          await claim(egg);
        } else {
          setPhase({ state: "unclaimed" });
        }
      } catch {
        setPhase({ state: "error", message: "Something jammed. Try again." });
      }
    },
    [claim],
  );

  // Back from sign-in with a claim flag: reopen and claim, then tidy the URL.
  // Read from window rather than useSearchParams so the shared layout stays
  // statically prerenderable.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const flagged = params.get(CLAIM_PARAM);
    if (!flagged || !isEggSource(flagged)) return;
    params.delete(CLAIM_PARAM);
    const rest = params.toString();
    router.replace(rest ? `${pathname}?${rest}` : pathname, { scroll: false });
    void open(flagged, true);
    // Runs once per page load; the flag is gone after this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setSource(null);
  }, []);

  const value = useMemo(
    () => ({ open: (egg: EggSource) => void open(egg) }),
    [open],
  );

  return (
    <EggContext.Provider value={value}>
      {children}
      {source && (
        <EggPopup
          source={source}
          phase={phase}
          onClaim={() => void claim(source)}
          onClose={close}
        />
      )}
    </EggContext.Provider>
  );
}

export type { Ticket };
