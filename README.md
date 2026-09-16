# Squash / Racket Sports Ladder Platform

A global, multi-tenant ladder platform: **City → Club → Ladder → Players/Matches**.
Built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

> **For the full current build status, architecture, and standing product
> decisions, see [`AGENTS.md`](./AGENTS.md).** This README is a quick intro;
> AGENTS.md is the living source of truth kept in sync every session.

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

See [`AGENTS.md`](./AGENTS.md) for the current, maintained list of what's
built, known gaps, and where to pick up next.

