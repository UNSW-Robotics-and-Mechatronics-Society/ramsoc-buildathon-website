-- RAMSoc Buildathon 2026 — initial schema.
--
-- Consolidated from the Sumobots 2026 schema (9 incremental migrations) into a
-- single clean baseline, with the standard/open category split removed:
-- Buildathon runs one division, flat $50 per team, 2-6 members.
--
-- Auth is Clerk. Supabase is used purely as Postgres, reached server-side with
-- the service-role key. RLS is enabled with NO policies on every table, so the
-- anon/publishable key can read nothing even if it leaks. The service-role key
-- bypasses RLS, which is what every "use server" action uses.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --

create table profiles (
  id                     uuid primary key default gen_random_uuid(),
  clerk_user_id          text unique not null,
  email                  text not null,
  full_name              text,
  phone                  text,

  -- Which cohort the entrant belongs to. Drives which fields below apply.
  user_type              text check (user_type in ('unsw', 'other_uni', 'high_school')),

  -- UNSW students
  zid                    text,
  faculty                text,
  degree                 text,
  majors                 text,
  degree_stage           text,
  undergrad_postgrad     text,
  domestic_international text,
  year_of_study          text,
  is_ramsoc_member       boolean not null default false,
  is_arc_member          boolean not null default false,

  -- Non-UNSW university students
  university             text,
  uni_id                 text,

  -- High school students
  high_school            text,

  gender                 text,
  gender_other           text,
  heard_from             text,
  heard_from_other       text,

  -- Free text. Catering runs at the kick-off and presentation nights, so this
  -- has to cover allergies and intolerances, not just a fixed diet list.
  dietary_requirements   text,

  onboarded              boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index profiles_clerk_user_id_idx on profiles (clerk_user_id);

-- ------------------------------------------------------------------- teams --

create table teams (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  join_code        text unique not null,
  paid             boolean not null default false,
  competition_year integer not null default 2026,
  created_by       uuid references profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index teams_join_code_idx on teams (join_code);

-- Team names are unique per year, case-insensitively.
create unique index teams_name_year_idx on teams (lower(name), competition_year);

-- ------------------------------------------------------------ team_members --

create table team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references teams (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  role       text not null check (role in ('captain', 'member')),
  joined_at  timestamptz not null default now(),
  unique (team_id, profile_id)
);

-- One team per person, enforced in the database rather than only in app code.
create unique index team_members_one_team_per_profile_idx on team_members (profile_id);

create index team_members_team_id_idx on team_members (team_id);

-- Exactly one captain per team.
create unique index team_members_one_captain_idx
  on team_members (team_id)
  where role = 'captain';

-- ---------------------------------------------------------------- payments --

create table payments (
  id                uuid primary key default gen_random_uuid(),
  team_id           uuid not null references teams (id) on delete cascade,
  square_payment_id text unique,
  amount_cents      integer not null,
  currency          text not null default 'AUD',
  status            text not null,
  source            text not null check (source in ('checkout', 'webhook')),
  cardholder_name   text,
  billing_postcode  text,
  square_response   jsonb,
  created_at        timestamptz not null default now()
);

create index payments_team_id_idx on payments (team_id);

-- -------------------------------------------------------------- error_logs --

create table error_logs (
  id         uuid primary key default gen_random_uuid(),
  source     text not null,
  message    text not null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index error_logs_source_idx on error_logs (source);
create index error_logs_created_at_idx on error_logs (created_at desc);

-- ------------------------------------------------- admin_tasks / completions --

create table admin_tasks (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  url              text,
  competition_year integer not null default 2026,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table task_completions (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references admin_tasks (id) on delete cascade,
  profile_id   uuid not null references profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (task_id, profile_id)
);

-- -------------------------------------------------------------- app_config --

create table app_config (
  competition_year    integer primary key,
  registration_opens  timestamptz,
  registration_closes timestamptz,
  payment_deadline    timestamptz,
  updated_at          timestamptz not null default now()
);

-- Buildathon 2026 runs Week 1-6 of term. Registration closes end of Week 1;
-- payment is due before the first build session in Week 4.
insert into app_config (competition_year, registration_opens, registration_closes, payment_deadline)
values (
  2026,
  '2026-08-24T00:00:00+10:00',
  '2026-09-20T23:59:59+10:00',
  '2026-10-05T23:59:59+11:00'
);

-- ---------------------------------------------------------------- timeline --
-- The public schedule, editable from /2026/admin/timeline. Rooms and times are
-- still being confirmed with the venue, so organisers need to change these
-- without a redeploy.

create table timeline_weeks (
  id               uuid primary key default gen_random_uuid(),
  competition_year integer not null default 2026,
  week             integer not null,
  -- Display string rather than a date range: entries read "22 - 23 Sep" and
  -- some weeks are a single day.
  dates            text not null,
  title            text not null,
  summary          text,
  accent           text not null default 'azure'
                     check (accent in ('azure', 'yellow', 'orange', 'green', 'red')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (competition_year, week)
);

create table timeline_sessions (
  id       uuid primary key default gen_random_uuid(),
  week_id  uuid not null references timeline_weeks (id) on delete cascade,
  position integer not null default 0,
  day      text not null,
  location text not null,
  "time"   text not null
);

create index timeline_sessions_week_id_idx on timeline_sessions (week_id, position);

-- Seed with the published 2026 schedule.
with seeded as (
  insert into timeline_weeks (week, dates, title, summary, accent)
  values
    (1, '15 Sep', 'Introduction',
     'Kick-off night. Meet the organisers, get the brief, and pick up your kit.', 'azure'),
    (2, '22 - 23 Sep', 'CAD',
     'Designing parts for 3D printing and laser cutting, from sketch to printable file.', 'yellow'),
    (3, '29 - 30 Sep', 'ESP32 + PCB',
     'Microcontroller programming and an intro to laying out your own circuit board.', 'orange'),
    (4, '6 - 7 Oct', 'Build Session',
     'Open makerspace time with mentors on hand.', 'green'),
    (5, '13 - 14 Oct', 'Build Session',
     'Last full week of build time before presentations.', 'green'),
    (6, '23 Oct', 'Closing Presentations',
     'Show the judges what you built. Prizes announced on the night.', 'red')
  returning id, week
)
insert into timeline_sessions (week_id, position, day, location, "time")
select seeded.id, s.position, s.day, s.location, s.time
from seeded
join (
  values
    (1, 0, 'Tuesday',   'MCIC',             '6:00 - 8:00pm'),
    (2, 0, 'Tuesday',   'TBC',              'TBC'),
    (2, 1, 'Wednesday', 'TBC',              'TBC'),
    (3, 0, 'Tuesday',   'MCIC',             '6:00 - 8:00pm'),
    (3, 1, 'Wednesday', 'MCIC',             '6:00 - 8:00pm'),
    (3, 2, 'Friday',    'TBC',              'TBC'),
    (4, 0, 'Tuesday',   'MCIC Makerspace',  '6:00 - 8:00pm'),
    (4, 1, 'Wednesday', 'MCIC Makerspace',  '6:00 - 8:00pm'),
    (5, 0, 'Tuesday',   'MCIC Makerspace',  '6:00 - 8:00pm'),
    (5, 1, 'Wednesday', 'MCIC Makerspace',  '6:00 - 8:00pm'),
    (6, 0, 'Friday',    'TBC',              '5:00 - 8:30pm')
) as s(week, position, day, location, time) on s.week = seeded.week;

-- --------------------------------------------------------------- updated_at --

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger teams_set_updated_at
  before update on teams
  for each row execute function set_updated_at();

create trigger admin_tasks_set_updated_at
  before update on admin_tasks
  for each row execute function set_updated_at();

create trigger app_config_set_updated_at
  before update on app_config
  for each row execute function set_updated_at();

-- --------------------------------------------------------------------- RLS --

alter table profiles         enable row level security;
alter table teams            enable row level security;
alter table team_members     enable row level security;
alter table payments         enable row level security;
alter table error_logs       enable row level security;
alter table admin_tasks      enable row level security;
alter table timeline_weeks    enable row level security;
alter table timeline_sessions enable row level security;
alter table task_completions enable row level security;
alter table app_config       enable row level security;
