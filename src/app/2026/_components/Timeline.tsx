import { TIMELINE } from "@/app/2026/_data/timeline";

const ACCENT_BG: Record<string, string> = {
  azure: "bg-lego-azure",
  yellow: "bg-lego-yellow",
  orange: "bg-lego-orange",
  green: "bg-lego-green",
  red: "bg-lego-red",
};

const ACCENT_TEXT: Record<string, string> = {
  azure: "text-lego-azure",
  yellow: "text-lego-yellow",
  orange: "text-lego-orange",
  green: "text-lego-green",
  red: "text-lego-red",
};

export default function Timeline() {
  return (
    <section id="timeline" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section B — Schedule</p>
        <h2 className="text-ink mb-4">Timeline</h2>
        <p className="text-ink-dim mb-12 max-w-2xl text-lg">
          Sessions run Tuesday and Wednesday evenings through Weeks 1 to 6.
          Rooms marked TBC are still being confirmed.
        </p>

        <ol className="space-y-4">
          {TIMELINE.map((week) => (
            <li
              key={week.week}
              className="bg-blueprint-900/70 border-grid-major overflow-hidden rounded-xl border"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-6 sm:p-6">
                {/* Week marker — a LEGO brick stud strip in the week's colour */}
                <div className="flex shrink-0 items-start gap-4 sm:w-44 sm:flex-col sm:gap-2">
                  <div
                    className={`lego-studs brick flex h-14 w-14 items-center justify-center ${ACCENT_BG[week.accent]}`}
                  >
                    <span className="font-display text-2xl font-extrabold text-[#0a2a55]">
                      {week.week}
                    </span>
                  </div>
                  <div>
                    <p className="font-blueprint text-ink-dim text-xs uppercase">
                      Week {week.week}
                    </p>
                    <p className="font-blueprint text-ink text-sm">
                      {week.dates}
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className={`mb-1 ${ACCENT_TEXT[week.accent]}`}>
                    {week.title}
                  </h3>
                  <p className="text-ink-dim mb-4">{week.summary}</p>

                  <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {week.sessions.map((session, i) => (
                      <li
                        key={i}
                        className="border-grid bg-blueprint-800/60 rounded-lg border px-3 py-2"
                      >
                        <p className="font-blueprint text-ink text-xs uppercase">
                          {session.day}
                        </p>
                        <p className="text-ink-dim text-sm">
                          {session.location} · {session.time}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
