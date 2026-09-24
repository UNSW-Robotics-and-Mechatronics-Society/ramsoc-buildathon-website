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

**Apple Pay** is verified by the file at
`public/.well-known/apple-developer-merchantid-domain-association`, which is
served at the domain root and issued by Square for
`buildathon.ramsocunsw.org`. It is committed deliberately: it is a public
verification file, not a secret.

It is bound to that exact domain, so if the site ever moves, re-register the new
domain in the Square dashboard and replace this file with the one it issues.
Do not copy Sumobots' version; it is bound to a different domain and will fail
verification.

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

## Capacity

Entry is capped at **60 paid teams** (`PAID_TEAM_CAP` in
`src/app/2026/_data/teamConfig.ts`). A slot is taken when a captain's card
clears, not when a team is formed, so the count is simply `teams` with
`paid = true` for the competition year.

Three things follow from the cap:

- `processPayment` counts paid teams immediately before charging and refuses
  once the cap is reached. It fails **closed**: if the count cannot be read,
  nothing is charged. The count and the charge are not one transaction, so two
  captains paying for the last slot at the same instant can both succeed — the
  money has already moved by then, so the team stays active and the overshoot
  is written to `error_logs` for an organiser to sort out.
- `createTeam` refuses new teams once the cap is reached, so nobody recruits a
  roster they can never activate. Joining an existing team stays open.
- The remaining count is advertised only once it drops below
  `LOW_SLOTS_THRESHOLD` (10), in the hero, the participant portal and the
  checkout. Above that it renders nothing, and if capacity cannot be read it
  renders nothing rather than guessing.

## Admin

`/2026/admin` is gated by a **shared password** in `ADMIN_PASSWORD`, entirely
separate from Clerk. It sets an httpOnly `admin_session` cookie scoped to
`/2026/admin` for 24 hours. Middleware guards navigation and every server
action re-checks the cookie independently.

### Late sign-up invites

Public sign-up (`/2026/sign-up`) is gated on the registration window: open
while registration is, closed otherwise, and never linked from the public nav.
When registration has closed, organisers can still let a specific late entrant
in from the **Invites** tab: entering an email issues a single-person link
(`/2026/sign-up-invite?token=…`, a row in `signup_invites`) that unlocks the
sign-up page for 72 hours. Invites are tied to an email, expire, are revocable,
and are listed in the admin console, so late entry stays in the organisers'
hands and on the record — there is no unlogged back door. It only unlocks
account creation; joining a team is still done through the normal flow or the
admin dashboard.

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
