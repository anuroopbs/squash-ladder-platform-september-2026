# AGENTS.md — Squash Ladder Platform

> **Read this first, every session — desktop, Telegram, terminal, wherever.**
> This file is auto-loaded by Hermes whenever a session's working directory
> is this project. It exists so you never have to guess "what's already
> built" or "where do I start" — update it whenever you ship something,
> and it stays true for the next session (including you, later).

## What this is

A global, multi-tenant squash/racket-sports ladder platform:
**City → Club → Ladder → Players → Challenges → Matches.**
Next.js 14 (App Router) + Tailwind CSS + Supabase (Postgres + Auth).

> **⚠️ MANDATORY: Read `CHECKLIST.md` in this repo root before AND after
> every change.** It covers build/lint/test status, PWA health, and mobile
> interface checks. Re-run its checks and update the status columns every
> session — this applies to every model working on this repo, not just one.

- **Repo root:** `C:\Users\anuro\CascadeProjects\2026-Sep-Squash-Ladder`
- **Branch:** `feature/ladder-system-overhaul` (main is untouched, safe rollback)
- **GitHub:** `github.com/anuroopbs/squash-ladder-platform-september-2026`
- **Production:** Vercel project `anuroopquestion7-gmailcoms-projects/squash-ladder-platform`
  (deploy with `vercel deploy --prod --force`; current live URL rotates each
  deploy — check `vercel ls` for the latest one)
- **Supabase project ref:** `wektzyvprwhzdqizbgih`

## ✅ What's actually built (don't rebuild these)

- **Home page** (`app/page.tsx`) — single flow: search (cities AND clubs,
  `GlobalExplorer` + `ClubSearchResultCard`) → city cards (whole card
  clickable) → How It Works → Vision. The old side-by-side "All Ladders"
  panel was removed 2026-09-23 (`components/home/LadderSidebar.tsx` is now
  unused, kept for reference).
- **Coaching announcement bar** (`components/home/CoachingAnnouncementBar.tsx`)
  — above the header on every page except `/login` and `/register`, links
  to Instagram, dismissible for 30 days (localStorage).
- **City page** (`app/[citySlug]/page.tsx`) — "← All cities" back button,
  club cards (whole card clickable). Clubs with 0 players are shown with a
  "No ladder yet" label; only "Test Club" is hidden (`lib/queries/clubs.ts`).
- **Club Hub** (`app/[citySlug]/[clubSlug]/page.tsx`) — "← Back to [City]"
  button, larger breadcrumbs, ladder table with W/L record, last match and
  "You can challenge" tags, Join card for signed-out visitors, challenges,
  score reporting, match history, QR code (below rankings),
  `loading.tsx` + `error.tsx` boundaries
- **SEO** — per-city/per-club meta titles + SportsOrganization JSON-LD
- **Error page** — chunk-load errors after a deploy trigger a full reload
  with a plain "We've updated the site" message (`lib/isChunkLoadError.ts`)
