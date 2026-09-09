"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MEMBER_LIMITS,
  formatAud,
  getEntryFeeCents,
} from "@/app/2026/_data/teamConfig";
import { updateRegistrationDates } from "@/app/2026/admin/_actions/config";
import type { AdminAppConfig } from "@/app/2026/admin/_utils/types";
import { ActionButton, Alert, DateField, Panel, PanelSection } from "./AdminUI";

/**
 * `datetime-local` inputs speak wall-clock time in the viewer's timezone, so
 * the conversion has to happen in the browser. Doing it during render would
 * mismatch the server pass, so the fields are hydrated in an effect.
 */
function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

type Fields = {
  registration_opens: string;
  registration_closes: string;
  payment_deadline: string;
  competition_starts: string;
  project_deadline: string;
};

export default function SettingsPanel({ config }: { config: AdminAppConfig }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [fields, setFields] = useState<Fields>({
    registration_opens: "",
    registration_closes: "",
    payment_deadline: "",
    competition_starts: "",
    project_deadline: "",
  });

  useEffect(() => {
    setFields({
      registration_opens: toLocalDatetimeValue(config.registration_opens),
      registration_closes: toLocalDatetimeValue(config.registration_closes),
      payment_deadline: toLocalDatetimeValue(config.payment_deadline),
      competition_starts: toLocalDatetimeValue(config.competition_starts),
      project_deadline: toLocalDatetimeValue(config.project_deadline),
    });
    setReady(true);
  }, [config]);

  const incomplete = Object.values(fields).some((v) => !v);

  function set(key: keyof Fields) {
    return (value: string) => setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const result = await updateRegistrationDates({
        registration_opens: new Date(fields.registration_opens).toISOString(),
        registration_closes: new Date(fields.registration_closes).toISOString(),
        payment_deadline: new Date(fields.payment_deadline).toISOString(),
        competition_starts: new Date(fields.competition_starts).toISOString(),
        project_deadline: new Date(fields.project_deadline).toISOString(),
      });
      if (result.success) {
        setSuccess("Key dates updated.");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to update dates");
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {error && <Alert tone="error">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <PanelSection
        title="Key dates"
        description="Times are entered in your local timezone and stored as UTC. These drive the countdown on the public site and whether participants can create or join teams. The last three must run in order: registration closes, the competition begins, then projects are due."
      >
        <div className="flex flex-col gap-4">
          <DateField
            label="Registration opens"
            hint="Before this, the public site shows the window as upcoming."
            value={fields.registration_opens}
            onChange={set("registration_opens")}
          />
          <DateField
            label="Registration closes"
            hint="After this, no new teams can be created or joined."
            value={fields.registration_closes}
            onChange={set("registration_closes")}
          />
          <DateField
            label="Payment deadline"
            hint="Last moment a captain can pay the team entry fee."
            value={fields.payment_deadline}
            onChange={set("payment_deadline")}
          />
          <DateField
            label="Competition begins"
            hint="Week 1 kick-off. The hero starts counting down to this once registration closes."
            value={fields.competition_starts}
            onChange={set("competition_starts")}
          />
          <DateField
            label="Project deadline"
            hint="Projects due. The hero counts down to this once the competition has begun."
            value={fields.project_deadline}
            onChange={set("project_deadline")}
          />

          <ActionButton
            tone="primary"
            className="self-start"
            onClick={handleSave}
            disabled={isPending || !ready || incomplete}
          >
            {isPending ? "Saving…" : "Save dates"}
          </ActionButton>

          {config.updated_at && (
            <p className="font-blueprint text-ink-dim text-xs">
              Last updated{" "}
              <time suppressHydrationWarning dateTime={config.updated_at}>
                {new Date(config.updated_at).toLocaleString("en-AU")}
              </time>
            </p>
          )}
        </div>
      </PanelSection>

      {/* Read-only reference: these are code/env constants, not admin-editable. */}
      <Panel className="p-5">
        <h3 className="font-display text-xl">Competition constants</h3>
        <p className="font-main text-ink-dim mt-1 mb-4 text-sm">
          Fixed for Buildathon 2026. Changing these needs a deploy, not a
          settings toggle.
        </p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Competition year",
              value: String(config.competition_year),
            },
            {
              label: "Team size",
              value: `${MEMBER_LIMITS.min}–${MEMBER_LIMITS.max}`,
            },
            { label: "Entry fee / team", value: formatAud(getEntryFeeCents()) },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-blueprint-950 rounded-md border border-white/15 px-3 py-2.5"
            >
              <dt className="spec-label">{item.label}</dt>
              <dd className="font-blueprint text-ink mt-0.5 text-lg tabular-nums">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
