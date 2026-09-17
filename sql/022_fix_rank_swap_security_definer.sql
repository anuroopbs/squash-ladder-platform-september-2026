-- ============================================================================
-- Migration 022: Fix silent rank-swap failures for non-admin players
-- ============================================================================
-- CONFIRMED BUG: swap_player_ranks() and report_match_and_swap() are NOT
-- security definer, meaning they run with the CALLING user's permissions.
-- The only RLS policy allowing UPDATE on ladder_players is "admins can
-- update ladder players" -- so when a regular (non-admin) player reports
-- a match and wins, the internal rank swap silently fails RLS. The match
-- gets recorded as confirmed, but the player's rank never actually moves.
-- Only the one existing admin account (is_admin=true) was unaffected,
-- which is why this went unnoticed.
--
-- Fix: mark both functions SECURITY DEFINER so they run with the
-- function owner's privileges (bypassing RLS internally), same pattern
-- already used correctly for handle_new_user() in 001_schema.sql.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

create or replace function swap_player_ranks(
  ladder_uuid uuid,
  player1_uuid uuid,
  player2_uuid uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  p1_rank integer;
  p2_rank integer;
begin
  select rank into p1_rank
  from public.ladder_players
  where ladder_id = ladder_uuid and player_id = player1_uuid
  for update;

  select rank into p2_rank
  from public.ladder_players
  where ladder_id = ladder_uuid and player_id = player2_uuid
  for update;

  if p1_rank is null or p2_rank is null then
    raise exception 'One or both players not found in ladder';
  end if;

  update public.ladder_players set rank = p2_rank where player_id = player1_uuid and ladder_id = ladder_uuid;
  update public.ladder_players set rank = p1_rank where player_id = player2_uuid and ladder_id = ladder_uuid;
end;
$$;

create or replace function report_match_and_swap(
  ladder_uuid uuid,
  challenge_uuid uuid,
  p1_uuid uuid,
  p2_uuid uuid,
  winner_uuid uuid,
  match_score text,
  reported_by_uuid uuid
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  match_id uuid;
  winner_rank integer;
  loser_rank integer;
  loser_uuid uuid;
begin
  insert into public.matches (
    ladder_id, challenge_id, player1_id, player2_id,
    winner_id, score, status, reported_by, played_at
  ) values (
    ladder_uuid, challenge_uuid, p1_uuid, p2_uuid,
    winner_uuid, match_score, 'pending_confirmation', reported_by_uuid, current_date
  ) returning id into match_id;

  select rank into winner_rank from public.ladder_players
  where ladder_id = ladder_uuid and player_id = winner_uuid;

  if winner_uuid = p1_uuid then
    loser_uuid := p2_uuid;
  else
    loser_uuid := p1_uuid;
  end if;

  select rank into loser_rank from public.ladder_players
  where ladder_id = ladder_uuid and player_id = loser_uuid;

  if winner_rank > loser_rank then
    perform swap_player_ranks(ladder_uuid, winner_uuid, loser_uuid);
  end if;

  if challenge_uuid is not null then
    update public.challenges set status = 'completed', updated_at = now()
    where id = challenge_uuid;
  end if;

  return match_id;
end;
$$;

-- Explicit grants (belt-and-suspenders, matches the pattern from migration 013)
grant execute on function public.swap_player_ranks(uuid, uuid, uuid) to authenticated;
grant execute on function public.report_match_and_swap(uuid, uuid, uuid, uuid, uuid, text, uuid) to authenticated;

-- Verify: both should now show true
SELECT proname, prosecdef AS is_security_definer
FROM pg_proc
WHERE proname IN ('swap_player_ranks', 'report_match_and_swap');
