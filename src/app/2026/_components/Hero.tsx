import Image from "next/image";
import Link from "next/link";
import Path from "@/app/path";
import { MEMBER_LIMITS, getEntryFeeCents, formatAud } from "@/app/2026/_data/teamConfig";

const SPECS = [
  { label: "Weeks", value: "1 – 6" },
  { label: "Entry fee", value: `${formatAud(getEntryFeeCents())} per team` },
  {
    label: "Teams",
    value: `${MEMBER_LIMITS.min} – ${MEMBER_LIMITS.max} people`,
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <p className="spec-label mb-4">UNSW RAMSoc presents</p>

          {/* Lowercase to match the promo wordmark. */}
          <h1 className="font-stud text-ink mb-5 lowercase">
            buildathon
            <span className="sr-only"> 2026</span>
          </h1>

          <p className="text-ink-dim mb-8 max-w-xl text-lg">
            A six-week mechatronics hackathon. Form a team, get a kit, and turn
            a brief into something that actually moves — no experience needed.
          </p>

          {/* Spec block, drafted like a title block on an engineering drawing. */}
          <dl className="drafting-frame mb-9 inline-block rounded-lg px-5 py-4">
            {SPECS.map((spec) => (
              <div
                key={spec.label}
                className="flex flex-wrap items-baseline gap-x-3 py-1"
              >
                <dt className="font-blueprint text-ink-dim w-28 text-xs uppercase">
                  {spec.label}
                </dt>
                <dd className="font-display text-ink text-xl font-bold">
                  {spec.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-4">
            <Link href={Path[2026].SignUp} className="button">
              Register your team
            </Link>
            <a href={Path[2026].About} className="button-outline">
              What is it?
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="border-grid-major relative aspect-square overflow-hidden rounded-xl border shadow-2xl">
            <Image
              src="/2026/brand/hero-square.jpg"
              alt="Buildathon 2026 — LEGO minifigures and electronics components laid out on an engineering blueprint"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
