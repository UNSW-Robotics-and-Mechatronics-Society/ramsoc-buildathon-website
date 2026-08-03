"use client";

import { useEffect, useRef, useState } from "react";

import type {
  AdminTeamRow,
  Profile,
  ProfileWithTeam,
  TeamBrowseItem,
  TeamMember,
  TeamWithMembers,
} from "@/app/_types/registration";
import type {
  AdminTask,
  AdminTimelineWeek,
} from "@/app/2026/admin/_utils/types";

import {
  MEMBER_LIMITS,
  formatAud,
  getEntryFeeCents,
} from "@/app/2026/_data/teamConfig";

import AdminShell from "@/app/2026/admin/_components/AdminShell";
import AdminLoginForm from "@/app/2026/admin/_components/AdminLoginForm";
import TeamsTable from "@/app/2026/admin/_components/TeamsTable";
import IndividualsTable from "@/app/2026/admin/_components/IndividualsTable";
import TasksTable from "@/app/2026/admin/_components/TasksTable";
import TimelineEditor from "@/app/2026/admin/_components/TimelineEditor";
import {
  ActionButton,
  Alert,
  ConfirmButton,
  DateField,
  EmptyRow,
  FilterSelect,
  Panel,
  PanelSection,
  SearchField,
  StatusPill,
  TableFrame,
  Th,
} from "@/app/2026/admin/_components/AdminUI";

import StepIndicator from "@/app/2026/onboarding/_components/StepIndicator";

import TeamCard from "@/app/2026/dashboard/_components/TeamCard";
import MemberList from "@/app/2026/dashboard/_components/MemberList";
import JoinCodeDisplay from "@/app/2026/dashboard/_components/JoinCodeDisplay";
import NoTeamState from "@/app/2026/dashboard/_components/NoTeamState";
import LeaveTeamButton from "@/app/2026/dashboard/_components/LeaveTeamButton";
import ProfileTab from "@/app/2026/dashboard/_components/ProfileTab";
import BuildTypewriter from "@/app/2026/_components/BuildTypewriter";

import { Button } from "@/app/2026/_components/ui/Button";
import Input from "@/app/2026/_components/ui/Input";
import Select from "@/app/2026/_components/ui/Select";
import Card from "@/app/2026/_components/ui/Card";
import Badge from "@/app/2026/_components/ui/Badge";
import FadeIn from "@/app/2026/_components/ui/FadeIn";

/**
 * Component gallery for the Buildathon 2026 portal.
 *
 * Supabase is not wired up on this project yet, so this page is the only way
 * to see the dashboard and admin components rendered. Everything below runs on
 * hand-written mock data that satisfies the real types in
 * `_types/registration.ts`; nothing here touches the database.
 *
 * Interactive controls inside the ported tables still call their real server
 * actions, so clicking "expand" or "save" on a table row will fail until the
 * database exists. Reading the layout is what this page is for.
 *
 * It lives under /2026/admin so it inherits the admin layout's
 * `robots: noindex` and the admin cookie gate in middleware; a client
 * component cannot export its own metadata.
 */

// ------------------------------------------------------------- mock data --

const baseProfile: Profile = {
  id: "p1",
  clerk_user_id: "user_2mockAAA",
  email: "alice.zhang@student.unsw.edu.au",
  full_name: "Alice Zhang",
  phone: "0400 111 222",
  user_type: "unsw",

  zid: "z5312880",
  faculty: "Engineering",
  degree: "Mechatronic Engineering / Computer Science",
  majors: "Robotics",
  degree_stage: "Penultimate",
  undergrad_postgrad: "Undergraduate",
  domestic_international: "Domestic",
  year_of_study: "3rd year",
  is_ramsoc_member: true,
  is_arc_member: true,

  university: "",
  uni_id: "",

  high_school: "",

  gender: "female",
  gender_other: "",
  heard_from: "discord",
  heard_from_other: "",
  dietary_requirements: "",

  onboarded: true,
  created_at: "2026-02-02T09:14:00Z",
  updated_at: "2026-02-11T22:05:00Z",
};

/** A student at another university: no zID, a `university` and a `uni_id`. */
const otherUniProfile: Profile = {
  ...baseProfile,
  id: "p2",
  clerk_user_id: "user_2mockBBB",
  email: "b.okafor@student.uts.edu.au",
  full_name: "Blessing Okafor",
  phone: "0400 333 444",
  user_type: "other_uni",
  zid: "",
  faculty: "",
  degree: "Mechanical Engineering",
  majors: "",
  degree_stage: "",
  undergrad_postgrad: "Undergraduate",
  domestic_international: "International",
  year_of_study: "2nd year",
  is_ramsoc_member: false,
  is_arc_member: false,
  university: "University of Technology Sydney",
  uni_id: "13998214",
  gender: "female",
  heard_from: "friend",
};

/** A high schooler: institution comes from `high_school`, no student ID. */
const highSchoolProfile: Profile = {
  ...baseProfile,
  id: "p3",
  clerk_user_id: "user_2mockCCC",
  email: "dev.sharma@education.nsw.gov.au",
  full_name: "Dev Sharma",
  phone: "0400 555 666",
  user_type: "high_school",
  zid: "",
  faculty: "",
  degree: "",
  majors: "",
  degree_stage: "",
  undergrad_postgrad: "",
  domestic_international: "",
  year_of_study: "Year 12",
  is_ramsoc_member: false,
  is_arc_member: false,
  university: "",
  uni_id: "",
  high_school: "Sydney Boys High School",
  gender: "male",
  heard_from: "school",
  heard_from_other: "",
  dietary_requirements: "",
};

