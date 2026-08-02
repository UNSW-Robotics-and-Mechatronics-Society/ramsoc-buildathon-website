"use client";

import { useEffect, useRef } from "react";

/**
 * The ruled blueprint ground, parallaxed.
 *
 * The layer is fixed, so on its own it would sit perfectly still. Translating
 * it up by a fraction of the scroll offset makes it drift at that fraction of
 * the page's speed instead.
 */

/** Major grid pitch in px. Also a multiple of the 24px minor pitch. */
const TILE = 120;

/** Background travels at this fraction of the scroll speed. */
const FACTOR = 0.35;

export default function BlueprintBackdrop() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      /*
       * Wrap the offset by the tile pitch. The grid repeats every TILE px, so
       * a wrapped offset is visually identical to the full one, and it keeps
       * the transform small enough that the layer can never run out of cover
       * no matter how long the page is.
       */
      const offset = -((window.scrollY * FACTOR) % TILE);
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      // Overhangs the viewport by one tile at each end so the drift never
      // exposes an edge.
      className="blueprint-grid pointer-events-none fixed inset-x-0 -top-[120px] -bottom-[120px] -z-10 will-change-transform"
    />
  );
}
