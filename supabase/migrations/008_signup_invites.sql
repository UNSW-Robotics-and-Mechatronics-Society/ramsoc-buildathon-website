-- Late sign-up invites.
--
-- Registration for 2026 closes on the published date and the public sign-up
-- route is gated on that window (see `getRegistrationStatus`). Organisers still
-- need a controlled way to let a specific late entrant in — someone who just
-- missed the deadline — without reopening sign-ups for everyone.
--
-- An admin issues an invite from `/2026/admin/invites`: a row here with a random
-- token. The token becomes a one-person link that unlocks `/2026/sign-up` while
-- the public window is closed. Every invite is tied to an email, has an expiry,
-- and can be revoked, so the door stays in the organisers' hands and every
-- late entrant is on the record here.
--
-- Auth is Clerk and Supabase is reached only with the service-role key, so RLS
-- is enabled with no policies, matching every other table: the token is never
-- exposed to the anon/publishable key.

create table signup_invites (
  id          uuid primary key default gen_random_uuid(),

  -- Who the invite is for. Informational: it is shown to the admin and recorded
  -- against the invite. Clerk owns the actual account, so this is not a hard
  -- binding on which email completes sign-up, it is the organiser's note of who
  -- the link was sent to.
  email       text not null,

  -- The secret that unlocks the gated sign-up page. Random, URL-safe.
  token       text unique not null,

  -- Optional free-text reason ("missed deadline, joining Ada's team").
  note        text,

  created_at  timestamptz not null default now(),

  -- After this the link no longer works, even if never opened.
  expires_at  timestamptz not null,

  -- Stamped the first time the invitee opens the link. Display-only, so admins
  -- can see which invites have been picked up.
  accepted_at timestamptz,

  -- Set by an admin to kill the link early. A revoked invite never validates.
  revoked_at  timestamptz
);

create index signup_invites_token_idx on signup_invites (token);
create index signup_invites_created_at_idx on signup_invites (created_at desc);

alter table signup_invites enable row level security;
