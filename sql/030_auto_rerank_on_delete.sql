-- ============================================================================
-- Migration 030: Auto re-rank a ladder whenever a player leaves it
-- ============================================================================
-- Root cause of the "missing #1" bug (found 2026-09-24): removing a player
-- from ladder_players (via the admin panel's client-side .delete(), a
-- player leaving via the "users can leave a ladder themselves" RLS policy,
-- or any other delete) left a gap in the rank sequence -- e.g. ranks
-- 2,3,4,5,6 with nobody at #1. sql/014_re_rank_all_ladders.sql was written
-- for exactly this on 2026-09-16 but was a manual, one-off script that
-- nobody remembered to re-run after every removal, so the gap came back.
--
-- Fix: an AFTER DELETE trigger on ladder_players that compacts the ranks of
-- the affected ladder back to 1..N immediately, every time, regardless of
-- which code path did the delete. join_ladder() already inserts new players
-- at max(rank)+1, so as long as ranks stay compact on delete, gaps can't
-- reappear. Idempotent (no-op when already compact); uses the existing
-- deferrable unique(ladder_id, rank) constraint (sql/013), same technique
-- as sql/014, just automatic now instead of manual.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

create or replace function public.rerank_ladder_after_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  with re_ranked as (
    select id, row_number() over (order by rank) as new_rank
    from public.ladder_players
    where ladder_id = old.ladder_id
  )
  update public.ladder_players
  set rank = re_ranked.new_rank
  from re_ranked
  where public.ladder_players.id = re_ranked.id
    and public.ladder_players.rank != re_ranked.new_rank;

  return old;
end;
$$;

drop trigger if exists ladder_players_rerank_after_delete on public.ladder_players;
create trigger ladder_players_rerank_after_delete
  after delete on public.ladder_players
  for each row
  execute function public.rerank_ladder_after_delete();

-- Verify: trigger exists
select tgname, tgenabled from pg_trigger where tgname = 'ladder_players_rerank_after_delete';
