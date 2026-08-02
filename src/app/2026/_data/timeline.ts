/**
 * Buildathon 2026 runs across the first six weeks of term.
 *
 * This is the FALLBACK copy of the schedule. The live one lives in the
 * timeline_weeks / timeline_sessions tables and is edited from
 * /2026/admin/timeline; getTimeline() only falls back here when the table is
 * empty or unreachable. Keep it roughly in step, but edit the real schedule in
 * the admin console.
 */

export type TimelineSession = {
  day: string;
  location: string;
  time: string;
};

export type TimelineAccent = "azure" | "yellow" | "orange" | "green" | "red";

export type TimelineWeek = {
  week: number;
  dates: string;
  title: string;
  /** Short blurb shown under the title. */
  summary: string;
  sessions: TimelineSession[];
  /** LEGO accent colour token used for the week's brick. */
  accent: TimelineAccent;
};

export const TIMELINE: TimelineWeek[] = [
  {
    week: 1,
    dates: "15 Sep",
    title: "Introduction",
    summary:
      "Kick-off night. Meet the organisers, get the brief, and pick up your kit.",
    sessions: [{ day: "Tuesday", location: "MCIC", time: "6:00 – 8:00pm" }],
    accent: "azure",
  },
  {
    week: 2,
    dates: "22 – 23 Sep",
    title: "CAD",
    summary:
      "Designing parts for 3D printing and laser cutting, from sketch to printable file.",
    sessions: [
      { day: "Tuesday", location: "TBC", time: "TBC" },
      { day: "Wednesday", location: "TBC", time: "TBC" },
    ],
    accent: "yellow",
  },
  {
    week: 3,
    dates: "29 – 30 Sep",
    title: "ESP32 + PCB",
    summary:
      "Microcontroller programming and an intro to laying out your own circuit board.",
    sessions: [
      { day: "Tuesday", location: "MCIC", time: "6:00 – 8:00pm" },
      { day: "Wednesday", location: "MCIC", time: "6:00 – 8:00pm" },
      { day: "Friday", location: "TBC", time: "TBC" },
    ],
    accent: "orange",
  },
  {
    week: 4,
    dates: "6 – 7 Oct",
    title: "Build Session",
    summary: "Open makerspace time with mentors on hand.",
    sessions: [
      { day: "Tuesday", location: "MCIC Makerspace", time: "6:00 – 8:00pm" },
      { day: "Wednesday", location: "MCIC Makerspace", time: "6:00 – 8:00pm" },
    ],
    accent: "green",
  },
  {
    week: 5,
    dates: "13 – 14 Oct",
    title: "Build Session",
    summary: "Last full week of build time before presentations.",
    sessions: [
      { day: "Tuesday", location: "MCIC Makerspace", time: "6:00 – 8:00pm" },
      { day: "Wednesday", location: "MCIC Makerspace", time: "6:00 – 8:00pm" },
    ],
    accent: "green",
  },
  {
    week: 6,
    dates: "23 Oct",
    title: "Closing Presentations",
    summary: "Show the judges what you built. Prizes announced on the night.",
    sessions: [{ day: "Friday", location: "TBC", time: "5:00 – 8:30pm" }],
    accent: "red",
  },
];
