# Squash / Racket Sports Ladder Platform

A global, multi-tenant ladder platform: **City → Club → Ladder → Players/Matches**.
Built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

Live at: https://squash-ladder-platform-september-20.vercel.app

## What's here

- `/` — the Global Explorer: search + a visual card grid of every city on the
  platform, pulling live data from Supabase.
- `/[citySlug]` — a City page listing that city's clubs as cards, with an
  "+ Add a club" link.
- `/[citySlug]/[clubSlug]` — the Club Hub: real ladder standings, a
  join-ladder banner (and leave-ladder option once you're a member),
  and the challenge/report-score UI.
- `/create` — a 3-step wizard (City → Club → Ladder) for adding a new
  city/club/ladder that isn't on the platform yet.
- `/login`, `/register` — simple email/password auth via `@supabase/ssr`,
  with `?next=` redirect support so joining from a specific club page
  brings you back to that same page afterward.

## Features shipped

- **Auth** — email/password sign-up and sign-in.
- **Ladder creation** — anyone signed in can add a city, club, and ladder
  from `/create`.
- **Join / leave a ladder** — join at the next open rank, or leave at any
  time from the Club Hub.
- **Challenges & score reporting** — challenge another player on your
  ladder, accept/decline, report a score, and confirm/dispute it.
- **Automatic rank movement** — confirming a match where the lower-ranked
  player won automatically re-shuffles ranks between the two players, via
  a Postgres trigger (see `sql/schema.sql`).

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project URL
and publishable (anon) key.

## Database

The full schema, RLS policies, and the rank-movement trigger live in
`sql/schema.sql`. Run it against a fresh Supabase project's SQL editor to
set everything up (tables, RLS, grants, and the `ladder_standings` view).

## Next steps

- Review production email-confirmation settings before pointing real users
  at this (currently off, fine for friends/family testing).
- Set up a custom domain once you're happy with where the product is.
- Audit Delhi and Dublin's club listings against real-world sources (the
  same pass already done for Hyderabad and Secunderabad).
