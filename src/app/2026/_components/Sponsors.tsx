import Image from "next/image";
import { SPONSORS, type Sponsor } from "@/app/2026/_data/sponsors";

/** Each mark is a fixed-colour brand asset, so it gets the plate it was drawn for. */
const PLATE: Record<Sponsor["plate"], string> = {
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
            const logo = (
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