const extraProfiles: Profile[] = [
  {
    ...baseProfile,
    id: "p4",
    clerk_user_id: "user_2mockDDD",
    email: "mia.tran@student.unsw.edu.au",
    full_name: "Mia Tran",
    zid: "z5401192",
    degree: "Electrical Engineering",
    majors: "Power systems",
    year_of_study: "1st year",
    is_arc_member: false,
    gender: "female",
  },
  {
    ...baseProfile,
    id: "p5",
    clerk_user_id: "user_2mockEEE",
    email: "j.rivera@student.unsw.edu.au",
    full_name: "Joaquin Rivera",
    zid: "z5288104",
    degree: "Software Engineering",
    majors: "Embedded systems",
    year_of_study: "4th year",
    gender: "male",
    heard_from: "lecture",
  },
  {
    ...otherUniProfile,
    id: "p6",
    clerk_user_id: "user_2mockFFF",
    email: "h.lindqvist@sydney.edu.au",
    full_name: "Hanna Lindqvist",
    university: "University of Sydney",
    uni_id: "520114872",
    degree: "Mechatronic Engineering",
    gender: "female",
  },
];

function member(
  index: number,
  teamId: string,
  profile: Profile,
  role: TeamMember["role"],
): TeamMember & { profile: Profile } {
  return {
    id: `tm-${teamId}-${index}`,
    team_id: teamId,
    profile_id: profile.id,
    role,
    joined_at: "2026-02-04T02:30:00Z",
    profile,
  };
}

/** A full roster at MEMBER_LIMITS.max, already paid. */
const fullTeam: TeamWithMembers = {
  id: "team-full",
  name: "Solar Sentinels",
  join_code: "K4M9QX",
  paid: true,
  competition_year: 2026,
  created_by: baseProfile.id,
  created_at: "2026-02-04T02:30:00Z",
  updated_at: "2026-02-09T11:02:00Z",
  members: [
    member(1, "team-full", baseProfile, "captain"),
    member(2, "team-full", otherUniProfile, "member"),
    member(3, "team-full", highSchoolProfile, "member"),
    member(4, "team-full", extraProfiles[0], "member"),
    member(5, "team-full", extraProfiles[1], "member"),
    member(6, "team-full", extraProfiles[2], "member"),
  ],
};

/** A captain on their own: below MEMBER_LIMITS.min, so payment is blocked. */
const soloTeam: TeamWithMembers = {
  id: "team-solo",
  name: "Flood Beacon",
  join_code: "P7WT2B",
  paid: false,
  competition_year: 2026,
  created_by: highSchoolProfile.id,
  created_at: "2026-02-10T23:48:00Z",
  updated_at: "2026-02-10T23:48:00Z",
  members: [member(1, "team-solo", highSchoolProfile, "captain")],
};

/** Enough members to pay, but the fee has not been taken yet. */
const payableTeam: TeamWithMembers = {
  id: "team-payable",
  name: "Reef Watch",
  join_code: "ZC5RN8",
  paid: false,
  competition_year: 2026,
  created_by: extraProfiles[1].id,
  created_at: "2026-02-06T08:15:00Z",
  updated_at: "2026-02-08T19:40:00Z",
  members: [
    member(1, "team-payable", extraProfiles[1], "captain"),
    member(2, "team-payable", extraProfiles[2], "member"),
    member(3, "team-payable", extraProfiles[0], "member"),
  ],
};

const browseTeams: TeamBrowseItem[] = [
  { name: "Solar Sentinels", member_count: 6 },
  { name: "Reef Watch", member_count: 3 },
  { name: "Flood Beacon", member_count: 1 },
  { name: "Grid Guardians", member_count: 4 },
  { name: "Compost Compass", member_count: 2 },
];

function adminRow(team: TeamWithMembers): AdminTeamRow {
  return {
    id: team.id,
    name: team.name,
    join_code: team.join_code,
    paid: team.paid,
    competition_year: team.competition_year,
    created_by: team.created_by,
    created_at: team.created_at,
    updated_at: team.updated_at,
    member_count: team.members.length,
    member_names: team.members.map((m) => m.profile.full_name),
  };
}

const adminTeams: AdminTeamRow[] = [
  adminRow(fullTeam),
  adminRow(payableTeam),
  adminRow(soloTeam),
  {
    id: "team-grid",
    name: "Grid Guardians",
    join_code: "H3LM6D",
    paid: true,
    competition_year: 2026,
    created_by: "p9",
    created_at: "2026-02-05T04:12:00Z",
    updated_at: "2026-02-07T10:00:00Z",
    member_count: 4,
    member_names: ["Nadia Haddad", "Tom Feng", "Priya Nair", "Omar Said"],
  },
  {
    id: "team-compost",
    name: "Compost Compass",
    join_code: "V8QJ1S",
    paid: false,
    competition_year: 2026,
    created_by: "p13",
    created_at: "2026-02-11T06:55:00Z",
    updated_at: "2026-02-11T06:55:00Z",
    member_count: 2,
    member_names: ["Ruby Castellano", "Wei Lam"],
  },
];

