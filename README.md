# Squash / Racket Sports Ladder Platform

A global, multi-tenant ladder platform: **City → Club → Ladder → Players/Matches**.
Built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

## What's here (v1 — read-only drill-down)

- `/` — the Global Explorer: search + a visual card grid of every city on the
  platform, pulling live data from Supabase.
- `/[citySlug]` — a City page listing that city's clubs as cards.
- `/[citySlug]/[clubSlug]` — a Club Hub stub (ladder rankings/challenges/score
  reporting are the next build step — see `architecture/city-club-ladder-schema-and-ux.md`
  in the Claude Project for the full plan).

This matches "build order" step 1 in the architecture doc: ship the
City → Club drill-down against real data first, before auth and the
creation wizard.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

`.env.local` is already filled in with the live Supabase project's URL and
publishable (anon) key — no setup needed there. If you ever need to point
this at a different Supabase project, copy `.env.example` to `.env.local`
and fill in your own values.

## Project structure

```
app/
  page.tsx                       Global Explorer (city search + cards)
  [citySlug]/page.tsx            City page (club cards)
  [citySlug]/[clubSlug]/page.tsx Club Hub (stub — ladder table comes next)
  not-found.tsx
  layout.tsx, globals.css

components/
  explorer/                      GlobalExplorer, CitySearchBar, CityCardGrid, CityCard
  location/                      Breadcrumbs, ClubCardGrid, ClubCard
  ui/                             Badge, EmptyState

lib/
  supabase/client.ts             Browser Supabase client
  supabase/server.ts             Server Component Supabase client
  queries/cities.ts, clubs.ts    Data-fetching functions (Server Components call these directly)
  types/database.ts              Hand-written types mirroring sql/schema.sql
  slugify.ts

sql/
  schema.sql                     Full Postgres schema (tables, RLS, the
                                  ladder_standings view) — already applied
                                  to the live Supabase project.
```

## Data flow

Server Components (`app/**/page.tsx`) call the functions in `lib/queries/*`
directly against the Supabase **server** client — no client-side loading
spinner on first paint. Anything interactive (the search box) is a small
leaf Client Component (`GlobalExplorer.tsx`) that receives server-fetched
data as props and filters it client-side.

## Next steps

1. Seed more cities/clubs (a few are already in via the SQL editor — see the
   Claude Project's `architecture/infra-notes.md` for the live project
   details).
2. Add auth (`/login`, `/register`) and the `CreateLadderWizard` so the
   "add my city/club" flow in the Explorer actually works.
3. Build the Club Hub for real: `LadderTable`, `ChallengeModal`,
   `ReportScoreModal`, `RecentMatchesFeed` — this replaces the stub in
   `app/[citySlug]/[clubSlug]/page.tsx`.
4. `/profile` — a signed-in player's dashboard across every ladder they're in.

Full architecture reasoning lives in the Claude Project for this app
("Squash WebSITE") under `architecture/city-club-ladder-schema-and-ux.md`.
