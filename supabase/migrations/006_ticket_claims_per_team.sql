-- ─────────────────────────────────────────────── one egg, one team, one ticket ──
-- Easter eggs were once-per-person: every member of a team could find the same
-- egg and mint their own ticket, so a team of six was worth six of everything.
-- They are now once-per-TEAM. `profile_id` stays on the row as the record of
-- who actually found it, which is what the popup shows teammates.
--
-- Tickets themselves are untouched: the finder holds the ticket personally and
-- can still trade it away in the Black Market. This only gates the minting.

alter table ticket_claims
  add column if not exists team_id uuid references teams (id) on delete cascade;

-- Attribute every existing claim to the claimer's current team.
update ticket_claims c
set team_id = m.team_id
from team_members m
where m.profile_id = c.profile_id
  and c.team_id is null;

-- A claim that cannot be attributed to a team has no place under the new key.
-- The ticket it minted lives in `tickets` and is NOT affected, the holder keeps
-- it; only the once-only lock goes.
delete from ticket_claims where team_id is null;

-- Teammates who each claimed the same egg under the old rule would now collide
-- on the primary key. Keep the earliest claim, drop the rest: the first person
-- to find it is the one who found it. profile_id breaks ties on identical
-- timestamps so exactly one row always survives.
delete from ticket_claims c
using ticket_claims other
where c.team_id = other.team_id
  and c.source = other.source
  and (other.claimed_at, other.profile_id) < (c.claimed_at, c.profile_id);

alter table ticket_claims alter column team_id set not null;

alter table ticket_claims drop constraint if exists ticket_claims_pkey;
alter table ticket_claims add primary key (team_id, source);
