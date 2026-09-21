-- ============================================================================
-- Migration 024: Track expiry-reminder emails sent (avoid duplicate sends)
-- ============================================================================
-- Adds a column to challenges so the daily reminder job can mark a
-- challenge as "already reminded" and never email the same challenge twice.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

alter table public.challenges
  add column if not exists reminder_sent_at timestamptz;

-- Verify
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'challenges'
order by ordinal_position;
