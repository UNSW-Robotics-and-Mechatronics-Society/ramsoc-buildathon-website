"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import type {
  MarketDealer,
  MarketMessage,
  Ticket,
} from "@/app/_types/market";
import {
  handOverTicket,
  pollMarket,
  sendMarketMessage,
  type MarketAccess,
  type MarketRoom as Room,
} from "@/app/2026/_actions/market";
import {
  MARKET_MESSAGE_MAX,
  MARKET_POLL_MS,
} from "@/app/2026/_data/market";
import { TICKET_CLASSES } from "@/app/2026/_data/tickets";
import LegoAvatar from "@/app/2026/_components/market/LegoAvatar";
import TicketCard from "@/app/2026/_components/tickets/TicketCard";
import { Button } from "@/app/2026/_components/ui/Button";
import { cn } from "@/app/_utils/cn";
import Path from "@/app/path";

/** Polls between presence heartbeats. Presence only needs to be roughly right. */
const HEARTBEAT_EVERY = 8;

const TIME = new Intl.DateTimeFormat("en-AU", {
  hour: "numeric",
  minute: "2-digit",
});

const SHUT_COPY: Record<Exclude<MarketAccess["state"], "ok">, string> = {
  "signed-out": "You were signed out.",
  closed: "Management closed the market.",
  muted: "You've been asked to leave.",
};

// ── pieces ───────────────────────────────────────────────────────────────────

function Message({ m }: { m: MarketMessage }) {
  if (m.kind === "system" || !m.author) {
    return (
      <li className="my-2 flex justify-center px-2">
        <p className="font-blueprint max-w-md rounded-sm border border-[#d9a441]/30 bg-[#d9a441]/10 px-3 py-1.5 text-center text-[0.65rem] text-[#e8c777] uppercase">
          {m.body}
        </p>
      </li>
    );
  }

  const offer = m.kind === "offer";

  return (
    <li className={cn("flex gap-2.5 px-2", m.mine && "flex-row-reverse")}>
      <LegoAvatar seed={m.author.avatarSeed} className="mt-5 h-9 w-9" />
      <div className={cn("flex max-w-[78%] flex-col", m.mine && "items-end")}>
        <p className="font-blueprint mb-1 flex items-baseline gap-2 text-[0.65rem] uppercase">
          <span className={m.mine ? "text-ink" : "text-[#d9a441]"}>
            {m.mine ? "You" : m.author.alias}
          </span>
          <time dateTime={m.created_at} className="text-ink-dim/70">
            {TIME.format(new Date(m.created_at))}
          </time>
        </p>
        <div
          className={cn(
            "font-main rounded-lg px-3.5 py-2 text-sm wrap-break-word",
            offer
              ? "border-lego-yellow/60 bg-lego-yellow/10 text-ink border"
              : m.mine
                ? "bg-[#1b3a66] text-ink"
                : "text-ink border border-white/10 bg-white/6",
          )}
        >
          {offer && (
            <span className="font-blueprint text-lego-yellow mb-1 block text-[0.6rem] uppercase">
              Offer
            </span>
          )}
          {m.body}
        </div>
      </div>
    </li>
  );
}

