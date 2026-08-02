import { FAQS } from "@/app/2026/_data/faqs";

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section D · Notes</p>
        <h2 className="text-ink mb-12">FAQ</h2>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
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
        </div>
      </div>
    </section>
  );
}
