import Image from "next/image";
import { SPONSORS, type Sponsor } from "@/app/2026/_data/sponsors";

/** Each mark is a fixed-colour brand asset, so it gets the plate it was drawn for. */
const PLATE: Record<Exclude<Sponsor["plate"], "lockup">, string> = {
  white: "bg-white",
  black: "bg-black",
  "unsw-yellow": "bg-[#FDDD00]",
};

export default function Sponsors() {
  return (
    <section id="sponsors" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section E · Acknowledgements</p>
        <h2 className="text-ink mb-12">Supported by</h2>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {SPONSORS.map((sponsor) => {
            // Supplied square lockups carry their own background and put the
            // wordmark at the bottom, so they must be shown whole rather than
            // cover-cropped into a wide tile.
            const logo =
              sponsor.plate === "lockup" ? (
                <div
                  className="relative h-28 overflow-hidden rounded-xl bg-white"
                  style={sponsor.bg ? { backgroundColor: sponsor.bg } : undefined}
                >
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  className={`flex h-28 items-center justify-center rounded-xl p-5 ${PLATE[sponsor.plate]}`}
                >
                  <Image
                    src={sponsor.logo}
                    alt={sponsor.name}
                    width={200}
                    height={100}
                    className="max-h-full w-auto object-contain"
                  />
                </div>
              );

            return (
              <li key={sponsor.name}>
                {sponsor.url ? (
                  <a
                    href={sponsor.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block transition-transform hover:-translate-y-1"
                  >
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
