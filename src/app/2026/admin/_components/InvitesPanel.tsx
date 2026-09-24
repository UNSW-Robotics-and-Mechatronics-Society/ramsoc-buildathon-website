"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSignupInvite,
  revokeSignupInvite,
} from "@/app/2026/admin/_actions/invites";
import { inviteState, type InviteState } from "@/app/2026/admin/_utils/invites";
import type { SignupInvite } from "@/app/2026/admin/_utils/types";
import Path from "@/app/path";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  EmptyRow,
  PanelSection,
  StatusPill,
  TableFrame,
  Th,
} from "./AdminUI";

/** Absolute invite link for a token, composed against the current origin. */
function inviteLink(token: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${Path[2026].SignUpInvite}?token=${encodeURIComponent(token)}`;
}

const statePill: Record<
  InviteState,
  { tone: "info" | "paid" | "neutral" | "unpaid"; label: string }
> = {
  active: { tone: "info", label: "Active" },
  opened: { tone: "paid", label: "Opened" },
  expired: { tone: "neutral", label: "Expired" },
  revoked: { tone: "unpaid", label: "Revoked" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InviteRow({
  invite,
  onChanged,
}: {
  invite: SignupInvite;
  onChanged: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const state = inviteState(invite);
  const pill = statePill[state];
  const live = state === "active" || state === "opened";

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink(invite.token));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, denied permission). Fall
      // back to a prompt so the organiser can still grab the link by hand.
      window.prompt("Copy the invite link:", inviteLink(invite.token));
    }
  }

  function revoke() {
    startTransition(async () => {
      await revokeSignupInvite(invite.id);
      onChanged();
    });
  }

  return (
    <tr className="border-b border-white/10 last:border-0">
      <td className="font-main text-ink px-3 py-2.5 text-sm break-all">
        {invite.email}
        {invite.note && (
          <span className="text-ink-dim block text-xs">{invite.note}</span>
        )}
      </td>
      <td className="px-3 py-2.5">
        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
      </td>
      <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs whitespace-nowrap">
        {formatDate(invite.expires_at)}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-2">
          {live && (
            <ActionButton tone="neutral" onClick={copy} disabled={isPending}>
              {copied ? "Copied" : "Copy link"}
            </ActionButton>
          )}
          {live && (
            <ConfirmButton
              label="Revoke"
              confirmLabel="Revoke?"
              onConfirm={revoke}
              disabled={isPending}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

export default function InvitesPanel({
  initialInvites,
  loadError,
}: {
  initialInvites: SignupInvite[];
  loadError?: string | null;
}) {
  const router = useRouter();
  const emailId = useId();
  const noteId = useId();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleCreate() {
    startTransition(async () => {
      setError(null);
      setNewLink(null);
      const result = await createSignupInvite(email, note);
      if (result.success && result.invite) {
        setNewLink(inviteLink(result.invite.token));
        setEmail("");
        setNote("");
        router.refresh();
      } else {
        setError(result.error ?? "Could not create the invite");
      }
    });
  }

  async function copyNew() {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink);
    } catch {
      window.prompt("Copy the invite link:", newLink);
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {loadError && (
        <Alert tone="error">
          Could not read the invites table. If this is the first deploy of this
          feature, run the <code>008_signup_invites.sql</code> migration against
          Supabase, then reload. ({loadError})
        </Alert>
      )}
      <PanelSection
        title="Issue a late sign-up invite"
        description="Registration is otherwise closed. This creates a single-person link that unlocks the sign-up page for one late entrant, valid for 72 hours. Send it to them directly — it is not linked anywhere on the site. Onboarding, teams and payment work exactly as they do during the normal window."
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex flex-col gap-1">
            <label htmlFor={emailId} className="spec-label">
              Their email
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@student.unsw.edu.au"
              className="font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] max-w-md rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor={noteId} className="spec-label">
              Note (optional)
            </label>
            <input
              id={noteId}
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Missed the deadline, joining Ada's team"
              className="font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] max-w-md rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>

          <ActionButton
            tone="primary"
            className="self-start"
            onClick={handleCreate}
            disabled={isPending || !email.trim()}
          >
            {isPending ? "Generating…" : "Generate invite link"}
          </ActionButton>

          {newLink && (
            <div className="border-lego-green/40 bg-lego-green/10 flex flex-col gap-2 rounded-md border px-4 py-3">
              <p className="font-main text-sm text-[#b6e8a0]">
                Invite created. Copy the link and send it to them — it is shown
                once here, but you can always copy it again from the table
                below.
              </p>
              <div className="flex items-center gap-2">
                <code className="font-blueprint bg-blueprint-950 text-ink flex-1 overflow-x-auto rounded border border-white/15 px-2 py-1.5 text-xs whitespace-nowrap">
                  {newLink}
                </code>
                <ActionButton tone="neutral" onClick={copyNew}>
                  Copy
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      </PanelSection>

      <TableFrame>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Expires</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {initialInvites.length === 0 ? (
              <EmptyRow colSpan={4}>No invites issued yet.</EmptyRow>
            ) : (
              initialInvites.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  onChanged={refresh}
                />
              ))
            )}
          </tbody>
        </table>
      </TableFrame>
    </div>
  );
}
