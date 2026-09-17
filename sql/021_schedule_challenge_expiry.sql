-- ============================================================================
-- Migration 021: Actually schedule expire_old_challenges() to run
-- ============================================================================
-- The 7-day challenge expiry function (from migration 002) was written but
-- NEVER CALLED anywhere -- not from app code, not from any scheduled job.
-- This means challenges never actually expire: a "pending" challenge sits
-- forever unless a player manually accepts/declines/reports it. Combined
-- with the "1 active challenge per player" rule, an unresponded challenge
-- permanently blocks that player from ever challenging anyone else again.
--
-- This uses Supabase's pg_cron extension (built-in on all plans, including
-- free tier) to run expire_old_challenges() once a day.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

-- Enable pg_cron (safe to run even if already enabled)
create extension if not exists pg_cron;

-- Remove any previous schedule with the same name (idempotent)
select cron.unschedule('expire-old-challenges')
where exists (select 1 from cron.job where jobname = 'expire-old-challenges');

-- Schedule: run once a day at 3am UTC
select cron.schedule(
  'expire-old-challenges',
  '0 3 * * *',
  $$select public.expire_old_challenges();$$
);

-- Verify it's scheduled
select jobname, schedule, command, active
from cron.job
where jobname = 'expire-old-challenges';
