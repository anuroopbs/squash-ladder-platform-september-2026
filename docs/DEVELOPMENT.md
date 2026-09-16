# Squash Ladder Platform — Development Log

> **This file is the detailed, running record of everything being built,
> fixed, and decided on this project.** Update it at the end of every
> meaningful session so any future session (desktop, Telegram, terminal,
> or a new AI agent) can pick up exactly where things left off.

---

## 🗓️ 2026-09-16 — Session: Lint, Build, Docs & Telegram Pairing

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
