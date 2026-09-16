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
   - Fix 6 (concurrency tests) — NOT done, biggest remaining gap.
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

