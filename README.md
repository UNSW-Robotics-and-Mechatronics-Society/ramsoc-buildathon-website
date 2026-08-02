# RAMSoc Buildathon 2026

Marketing site and participant portal for UNSW RAMSoc's Buildathon — a six-week
mechatronics hackathon. Teams of 2–6 register, pay a flat $50 entry fee, and
organisers manage the cohort from an admin dashboard.

## Stack

| Concern  | Choice                                                            |
| -------- | ----------------------------------------------------------------- |
| Framework| Next.js 16 (App Router, RSC, Turbopack in dev)                     |
| Auth     | **Clerk** — the only identity provider                             |
| Database | **Supabase Postgres**, reached server-side with the service key    |
| Payments | **Square** Web Payments SDK (card, Apple Pay, Google Pay)          |
| Styling  | Tailwind v4, CSS-first config in `src/app/styles.css`              |

> Supabase is used purely as a Postgres host. It is **not** used for auth, and
> the client never talks to it directly — every read and write goes through a
> `"use server"` action holding the service-role key. RLS is enabled with no
> policies on every table, so a leaked anon key grants nothing.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

The app is served from `/2026`; `/` redirects there.

### Database

Run `supabase/migrations/001_initial_schema.sql` against a fresh Supabase
project — it is a single consolidated baseline, not an incremental migration.
It creates `profiles`, `teams`, `team_members`, `payments`, `error_logs`,
`admin_tasks`, `task_completions` and `app_config`, seeds the 2026 config row,
and enables RLS.

### Square

Set `NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox` while testing. Two things must
line up for the webhook to validate:

1. `SQUARE_WEBHOOK_URL` must match the notification URL registered in the
   Square dashboard **byte for byte** — it is part of the HMAC payload.
2. `SQUARE_WEBHOOK_SIGNATURE_KEY` must be the key for that same endpoint.

Payments are linked back to a team through Square's `referenceId` field, which
carries the team UUID. The human-readable `note` is decorative, so its wording
is safe to change.

**Apple Pay needs one manual step before it will work.** Register the
Buildathon domain in the Square dashboard, download the domain association
file it generates, and save it to
`public/.well-known/apple-developer-merchantid-domain-association`. It is
deliberately not in this repo — Sumobots' copy is bound to a different domain
and would fail verification.

## Layout

```
src/app/
  layout.tsx            ClerkProvider + theme
  styles.css            the entire design system (Tailwind v4, CSS-first)
  path.ts               centralised route constants
  _types/               shared types
  _utils/               supabase client, error logging, cn()
  api/square-webhook/   Square payment.updated handler
  2026/
    page.tsx            marketing homepage
    _components/        marketing sections + ui/ primitives
    _data/              content (timeline, FAQ, resources, sponsors) + config
    _actions/           team, profile, payment, appConfig server actions
    onboarding/         multi-step registration
    dashboard/          member portal + payment
    admin/              organiser dashboard (separate password auth)
```

## Admin

`/2026/admin` is gated by a **shared password** in `ADMIN_PASSWORD`, entirely
separate from Clerk. It sets an httpOnly `admin_session` cookie scoped to
`/2026/admin` for 24 hours. Middleware guards navigation and every server
action re-checks the cookie independently.

## Theme

Blueprint + LEGO: a deep drafting-blue ground ruled with a faint white grid,
white "ink" type, and LEGO brick colours as accents (yellow is the primary
action colour). Everything is defined in `src/app/styles.css` — tokens under
`@theme inline`, plus the `.brick`, `.lego-studs`, `.drafting-frame`,
`.blueprint-grid` and `.spec-label` utilities.

## Notes for next year

Fork this repo rather than the Sumobots one — the portal here has had the
standard/open division split removed, the schema consolidated, and several
Sumobots bugs fixed (see git history).
