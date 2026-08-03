export type Sponsor = {
  name: string;
  logo: string;
  url?: string;
  /**
   * How the logo sits in its tile.
   *
   * `white` / `black` / `unsw-yellow` are plate colours for transparent marks,
   * each needing the background it was drawn for. `lockup` is for supplied
   * square artwork that already carries its own background: it is shown whole
   * on white, never cropped, because the wordmark sits at the bottom of the
   * square and cover-cropping cuts it off.
   */
  plate: "white" | "black" | "unsw-yellow" | "lockup";
};

export const SPONSORS: Sponsor[] = [
  {
    name: "UNSW Founders",
    logo: "/2026/sponsors/unsw-founders-logo.png",
    url: "https://www.founders.unsw.edu.au/",
    plate: "lockup",
  },
  {
    name: "UNSW Engineering",
    logo: "/2026/sponsors/unsw-engineering-logo.png",
    url: "https://www.unsw.edu.au/engineering",
    plate: "lockup",
  },
  {
    name: "Arc UNSW",
    logo: "/2026/sponsors/unsw_arc_logo_green_outline.svg",
    url: "https://www.arc.unsw.edu.au/",
    plate: "white",
  },
  {
    name: "UNSW School of Computer Science and Engineering",
    logo: "/2026/sponsors/unsw_cse_school_logo.svg",
    url: "https://www.unsw.edu.au/engineering/computer-science-engineering",
    plate: "unsw-yellow",
  },
  {
    name: "UNSW School of Mechanical and Manufacturing Engineering",
    logo: "/2026/sponsors/unsw_mech_school_logo.svg",
    url: "https://www.unsw.edu.au/engineering/mechanical-manufacturing-engineering",
    plate: "unsw-yellow",
  },
  {
    name: "Engineers Australia",
    logo: "/2026/sponsors/engineers_australia_logo.svg",
    url: "https://www.engineersaustralia.org.au/",
    plate: "white",
  },
  {
    name: "Yokogawa",
    logo: "/2026/sponsors/yokogawa-logo.png",
    url: "https://www.yokogawa.com/au/",
    plate: "white",
  },
  {
    name: "ANT61",
    logo: "/2026/sponsors/ant61-logo.png",
    url: "https://ant61.com/",
    plate: "black",
  },
];
