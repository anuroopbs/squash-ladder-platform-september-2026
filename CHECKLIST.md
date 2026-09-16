# Squash Ladder Platform — Standing Checklist

> **THIS FILE IS MANDATORY, MODEL-AGNOSTIC PROCESS.** Any AI model working
> on this repo — Claude, GPT, Llama, Nemotron, whatever — reads this file
> automatically (it's referenced from AGENTS.md, which Hermes auto-loads).
> Run through this checklist BEFORE starting work and AFTER finishing work,
> every single session, no exceptions. Update the ✅/❌ status as you go.
> The user updates the "Notes" column manually between sessions — read it.

## How this works

1. **Before starting any change:** scan this checklist. If PWA/mobile items
   are marked ❌ or ⚠️, know that going in.
2. **After finishing any change:** re-run the checks below. Update status.
3. **After EVERY successful build/deploy:** append an entry to
   `docs/DEVELOPMENT.md` (mandatory, see that file's own header).
4. Never mark something ✅ without actually running the check. Evidence,
   not assumption — this is a standing project rule.

---

## 1. Build & Lint (run every session, before AND after changes)

| # | Check | Command | Status | Last Verified |
|---|---|---|---|---|
| 1.1 | Production build compiles | `npm run build` | ✅ | 2026-09-16 |
| 1.2 | Lint is clean | `npx next lint --max-warnings 0` | ✅ | 2026-09-16 |
| 1.3 | Test suite passes | `npm test` | ✅ (14 pass, 2 skip) | 2026-09-16 |

## 2. Progressive Web App (PWA)

| # | Check | How to verify | Status | Last Verified |
|---|---|---|---|---|
| 2.1 | `manifest.json` serves correctly | `curl <url>/manifest.json` → 200, valid JSON | ✅ | 2026-09-16 |
| 2.2 | Icon 192×192 exists & valid | `curl <url>/icons/icon-192.png` → 200, PNG 192x192 | ✅ | 2026-09-16 |
| 2.3 | Icon 512×512 exists & valid | `curl <url>/icons/icon-512.png` → 200, PNG 512x512 | ✅ | 2026-09-16 |
| 2.4 | Service worker serves & registers | `curl <url>/sw.js` → 200, JS content-type | ✅ | 2026-09-16 |
| 2.5 | App name shows correctly on install | Manifest `name`/`short_name` = "Squash Ladder" | ✅ | 2026-09-16 |
| 2.6 | Installable on Android (Chrome) | Manual: visit site on Android Chrome, check for install banner | ⚠️ Needs manual device test | — |
| 2.7 | Installable on iOS (Safari "Add to Home Screen") | Manual: Safari → Share → Add to Home Screen | ⚠️ Needs manual device test | — |
| 2.8 | Standalone mode (no browser chrome) after install | Manual: open installed app, confirm no URL bar | ⚠️ Needs manual device test | — |
| 2.9 | Offline fallback page | Dedicated `offline.html`/route | ❌ Not built — SW falls back to cached `/` only |
| 2.10 | Theme color matches app background | `viewport.themeColor` = `#0b0f0d` matches body bg | ✅ | 2026-09-16 |

## 3. Mobile Interface (every UI change must re-check this)

| # | Check | How to verify | Status | Last Verified |
|---|---|---|---|---|
| 3.1 | Viewport meta prevents unwanted zoom | `maximumScale: 1, userScalable: false` in layout.tsx | ✅ | 2026-09-16 |
| 3.2 | Touch targets ≥44px | Manual/visual check on buttons, inputs | ✅ (per AGENTS.md) | 2026-09-16 |
| 3.3 | Sticky header works on scroll | Manual: scroll on mobile viewport | ✅ (per AGENTS.md) | 2026-09-16 |
| 3.4 | Home page 50/50 layout collapses correctly on mobile | `grid-cols-1` on small screens, `lg:grid-cols-2` on large | ✅ | 2026-09-16 |
| 3.5 | QR codes readable/scannable on mobile screen | Visual check on club page | ⚠️ Needs manual device test | — |
| 3.6 | Forms (login/register/challenge/report score) usable on mobile | Manual: fill out each form on a phone-sized viewport | ⚠️ Needs manual device test | — |
| 3.7 | Bottom install banner doesn't block content | Visual: banner has `pointer-events-none` wrapper, doesn't cover critical UI | ✅ | 2026-09-16 |
| 3.8 | PWAInstaller banner respects safe-area (notch/home indicator) | `viewportFit: cover` set; banner uses safe padding | ⚠️ Not explicitly verified |

## 4. Documentation (this is itself part of the checklist — meta-check)

| # | Check | Status | Last Verified |
|---|---|---|---|
| 4.1 | `AGENTS.md` reflects current build state | ✅ | 2026-09-16 |
| 4.2 | `docs/DEVELOPMENT.md` has an entry for the latest session | ✅ | 2026-09-16 |
| 4.3 | `sql/README.md` reflects latest migration | ✅ | 2026-09-16 |
| 4.4 | This checklist itself was re-run this session | ✅ | 2026-09-16 |

---

## Standing Rule (read this every time)

**Documentation and this checklist update AUTOMATICALLY as part of every
build cycle** — not as an afterthought, not only when asked. The sequence
for every unit of work is:

```
1. Make the change
2. npm run build && npx next lint --max-warnings 0 && npm test
3. If green: update docs/DEVELOPMENT.md with what changed
4. Re-run the relevant rows of THIS checklist, update ✅/❌/⚠️
5. Commit + push (docs in the SAME commit as the code, never separate)
```

This applies regardless of which LLM/model is running the session — this
file and AGENTS.md are the shared source of truth every model reads.

## Manual Device Tests (user-executed, update these yourself)

The ⚠️ rows above need a real phone — I cannot click a physical Android/iOS
device. When you test one, update the row directly in this file (or tell
me the result and I'll update it for you). Suggested test flow:

1. Open `https://squashladder.in` (or latest Vercel URL) on your phone
2. Chrome (Android): look for "Add to Home Screen" prompt or check
   the 3-dot menu → "Install app"
3. Safari (iOS): Share button → "Add to Home Screen"
4. After installing, open the app icon from home screen — confirm no
   browser address bar appears (standalone mode)
5. Try joining a ladder, sending a challenge, reporting a score — all
   from the phone
6. Report back what worked / what didn't, and I'll fix + update this file
