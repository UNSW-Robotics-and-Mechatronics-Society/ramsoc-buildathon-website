import Image from "next/image";
import { ExternalLink } from "lucide-react";
import {
  WORKSHOP_RESOURCES,
  EXTERNAL_RESOURCES,
  TROUBLESHOOTING,
  type Resource,
} from "@/app/2026/_data/resources";

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <a
      href={resource.href}
      target="_blank"
      rel="noreferrer noopener"
      className="group border-grid-major bg-blueprint-900/70 hover:border-lego-yellow flex flex-col overflow-hidden rounded-xl border transition-colors"
    >
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={resource.image}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-ink group-hover:text-lego-yellow mb-1 text-base transition-colors">
          {resource.title}
        </h3>
        <p className="text-ink-dim mb-3 text-sm">{resource.description}</p>

        {/* Explicit affordance: the card is a link, and without a visible cue
            people read it as a static tile and never click it. */}
        <span className="font-blueprint text-lego-yellow mt-auto inline-flex items-center gap-1.5 text-[0.7rem] uppercase group-hover:underline">
          {resource.kind === "video"
            ? "Watch"
            : resource.kind === "slides"
              ? "Open slides"
              : "Open"}
          <ExternalLink size={12} aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </span>
      </div>
    </a>
  );
}

export default function Resources() {
  return (
    <section id="resources" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section C · Reference</p>
        <h2 className="text-ink mb-4">Resources</h2>
        <p className="text-ink-dim mb-10 max-w-2xl text-lg">
          Slides and recordings for each workshop. Some are carried over from previous years and cover the same ground; 2026 material is added as each session runs.
        </p>

        <h3 className="text-ink mb-4">Workshop material</h3>
        <div className="mb-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSHOP_RESOURCES.map((r) => (
            <ResourceCard key={r.title} resource={r} />
          ))}
        </div>

        <h3 className="text-ink mb-4">Before you start</h3>
        <div className="mb-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EXTERNAL_RESOURCES.map((r) => (
            <ResourceCard key={r.title} resource={r} />
          ))}
        </div>

        <h3 className="text-ink mb-4">Troubleshooting</h3>
        <ul className="grid gap-4 md:grid-cols-3">
          {TROUBLESHOOTING.map((item) => (
            <li
              key={item.problem}
              className="border-grid-major bg-blueprint-900/70 rounded-xl border p-5"
            >
              <p className="font-blueprint text-lego-orange mb-2 text-sm">
                {item.problem}
              </p>
              <p className="text-ink-dim text-sm">{item.fix}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
