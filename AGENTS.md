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

- **Repo root:** `C:\Users\anuro\CascadeProjects\2026-Sep-Squash-Ladder`
- **Branch:** `feature/ladder-system-overhaul` (main is untouched, safe rollback)
- **GitHub:** `github.com/anuroopbs/squash-ladder-platform-september-2026`
- **Production:** Vercel project `anuroopquestion7-gmailcoms-projects/squash-ladder-platform`
  (deploy with `vercel deploy --prod --force`; current live URL rotates each
  deploy — check `vercel ls` for the latest one)
- **Supabase project ref:** `wektzyvprwhzdqizbgih`

## ✅ What's actually built (don't rebuild these)

- **Home page** (`app/page.tsx`) — city explorer, search, "All Ladders" grid
  with search + Join button per ladder, How It Works, Vision section
- **City page** (`app/[citySlug]/page.tsx`) — club cards for that city
- **Club Hub** (`app/[citySlug]/[clubSlug]/page.tsx`) — real ladder table,
  challenges, score reporting, match history, QR code share section,
  `loading.tsx` + `error.tsx` boundaries
- **Auth** — `/login` and `/register`, each with **Email+Password** AND
  **Phone OTP** tabs (`components/auth/LoginForm.tsx`, `RegisterForm.tsx`).
  Phone auth needs Supabase Dashboard → Authentication → Providers → Phone
  → **enabled** by the user before OTP actually works end-to-end.
- **Profile page** (`app/profile/page.tsx`) — basic player dashboard
- **Ladder system** — join, challenge (1-3 ranks above only), report score,
  atomic rank swap. Server functions: `swap_player_ranks`,
  `report_match_and_swap`, `join_ladder`, `expire_old_challenges`,
  `validate_challenge_rank_gap` trigger — all in
  `sql/migration_ladder_overhaul.sql` (already applied to prod DB)
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

- **Empty ladders**: several clubs have 0 players (Delhi Gymkhana was
  intentionally cleared of fake data — real users need to join it)
- **Email/phone visibility**: `profiles.phone` column exists but is NULL
  for all pre-existing users (only new signups populate it via the
  `handle_new_user` trigger). Emails live in `auth.users`, not `profiles`
  — need service_role key or Dashboard SQL Editor to read them, `anon` key
  can't join across schemas.
- **No automated tests** — ✅ RESOLVED (see `lib/*.test.ts`, run `npm test`)
- **Some `as any` / `as unknown as` casts** remain in older query files —
  flagged but not all cleaned up
- **Admin panel** — none; all data ops go through SQL Editor manually
- **Notifications** — no email/push/SMS when challenged, score reported, etc.

## 🗄️ Database facts worth knowing before writing SQL

- **`profiles.id` is a hard FK to `auth.users.id`** — you cannot
  `INSERT INTO profiles` with a fresh `gen_random_uuid()`; the row will be
  rejected (`profiles_id_fkey` violation) unless that UUID already exists
  as a real authenticated user. To seed a "fake"/test player, either use a
  real registered account, or leave the ladder empty for a real user to
  join first.
- RLS is on for every table. `anon` key = public read + own-row writes
  only. Cleanup/bulk changes that touch other users' rows need the
  Supabase **SQL Editor** (runs as postgres, bypasses RLS) — the user runs
  these manually, they are pasted **inline in chat**, never as a file
  attachment (user can't open `.sql` files from Vercel/GitHub previews).
- `sql/` folder is a running log of every migration ever applied — treat
  it as history, not a single source of truth. Files are numbered
  `001`–`013`+ in the order they were actually applied to production;
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
4. If asked to change ladder/player data, write the SQL, show it inline,
   and let the user run it in Supabase SQL Editor — don't attempt writes
   via the `anon` client for anything touching other users' rows.
5. Update **this file** when you ship something non-trivial, so the next
   session (any surface) starts oriented instead of guessing.
