export type Sponsor = {
  name: string;
  logo: string;
  url?: string;
  /**
   * Plate colour behind the logo. These are fixed-colour brand marks, so each
   * needs the background it was drawn for — Arc's green outline and Engineers
   * Australia read on white, the UNSW school marks on UNSW yellow, and ANT61's
   * white wordmark needs black.
   */
  plate: "white" | "black" | "unsw-yellow";
};

/**
 * Carried over from the Sumobots 2026 partner set. `yokogawa-logo.png` is the
 * file Sumobots stored as `icon.png` — same artwork, saner name.
 */
export const SPONSORS: Sponsor[] = [
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
    name: "UNSW School of Electrical Engineering and Telecommunications",
    logo: "/2026/sponsors/unsw_eet_logo.svg",
    url: "https://www.unsw.edu.au/engineering/electrical-engineering-telecommunications",
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
