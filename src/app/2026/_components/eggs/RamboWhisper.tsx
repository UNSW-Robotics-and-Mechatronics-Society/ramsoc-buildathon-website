"use client";

import { useEffect } from "react";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";

const NAME = "rambo";

/**
 * Type his name anywhere on the page (not into a field) and he answers.
 * Renders nothing; it only listens.
 */
export default function RamboWhisper() {
  const egg = useEgg();

  useEffect(() => {
    let buffer = "";

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      buffer = (buffer + e.key.toLowerCase()).slice(-NAME.length);
      if (buffer === NAME) {
        buffer = "";
        egg.open("typeRambo");
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [egg]);

  return null;
}
