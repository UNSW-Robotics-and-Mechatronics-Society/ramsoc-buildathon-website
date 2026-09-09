-- ─────────────────────────────────────────────────────────── key dates ──
-- The hero countdown runs three milestones as a chain: registration closes,
-- then the competition begins, then projects are due. Only the first of those
-- existed in app_config; the other two were free text in timeline_weeks.dates,
-- which cannot be counted down to.

alter table app_config
  add column competition_starts timestamptz,
  add column project_deadline   timestamptz;

-- Registration closed on 20 Sep in 001, five days AFTER the Week 1 kick-off on
-- the 15th, so the chain could never run in order. It now closes the night
-- before kick-off. Projects are due the morning of the closing presentations.
update app_config
set registration_closes = '2026-09-14T23:59:59+10:00',
    competition_starts  = '2026-09-15T18:00:00+10:00',
    project_deadline    = '2026-10-23T10:00:00+11:00'
where competition_year = 2026;
