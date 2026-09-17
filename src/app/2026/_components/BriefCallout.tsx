import { BRIEF } from "@/app/2026/_data/resources";

/**
 * The yellow brick, back in the slot the registration call to action used to
 * hold. Registration is done; the brief is the thing every team needs now, so
 * it takes the loudest element on the page.
 */
export default function BriefCallout() {
  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="lego-studs brick bg-lego-yellow flex flex-col items-start gap-6 p-7 text-[#0a2a55] sm:p-9 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-[#0a2a55]">The brief is live</h2>
            <p className="font-blueprint text-sm text-[#0a2a55]/80 uppercase">
              {BRIEF.description}
            </p>
          </div>

          <a
            href={BRIEF.href}
            target="_blank"
            rel="noreferrer noopener"
            className="brick font-display inline-flex min-h-11 shrink-0 items-center justify-center bg-[#0a2a55] px-7 py-3 text-lg font-bold tracking-wide text-white uppercase hover:bg-[#0e3a72]"
          >
            Read the brief
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
