"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FAQS, HIDDEN_FAQ } from "@/app/2026/_data/faqs";
import { useEgg } from "@/app/2026/_components/eggs/EggProvider";

/**
 * Plain <details> disclosures, with one addition: a seventeenth question that
 * only exists once every other one has been opened. Nobody reads every FAQ,
 * so whoever does gets a ticket for it.
 */
export default function Faq() {
  const egg = useEgg();
  const [opened, setOpened] = useState<ReadonlySet<string>>(() => new Set());

  const allRead = opened.size >= FAQS.length;

  function track(question: string, open: boolean) {
    if (!open) return;
    setOpened((prev) =>
      prev.has(question) ? prev : new Set(prev).add(question),
    );
  }

  return (
    <section id="faq" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section D · Notes</p>
        <h2 className="text-ink mb-12">FAQ</h2>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              onToggle={(e) => track(faq.question, e.currentTarget.open)}
              className="group border-grid-major bg-blueprint-900/70 rounded-xl border open:pb-1"
            >
              <summary className="font-display text-ink flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold uppercase [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden
                  className="text-lego-yellow shrink-0 text-2xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-ink-dim px-5 pb-4">{faq.answer}</p>
            </details>
          ))}

          {allRead && (
            <motion.details
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onToggle={(e) => {
                if (e.currentTarget.open) egg.open("faq17");
              }}
              className="group rounded-xl border border-[#d9a441]/50 bg-[#0a1226]/80 open:pb-1"
            >
              <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-lg font-bold text-[#e8c777] uppercase [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-3">
                  <span className="font-blueprint text-[0.65rem] text-[#d9a441]/70">
                    {FAQS.length + 1}
                  </span>
                  {HIDDEN_FAQ.question}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-2xl leading-none text-[#d9a441] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="text-ink-dim px-5 pb-4">{HIDDEN_FAQ.answer}</p>
            </motion.details>
          )}
        </div>
      </div>
    </section>
  );
}
