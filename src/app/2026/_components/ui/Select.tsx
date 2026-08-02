"use client";

import { cn } from "@/app/_utils/cn";
import { forwardRef } from "react";

type SelectProps = {
  label: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children">;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, className, id, "aria-describedby": describedBy, ...props },
    ref,
  ) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${selectId}-error`;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="font-main text-sm text-muted-foreground">
          {label}{props.required && <span className="text-destructive"> *</span>}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined
          }
          className={cn(
            "font-main min-h-[44px] rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
            error && "border-destructive ring-1 ring-destructive/20",
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";
export default Select;
