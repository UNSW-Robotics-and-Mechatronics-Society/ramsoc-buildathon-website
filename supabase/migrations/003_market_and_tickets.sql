-- ─────────────────────────────────────────────── black market + tickets ──
-- Easter eggs around the site mint classed tickets (A > B > C) that are
-- stored against a profile and shown to staff at workshops. The Black Market
-- is an anonymous chat, open to members of paid teams, where those tickets
-- change hands. Aliases and avatars are assigned once, the first time someone
-- walks in, and never shown to other participants alongside a real name.

-- ------------------------------------------------------ market identity --

alter table profiles
  add column if not exists market_alias       text unique,
  add column if not exists market_avatar_seed integer,
  add column if not exists market_joined_at   timestamptz,
  add column if not exists market_last_seen   timestamptz,
  add column if not exists market_muted       boolean not null default false;

-- Organisers can shutter the market from the admin console.
alter table app_config
  add column if not exists market_open boolean not null default true;

-- ---------------------------------------------------------------- tickets --

-- One claim per easter egg per person. Kept separate from tickets so that a
-- ticket received in a trade never blocks its new holder from claiming the
-- same egg themselves.
create table if not exists ticket_claims (
  profile_id uuid not null references profiles (id) on delete cascade,
  source     text not null,
  claimed_at timestamptz not null default now(),
  primary key (profile_id, source)
);

create table if not exists tickets (
  id               uuid primary key default gen_random_uuid(),
  -- Human-readable, printed on the ticket face: e.g. A-7K2M-19.
  serial           text unique not null,
  class            text not null check (class in ('A', 'B', 'C')),
  -- Which easter egg minted it. Survives transfers.
  source           text not null,
  holder_id        uuid not null references profiles (id) on delete cascade,
  minted_by        uuid references profiles (id) on delete set null,
  minted_at        timestamptz not null default now(),
  transfer_count   integer not null default 0,
  competition_year integer not null default 2026
);

create index if not exists tickets_holder_id_idx on tickets (holder_id);

create table if not exists ticket_transfers (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets (id) on delete cascade,
  from_id    uuid references profiles (id) on delete set null,
  to_id      uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ticket_transfers_ticket_id_idx
  on ticket_transfers (ticket_id);

-- --------------------------------------------------------- market chat --

create table if not exists market_messages (
  id         uuid primary key default gen_random_uuid(),
  -- Monotonic cursor for polling. UUIDs do not order, timestamps can tie.
  seq        bigint generated always as identity,
  -- Null for system notices (a ticket changing hands, the market closing).
  profile_id uuid references profiles (id) on delete set null,
  kind       text not null default 'chat'
             check (kind in ('chat', 'offer', 'system')),
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now(),
  -- Soft delete, so a moderated message drops out of every open client on
  -- its next poll rather than lingering until reload.
  deleted_at timestamptz
);

create index if not exists market_messages_seq_idx on market_messages (seq);
create index if not exists market_messages_deleted_at_idx
  on market_messages (deleted_at) where deleted_at is not null;
create index if not exists market_messages_profile_id_idx
  on market_messages (profile_id);

-- --------------------------------------------------------------------- RLS --

alter table ticket_claims    enable row level security;
alter table tickets          enable row level security;
alter table ticket_transfers enable row level security;
alter table market_messages  enable row level security;
