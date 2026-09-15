"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminMarketMessage,
  AdminTicketRow,
  TicketClass,
} from "@/app/_types/market";
import {
  adminDeleteMarketMessage,
  adminRevokeTicket,
  adminSetMarketMuted,
  adminSetMarketOpen,
} from "@/app/2026/admin/_actions/market";
import { EGGS, TICKET_CLASSES, isEggSource } from "@/app/2026/_data/tickets";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  EmptyRow,
  FilterSelect,
  SearchField,
  StatusPill,
  TableFrame,
  Th,
} from "./AdminUI";

const DATE = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blueprint-900 rounded-md border border-white/15 px-4 py-2.5">
      <p className="spec-label">{label}</p>
      <p className="font-blueprint text-ink mt-0.5 text-xl tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ClassPill({ cls }: { cls: TicketClass }) {
  const spec = TICKET_CLASSES[cls];
  return (
    <span
      style={{ backgroundColor: spec.brick, color: spec.ink }}
      className="font-display inline-flex min-w-8 items-center justify-center rounded-sm px-2 py-0.5 text-sm font-bold"
    >
      {cls}
    </span>
  );
}

/**
 * The one place real names sit next to market aliases. Participants never
 * see this mapping; organisers need it to moderate and to settle disputes
 * over a trade.
 */
