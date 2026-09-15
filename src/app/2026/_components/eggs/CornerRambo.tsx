"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";

/** Chance he turns up at all on a given page load. */
const ODDS = 0.25;

/** He waits a little, so he is not there the moment the page opens. */
const DELAY_MIN_MS = 4000;
const DELAY_MAX_MS = 12000;

/** Once grabbed or seen, he stays away for the rest of the session. */
const SEEN_KEY = "rambo-corner-seen";

/**
 * Rambo, peeking in from the bottom-right corner, tilted and only half on
 * the page. Grab him for a ticket. Sometimes he is there, mostly he is not.
 */
export default function CornerRambo() {
  const egg = useEgg();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // Storage blocked: he just might show up again next time.
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (Math.random() > ODDS) return;

    const delay = DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, []);

  function grab() {
    setShow(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Fine.
    }
    egg.open("cornerRambo");
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={grab}
          aria-label="Rambo is peeking into the page. Grab him."
          initial={{ x: "75%", y: "75%", rotate: 45, opacity: 0 }}
          animate={{ x: "40%", y: "40%", rotate: 45, opacity: 1 }}
          exit={{ x: "85%", y: "85%", rotate: 45, opacity: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 14 }}
          className="fixed right-0 bottom-0 z-40 h-52 w-52 cursor-pointer outline-none sm:h-64 sm:w-64"
        >
          <motion.span
            aria-hidden
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            className="relative block h-full w-full"
          >
            <Image
              src="/2026/brand/rambo.png"
              alt=""
              fill
              sizes="16rem"
              className="object-contain drop-shadow-[0_10px_0_rgba(0,0,0,0.3)]"
            />
          </motion.span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
