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
  page.tsx                        Home: search (cities + clubs) → city cards
  [citySlug]/page.tsx             City page (club cards, back button)
  [citySlug]/[clubSlug]/page.tsx  Club Hub: ladder, challenges, scores, QR
  admin/page.tsx                  Admin dashboard (is_admin only)
  profile/page.tsx                Player dashboard
  login/, register/               Phone OTP (default) + email/password
  api/notify/*                    Resend email routes (challenge, score, reminder)
  error.tsx, global-error.tsx, not-found.tsx

components/
  admin/      AdminLadderPanel, DisputeQueuePanel
  auth/       LoginForm, RegisterForm, AuthCard, SignOutButton
  explorer/   GlobalExplorer, CitySearchBar, CityCard(Grid), ClubSearchResultCard
  home/       CoachingAnnouncementBar, HowItWorks, VisionSection
  ladder/     LadderTable, ChallengeModal, ReportScoreModal, MatchHistory,
              ChallengesList, JoinLadderButton, CreateLadder*, QRCodeCard
  layout/     SiteHeader
  location/   Breadcrumbs, ClubCard(Grid)
  profile/    AddPhoneNumber
  ui/         Button, Input, Badge, BackButton, EmptyState, Skeleton,
              SupportContact, PWAInstaller, ScrollToTop

lib/
  supabase/   browser, server and middleware clients
  queries/    data access (cities, clubs, ladders, challenges, admin, ...)
  formatDate.ts, isChunkLoadError.ts, errors.ts, slugify.ts (+ *.test.ts)

sql/          Numbered migration log 001–028. Read sql/README.md first.
docs/         DEVELOPMENT.md (session log), domain setup notes
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

