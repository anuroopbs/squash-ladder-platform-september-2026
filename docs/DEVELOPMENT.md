# Squash Ladder Platform — Development Log

> **This file is the detailed, running record of everything being built,
> fixed, and decided on this project.** Update it at the end of EVERY
> session, automatically, without being asked — this is a standing rule,
> not a suggestion. The user works across many different LLMs/models and
> needs every session to have full context without re-explaining anything.
> Update it at the end of every meaningful session so any future session
> (desktop, Telegram, terminal, or a new AI agent) can pick up exactly
> where things left off.

---

## 🗓️ 2026-09-17 → 2026-09-23 — Sessions 4–8 (consolidated catch-up entry)

> This log had no entries after 2026-09-16 even though a lot shipped. This
> entry was rebuilt on 2026-09-23 from `git log`, the code and the session
> history. The individual commit messages have the full detail.

### Shipped (in order)
| Date | Commit | What |
|---|---|---|
| 09-17 | `2d22ba7` | Critical fix: rank swap silently failed for non-admins (sql/022 SECURITY DEFINER) |
| 09-17 | `dad6997`, `b024fab` | pg_cron daily challenge expiry (sql/021), phone on standings (sql/020) |
| 09-18–20 | `edd6205`, `a338c4d`, `d38325e` | Challenge UX overhaul, Hyderabad pinned first, "Request a ladder" reverted to Instagram DM |
| 09-21 | `3c60337` | Email notifications via Resend: challenge received + daily 48h expiry reminder |
| 09-21 | `b0fc32f`, `52277f5` | Home page queries run in parallel; support/coaching promo moved higher |
| 09-22 | `8f3784b` | Admin panel: remove/move players on any ladder (sql/025) |
| 09-23 | `2c8f18b` | Opponent must confirm a result before ranks swap, auto-confirm after 48h, self-service Create a Ladder (sql/026, 027) |
| 09-23 | `c106586` | Deterministic date format (fixes hydration errors #425/#422) |
| 09-23 | `106c3ab` | Score dispute → admin queue (sql/028) |
| 09-23 | `fc9c3c8` | SEO meta titles + SportsOrganization schema. **Tagged `milestone-2/3-2026-09-23`** |
| 09-23 | `4695f54`…`2e64ddb` | Back buttons, bigger breadcrumbs, chunk-error auto-reload, "9 Sep 2026" dates, trophy icons, signup cleanup, simpler homepage, richer rankings, coaching bar, empty ladders shown again |

### Infrastructure set up in this period
- **Twilio + Supabase Phone OTP**: live, a real SMS test passed on 2026-09-22.
- **Resend**: API key in Vercel. DNS records for `squashladder.in` added in
  Vercel DNS (Vercel is the DNS host, GoDaddy is only the registrar). The domain
  still shows **Pending** in Resend as of 2026-09-23.
- **Vercel env vars**: `RESEND_API_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`.
- **Hermes cron** `squash-ladder-expiry-reminder` runs at 09:00 IST daily and
  POSTs to `/api/notify/expiry-reminder`. Returned `{"sent":0}` on its test run.

### 2026-09-23 (later): notification fix + security hardening
- Challenge/score emails were never sent: the client only called the notify
  route when `opponent.email` was set, and it never was. Applying sql/023 would
  have fixed that but published every player's email through a public view.
  It was applied, spotted, and rolled back within minutes (the view is back to
  the 020 version, verified via API, club pages 200).
- Real fix: the browser sends only `{ opponentId }`. `/api/notify/challenge` and
  `/api/notify/score-reported` now require a signed‑in user and a matching
  challenge/match from the last 10 minutes, then read the email, names and score
  on the server with the service‑role key. This also closes an open relay: the
  old routes emailed any address in the request body, with no login needed.
- All user text in the emails is HTML‑escaped (`lib/notify.ts`, with tests).
- Expiry reminder: `reminder_sent_at` is now set only after a successful send.
- Resend domain still **Pending**. On the domain page, DKIM showed Verified but
  the `send` MX + SPF records showed Pending. Root cause found in Vercel DNS:
  there were two MX records on `send`, the correct
  `feedback-smtp.ap-northeast-1.amazonses.com` and a typo'd
  `feedbacksmtp.ap-northeast-1.amazonses.com` (from the 2026-09-21 setup).
  The typo record (`rec_5941975894fc6f91cf21c2b0`) was removed with
  `vercel dns rm`. Public DNS now returns only the correct MX. After that,
  Resend restarted verification. Emails will not deliver until the status
  turns Verified, usually within a few hours.
- Still open: `profiles.email`/`phone` readable by anon key (see AGENTS.md).

### 2026-09-23 (later): player email/phone made private (sql/029)
- Before: anyone with the public anon key (it ships in the website) could
  run `GET /rest/v1/profiles?select=email,phone` and get 28 emails and 6 phones.
- Now: column-level grants. Names still public; email/phone only through
  `get_my_profile()` (own row) and `get_ladder_contacts()` (ladder members get
  phones, admins get phones + emails). App code updated: `getCurrentPlayer`,
  club page, admin panel, home query (`profiles(*)` → named columns).
- Rolled out in order: functions → deploy app → revoke. No downtime: all public
  pages returned 200 before and after, and the club page renders its ladder.
- Not yet verified: signed-in views (needs a real login on a phone).

### AI audit log
- `scripts/export-audit-log.py [session_id] [YYYY-MM-DD]` exports every AI tool
  call from the local Hermes session database into `docs/audit/AUDIT-LOG-<date>.md`
  (time, tool, what it did; secrets masked). 2026-09-23: 991 actions.

### Found during the 2026-09-23 documentation audit
- **sql/023 was never applied.** `ladder_standings.email` does not exist in the
  live DB, so challenge and score-reported emails are never sent (the client
  only calls the notify route when `opponent.email` is set).
- AGENTS.md, CHECKLIST.md, README.md and sql/README.md were all out of date
  (they said "no admin panel" and "no notifications", and the migration table
  stopped at 022). All four were corrected.
- Build ✅, lint ✅, tests 23 pass / 2 skip ✅, PWA assets on prod all 200 ✅.

---

## 🗓️ 2026-09-16 — Session 3: PWA Audit + Standing Checklist System

### What Happened This Session

1. **Full PWA audit performed** (not assumed — actually verified against
   production):
   - `manifest.json`, both icons (192×192, 512×512), and `sw.js` all
     confirmed serving correctly (200, correct MIME types, correct PNG
     dimensions) on `https://squash-ladder-platform-r8wxu66l0.vercel.app`
   - Viewport/theme-color/Apple Web App config all correct
   - Install banner (`PWAInstaller.tsx`) correctly captures
     `beforeinstallprompt`, is dismissible, respects standalone-mode check
   - **Gap found:** no dedicated offline fallback page — service worker
     only falls back to cached `/` on network failure
   - **Verdict: PWA is genuinely working** for install-to-home-screen on
     both Android and iOS, standalone mode correctly configured
2. **`CHECKLIST.md` created** at repo root — the standing, model-agnostic
   process file the user asked for. Covers:
   - Section 1: Build/lint/test (must be green every session)
   - Section 2: PWA health (10 checks, 7 auto-verifiable, 3 need a real
     phone — marked ⚠️ pending manual device test)
   - Section 3: Mobile interface (8 checks, same split)
   - Section 4: Documentation meta-check
   - A standing rule baked into the file: every unit of work follows
     make-change → build/lint/test → update DEVELOPMENT.md → update this
     checklist → commit (docs in the same commit as code, never separate)
3. **AGENTS.md updated** to reference `CHECKLIST.md` as mandatory reading
   for any model working on this repo.
4. **Standing rule saved to memory:** CHECKLIST.md + DEVELOPMENT.md +
   AGENTS.md updates are now an automatic part of every session's process,
   not something the user needs to request each time.

### Build & Test Status (End of Session)
| Check | Result |
|---|---|
| `npm run build` | ✅ |
| `npx next lint --max-warnings 0` | ✅ |
| `npm test` | ✅ 14 passed, 2 skipped |
| PWA manifest/icons/SW on production | ✅ All verified live |

### What Still Needs a Human With a Phone
- Install banner actually appearing on Android Chrome
- "Add to Home Screen" flow on iOS Safari
- Standalone mode confirmed after install (no browser chrome)
- QR code readability on a real mobile screen
- Full form flows (login/register/challenge/report score) on a real phone
- These are logged in `CHECKLIST.md` section 2 and 3 — update them
  directly (or tell me the result) once tested.

---

## 🗓️ 2026-09-16 — Session 2: Architecture Audit, Race Condition Fixes, Domain Setup, Support Contact

### What Happened This Session

1. **Domain purchased & connected:** `squashladder.in` bought on GoDaddy,
   added to Vercel project, nameserver instructions documented in
   `docs/domain-setup-instructions.md` (zero-context, AI-agent-executable).
2. **Full architecture audit performed** — rated 5.5/10. Found:
   - Race condition in `joinLadder()` (2 call sites: `lib/queries/challenges.ts`
     and `components/ladder/JoinLadderButton.tsx`)
   - Fragile `rank = -1` scratch-value hack in `swap_player_ranks()`
   - **A third, previously-missed race condition** in `ReportScoreModal.tsx`
     — it was manually inserting matches + swapping ranks client-side
     instead of using the existing `report_match_and_swap()` RPC
   - N+1 query pattern in `getChallengesByLadder`, `getChallengesByPlayer`,
     `getMatchesByLadder` (1 + 2N/3N queries instead of 1 embedded select)
   - No error-mapping layer — raw Postgres errors reaching the UI
   - SQL migration files had no ordering/versioning scheme
3. **All 5 architecture fixes applied and pushed:**
   - Fix 1-2: `joinLadder()` now calls atomic `join_ladder()` RPC;
     `unique(ladder_id, rank)` made deferrable; `swap_player_ranks()`
     swaps directly instead of via `-1` — `sql/013_fix_race_conditions.sql`
   - Fix 3: N+1 queries replaced with embedded selects in `challenges.ts`
   - Fix 4: `lib/errors.ts` — `toUserMessage()` maps known Postgres/RLS
     error patterns to user-facing strings; wired into ChallengeModal,
     ReportScoreModal, JoinLadderButton. Also fixed the 3rd race condition
     found above (ReportScoreModal → `report_match_and_swap()` RPC).
   - Fix 5: All 13 SQL files renamed with `001`–`013` numeric prefixes in
     verified git-commit chronological order; `sql/README.md` created
     documenting what each does and which are `_SUPERSEDED`.
   - Fix 6: Vitest test suite added — `lib/slugify.test.ts` (6 tests),
     `lib/errors.test.ts` (8 tests, covers the error-mapping layer from
     Fix 4), `lib/queries/ladder-concurrency.test.ts` (2 concurrency tests
     for the race conditions fixed in Fix 1-2 — gated to skip unless
     `TEST_SUPABASE_URL`/`TEST_SUPABASE_SERVICE_ROLE_KEY` env vars point
     at a dedicated test database, never runs against production).
     `npm test` runs the full suite; `npm run test:concurrency` runs just
     the DB-backed ones. 14 tests passing, 2 correctly skipped without
     test DB credentials.
4. **Support contact integrated:** `components/ui/SupportContact.tsx` —
   links to Instagram `@dublinsquashmentor` for "trouble creating a ladder /
   joining / anything broken." Added to: home page footer, club page
   footer (existing ladders), club page empty-state (no ladder yet).
5. **Hermes provider-switch bug** — confirmed same root cause as earlier
   session (poisoned conversation history on model switch), no config fix
   available; workaround is one provider per session, documented in
   `docs/BUG-REPORT-provider-switch-sanitization.md`.

### Build & Lint Status (End of Session)
| Check | Result |
|---|---|
| `npm run build` | ✅ All 8 routes compile |
| `npx next lint --max-warnings 0` | ✅ Clean |
| Architecture rating | 5.5/10 → fixes applied for #1-5, #6 pending |

### Files Changed This Session
- `lib/queries/challenges.ts` — race condition fix + N+1 fix
- `components/ladder/JoinLadderButton.tsx` — race condition fix + error mapping
- `components/ladder/ChallengeModal.tsx` — error mapping
- `components/ladder/ReportScoreModal.tsx` — 3rd race condition fix + error mapping
- `lib/errors.ts` — NEW, error-mapping layer
- `sql/013_fix_race_conditions.sql` — NEW, DB-side race condition fix
- `sql/README.md` — NEW, migration history table
- `sql/001`–`012_*.sql` — renamed with numeric prefixes (see README for mapping)
- `components/ui/SupportContact.tsx` — NEW
- `app/page.tsx`, `app/[citySlug]/[clubSlug]/page.tsx` — SupportContact wired in
- `docs/domain-setup-instructions.md` — NEW, GoDaddy → Vercel setup guide
- `AGENTS.md` — updated migration numbering reference

### Next Steps (Carried Forward)
1. Run `sql/011`, `sql/012`, `sql/013` in Supabase if not already done this session — ✅ confirmed done by user mid-session
2. Set up test infrastructure (Jest/Vitest) — Fix #6, biggest remaining architectural gap
3. Address remaining `as any` casts (some intentionally kept in this session's own new code for Supabase embedded-select typing — see `challenges.ts`)
4. Build admin panel for data ops
5. Add notification system for challenges/score reports
6. Point `squashladder.in` DNS at Vercel (user executing via GoDaddy nameserver change)

---

## 🗓️ 2026-09-16 — Session 1: Lint, Build, Docs & Telegram Pairing

### Environment
- **Model:** Laguna S 2.1 (poolside/nous) → switched to LongCat 2.0 (meituan/nous) mid-session
- **Branch:** `feature/ladder-system-overhaul`
- **Node:** Next.js 14.2.15, Tailwind CSS, Supabase

### Build & Lint Status
| Check | Result |
|---|---|
| `npm run build` | ✅ All 8 routes compile, types valid |
| `npm run lint` | ✅ Clean (after fix below) |
| Dev server | ✅ Running on port 3001 (3000 was in use) |
| `/` (Home) | ✅ 200 |
| `/login` | ✅ 200 |
| `/register` | ✅ 200 |
| `/profile` | ✅ 307 (redirect — expected, unauthenticated) |
| `/hyderabad` | ✅ 200 |

### Fixes Applied This Session

#### 1. ESLint config was missing
- **Problem:** `next lint` prompted interactively for config (Strict/Base/Cancel) — blocked CI/automation
- **Fix:** Created `.eslintrc.json` with `{ "extends": ["next/core-web-vitals"] }`
- **File:** `.eslintrc.json`

#### 2. QRCodeCard `<img>` lint warning
- **Problem:** `@next/next/no-img-element` warning on line 32 — external QR image from `api.qrserver.com` can't use `next/image`
- **Fix:** Added `{/* eslint-disable-next-line @next/next/no-img-element */}` comment (correct call — it's an external dynamic URL, not a local asset)
- **File:** `components/ladder/QRCodeCard.tsx`

### Documentation Created
- **`AGENTS.md`** — living project briefing, auto-loaded by Hermes for any session in this repo. Build status, DB landmines, standing decisions, orientation checklist.
- **`docs/DEVELOPMENT.md`** — this file. Running log of all work.

### Infrastructure / Ops
- **Telegram bot `@Squashladderbot`** — pairing was stuck because requests sat unapproved in `hermes pairing` queue. Fixed: `hermes pairing approve telegram 1b4c73a9099824cd`. Confirmed working via gateway logs (3 messages sent, 3 responses delivered).
- **Cleared stale pairing request** (`aa2a889da1c1fd72`) — queue now clean.
- **Gateway running** (PID 21144), auto-starts on Windows login.

### Model Routing (Standing Decision)
| Tier | Model | Use |
|---|---|---|
| Default | Hy3 (Tencent Hunyuan) | Routine edits, file reads/writes, tool-calling |
| Escalate | Nemotron 3 Ultra | ELO math, RLS, ranking algorithms, gnarly bugs |
| Fallback | Laguna S 2.1 | Coding-specialist, fast, 262K ctx |
| Fast lane | Nemotron 3.5 Lightning | Low-stakes edits |
| **Never use** | Ling Sante, Ling Fin, Solar Pro4, Step 3.7 Flash, Laguna Xs 2.1, Muse Spark 1.2 | Wrong domain / trivial / data-sharing |

### Known Issues / Debt (from AGENTS.md)
- Empty ladders (Delhi Gymkhana intentionally cleared)
- `profiles.phone` NULL for pre-existing users
- Zero test coverage
- Some `as any` / `as unknown as` casts remain in older query files
- No admin panel
- No notifications (email/push/SMS)

### Next Steps
1. Commit + push the lint config + QR fix
2. Address remaining `as any` casts in query files
3. Set up test infrastructure (biggest architectural gap)
4. Build admin panel for data ops
5. Add notification system for challenges/score reports

---

## 🗓️ 2026-09-15 (prior session reference)

- Home page city explorer + search
- City → Club → Ladder drill-down
- Club Hub with real ladder table, challenges, score reporting
- OTP login (email + phone tabs)
- QR codes per ladder
- PWA setup (installable on Android + iOS)
- Mobile-first UI (44px+ touch targets)
- Ladder system: join, challenge (1-3 ranks), report score, atomic rank swap
- DB migrations in `sql/` folder

