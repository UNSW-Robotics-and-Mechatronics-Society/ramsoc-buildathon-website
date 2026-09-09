import Image from "next/image";
import Link from "next/link";
import Path from "@/app/path";
import BuildTypewriter from "@/app/2026/_components/BuildTypewriter";
import CountdownStages from "@/app/2026/_components/CountdownStages";
import { getAppConfig } from "@/app/2026/_actions/appConfig";
import { DISCORD_INVITE } from "@/app/2026/_data/socials";
import {
  getCountdownStages,
  resolveCountdownPhase,
} from "@/app/2026/_data/registrationConfig";
import { MEMBER_LIMITS, getEntryFeeCents, formatAud } from "@/app/2026/_data/teamConfig";

const SPECS = [
  { label: "Weeks", value: "1 – 6" },
  { label: "Entry fee", value: `${formatAud(getEntryFeeCents())} per team` },
  {
    label: "Teams",
    value: `${MEMBER_LIMITS.min} – ${MEMBER_LIMITS.max} people`,
  },
];

export default async function Hero() {
  const stages = getCountdownStages(await getAppConfig());

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

          <BuildTypewriter />

          <p className="text-ink-dim mb-8 max-w-xl text-lg">
            A six-week mechatronics hackathon. Form a team, get a kit, and build
            something to the brief. No experience needed.
          </p>

          {/* Spec block, drafted like the title block on an engineering drawing.
              Solid-ish surface so the ruled grid does not run through the figures. */}
          <dl className="drafting-frame bg-blueprint-900/85 mb-8 inline-block rounded-lg px-5 py-4 backdrop-blur-sm">
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

          <div className="mb-9 max-w-xl">
            <CountdownStages
              stages={stages}
              initialPhase={resolveCountdownPhase(stages)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href={Path[2026].SignUp} className="button">
              Register your team
            </Link>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noreferrer noopener"
              className="button-discord"
            >
              Join the Discord
            </a>
            <a href={Path[2026].About} className="text-link font-blueprint text-xs uppercase">
              What is it?
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="border-grid-major relative aspect-square overflow-hidden rounded-xl border shadow-2xl">
            <Image
              src="/2026/brand/hero-square.jpg"
              alt="Buildathon 2026 poster: LEGO minifigures and electronics components laid out on an engineering blueprint"
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
