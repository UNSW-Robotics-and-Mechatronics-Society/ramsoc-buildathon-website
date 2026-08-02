"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "@/app/2026/admin/_actions/auth";
import Path from "@/app/path";

export default function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await adminLogin(password);
      if (result.success) {
        router.push(Path[2026].AdminTeams);
      } else {
        setError(result.error ?? "Invalid password");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="admin-password" className="spec-label">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "admin-password-error" : undefined}
          className="font-main bg-blueprint-950 text-ink placeholder:text-ink-dim/60 focus-visible:border-lego-yellow focus-visible:ring-lego-yellow/50 aria-invalid:border-lego-red min-h-[44px] rounded-md border border-white/20 px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2"
          placeholder="Enter admin password"
        />
        {error && (
          <p
            id="admin-password-error"
            role="alert"
            className="font-main text-xs text-[#ff9ca2]"
          >
            {error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || password.length === 0}
        className="button w-full text-base disabled:pointer-events-none disabled:opacity-50"
      >
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
