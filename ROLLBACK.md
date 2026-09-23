# Rollback Guide — Squash Ladder Platform

Quick reference for reverting to a known-good milestone if a later change
breaks something in production.

## Current milestones

| Tag | Commit | Deployed URL | Date |
|---|---|---|---|
| `milestone-2-2026-09-23` | `fc9c3c8` | `squash-ladder-platform-ald5t515s.vercel.app` (aliased to squashladder.in) | 2026-09-23 |
| `milestone-3-2026-09-23` | `fc9c3c8` (same commit as milestone-2) | same as above | 2026-09-23 |

Both tags point at the same commit — `fc9c3c8` was the last commit before
starting the navigation/layout/coaching-bar work, so it serves as the
rollback point for both.

Deployment ID: `dpl_CGrTc29FeFNgr51rxS44fXjGuH1X`

> Note: deploys here are done via `vercel deploy --prod --force` (CLI
> upload of the local working tree), not Vercel's git integration, so
> Vercel's own deployment metadata does not store a commit SHA. The
> commit ↔ deployment match above is guaranteed by process: the deploy
> was run immediately after committing with a clean `git status` (no
> uncommitted changes), so the uploaded bundle is an exact snapshot of
> that commit.

## Roll back via git

```bash
# See what changed since the milestone, without touching anything yet
git log milestone-3-2026-09-23..HEAD --oneline

# Option A — throw away everything after the milestone (destructive,
# only do this if nothing after the milestone is worth keeping)
git checkout feature/ladder-system-overhaul
git reset --hard milestone-3-2026-09-23

# Option B — revert forward (non-destructive, keeps history, safer)
git revert --no-commit milestone-3-2026-09-23..HEAD
git commit -m "revert: roll back to milestone-3-2026-09-23"
```

After either option, redeploy (see below) to actually take the bad code
off production — resetting/reverting git alone does not touch the live
site until you deploy again.

## Roll back via Vercel (fastest — no git changes needed)

Vercel keeps every previous deployment live at its own unique URL and lets
you instantly re-point the production alias to any older one without a
rebuild:

```bash
# List recent deployments to find the one to restore
vercel ls

# Re-promote the milestone's deployment to production instantly
vercel promote squash-ladder-platform-ald5t515s.vercel.app
```

This is the fastest path to "make the site work again right now" — it
swaps the `squashladder.in` alias back to the known-good build in
seconds, with no build step. Follow up with a proper git-level rollback
(above) once things are stable again so the repo and the live site agree.

## Verifying a rollback worked

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://squashladder.in/
vercel ls | head -5   # confirm squashladder.in points at the restored deployment
```