export default function MarketPanel({
  open,
  messages,
  tickets,
}: {
  open: boolean;
  messages: AdminMarketMessage[];
  tickets: AdminTicketRow[];
}) {
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState("live");
  const [ticketSearch, setTicketSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAction(
    action: () => Promise<{ success: boolean; error?: string }>,
  ) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.success) setError(result.error ?? "Action failed");
      router.refresh();
    });
  }

  const q = search.toLowerCase();
  const visibleMessages = messages.filter((m) => {
    if (showDeleted === "live" && m.deleted_at) return false;
    if (!q) return true;
    return (
      m.body.toLowerCase().includes(q) ||
      (m.alias ?? "").toLowerCase().includes(q) ||
      (m.full_name ?? "").toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q)
    );
  });

  const tq = ticketSearch.toLowerCase();
  const visibleTickets = tickets.filter((t) => {
    if (!tq) return true;
    return (
      t.serial.toLowerCase().includes(tq) ||
      (t.holder_name ?? "").toLowerCase().includes(tq) ||
      (t.holder_alias ?? "").toLowerCase().includes(tq) ||
      (t.holder_email ?? "").toLowerCase().includes(tq)
    );
  });

  const byClass = (cls: TicketClass) =>
    tickets.filter((t) => t.class === cls).length;
  const dealers = new Set(messages.map((m) => m.clerk_user_id).filter(Boolean));

  return (
    <div className="flex flex-col gap-6">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Market" value={open ? "Open" : "Closed"} />
          <Stat label="Dealers seen" value={String(dealers.size)} />
          <Stat label="Class A" value={String(byClass("A"))} />
          <Stat label="Class B" value={String(byClass("B"))} />
          <Stat label="Class C" value={String(byClass("C"))} />
        </div>
        <ConfirmButton
          tone={open ? "danger" : "primary"}
          label={open ? "Close the market" : "Open the market"}
          confirmLabel={open ? "Confirm close?" : "Confirm open?"}
          disabled={isPending}
          onConfirm={() => handleAction(() => adminSetMarketOpen(!open))}
        />
      </div>

      {/* ── messages ── */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl">Messages</h2>
          <p className="font-main text-ink-dim mt-1 text-sm">
            Nothing here is kept: any message, deleted ones included, is
            hard-purged 3 hours after it was sent. This list only ever shows
            what is still in the database right now.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <SearchField
            label="Search"
            value={search}
            onChange={setSearch}
            placeholder="Text, alias, name, or email"
            className="min-w-[16rem] flex-1 sm:max-w-sm"
          />
          <FilterSelect
            label="Show"
            value={showDeleted}
            onChange={setShowDeleted}
            options={[
              { value: "live", label: "Live only" },
              { value: "all", label: "Including deleted" },
            ]}
          />
          <p className="font-blueprint text-ink-dim pb-3 text-xs uppercase">
            {visibleMessages.length} of {messages.length} shown
          </p>
        </div>

        <TableFrame>
          <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              Black Market messages with the real identity behind each alias.
            </caption>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Alias</Th>
                <Th>Person</Th>
                <Th>Message</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleMessages.length === 0 && (
                <EmptyRow colSpan={5}>
                  {messages.length === 0
                    ? "Nothing has been said yet."
                    : "No messages match those filters."}
                </EmptyRow>
              )}
              {visibleMessages.map((m) => (
                <tr
                  key={m.id}
                  className={`align-top hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10 ${m.deleted_at ? "opacity-50" : ""}`}
                >
                  <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs whitespace-nowrap tabular-nums">
                    {DATE.format(new Date(m.created_at))}
                  </td>
                  <td className="font-main text-ink px-3 py-2.5 text-sm whitespace-nowrap">
                    {m.kind === "system" ? (
                      <StatusPill tone="neutral">System</StatusPill>
                    ) : (
                      <>
                        {m.alias ?? "-"}
                        {m.kind === "offer" && (
                          <span className="ml-2">
                            <StatusPill tone="captain">Offer</StatusPill>
                          </span>
                        )}
                        {m.muted && (
                          <span className="ml-2">
                            <StatusPill tone="unpaid">Muted</StatusPill>
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.registered ? (
                      <>
                        <p className="font-main text-ink text-sm">
                          {m.full_name ?? "-"}
                        </p>
                        <p className="font-blueprint text-ink-dim text-xs break-all">
                          {m.email}
                        </p>
                      </>
                    ) : m.clerk_user_id ? (
                      <StatusPill tone="neutral">Not registered</StatusPill>
                    ) : (
                      <span className="text-ink-dim text-sm">-</span>
                    )}
                  </td>
                  <td className="font-main text-ink max-w-md px-3 py-2.5 text-sm wrap-break-word">
                    {m.body}
                    {m.deleted_at && (
                      <span className="font-blueprint text-ink-dim mt-1 block text-[11px] uppercase">
                        Deleted {DATE.format(new Date(m.deleted_at))}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {m.kind !== "system" && (
                      <div className="flex flex-wrap gap-2">
                        {!m.deleted_at && (
                          <ConfirmButton
                            label="Delete"
                            confirmLabel="Confirm delete?"
                            disabled={isPending}
                            onConfirm={() =>
                              handleAction(() => adminDeleteMarketMessage(m.id))
                            }
                          />
                        )}
                        {m.clerk_user_id && (
                          <ActionButton
                            tone={m.muted ? "primary" : "neutral"}
                            disabled={isPending}
                            onClick={() =>
                              handleAction(() =>
                                adminSetMarketMuted(m.clerk_user_id!, !m.muted),
                              )
                            }
                          >
                            {m.muted ? "Unmute" : "Mute"}
                          </ActionButton>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </section>

      {/* ── tickets ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl">Ticket ledger</h2>
        <div className="flex flex-wrap items-end gap-3">
          <SearchField
            label="Search"
            value={ticketSearch}
            onChange={setTicketSearch}
            placeholder="Serial, holder, alias, or email"
            className="min-w-[16rem] flex-1 sm:max-w-sm"
          />
          <p className="font-blueprint text-ink-dim pb-3 text-xs uppercase">
            {visibleTickets.length} of {tickets.length} shown
          </p>
        </div>

        <TableFrame>
          <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              Every bonus ticket, who holds it now, and where it came from.
            </caption>
            <thead>
              <tr>
                <Th>Serial</Th>
                <Th>Class</Th>
                <Th>Held by</Th>
                <Th>From</Th>
                <Th>Minted by</Th>
                <Th align="right">Traded</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {visibleTickets.length === 0 && (
                <EmptyRow colSpan={7}>
                  {tickets.length === 0
                    ? "No tickets have been claimed yet."
                    : "No tickets match that search."}
                </EmptyRow>
              )}
              {visibleTickets.map((t) => (
                <tr
                  key={t.id}
                  className="align-top hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10"
                >
                  <td className="font-blueprint text-ink px-3 py-2.5 text-sm whitespace-nowrap tabular-nums">
                    {t.serial}
                    <span className="text-ink-dim mt-0.5 block text-xs">
                      {DATE.format(new Date(t.minted_at))}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <ClassPill cls={t.class} />
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-main text-ink text-sm">
                      {t.holder_name ?? "-"}
                    </p>
                    <p className="font-blueprint text-ink-dim text-xs">
                      {t.holder_alias ?? "no alias yet"}
                      {t.holder_email && (
                        <span className="block break-all">{t.holder_email}</span>
                      )}
                    </p>
                  </td>
                  <td className="font-main text-ink-dim px-3 py-2.5 text-sm">
                    {isEggSource(t.source) ? EGGS[t.source].title : t.source}
                  </td>
                  <td className="font-main text-ink-dim px-3 py-2.5 text-sm">
                    {t.minted_by_name ?? "-"}
                  </td>
                  <td className="font-blueprint text-ink-dim px-3 py-2.5 text-right text-sm tabular-nums">
                    {t.transfer_count > 0 ? `×${t.transfer_count}` : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <ConfirmButton
                      label="Revoke"
                      confirmLabel="Confirm revoke?"
                      disabled={isPending}
                      onConfirm={() =>
                        handleAction(() => adminRevokeTicket(t.id))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </section>
    </div>
  );
}
