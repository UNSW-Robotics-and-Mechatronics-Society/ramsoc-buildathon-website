-- ─────────────────────────────────────────────────────────── key dates ──
-- The hero countdown runs three milestones as a chain: registration closes,
-- then the competition begins, then projects are due. Only the first of those
-- existed in app_config; the other two were free text in timeline_weeks.dates,
-- which cannot be counted down to.
--
-- 001 is a consolidated baseline and now creates these columns itself, so this
-- migration is only for a project built from the older baseline. It is written
-- to be safe to run either way.

alter table app_config
  add column if not exists competition_starts timestamptz,
  add column if not exists project_deadline   timestamptz;

-- Registration closed on 20 Sep in the older baseline, five days AFTER the
-- Week 1 kick-off on the 15th, so the chain could never run in order. It now
-- closes the night before kick-off, and payment closes with registration
-- (at the end of its 24 hour grace period, so a last-minute team can pay).
-- Projects are due the morning of the closing presentations.
update app_config
set registration_closes = '2026-09-14T23:59:59+10:00',
    payment_deadline    = '2026-09-15T23:59:59+10:00',
    competition_starts  = '2026-09-15T18:00:00+10:00',
    project_deadline    = '2026-10-23T10:00:00+11:00'
where competition_year = 2026;