- **Dates** — one shared formatter `lib/formatDate.ts` ("9 Sep 2026", fixed
  timezone) so server and browser match (fixed React hydration errors
  #425/#422). Use it for every date — never `toLocaleDateString()`.
- **Auth** — `/login` and `/register`, phone OTP is the default tab, email +
  password is the second tab (`components/auth/LoginForm.tsx`,
  `RegisterForm.tsx`). Phone OTP is **live and enabled in Supabase**. After a
  phone signup the user is asked for an email (`components/profile/AddPhoneNumber.tsx`).
- **Profile page** (`app/profile/page.tsx`) — player dashboard
- **Ladder system** — join, challenge (1-3 ranks above only), report score →
  opponent confirms → ranks swap (`report_match`, `confirm_match_and_swap`,
  sql/026). Undisputed results auto-confirm after 48h
  (`auto_confirm_stale_matches`, pg_cron). Challenges expire after 7 days
  (`expire_old_challenges`, pg_cron, sql/021). Rank functions are
  SECURITY DEFINER (sql/022).
- **Score disputes** — either player can flag a result (`dispute_match`);
  it goes to the admin queue (`components/admin/DisputeQueuePanel.tsx`) where
  an admin confirms or voids it (`resolve_disputed_match`, sql/028).
- **Ranks stay gap-free automatically** (sql/030, 2026-09-24) — an
  `AFTER DELETE` trigger on `ladder_players` re-compacts a ladder's ranks to
  `1..N` the instant a player is removed, from any code path. Fixes/prevents
  the "missing #1" bug (P Karthik's ladder was stuck at `2,3,4,5,6` because
  sql/014's one-off re-rank script from 2026-09-16 was never actually run —
  it's now applied too, and the trigger means this class of bug can't recur).
- **Admin panel** (`app/admin/page.tsx`) — only for `profiles.is_admin = true`
  (others are redirected). Remove/move players on any ladder
  (`AdminLadderPanel.tsx`) + dispute queue. sql/025.
- **Self-service ladder creation** — any signed-in user can create a
  city/club/ladder (`CreateLadderModal.tsx`, sql/027).
- **Email notifications** (via Resend, sent from `notifications@squashladder.in`):
  - "You've been challenged" → `app/api/notify/challenge`
  - "Score reported, please confirm" → `app/api/notify/score-reported`
  - "48 hours left to play" reminder → `app/api/notify/expiry-reminder`,
    called daily at 09:00 IST by the Hermes cron job
    `squash-ladder-expiry-reminder` (script `squash-expiry-reminder.sh`,
    protected by `CRON_SECRET`). Duplicate sends prevented by
    `challenges.reminder_sent_at` (sql/024).
  - Vercel production env vars set: `RESEND_API_KEY`, `CRON_SECRET`,
    `SUPABASE_SERVICE_ROLE_KEY`, plus the two public Supabase vars.
  - **How the notify routes are secured (2026-09-23)**: the browser sends only
    `{ opponentId }`. The route checks that the signed‑in caller created a
    matching challenge or match in the last 10 minutes, then looks up the email,
    names and score on the server with the service‑role key (`lib/notify.ts`).
    Before this change the routes would email any address passed to them (an open
    relay), and the caller never had the email because `ladder_standings` has no
    email column. Email must **never** be added to that public view (see sql/023).
  - The expiry reminder now sets `reminder_sent_at` only when an email was
    actually sent. Before, a failed send (e.g. Resend domain not verified) was
    still marked as sent, so the reminder was lost.
  - ⚠️ **Resend domain still Pending**: the Resend dashboard shows
    `squashladder.in` as **Pending** (checked 2026-09-23). The 4 DNS records
    (DKIM `resend._domainkey`, MX + SPF on `send`, DMARC `_dmarc`) were added in
    **Vercel DNS** on 2026-09-21. DNS for this domain is managed by Vercel, not
    GoDaddy (GoDaddy is only the registrar).
    A duplicate typo MX record (`feedbacksmtp…`) was removed on 2026-09-23 and
    verification restarted. Check resend.com/domains for **Verified**.
- **Phone OTP via Twilio**: the Supabase Phone provider is enabled with Twilio.
  An end-to-end test with a real SMS succeeded on 2026-09-22.
- **Rollback points** — git tags `milestone-2-2026-09-23` and
  `milestone-3-2026-09-23` (both on `fc9c3c8`); steps in `ROLLBACK.md`.
- **QR codes** — `components/ladder/QRCodeCard.tsx`, one per ladder on the
  Club Hub page, links straight to that ladder
- **Support contact** — `components/ui/SupportContact.tsx`, links to
  Instagram `@dublinsquashmentor` for help with broken features / can't
  create a ladder / anything not working. Shown on: home page footer,
  club page footer, club page empty-state (no ladder set up yet).
- **PWA** — `public/manifest.json` (name: "Squash Ladder"), `public/sw.js`,
  `components/ui/PWAInstaller.tsx` install banner. Installable on Android
  + iOS via "Add to Home Screen".
- **Mobile-first UI** — `ScrollToTop.tsx`, sticky header, 44px+ touch
  targets on all buttons/inputs

## 🟡 Known gaps / not done yet

- **Empty ladders**: all clubs with 0 players are shown in city listings
  with a "No ladder yet" label, so players can discover them and be the
  first to join. Only "Test Club" is hidden (seed/test data)
- **Email/phone visibility**: `profiles.phone` and `profiles.email` exist.
  Phone is NULL for users who signed up before phone capture; email was
  backfilled from `auth.users` (sql/011).
- **Some `as any` / `as unknown as` casts** remain in older query files —
  flagged but not all cleaned up
- **Notifications are email only** — no SMS/push yet. Players who signed up
  by phone and never added an email get no notification emails.
- **Offline page** — PWA has no dedicated offline fallback (see CHECKLIST 2.9)
- **Branch not merged** — all work lives on `feature/ladder-system-overhaul`;
  `main` is the older version. Production is deployed from this branch via CLI.
- **`sql/README.md` "Needs manual apply" is not a safe status** — it silently
  sat unapplied for 8 days once (sql/014) and caused a real bug. Treat any
  "Needs manual apply"/"⏳" row as urgent, or better, apply it immediately.

## 🗄️ Database facts worth knowing before writing SQL

- **Player email + phone are private (sql/029, 2026-09-23).** `anon` and
  `authenticated` can only `select` the columns `id, display_name, avatar_url,
  is_admin, created_at, updated_at` on `profiles`. **Never use
  `select("*")` or `profiles(*)` on profiles in app code**, because it fails with
  `42501`. Use:
  - `rpc("get_my_profile")` for the signed-in user's own full row (`getCurrentPlayer()`)
  - `rpc("get_ladder_contacts", { ladder_uuid })` for phones, which returns
    rows only to members of that ladder (plus emails, for every ladder, to admins),
    via `getLadderContacts()` in `lib/queries/ladders.ts`
  - the service-role key on the server (notify routes, reminder cron)
  `ladder_standings` has no phone/email columns any more.

- **`profiles.id` is a hard FK to `auth.users.id`** — you cannot
  `INSERT INTO profiles` with a fresh `gen_random_uuid()`; the row will be
  rejected (`profiles_id_fkey` violation) unless that UUID already exists
  as a real authenticated user. To seed a "fake"/test player, either use a
  real registered account, or leave the ladder empty for a real user to
  join first.
- RLS is on for every table. `anon` key = public read + own-row writes
  only. Cleanup/bulk changes that touch other users' rows need the
  Supabase **SQL Editor** (runs as postgres, bypasses RLS). The user has
  authorised the agent to run SQL itself in the SQL Editor through the Hermes
  preview pane and report the results. Do not hand SQL to the user to run.
- `sql/` folder is a running log of every migration ever applied — treat
  it as history, not a single source of truth. Files are numbered
  `001`–`028` in the order they were actually applied to production;
  see `sql/README.md` for the full table and which files are
  `_SUPERSEDED` by a later one. `001_schema.sql` is the original base;
  everything after `002_migration_ladder_overhaul.sql` are incremental
  patches. When adding a new migration, use the next sequential number.

## 🎯 Standing product decisions (don't relitigate)

- New players join a ladder at the bottom; can only challenge 1-3 ranks
  above them; win → ranks swap, lose → no change; 1 active challenge per
  player; 7-day challenge expiry.
- Registration should actively **encourage** (not just allow) a phone
  number — the user wants mobile numbers captured for future
  notifications/OTP even on email signups.
- Every ladder gets a shareable QR code for print-and-display at the
  physical club.

## 🧭 If you're starting a session here with no other context

1. Skim this file (you just did).
2. `git status` / `git log --oneline -10` to see the latest commits — the
   commit messages are detailed and describe exactly what shipped.
3. Check `vercel ls` for the current live deployment before assuming
   something isn't deployed yet.
4. Any SQL change: run it yourself in the Supabase SQL Editor through the
   Hermes preview pane (never take over the user's own Chrome), then add
   the next numbered file to `sql/` and a row to `sql/README.md`.
5. Update **this file**, `docs/DEVELOPMENT.md` and `CHECKLIST.md` when you ship
   something, in the same commit, and push to GitHub.
6. Before recommending "next steps", check this file, the git log and the
   code. Do not suggest things that are already done.
