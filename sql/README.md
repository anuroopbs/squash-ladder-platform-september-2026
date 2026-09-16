# SQL Migrations — Order & Status

> **This folder is a running historical log of every SQL script ever run against
> the production Supabase database — not a clean, replayable migration chain.**
> Files are numbered by the order they were actually applied (from git commit
> history), not by a formal migration tool. Read this file before assuming a
> table/column/function does or doesn't exist — check the LATEST script that
> touches it, not the first one you find.

## How to read this list

- **Numbered prefix** = chronological order applied to production (verified
  against `git log` commit timestamps, Sep 9–16, 2026)
- **`_SUPERSEDED` suffix** = a later script in this list re-does the same
  work (often more completely). The file is kept for historical record, but
  don't treat it as the current source of truth for that change.
- If you need to stand up a **fresh** database from scratch, run the
  non-superseded files in order: `001`, `002`, `007`, `009`, `010`, `011`,
  `012`, `013`. (`006` and `008` are folded into `007`; `003`/`004`/`005`
  are folded into `007`/`009`.)

## Full list, in applied order

| # | File | What it does | Status |
|---|---|---|---|
| 001 | `001_schema.sql` | Base schema: cities → clubs → ladders → ladder_players → challenges → matches, RLS policies, `ladder_standings` view | ✅ Foundation |
| 002 | `002_migration_ladder_overhaul.sql` | Challenge rank-gap trigger, 1-active-challenge constraint, score format CHECK, `swap_player_ranks()`, `join_ladder()`, `report_match_and_swap()` functions | ✅ Foundation |
| 003 | `003_cleanup_fakes_SUPERSEDED.sql` | Early attempt to remove fake/test players | ⚠️ Superseded by 007/009 |
| 004 | `004_cleanup_fake_players_SUPERSEDED.sql` | Second attempt at the same cleanup | ⚠️ Superseded by 007/009 |
| 005 | `005_add_phone_column_SUPERSEDED.sql` | Adds `profiles.phone` column | ⚠️ Superseded — same ALTER also in 007 (idempotent, `IF NOT EXISTS`) |
| 006 | `006_run_all_cleanup_SUPERSEDED.sql` | Combined cleanup attempt | ⚠️ Superseded by 007 |
| 007 | `007_complete_cleanup.sql` | Consolidated: phone column, Dublin ladders (original location), remove 17 Degrees North + Prestige Nirvana clubs | ✅ Applied |
| 008 | `008_create_dublin_ladders_SUPERSEDED.sql` | Standalone Dublin ladder creation | ⚠️ Superseded — same INSERT also in 007 |
| 009 | `009_final_cleanup.sql` | Final player cleanup pass (Dublin Mount Pleasant rank fixes, re-ranking) | ✅ Applied |
| 010 | `010_move_dublin_ladders.sql` | Moves Dublin Squash Open + Dublin Women Squash Association from Mount Pleasant to a new dedicated "Dublin Squash" club | ✅ Applied |
| 011 | `011_add_email_to_profiles.sql` | Adds `profiles.email` column, updates `handle_new_user()` trigger, backfills from `auth.users` | ✅ Applied |
| 012 | `012_remove_specific_players.sql` | Removes 7 named test/demo players from all ladders and challenges | ✅ Applied |
| 013 | `013_fix_race_conditions.sql` | Makes `unique(ladder_id, rank)` deferrable, rewrites `swap_player_ranks()` to swap directly instead of via a `-1` scratch value, explicit RPC grants | ✅ Applied |
| 014 | `014_re_rank_all_ladders.sql` | **Re-ranks all ladders globally** — compacts rank sequences so there are no gaps left behind by player deletions. Idempotent, safe to re-run. | ⏳ Needs manual apply |
| 015 | `015_cleanup_stuck_challenges.sql` | **Fixes stuck challenges** — marks pending/accepted challenges as completed if a match was already played between the two players (root cause: ReportScoreModal wasn't passing challenge_uuid, fixed in app code). | ⏳ Needs manual apply |

## Current known state of `profiles` table columns

As of `013`, `public.profiles` has: `id`, `display_name`, `avatar_url`,
`is_admin`, `phone` (added in 007, NULL for pre-existing users), `email`
(added in 011, backfilled from `auth.users`), `created_at`, `updated_at`.

## Adding a new migration

Name it `01N_short_description.sql` with the next sequential number. Add a
row to the table above when you do. If it fully replaces an earlier script's
purpose, mark the earlier one `_SUPERSEDED` and note it here — don't delete
old files, they're the audit trail.
