"use client";

import { useEffect, useRef, useState } from "react";
import { BUILD_IDEAS } from "@/app/2026/_data/buildIdeas";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";

/** Drives the invisible sizer that reserves the animation's maximum height. */
const LONGEST_IDEA = BUILD_IDEAS.reduce((a, b) => (b.length > a.length ? b : a));

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_FULL_MS = 1700;
const HOLD_EMPTY_MS = 350;

/**
 * Every so often the typewriter slips and types this instead of a build idea.
 * It holds a good while longer than the others, and while it is on screen it
 * is a button. Whoever is watching closely enough to catch it, and click it,
 * gets a ticket.
 */
const SLIP = "a black market";
const SLIP_ODDS = 1 / 10;
const HOLD_SLIP_MS = 4500;

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
  const egg = useEgg();
  const [text, setText] = useState("");
  const [slipping, setSlipping] = useState(false);
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
    let slip = false;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const word = slip ? SLIP : BUILD_IDEAS[index];
      charCount += deleting ? -1 : 1;
      setText(word.slice(0, charCount));
      setSlipping(slip);

      let delay = deleting ? DELETE_MS : TYPE_MS;

      if (!deleting && charCount === word.length) {
        deleting = true;
        delay = slip ? HOLD_SLIP_MS : HOLD_FULL_MS;
      } else if (deleting && charCount === 0) {
        deleting = false;
        if (!slip) index = (index + 1) % BUILD_IDEAS.length;
        slip = Math.random() < SLIP_ODDS;
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
            {slipping && text.length > 0 ? (
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => egg.open("typewriter")}
                className="text-lego-yellow cursor-pointer underline decoration-dotted decoration-2 underline-offset-8 transition-colors hover:text-[#d9a441]"
              >
                {text}
                <span className="caret" />
              </button>
            ) : (
              <span aria-hidden className="text-lego-yellow">
                {text}
                <span className="caret" />
              </span>
            )}
            <span className="sr-only">
              something that matters, like a solar tracker, a flood warning
              beacon, a water-quality buoy, or whatever the brief calls for.
            </span>
          </>
        )}
      </p>
    </div>
  );
}
