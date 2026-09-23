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
| 010 | `010_move_dublin_ladders.sql` | ⚠️ Written but **never actually applied** to production — superseded by 017, which discovered (via live diagnostic) that both ladders were still inside Mount Pleasant all along. | ⚠️ Superseded by 017, not applied |
| 011 | `011_add_email_to_profiles.sql` | Adds `profiles.email` column, updates `handle_new_user()` trigger, backfills from `auth.users` | ✅ Applied |
| 012 | `012_remove_specific_players.sql` | Removes 7 named test/demo players from all ladders and challenges | ✅ Applied |
| 013 | `013_fix_race_conditions.sql` | Makes `unique(ladder_id, rank)` deferrable, rewrites `swap_player_ranks()` to swap directly instead of via a `-1` scratch value, explicit RPC grants | ✅ Applied |
| 014 | `014_re_rank_all_ladders.sql` | **Re-ranks all ladders globally** — compacts rank sequences so there are no gaps left behind by player deletions. Idempotent, safe to re-run. | ⏳ Needs manual apply |
| 015 | `015_cleanup_stuck_challenges.sql` | **Fixes stuck challenges** — marks pending/accepted challenges as completed if a match was already played between the two players (root cause: ReportScoreModal wasn't passing challenge_uuid, fixed in app code). | ⏳ Needs manual apply |
| 016 | `016_diagnostic_dublin_state.sql` | Read-only diagnostic — revealed 010 was never applied (Dublin Squash Open + Dublin Women Squash Association were still inside Mount Pleasant). | ℹ️ Diagnostic only |
| 017 | `017_dublin_ladders_own_clubs.sql` | **Real fix for Dublin structure** — creates "Dublin Squash Open" and "Dublin Women Squash Association" as their own clubs directly under Dublin city, moves the two ladders out of Mount Pleasant into them, renames each ladder to "Ladder Ranking". Confirmed live on squashladder.in/dublin (4 clubs). | ✅ Applied |
| 018 | `018_remove_players_p_karthik.sql` | Removes players from P Karthik Squash Institute — applied, then extended in a follow-up ad-hoc query to remove all 4 test players, leaving only NAWiN. Test matches also cleared. | ✅ Applied (superseded by later ad-hoc cleanup, ladder now has only NAWiN) |
| 019 | `019_ladder_requests_SUPERSEDED.sql` | Was going to add a `ladder_requests` table + form for self-service requests — user decided against it, reverted to the existing Instagram-DM flow instead. Never applied. | ⚠️ Superseded, not applied |
| 020 | `020_expose_phone_on_standings.sql` | Adds `phone` to `ladder_standings` view (member-only display in app code). | ✅ Applied |
| 021 | `021_schedule_challenge_expiry.sql` | Schedules `expire_old_challenges()` via pg_cron, daily 3am UTC — was written in migration 002 but never actually called anywhere until now. | ✅ Applied |
| 022 | `022_fix_rank_swap_security_definer.sql` | **Critical fix** — `swap_player_ranks()`/`report_match_and_swap()` were not `SECURITY DEFINER`, so the internal rank-swap UPDATE silently failed RLS for every non-admin player (only "admins can update ladder players" policy existed). Matches got recorded as confirmed but ranks never actually moved for regular players. Confirmed via live diagnostic (`prosecdef = false` on both functions) before fixing. | ✅ Applied (user ran it and confirmed, 2026-09-17) |
| 023 | `023_expose_email_on_standings_SUPERSEDED.sql` | Would have added `email` to the public `ladder_standings` view. **Rejected on 2026-09-23 for privacy**: that view can be read with the public anon key, so every player's email would be downloadable by anyone. It was applied briefly, then rolled back to the 020 view in the same session (verified: `email does not exist` via API, and 15 ladder rows still load). The notify routes now look up emails on the server instead (`lib/notify.ts`). | ⚠️ Superseded, not in effect |
| 024 | `024_challenge_reminder_tracking.sql` | Adds `challenges.reminder_sent_at` so the daily "48 hours left" email is sent only once per challenge. | ✅ Applied (column readable via API, 2026-09-23) |
| 025 | `025_admin_panel_setup.sql` | Makes Anuroop's account admin (`is_admin = true`) and adds the missing "admins can delete ladder players" RLS policy. | ✅ Applied (admin panel in use) |
| 026 | `026_match_confirmation_flow.sql` | Splits reporting from rank swapping: `report_match()` only records the result, and ranks swap when the opponent confirms (`confirm_match_and_swap()`). Adds `dispute_match()`, plus `auto_confirm_stale_matches()` (pg_cron) to auto-confirm undisputed results after 48h. Replaces `report_match_and_swap()`. | ✅ Applied (functions answer via API, 2026-09-23) |
| 027 | `027_create_ladder_flow.sql` | `slugify()` + `create_ladder_full()`, one atomic SECURITY DEFINER function behind the self-service "Create a Ladder" flow. | ✅ Applied (`create_ladder_full` exists via API, 2026-09-23) |
| 028 | `028_dispute_resolution_queue.sql` | Admin dispute queue: `get_disputed_matches()` + `resolve_disputed_match()` (confirm with a final winner/score, or void and reopen the challenge). | ✅ Applied (both functions answer "Only an admin can…", 2026-09-23) |
| 029 | `029_private_contact_details.sql` | **Privacy fix**: column-level grants so `anon`/`authenticated` can no longer read `profiles.email`/`phone`. Adds `get_my_profile()` and `get_ladder_contacts()` (members/admins only), and removes phone from `ladder_standings`. Applied in 2 steps (functions, then deploy app code, then lockdown) so the live site never broke. | ✅ Applied 2026-09-23. Verified via API: `profiles?select=email` → 42501, names still readable, 15 standings rows, all public pages 200 |

> **How 024–028 were verified (2026-09-23):** calls were made to the live
> PostgREST API with the public anon key. An existing function answers with its
> own error message (e.g. "Match not found"), while a missing one answers
> `PGRST202`. This checks existence only, not SECURITY DEFINER flags or pg_cron
> schedules. For those, run this in the SQL Editor:
>
> ```sql
> select proname, prosecdef from pg_proc
> where pronamespace = 'public'::regnamespace
>   and proname in ('report_match','confirm_match_and_swap','dispute_match',
>     'auto_confirm_stale_matches','resolve_disputed_match','get_disputed_matches',
>     'create_ladder_full','swap_player_ranks');
> select jobname, schedule from cron.job;
> ```

## Current known state of `profiles` table columns

As of `013`, `public.profiles` has: `id`, `display_name`, `avatar_url`,
`is_admin`, `phone` (added in 007, NULL for pre-existing users), `email`
(added in 011, backfilled from `auth.users`), `created_at`, `updated_at`.

## Adding a new migration

Name it `01N_short_description.sql` with the next sequential number. Add a
row to the table above when you do. If it fully replaces an earlier script's
purpose, mark the earlier one `_SUPERSEDED` and note it here — don't delete
old files, they're the audit trail.
