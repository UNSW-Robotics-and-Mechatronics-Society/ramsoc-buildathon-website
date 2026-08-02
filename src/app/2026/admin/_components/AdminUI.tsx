"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/app/_utils/cn";

/**
 * Presentation primitives shared by the admin tables.
 *
 * The admin area is a dense data tool, so it deliberately steps back from the
 * blueprint grid the public site uses: tables sit on a solid drafting-blue
 * surface, numerics are set in the mono "blueprint" face, and LEGO colour is
 * reserved for status (green paid / red unpaid) and the primary action.
 */

// ------------------------------------------------------------- status pill --

const pillTones = {
  paid: "border-lego-green/60 bg-lego-green/20 text-[#a7e08d]",
  unpaid: "border-lego-red/60 bg-lego-red/20 text-[#ffb0b4]",
  captain: "border-lego-yellow/60 bg-lego-yellow/20 text-lego-yellow",
  info: "border-lego-azure/60 bg-lego-azure/20 text-[#a8dcf5]",
  neutral: "border-white/20 bg-white/8 text-ink-dim",
} as const;

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof pillTones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-blueprint inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] leading-4 uppercase",
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ------------------------------------------------------------------ panels --

/** A solid, grid-free surface. Everything dense sits on one of these. */
export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-blueprint-900 rounded-lg border border-white/15 shadow-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-5">
      <h3 className="font-display text-xl">{title}</h3>
      {description && (
        <p className="font-main text-ink-dim mt-1 mb-4 max-w-prose text-sm">
          {description}
        </p>
      )}
      <div className={description ? undefined : "mt-4"}>{children}</div>
    </Panel>
  );
}

// ------------------------------------------------------------------ tables --

/**
 * Contained horizontal + vertical scroll for a table. The page body never
 * scrolls sideways — overflow is trapped in here — and the capped height is
 * what makes the sticky header meaningful.
 */
export function TableFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blueprint-900 overflow-hidden rounded-lg border border-white/15 shadow-lg">
      <div className="max-h-[calc(100vh-19rem)] min-h-[8rem] overflow-auto">
        {children}
      </div>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "font-blueprint bg-blueprint-950 text-ink-dim sticky top-0 z-10 border-b border-white/20 px-3 py-2.5 text-[11px] font-medium whitespace-nowrap uppercase",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="font-main text-ink-dim px-3 py-10 text-center text-sm"
      >
        {children}
      </td>
    </tr>
  );
}

// ------------------------------------------------------------- form inputs --

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="spec-label">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2"
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="spec-label">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-main bg-blueprint-950 text-ink focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] rounded-md border border-white/20 px-3 py-2 text-sm outline-none focus-visible:ring-2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function DateField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="spec-label">
        {label}
      </label>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-blueprint bg-blueprint-950 text-ink focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 min-h-[44px] max-w-xs rounded-md border border-white/20 px-3 py-2 text-sm [color-scheme:dark] outline-none focus-visible:ring-2"
      />
      {hint && <p className="font-main text-ink-dim text-xs">{hint}</p>}
    </div>
  );
}

// ----------------------------------------------------------------- buttons --

const actionTones = {
  neutral:
    "border-white/20 text-ink hover:border-white/40 hover:bg-white/10 focus-visible:ring-white/50",
  primary:
    "border-lego-yellow/70 text-lego-yellow hover:bg-lego-yellow/15 focus-visible:ring-lego-yellow/60",
  danger:
    "border-lego-red/60 text-[#ff9ca2] hover:bg-lego-red/20 focus-visible:ring-lego-red/60",
} as const;

type ActionTone = keyof typeof actionTones;

/**
 * A compact row action. Kept to a 44px tap target even though the label is
 * small — organisers use this on laptops and on phones at the venue.
 */
export function ActionButton({
  tone = "neutral",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ActionTone }) {
  return (
    <button
      type={type}
      className={cn(
        "font-blueprint inline-flex min-h-[44px] items-center justify-center rounded-md border px-3 py-1.5 text-xs uppercase transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        actionTones[tone],
        className,
      )}
      {...props}
    />
  );
}

/**
 * Two-step destructive action: the first click arms the button and swaps the
 * label to a confirmation, the second click fires. It disarms itself after a
 * few seconds so a stray click can never leave a live "delete" sitting in the
 * table waiting to be hit.
 */
export function ConfirmButton({
  label,
  confirmLabel = "Confirm?",
  onConfirm,
  tone = "danger",
  disabled,
  className,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  tone?: ActionTone;
  disabled?: boolean;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!armed) return;
    timer.current = setTimeout(() => setArmed(false), 5000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [armed]);

  return (
    <ActionButton
      tone={armed ? "danger" : tone}
      disabled={disabled}
      aria-live="polite"
      className={cn(armed && "bg-lego-red/25 font-semibold", className)}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : label}
    </ActionButton>
  );
}

// ------------------------------------------------------------------ alerts --

export function Alert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "font-main rounded-md border px-4 py-3 text-sm",
        tone === "error"
          ? "border-lego-red/50 bg-lego-red/15 text-[#ffb0b4]"
          : "border-lego-green/50 bg-lego-green/15 text-[#b6e8a0]",
      )}
    >
      {children}
    </p>
  );
}
