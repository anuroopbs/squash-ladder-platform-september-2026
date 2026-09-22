-- ============================================================================
-- Migration 025: Admin panel setup
-- ============================================================================
-- 1. Grants Anuroop's account admin privileges (is_admin=true)
-- 2. Adds the missing "admins can delete ladder_players" RLS policy — the
--    existing admin policies (001_schema.sql) cover update/delete on
--    cities/clubs/ladders and update on ladder_players, but never delete on
--    ladder_players, so an admin couldn't remove a player from a ladder via
--    the app (only self-removal was allowed).
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

update public.profiles
set is_admin = true
where phone = '+917981600869';

drop policy if exists "admins can delete ladder players" on public.ladder_players;
create policy "admins can delete ladder players"
  on public.ladder_players for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- Verify
select id, display_name, phone, is_admin from public.profiles where is_admin = true;