function withTeam(
  profile: Profile,
  team: { id: string; name: string } | null,
  role: "captain" | "member" | null,
): ProfileWithTeam {
  return {
    ...profile,
    team_id: team?.id ?? null,
    team_name: team?.name ?? null,
    team_role: role,
  };
}

const adminProfiles: ProfileWithTeam[] = [
  withTeam(baseProfile, fullTeam, "captain"),
  withTeam(otherUniProfile, fullTeam, "member"),
  withTeam(highSchoolProfile, soloTeam, "captain"),
  withTeam(extraProfiles[0], payableTeam, "member"),
  withTeam(extraProfiles[1], payableTeam, "captain"),
  withTeam(extraProfiles[2], null, null),
  withTeam(
    {
      ...baseProfile,
      id: "p7",
      clerk_user_id: "user_2mockGGG",
      full_name: "Nadia Haddad",
      email: "n.haddad@student.unsw.edu.au",
      zid: "z5377421",
      degree: "Mechanical Engineering",
      is_ramsoc_member: false,
      gender: "female",
    },
    { id: "team-grid", name: "Grid Guardians" },
    "captain",
  ),
  withTeam(
    {
      ...highSchoolProfile,
      id: "p8",
      clerk_user_id: "user_2mockHHH",
      full_name: "Ruby Castellano",
      email: "ruby.castellano@student.nsw.edu.au",
      high_school: "Newtown High School of the Performing Arts",
      year_of_study: "Year 11",
      gender: "female",
    },
    null,
    null,
  ),
];

const adminTasks: AdminTask[] = [
  {
    id: "task-1",
    title: "Sign the workshop safety acknowledgement",
    description: "Every member of the team has to sign it before kit pickup.",
    url: "https://example.com/safety-form",
    active: true,
    created_at: "2026-02-03T01:00:00Z",
  },
  {
    id: "task-2",
    title: "Submit your one-page build brief",
    description: "What you plan to build and how it answers the brief.",
    url: "",
    active: true,
    created_at: "2026-02-06T01:00:00Z",
  },
  {
    id: "task-3",
    title: "Book a mentor slot",
    description: "",
    url: "https://example.com/mentors",
    active: false,
    created_at: "2026-02-09T01:00:00Z",
  },
];

/** Two weeks of the schedule, one of them still waiting on a room. */
const adminTimeline: AdminTimelineWeek[] = [
  {
    id: "week-1",
    week: 1,
    dates: "15 Sep",
    title: "Introduction",
    summary:
      "Kick-off night. Meet the organisers, get the brief, and pick up your kit.",
    accent: "azure",
    sessions: [
      {
        id: "sess-1",
        week_id: "week-1",
        position: 0,
        day: "Tuesday",
        location: "MCIC",
        time: "6:00 - 8:00pm",
      },
    ],
  },
  {
    id: "week-2",
    week: 2,
    dates: "22 - 23 Sep",
    title: "CAD",
    summary:
      "Designing parts for 3D printing and laser cutting, from sketch to printable file.",
    accent: "yellow",
    sessions: [
      {
        id: "sess-2",
        week_id: "week-2",
        position: 0,
        day: "Tuesday",
        location: "TBC",
        time: "TBC",
      },
      {
        id: "sess-3",
        week_id: "week-2",
        position: 1,
        day: "Wednesday",
        location: "TBC",
        time: "TBC",
      },
    ],
  },
];

// ----------------------------------------------------------------- tokens --

type Swatch = { name: string; hex: string; className: string };

const groundSwatches: Swatch[] = [
  { name: "blueprint-950", hex: "#04234f", className: "bg-blueprint-950" },
  { name: "blueprint-900", hex: "#072f6b", className: "bg-blueprint-900" },
  { name: "blueprint-850", hex: "#08376f", className: "bg-blueprint-850" },
  { name: "blueprint-800", hex: "#0a3d88", className: "bg-blueprint-800" },
  { name: "blueprint-700", hex: "#0e4ba6", className: "bg-blueprint-700" },
  { name: "blueprint-600", hex: "#1560c4", className: "bg-blueprint-600" },
  { name: "blueprint-500", hex: "#2c7ae0", className: "bg-blueprint-500" },
];

const inkSwatches: Swatch[] = [
  { name: "ink", hex: "#eaf1ff", className: "bg-ink" },
  { name: "ink-dim", hex: "#a9c2e8", className: "bg-ink-dim" },
  { name: "grid", hex: "rgb(255 255 255 / 0.10)", className: "bg-grid" },
  {
    name: "grid-major",
    hex: "rgb(255 255 255 / 0.18)",
    className: "bg-grid-major",
  },
];

const legoSwatches: Swatch[] = [
  { name: "lego-yellow", hex: "#ffcf00", className: "bg-lego-yellow" },
  { name: "lego-orange", hex: "#f57c20", className: "bg-lego-orange" },
  { name: "lego-red", hex: "#d9202a", className: "bg-lego-red" },
  { name: "lego-green", hex: "#4c9f38", className: "bg-lego-green" },
  { name: "lego-azure", hex: "#35a3e0", className: "bg-lego-azure" },
];

