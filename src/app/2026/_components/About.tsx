import Image from "next/image";

const STEPS = [
  {
    n: "01",
    title: "Form a team",
    body: "Two to six people. Register solo and find a team, or create one and share your join code.",
  },
  {
    n: "02",
    title: "Get the brief and a kit",
    body: "Every team starts with an ESP32, a breadboard and a handful of components on kick-off night.",
  },
  {
    n: "03",
    title: "Learn each week",
    body: "Workshops on CAD, microcontrollers and PCB design. Attend to earn tickets for the component shop.",
  },
  {
    n: "04",
    title: "Build it",
    body: "Two weeks of open makerspace time with mentors, 3D printing and laser cutting on hand.",
  },
  {
    n: "05",
    title: "Present",
    body: "Show the judges what you made on presentation night in Week 6. Prizes on the night.",
  },
];

export default function About() {
  return (
    <section id="about" className="scroll-mt-20 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="spec-label mb-3">Section A — Overview</p>
        <h2 className="text-ink mb-4">What is Buildathon?</h2>
        <p className="text-ink-dim mb-12 max-w-2xl text-lg">
          Six weeks, one brief, and whatever you can build with it. Buildathon
          is RAMSoc&apos;s hardware hackathon — closer to a term-long project
          than a weekend sprint, and open to everyone regardless of degree or
          experience.
        </p>

        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <ol className="relative space-y-1">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="border-grid flex gap-5 border-b py-5 last:border-b-0"
              >
                <span className="font-blueprint text-lego-yellow shrink-0 pt-1 text-sm">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-ink mb-1">{step.title}</h3>
                  <p className="text-ink-dim">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="border-grid-major relative aspect-[4/5] overflow-hidden rounded-xl border">
            <Image
              src="/2026/brand/components.jpg"
              alt="The Buildathon kit: resistors, an ESP32 board, a breadboard, an LED, a USB cable and arcade tickets"
              fill
              sizes="(max-width: 1024px) 100vw, 35vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
