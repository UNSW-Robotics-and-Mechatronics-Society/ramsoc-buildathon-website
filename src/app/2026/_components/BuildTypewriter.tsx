"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_IDEAS } from "@/app/2026/_data/buildIdeas";

/** Drives the invisible sizer that reserves the animation's maximum height. */
const LONGEST_IDEA = BUILD_IDEAS.reduce((a, b) => (b.length > a.length ? b : a));

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_FULL_MS = 1700;
const HOLD_EMPTY_MS = 350;

/**
 * Types and deletes its way through the build ideas.
 *
 * Accessibility: the animation is decorative and a constantly-changing live
 * region is hostile to screen readers, so the animated text is aria-hidden and
 * a static sentence carrying the same meaning sits behind it. Users who have
 * asked for reduced motion get that static sentence rendered visibly instead
 * of the animation.
 */
export default function BuildTypewriter() {
  const [text, setText] = useState("");
  const [reducedMotion, setReducedMotion] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let index = 0;
    let charCount = 0;
    let deleting = false;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const word = BUILD_IDEAS[index];
      charCount += deleting ? -1 : 1;
      setText(word.slice(0, charCount));

      let delay = deleting ? DELETE_MS : TYPE_MS;

      if (!deleting && charCount === word.length) {
        deleting = true;
        delay = HOLD_FULL_MS;
      } else if (deleting && charCount === 0) {
        deleting = false;
        index = (index + 1) % BUILD_IDEAS.length;
        delay = HOLD_EMPTY_MS;
      }

      timer.current = setTimeout(tick, delay);
    };

    timer.current = setTimeout(tick, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer.current);
    };
  }, [reducedMotion]);

  return (
    <div className="font-display relative mb-3 text-2xl leading-tight font-bold tracking-wide uppercase sm:text-3xl md:text-4xl">
      {/*
        Invisible sizer holding the longest phrase. It reserves exactly the
        height the animation will ever need, so a phrase that wraps to a second
        line cannot shove the rest of the hero down mid-type.
      */}
      <p aria-hidden className="invisible max-w-xl">
        Build {LONGEST_IDEA}
      </p>

      <p className="absolute inset-0 max-w-xl">
        <span className="text-ink">Build </span>

        {reducedMotion ? (
          <span className="text-lego-yellow">something that matters.</span>
        ) : (
          <>
            {/* Decorative; the sr-only sentence below carries the meaning. */}
            <span aria-hidden className="text-lego-yellow">
              {text}
              <span className="caret" />
            </span>
            <span className="sr-only">
              something that matters, like a solar tracker, a flood warning
              beacon, a water-quality buoy, or anything else that moves a UN
              Sustainable Development Goal forward.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