function Wallet({
  tickets,
  dealers,
  registered,
  onHandOver,
  busy,
}: {
  tickets: Ticket[];
  dealers: MarketDealer[];
  /** False for a dealer signed in but never onboarded: nothing to hold yet. */
  registered: boolean;
  onHandOver: (ticketId: string, alias: string) => Promise<string | null>;
  busy: boolean;
}) {
  const [handing, setHanding] = useState<string | null>(null);
  const [alias, setAlias] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirm(ticketId: string) {
    setError(null);
    const problem = await onHandOver(ticketId, alias);
    if (problem) {
      setError(problem);
    } else {
      setHanding(null);
      setAlias("");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <p className="font-blueprint text-[#d9a441] text-xs uppercase">
          Your pockets
        </p>
        <span className="font-blueprint text-ink-dim text-xs">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
        </span>
      </div>

      {tickets.length === 0 ? (
        <p className="font-main text-ink-dim text-sm">
          {registered ? (
            "Nothing to trade. Tickets from the workshops are paper; the bonus ones are hidden around this site."
          ) : (
            <>
              Nothing to trade yet. Ticket holding needs a Buildathon
              registration, so a workshop can check it against a real person.{" "}
              <Link href={Path[2026].Onboarding} className="text-link">
                Finish registering
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-4 pt-1">
          {tickets.map((t) => (
            <li key={t.id} className="flex flex-col gap-2">
              <TicketCard ticket={t} size="sm" />
              {handing === t.id ? (
                <div className="flex flex-col gap-2 rounded-md border border-[#d9a441]/40 bg-black/30 p-3">
                  <label
                    htmlFor={`hand-${t.id}`}
                    className="font-blueprint text-ink-dim text-[0.65rem] uppercase"
                  >
                    Hand this {TICKET_CLASSES[t.class].label} ticket to
                  </label>
                  <input
                    id={`hand-${t.id}`}
                    list="market-dealers"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder="Dealer name"
                    autoComplete="off"
                    className="font-main text-ink placeholder:text-ink-dim/60 min-h-11 rounded-md border border-white/20 bg-black/40 px-3 text-sm outline-none focus-visible:border-[#d9a441]"
                  />
                  <datalist id="market-dealers">
                    {dealers.map((d) => (
                      <option key={d.alias} value={d.alias} />
                    ))}
                  </datalist>
                  {error && (
                    <p role="alert" className="font-main text-xs text-[#ffc9c9]">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="full"
                      variant="secondary"
                      onClick={() => {
                        setHanding(null);
                        setError(null);
                      }}
                      disabled={busy}
                    >
                      Keep it
                    </Button>
                    <Button
                      size="full"
                      onClick={() => confirm(t.id)}
                      disabled={busy || !alias.trim()}
                      loading={busy}
                      className="font-display brick font-bold uppercase"
                    >
                      Hand over
                    </Button>
                  </div>
                  <p className="font-main text-ink-dim text-[0.7rem]">
                    This moves the ticket to their account. There is no undo.
                    Whatever they gave you for it is between you two.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHanding(t.id);
                    setError(null);
                  }}
                  className="font-blueprint min-h-11 self-end rounded-md border border-[#d9a441]/50 px-3 text-[0.65rem] text-[#e8c777] uppercase transition-colors hover:bg-[#d9a441]/15"
                >
                  Hand over…
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── room ─────────────────────────────────────────────────────────────────────

export default function MarketRoom({ initial }: { initial: Room }) {
  const [messages, setMessages] = useState<MarketMessage[]>(initial.messages);
  const [dealers, setDealers] = useState<MarketDealer[]>(initial.dealers);
  const [tickets, setTickets] = useState<Ticket[]>(initial.tickets);
  const [shut, setShut] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [asOffer, setAsOffer] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [panel, setPanel] = useState<"chat" | "wallet">("chat");

  const cursor = useRef({
    afterSeq: initial.messages.reduce((m, x) => Math.max(m, x.seq), 0),
    since: initial.now,
  });
  const pollCount = useRef(0);
  const listRef = useRef<HTMLUListElement>(null);
  const stickToBottom = useRef(true);

  const merge = useCallback(
    (incoming: MarketMessage[], deletedIds: string[]) => {
      if (incoming.length === 0 && deletedIds.length === 0) return;
      setMessages((current) => {
        const seen = new Set(current.map((m) => m.id));
        const gone = new Set(deletedIds);
        const next = current.filter((m) => !gone.has(m.id));
        for (const m of incoming) {
          if (!seen.has(m.id) && !gone.has(m.id)) next.push(m);
        }
        next.sort((a, b) => a.seq - b.seq);
        return next;
      });
      const top = incoming.reduce((m, x) => Math.max(m, x.seq), 0);
      if (top > cursor.current.afterSeq) cursor.current.afterSeq = top;
    },
    [],
  );

  // Poll while the tab is visible. A hidden tab stops asking rather than
  // hammering the database for a room nobody is looking at.
  useEffect(() => {
    if (shut) return;
    let cancelled = false;
    let inFlight = false;

    async function tick() {
      if (inFlight || document.hidden) return;
      inFlight = true;
      pollCount.current += 1;
      try {
        const result = await pollMarket({
          afterSeq: cursor.current.afterSeq,
          since: cursor.current.since,
          heartbeat: pollCount.current % HEARTBEAT_EVERY === 1,
        });
        if (cancelled) return;
        if (!result.open) {
          setShut(
            SHUT_COPY[(result.reason ?? "closed") as keyof typeof SHUT_COPY] ??
              SHUT_COPY.closed,
          );
          return;
        }
        cursor.current.since = result.now;
        merge(result.messages, result.deletedIds);
        setDealers(result.dealers);
      } catch {
        // Transient. The next tick tries again.
      } finally {
        inFlight = false;
      }
    }

    const id = setInterval(tick, MARKET_POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [merge, shut]);

  // Follow new messages unless the reader has scrolled up to read history.
  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  function onListScroll() {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function send() {
    const body = draft.trim();
    if (!body || isPending) return;
    setSendError(null);
    startTransition(async () => {
      const result = await sendMarketMessage(body, asOffer ? "offer" : "chat");
      if (result.success) {
        setDraft("");
        setAsOffer(false);
        stickToBottom.current = true;
        merge([result.message], []);
      } else {
        setSendError(result.error);
      }
    });
  }

  const handOver = useCallback(
    (ticketId: string, alias: string) =>
      new Promise<string | null>((resolve) => {
        startTransition(async () => {
          const result = await handOverTicket(ticketId, alias);
          if (result.success) {
            setTickets(result.tickets);
            resolve(null);
          } else {
            resolve(result.error);
          }
        });
      }),
    [],
  );

  const online = useMemo(
    () => dealers.filter((d) => d.alias !== initial.identity.alias),
    [dealers, initial.identity.alias],
  );

  if (shut) {
    return (
      <section className="market-wall flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md">
          <p className="font-blueprint text-[#d9a441] text-xs uppercase">
            Shutters down
          </p>
          <h1 className="text-ink mt-3 text-2xl">{shut}</h1>
          <p className="text-ink-dim mt-2 text-base">
            The room is still there. Come back when the door opens again.
          </p>
          <Link href={Path[2026].Root} className="button mt-6 text-base">
            Back to Buildathon
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="market-wall min-h-[calc(100vh-8rem)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        {/* Header: the sign, who is around, and who you are in here. */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d9a441]/25 pb-4">
          <div>
            <p className="font-blueprint text-[#d9a441] text-xs uppercase">
              Back of the makerspace · Cash or components
            </p>
            <h1 className="font-stud text-ink market-flicker mt-1 lowercase">
              black <span className="text-[#d9a441]">market</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <LegoAvatar
              seed={initial.identity.avatarSeed}
              className="h-11 w-11"
              title="Your dealer avatar"
            />
            <div className="min-w-0">
              <p className="font-blueprint text-ink-dim text-[0.6rem] uppercase">
                In here, you are
              </p>
              <p className="font-display text-ink truncate text-lg leading-tight font-bold uppercase">
                {initial.identity.alias}
              </p>
            </div>
          </div>
        </header>

        {/* Mobile switch between the room and your pockets. */}
        <div className="flex gap-2 lg:hidden">
          {(["chat", "wallet"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPanel(p)}
              aria-pressed={panel === p}
              className={cn(
                "font-display brick min-h-11 flex-1 text-base font-bold uppercase",
                panel === p
                  ? "bg-[#d9a441] text-[#1a1206]"
                  : "text-ink bg-white/8",
              )}
            >
              {p === "chat" ? "The room" : `Pockets (${tickets.length})`}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* The room */}
          <div
            className={cn(
              "flex min-h-[28rem] flex-col rounded-xl border border-white/10 bg-black/35 shadow-2xl",
              panel !== "chat" && "hidden lg:flex",
            )}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <p className="font-blueprint text-ink-dim text-[0.65rem] uppercase">
                {online.length === 0
                  ? "Nobody else around right now"
                  : `${online.length} other dealer${online.length === 1 ? "" : "s"} around`}
              </p>
              <p className="font-blueprint text-ink-dim/60 text-[0.6rem] uppercase">
                Names are fake. Organisers can see everything.
              </p>
            </div>

            <ul
              ref={listRef}
              onScroll={onListScroll}
              className="no-scrollbar flex h-[52vh] min-h-[20rem] flex-col gap-4 overflow-y-auto px-2 py-4 lg:h-[56vh]"
            >
              {messages.length === 0 && (
                <li className="font-main text-ink-dim m-auto px-6 text-center text-sm">
                  Quiet in here. Say something, or post an offer.
                </li>
              )}
              {messages.map((m) => (
                <Message key={m.id} m={m} />
              ))}
            </ul>

            {/* Composer */}
            <div className="border-t border-white/10 p-3">
              {sendError && (
                <p role="alert" className="font-main mb-2 text-xs text-[#ffc9c9]">
                  {sendError}
                </p>
              )}
              <div className="flex items-end gap-2">
                <label htmlFor="market-draft" className="sr-only">
                  Message
                </label>
                <textarea
                  id="market-draft"
                  rows={1}
                  value={draft}
                  maxLength={MARKET_MESSAGE_MAX}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={
                    asOffer
                      ? "Class B for a servo and a bag of chips…"
                      : "Say it quietly…"
                  }
                  className="font-main text-ink placeholder:text-ink-dim/60 max-h-32 min-h-11 flex-1 resize-none rounded-md border border-white/20 bg-black/40 px-3 py-2.5 text-sm outline-none focus-visible:border-[#d9a441]"
                />
                <button
                  type="button"
                  onClick={() => setAsOffer((v) => !v)}
                  aria-pressed={asOffer}
                  className={cn(
                    "font-blueprint min-h-11 rounded-md border px-3 text-[0.65rem] uppercase transition-colors",
                    asOffer
                      ? "border-lego-yellow bg-lego-yellow/20 text-lego-yellow"
                      : "text-ink-dim border-white/20 hover:border-white/40",
                  )}
                >
                  Offer
                </button>
                <Button
                  onClick={send}
                  disabled={isPending || !draft.trim()}
                  loading={isPending}
                  className="font-display brick min-h-11 font-bold uppercase"
                >
                  Send
                </Button>
              </div>
              <p className="font-blueprint text-ink-dim/60 mt-2 text-[0.6rem] uppercase">
                {draft.length}/{MARKET_MESSAGE_MAX} · Enter to send
              </p>
            </div>
          </div>

          {/* Pockets + who is around */}
          <aside
            className={cn(
              "flex flex-col gap-5",
              panel !== "wallet" && "hidden lg:flex",
            )}
          >
            <div className="rounded-xl border border-white/10 bg-black/35 p-4 shadow-2xl">
              <Wallet
                tickets={tickets}
                dealers={online}
                registered={initial.registered}
                onHandOver={handOver}
                busy={isPending}
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-black/35 p-4 shadow-2xl">
              <p className="font-blueprint text-[#d9a441] mb-3 text-xs uppercase">
                Around right now
              </p>
              {online.length === 0 ? (
                <p className="font-main text-ink-dim text-sm">Just you.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {online.map((d) => (
                    <li key={d.alias} className="flex items-center gap-2.5">
                      <LegoAvatar seed={d.avatarSeed} className="h-8 w-8" />
                      <span className="font-main text-ink truncate text-sm">
                        {d.alias}
                      </span>
                      <span
                        aria-hidden
                        className="bg-lego-green ml-auto h-2 w-2 shrink-0 rounded-full"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