const SECTIONS = [
  { id: "tokens", label: "Tokens" },
  { id: "typography", label: "Typography" },
  { id: "utilities", label: "Utilities" },
  { id: "primitives", label: "Primitives" },
  { id: "onboarding", label: "Onboarding" },
  { id: "dashboard", label: "Dashboard" },
  { id: "admin", label: "Admin" },
] as const;

// ---------------------------------------------------------------- helpers --

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {swatches.map((swatch) => (
        <li
          key={swatch.name}
          className="bg-blueprint-950 overflow-hidden rounded-md border border-white/15"
        >
          <div
            aria-hidden
            className={`h-14 w-full border-b border-white/15 ${swatch.className}`}
          />
          <div className="px-3 py-2">
            <p className="font-blueprint text-ink truncate text-xs">
              {swatch.name}
            </p>
            <p className="font-blueprint text-ink-dim truncate text-[0.65rem]">
              {swatch.hex}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One labelled slot in the gallery. Solid surface, mono caption. */
function Specimen({
  label,
  note,
  className,
  children,
}: {
  label: string;
  note?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-blueprint-950 min-w-0 rounded-md border border-white/15">
      <div className="border-b border-white/10 px-3 py-2">
        <p className="font-blueprint text-ink text-[0.7rem] uppercase">
          {label}
        </p>
        {note && (
          <p className="font-main text-ink-dim mt-0.5 text-xs">{note}</p>
        )}
      </div>
      <div className={className ?? "p-4"}>{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

// ------------------------------------------------------------------- page --

export default function AdminUiGalleryPage() {
  // The admin header and this page's own nav are both sticky and both change
  // height as the viewport narrows, so their heights are measured rather than
  // guessed. Anything hard-coded here goes wrong the moment the header wraps.
  const navRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [navHeight, setNavHeight] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    const nav = navRef.current;
    if (!header || !nav) return;

    const measure = () => {
      setHeaderHeight(header.getBoundingClientRect().height);
      setNavHeight(nav.getBoundingClientRect().height);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(header);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  const scrollMarginTop = headerHeight + navHeight + 16;

  return (
    <AdminShell title="UI gallery">
      {/*
        overflow-x-clip, not overflow-x-hidden: `hidden` turns this into a
        scroll container and silently kills the sticky nav below, `clip` does
        not. Either way the page body never scrolls sideways.
      */}
      <div className="min-w-0 overflow-x-clip">
        <nav
          ref={navRef}
          aria-label="Gallery sections"
          style={{ top: headerHeight }}
          className="bg-blueprint-950/95 sticky z-20 mb-6 rounded-md border border-white/15 px-2 py-2 backdrop-blur"
        >
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="font-blueprint text-ink-dim hover:text-ink focus-visible:ring-lego-yellow/60 inline-flex min-h-[44px] items-center rounded-md border border-white/15 px-3 text-xs whitespace-nowrap uppercase transition-colors outline-none hover:border-white/40 hover:bg-white/10 focus-visible:ring-2"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="font-main text-ink-dim mb-8 max-w-prose text-sm">
          Every portal component rendered against mock data, so the UI can be
          reviewed without a database. Nothing on this page reads or writes
          Supabase. Controls inside the ported admin tables still point at their
          real server actions, so submitting one will fail until the database is
          configured.
        </p>

        {/* ------------------------------------------------------ tokens -- */}
        <GallerySection
          id="tokens"
          index="01"
          title="Design tokens"
          blurb="A deep drafting-blue ground, white ink, and saturated LEGO brick accents. LEGO yellow is the primary action colour."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="flex flex-col gap-5">
            <Panel className="p-4 sm:p-5">
              <p className="spec-label mb-3">Blueprint ground</p>
              <SwatchGrid swatches={groundSwatches} />
            </Panel>

            <Panel className="p-4 sm:p-5">
              <p className="spec-label mb-3">Drafting ink and rules</p>
              <SwatchGrid swatches={inkSwatches} />
              <p className="font-main text-ink-dim mt-3 text-xs">
                The two grid tokens are translucent white, so on this dark panel
                they read as very faint. They are the ruled lines on the body
                background and the border colour of the drafting frame.
              </p>
            </Panel>

            <Panel className="p-4 sm:p-5">
              <p className="spec-label mb-3">LEGO brick accents</p>
              <SwatchGrid swatches={legoSwatches} />
            </Panel>
          </div>
        </GallerySection>

        {/* -------------------------------------------------- typography -- */}
        <GallerySection
          id="typography"
          index="02"
          title="Typography"
          blurb="Four faces: a dotted wordmark face for display, a condensed sans for headings, Inter for copy, and a mono for technical labels and numerics."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Specimen
              label="font-stud"
              note="Bitcount. Every glyph is drawn from round dots, like studs on a baseplate. Used by h1 and h2."
            >
              <p className="font-stud text-3xl break-words sm:text-4xl">
                Buildathon 2026
              </p>
            </Specimen>

            <Specimen
              label="font-display"
              note="Saira Condensed. Section titles, buttons, h3 and h4."
            >
              <p className="font-display text-3xl font-bold uppercase sm:text-4xl">
                Build something that matters
              </p>
            </Specimen>

            <Specimen label="font-main" note="Inter. All body copy and inputs.">
              <p className="font-main text-sm">
                A six-week mechatronics hackathon run by UNSW RAMSoc. Build a
                team of {MEMBER_LIMITS.min} to {MEMBER_LIMITS.max}, get a kit,
                and bring a brief to life.
              </p>
            </Specimen>

            <Specimen
              label="font-blueprint"
              note="IBM Plex Mono, wide tracking. Labels, join codes, tabular numerics."
            >
              <p className="font-blueprint text-sm break-all uppercase">
                Part no. K4M9QX / rev 02 / 2026-02-11
              </p>
            </Specimen>

            <Specimen
              label="Heading scale"
              note="h1 and h2 are set in the dotted face, h3 and h4 fall back to the condensed sans so they stay legible next to body copy."
              className="flex flex-col gap-3 p-4"
            >
              <h1 className="break-words">Build</h1>
              <h2 className="break-words">Heading two</h2>
              <h3>Heading three</h3>
              <h4>Heading four</h4>
            </Specimen>

            <Specimen
              label=".spec-label"
              note="The annotation style from engineering drawings. Mono, small, uppercase, dimmed ink."
            >
              <p className="spec-label">Entrant record</p>
              <p className="spec-label mt-2">Part no. / join code</p>
            </Specimen>
          </div>
        </GallerySection>

        {/* --------------------------------------------------- utilities -- */}
        <GallerySection
          id="utilities"
          index="03"
          title="Utilities"
          blurb="The custom Tailwind utilities and component classes from styles.css, rendered live."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Specimen
              label=".brick"
              note="A solid slab with the chunky bottom shadow a LEGO piece casts. The shadow collapses on :active, so press it."
            >
              <div className="brick bg-lego-yellow font-display px-5 py-4 text-lg font-bold text-[#0a2a55] uppercase">
                Press me
              </div>
            </Specimen>

            <Specimen
              label=".lego-studs"
              note="A row of studs along the top edge, drawn in currentColor. Combined with .brick on the roster tiles."
              className="px-4 pt-6 pb-4"
            >
              <div className="lego-studs brick bg-lego-azure/20 text-lego-azure px-4 py-4">
                <p className="font-main text-ink text-sm font-semibold">
                  Studded brick
                </p>
              </div>
            </Specimen>

            <Specimen
              label=".drafting-frame"
              note="A doubled outline with an offset, as used around callouts on the promo art."
              className="p-6"
            >
              <div className="drafting-frame bg-blueprint-900 px-4 py-5 text-center">
                <p className="font-blueprint text-sm tracking-[0.3em] uppercase">
                  K4M9QX
                </p>
              </div>
            </Specimen>

            <Specimen
              label=".blueprint-grid"
              note="The ruled ground: minor squares with a heavier major line every fifth. Applied to the body, suppressed across the admin area."
              className="p-0"
            >
              <div className="blueprint-grid h-40 w-full" />
            </Specimen>

            <Specimen
              label="Button classes"
              note=".button, .button-outline and .button-discord. These are the public-site CTAs, distinct from the Button primitive."
              className="p-4"
            >
              <Row>
                <button type="button" className="button">
                  Register
                </button>
                <button type="button" className="button-outline">
                  Learn more
                </button>
                <button type="button" className="button-discord">
                  Join the Discord
                </button>
              </Row>
            </Specimen>

            <Specimen
              label=".text-link and .caret"
              note="The inline link style, and the blinking block cursor the hero typewriter leaves behind."
            >
              <p className="font-main text-sm">
                Looking for teammates?{" "}
                <a href="#utilities" className="text-link">
                  Find a team on the Discord
                </a>
                .
              </p>
              <p className="font-display text-lego-yellow mt-4 text-2xl font-bold uppercase">
                Build a solar tracker
                <span className="caret" />
              </p>
            </Specimen>
          </div>
        </GallerySection>

        {/* -------------------------------------------------- primitives -- */}
        <GallerySection
          id="primitives"
          index="04"
          title="UI primitives"
          blurb="The shared components under _components/ui. Button, Input and Select drive every form in the portal."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Specimen label="Button / variants">
              <Row>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </Row>
            </Specimen>

            <Specimen
              label="Button / sizes"
              note="default, lg, then full width"
            >
              <div className="flex flex-col gap-3">
                <Row>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </Row>
                <Button size="full">Full width</Button>
              </div>
            </Specimen>

            <Specimen
              label="Button / states"
              note="`loading` shows a spinner and disables the button on its own."
            >
              <Row>
                <Button loading>Saving</Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary" loading>
                  Loading
                </Button>
                <Button
                  variant="primary"
                  className="bg-lego-red hover:bg-lego-red/85 text-white"
                >
                  Destructive
                </Button>
              </Row>
            </Specimen>

            <Specimen
              label="Badge / variants"
              note="Colours come from the LEGO accents so badges read as part of the brick vocabulary."
            >
              <Row>
                <Badge>Default</Badge>
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Not active</Badge>
                <Badge variant="danger">Overdue</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="captain">Captain</Badge>
              </Row>
            </Specimen>

            <Specimen
              label="Input"
              note="The label is required and doubles as the generated id, so every input is labelled."
            >
              <div className="flex flex-col gap-4">
                <Input label="Full name" defaultValue="Alice Zhang" />
                <Input
                  label="Email"
                  type="email"
                  required
                  placeholder="you@student.unsw.edu.au"
                />
                <Input
                  label="zID"
                  defaultValue="5312880"
                  error="A zID starts with z followed by seven digits."
                />
                <Input label="Phone" disabled defaultValue="0400 111 222" />
              </div>
            </Specimen>

            <Specimen label="Select">
              <div className="flex flex-col gap-4">
                <Select
                  label="Cohort"
                  defaultValue="unsw"
                  options={[
                    { value: "unsw", label: "UNSW student" },
                    { value: "other_uni", label: "Other university student" },
                    { value: "high_school", label: "High school student" },
                  ]}
                />
                <Select
                  label="Year of study"
                  required
                  placeholder="Select a year"
                  defaultValue=""
                  options={[
                    { value: "1", label: "1st year" },
                    { value: "2", label: "2nd year" },
                    { value: "3", label: "3rd year" },
                  ]}
                  error="Pick a year of study."
                />
              </div>
            </Specimen>

            <Specimen
              label="Card"
              note="A translucent, blurred slab. On the blueprint ground it needs a solid tint behind dense content, which is why the dashboard passes bg-blueprint-900/50."
              className="p-4"
            >
              <div className="flex flex-col gap-4">
                <Card>
                  <p className="spec-label">Default card</p>
                  <p className="font-main text-ink-dim mt-1 text-sm">
                    Translucent over whatever sits behind it.
                  </p>
                </Card>
                <Card className="bg-blueprint-900/50">
                  <p className="spec-label">Card with the dashboard tint</p>
                  <p className="font-main text-ink-dim mt-1 text-sm">
                    bg-blueprint-900/50, as used across the dashboard.
                  </p>
                </Card>
              </div>
            </Specimen>

            <Specimen
              label="FadeIn"
              note="Motion wrapper used for staggered reveals. It animates on mount, so replay it to see the directions."
            >
              <div className="flex flex-col gap-3">
                <ActionButton
                  tone="primary"
                  onClick={() => setFadeKey((k) => k + 1)}
                >
                  Replay
                </ActionButton>
                <div key={fadeKey} className="grid gap-2 sm:grid-cols-2">
                  {(["up", "down", "left", "right", "none"] as const).map(
                    (direction, i) => (
                      <FadeIn
                        key={direction}
                        direction={direction}
                        delay={i * 0.12}
                      >
                        <p className="font-blueprint bg-blueprint-900 text-ink rounded-md border border-white/15 px-3 py-2 text-xs uppercase">
                          direction={direction}
                        </p>
                      </FadeIn>
                    ),
                  )}
                </div>
              </div>
            </Specimen>
          </div>
        </GallerySection>

        {/* -------------------------------------------------- onboarding -- */}
        <GallerySection
          id="onboarding"
          index="05"
          title="Onboarding"
          blurb="Buildathon runs one division, so onboarding is fixed at three steps: who you are, your details, your team."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2, 3].map((step) => (
              <Specimen key={step} label={`StepIndicator / step ${step}`}>
                <StepIndicator currentStep={step} totalSteps={3} />
              </Specimen>
            ))}
            <Specimen
              label="StepIndicator / all complete"
              note="currentStep past the last step, as it looks the instant before the redirect to the dashboard."
            >
              <StepIndicator currentStep={4} totalSteps={3} />
            </Specimen>
          </div>
        </GallerySection>

        {/* --------------------------------------------------- dashboard -- */}
        <GallerySection
          id="dashboard"
          index="06"
          title="Dashboard"
          blurb={`Entry fee ${formatAud(getEntryFeeCents())} per team, rosters of ${MEMBER_LIMITS.min} to ${MEMBER_LIMITS.max}. Paid and unpaid, full and nearly empty, captain and member views.`}
          scrollMarginTop={scrollMarginTop}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Specimen
              label="TeamCard / paid, full roster, captain"
              note="Once paid, the fee block disappears entirely."
            >
              <TeamCard team={fullTeam} isCaptain />
            </Specimen>

            <Specimen
              label="TeamCard / unpaid, payable, captain"
              note={`At or above ${MEMBER_LIMITS.min} members the captain can pay.`}
            >
              <TeamCard team={payableTeam} isCaptain />
            </Specimen>

            <Specimen
              label="TeamCard / unpaid, payable, member"
              note="A non-captain sees the fee but cannot pay it."
            >
              <TeamCard team={payableTeam} />
            </Specimen>

            <Specimen
              label="TeamCard / unpaid, below minimum"
              note="A solo captain is blocked until the roster reaches the minimum."
            >
              <TeamCard team={soloTeam} isCaptain />
            </Specimen>

            <Specimen
              label="MemberList / captain view"
              note="All three cohorts. The line under each name is the zID for UNSW, the school for high schoolers, and the university for everyone else."
            >
              <MemberList
                members={fullTeam.members}
                isCaptain
                currentProfileId={baseProfile.id}
              />
            </Specimen>

            <Specimen
              label="MemberList / member view, slots remaining"
              note="No promote or remove controls, and the remaining-slots plate is visible."
            >
              <MemberList
                members={payableTeam.members}
                currentProfileId={extraProfiles[0].id}
              />
            </Specimen>

            <Specimen
              label="JoinCodeDisplay"
              note="Hidden until tapped, then tap again to copy."
            >
              <JoinCodeDisplay code={fullTeam.join_code} />
            </Specimen>

            <Specimen
              label="LeaveTeamButton"
              note="Two-step: the first click swaps in a confirmation panel."
            >
              <LeaveTeamButton />
            </Specimen>

            <Specimen
              label="NoTeamState / with a registry"
              note="Team names are listed so entrants can ask a captain for a code. Codes are never listed."
            >
              <NoTeamState teams={browseTeams} />
            </Specimen>

            <Specimen
              label="NoTeamState / no teams yet"
              note="Before anyone has registered, the registry card is dropped."
            >
              <NoTeamState teams={[]} />
            </Specimen>

            <Specimen
              label="ProfileTab / UNSW"
              note="Blank fields collapse, so the spec table is shorter for cohorts that do not fill them in. The Edit button swaps in EditProfileForm, which needs the database."
            >
              <ProfileTab profile={baseProfile} onLogout={() => {}} />
            </Specimen>

            <Specimen
              label="ProfileTab / high school"
              note="No zID, no faculty, no RAMSoc or Arc rows."
            >
              <ProfileTab profile={highSchoolProfile} onLogout={() => {}} />
            </Specimen>

            <Specimen
              label="ProfileTab / other university"
              note="Institution comes from `university`, and the student number from `uni_id`."
            >
              <ProfileTab profile={otherUniProfile} onLogout={() => {}} />
            </Specimen>

            <Specimen
              label="BuildTypewriter"
              note="Hero animation. It respects prefers-reduced-motion and falls back to a static sentence."
            >
              <BuildTypewriter />
            </Specimen>
          </div>
        </GallerySection>

        {/* ------------------------------------------------------- admin -- */}
        <GallerySection
          id="admin"
          index="07"
          title="Admin"
          blurb="The organiser console. Solid surfaces, no ruled grid, mono numerics, and LEGO colour reserved for status and the primary action."
          scrollMarginTop={scrollMarginTop}
        >
          <div className="flex flex-col gap-6">
            <AdminPrimitives />

            <Panel className="p-4 sm:p-5">
              <p className="spec-label mb-1">AdminLoginForm</p>
              <p className="font-main text-ink-dim mb-4 max-w-prose text-sm">
                The one piece of set-dressing in the admin area: a yellow brick
                with studs, since the login screen has no data to compete with.
              </p>
              <div className="mx-auto w-full max-w-sm">
                <div className="lego-studs [--stud-color:var(--color-blueprint-900)]">
                  <div className="brick drafting-frame bg-blueprint-900 p-6">
                    <p className="spec-label">RAMSoc Buildathon 2026</p>
                    <h3 className="mt-1 mb-1 text-2xl">Admin console</h3>
                    <p className="font-main text-ink-dim mb-6 text-sm">
                      Organisers only. Enter the shared admin password.
                    </p>
                    <AdminLoginForm />
                  </div>
                </div>
              </div>
            </Panel>

            <PanelSection
              title="TeamsTable"
              description="Search, a paid filter, summary stats and an expandable detail row per team. Expanding a row fetches the roster from the database, so it will not open here."
            >
              <TeamsTable teams={adminTeams} />
            </PanelSection>

            <PanelSection
              title="IndividualsTable"
              description="Every registered entrant, with their cohort, institution and team. Two of these mock entrants have no team, which is what organisers use this tab to fix."
            >
              <IndividualsTable profiles={adminProfiles} teams={adminTeams} />
            </PanelSection>

            <PanelSection
              title="TasksTable"
              description="Dashboard checklist items, with a live preview of how they appear to participants. One of these mock tasks is hidden."
            >
              <TasksTable tasks={adminTasks} />
            </PanelSection>

            <PanelSection
              title="TimelineEditor"
              description="The public schedule, one card per week. Saving a week writes its fields and any edited sessions together; adding, deleting and reordering write immediately, so none of these controls will work here without a database."
            >
              <TimelineEditor weeks={adminTimeline} />
            </PanelSection>
          </div>
        </GallerySection>
      </div>
    </AdminShell>
  );
}

// ------------------------------------------------------ admin primitives --

/** The AdminUI kit on its own, with working state for the form controls. */
function AdminPrimitives() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [deadline, setDeadline] = useState("2026-03-13T23:59");
  const [lastAction, setLastAction] = useState<string | null>(null);

  return (
    <Panel className="p-4 sm:p-5">
      <p className="spec-label mb-1">AdminUI primitives</p>
      <p className="font-main text-ink-dim mb-4 max-w-prose text-sm">
        Shared presentation pieces behind all three admin tables.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Specimen
          label="StatusPill"
          note="Green for paid, red for unpaid, yellow for captain, azure for information."
        >
          <Row>
            <StatusPill tone="paid">Paid</StatusPill>
            <StatusPill tone="unpaid">Unpaid</StatusPill>
            <StatusPill tone="captain">Captain</StatusPill>
            <StatusPill tone="info">Other uni</StatusPill>
            <StatusPill tone="neutral">No team</StatusPill>
          </Row>
        </Specimen>

        <Specimen
          label="ActionButton"
          note="Compact label, but still a 44px tap target: organisers use these on phones at the venue."
        >
          <Row>
            <ActionButton onClick={() => setLastAction("neutral")}>
              Neutral
            </ActionButton>
            <ActionButton
              tone="primary"
              onClick={() => setLastAction("primary")}
            >
              Primary
            </ActionButton>
            <ActionButton tone="danger" onClick={() => setLastAction("danger")}>
              Danger
            </ActionButton>
            <ActionButton disabled>Disabled</ActionButton>
          </Row>
        </Specimen>

        <Specimen
          label="ConfirmButton"
          note="The first click arms it and swaps the label. It disarms itself after five seconds."
        >
          <Row>
            <ConfirmButton
              label="Delete team"
              confirmLabel="Confirm delete?"
              onConfirm={() => setLastAction("delete confirmed")}
            />
            <ConfirmButton
              label="Mark unpaid"
              confirmLabel="Sure?"
              tone="neutral"
              onConfirm={() => setLastAction("marked unpaid")}
            />
          </Row>
          <p
            aria-live="polite"
            className="font-blueprint text-ink-dim mt-3 text-[0.65rem] uppercase"
          >
            {lastAction ? `Last action: ${lastAction}` : "No action yet"}
          </p>
        </Specimen>

        <Specimen label="Alert">
          <div className="flex flex-col gap-3">
            <Alert tone="error">
              That join code is already taken by another team.
            </Alert>
            <Alert tone="success">Reef Watch is now marked as paid.</Alert>
          </div>
        </Specimen>

        <Specimen
          label="SearchField, FilterSelect, DateField"
          note="Controlled inputs. Each carries a spec-label and a 44px minimum height."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <SearchField
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="Name, join code or member"
            />
            <FilterSelect
              label="Payment"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All teams" },
                { value: "paid", label: "Paid" },
                { value: "unpaid", label: "Unpaid" },
              ]}
            />
            <div className="sm:col-span-2">
              <DateField
                label="Payment deadline"
                hint="Teams that have not paid by this time lose their place."
                value={deadline}
                onChange={setDeadline}
              />
            </div>
          </div>
        </Specimen>

        <Specimen
          label="TableFrame, Th, EmptyRow"
          note="Scrolling is trapped inside the frame, so the page body never moves sideways. The header row stays pinned."
          className="p-4"
        >
          <div className="flex flex-col gap-4">
            <TableFrame>
              <table className="w-full min-w-[30rem] border-separate border-spacing-0 text-left">
                <caption className="sr-only">
                  Example of the admin table frame.
                </caption>
                <thead>
                  <tr>
                    <Th>Team</Th>
                    <Th>Join code</Th>
                    <Th align="right">Members</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {adminTeams.map((team) => (
                    <tr
                      key={team.id}
                      className="hover:bg-white/5 [&>*]:border-b [&>*]:border-white/10"
                    >
                      <th
                        scope="row"
                        className="font-main text-ink px-3 py-2.5 text-left text-sm font-normal"
                      >
                        {team.name}
                      </th>
                      <td className="font-blueprint text-ink-dim px-3 py-2.5 text-xs uppercase">
                        {team.join_code}
                      </td>
                      <td className="font-blueprint text-ink px-3 py-2.5 text-right text-sm tabular-nums">
                        {team.member_count}/{MEMBER_LIMITS.max}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill tone={team.paid ? "paid" : "unpaid"}>
                          {team.paid ? "Paid" : "Unpaid"}
                        </StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableFrame>

            <TableFrame>
              <table className="w-full border-separate border-spacing-0 text-left">
                <caption className="sr-only">An empty admin table.</caption>
                <thead>
                  <tr>
                    <Th>Team</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  <EmptyRow colSpan={2}>No teams match that search.</EmptyRow>
                </tbody>
              </table>
            </TableFrame>
          </div>
        </Specimen>

        <Specimen
          label="Panel and PanelSection"
          note="The solid, grid-free surface everything dense sits on."
          className="p-4"
        >
          <div className="flex flex-col gap-4">
            <Panel className="p-4">
              <p className="font-main text-ink-dim text-sm">
                A bare Panel: solid blueprint-900, hairline border, drop shadow.
              </p>
            </Panel>
            <PanelSection
              title="Panel section"
              description="A Panel with a display heading and an optional description."
            >
              <p className="font-main text-ink-dim text-sm">
                Children go here.
              </p>
            </PanelSection>
          </div>
        </Specimen>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------- section UI --

function GallerySection({
  id,
  index,
  title,
  blurb,
  scrollMarginTop,
  children,
}: {
  id: string;
  index: string;
  title: string;
  blurb: string;
  scrollMarginTop: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ scrollMarginTop }} className="mb-12 min-w-0">
      <div className="mb-5 border-b border-white/15 pb-3">
        <p className="spec-label">Section {index}</p>
        <h2 className="mt-1 text-2xl sm:text-3xl">{title}</h2>
        <p className="font-main text-ink-dim mt-2 max-w-prose text-sm">
          {blurb}
        </p>
      </div>
      {children}
    </section>
  );
}
