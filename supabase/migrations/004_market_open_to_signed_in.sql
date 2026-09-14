-- ──────────────────────────────────────────── market open to anyone signed in ──
-- The Black Market no longer requires a paid team, a team at all, or even
-- finished registration: any signed-in Clerk account can walk in. That means
-- a market identity can no longer live on `profiles`, since a visitor who has
-- signed in but never been through onboarding has no profiles row.
--
-- Identity moves to its own table keyed by the Clerk user id. `profile_id` is
-- an optional, opportunistically-kept-fresh link to `profiles`, used only to
-- decide whether someone can hold tickets (which still requires a real,
-- workshop-verifiable registration) and to show organisers a real name.
--
-- The `market_*` columns 003 added to `profiles` are left in place rather
-- than dropped, dropping columns is a one-way door and nothing reads them
-- after this migration, so they are simply dead weight, not a hazard.

create table if not exists market_identities (
  clerk_user_id text primary key,
  profile_id    uuid references profiles (id) on delete set null,
  alias         text unique not null,
  avatar_seed   integer not null,
  muted         boolean not null default false,
  joined_at     timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

create index if not exists market_identities_profile_id_idx
  on market_identities (profile_id);

-- Messages now key their author by Clerk id. `profile_id` stays as a
-- best-effort cross-reference for the admin console, nullable either way.
alter table market_messages
  add column if not exists author_id text
    references market_identities (clerk_user_id) on delete set null;

create index if not exists market_messages_author_id_idx
  on market_messages (author_id);

alter table market_identities enable row level security;
