-- ============================================================================
-- Migration 026: Real match confirmation flow
-- ============================================================================
-- Problem found in a full system audit (2026-09-22): matches.status and
-- confirmed_by have existed in the schema since 001_schema.sql, and
-- confirmMatch() was written in lib/queries/challenges.ts, but NO UI ever
-- called it. Worse, report_match_and_swap() (migration 002) swaps ranks
-- IMMEDIATELY on report, before the opponent ever sees or confirms
-- anything -- so "pending_confirmation" was purely cosmetic. A player
-- could report a false result and their rank would already have moved.
--
-- This migration:
--   1. Splits report_match_and_swap() into report_match() (insert only,
--      no swap) + confirm_match_and_swap() (opponent confirms -> swap
--      happens then, for the first time).
--   2. Adds dispute_match() so the opponent can flag a wrong result
--      instead of just ignoring it forever.
--   3. Adds auto_confirm_stale_matches(), scheduled via pg_cron, so a
--      match nobody disputes within 48h auto-confirms (prevents an
--      opponent going silent from permanently blocking the ladder).
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

-- 1. report_match(): insert only, mark the linked challenge completed, but
--    DO NOT touch ranks. Replaces the swap-on-report half of the old
--    report_match_and_swap().
create or replace function report_match(
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
begin
  insert into public.matches (
    ladder_id, challenge_id, player1_id, player2_id,
    winner_id, score, status, reported_by, played_at
  ) values (
    ladder_uuid, challenge_uuid, p1_uuid, p2_uuid,
    winner_uuid, match_score, 'pending_confirmation', reported_by_uuid, current_date
  ) returning id into match_id;

  -- Challenge is "used up" the moment a result is reported (even before
  -- confirmation) so the reporter isn't stuck unable to send a new
  -- challenge while this one waits on the opponent to confirm.
  if challenge_uuid is not null then
    update public.challenges set status = 'completed', updated_at = now()
    where id = challenge_uuid;
  end if;

  return match_id;
end;
$$;

-- 2. confirm_match_and_swap(): the opponent (or an admin) confirms a
--    pending match. THIS is where the rank swap actually happens now.
create or replace function confirm_match_and_swap(
  match_uuid uuid,
  confirmed_by_uuid uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  m record;
  winner_rank integer;
  loser_rank integer;
  loser_uuid uuid;
  is_admin_user boolean;
begin
  select * into m from public.matches where id = match_uuid for update;
  if m is null then
    raise exception 'Match not found';
  end if;

  if m.status <> 'pending_confirmation' then
    raise exception 'Match is not pending confirmation';
  end if;

  select is_admin into is_admin_user from public.profiles where id = confirmed_by_uuid;

  -- Only the non-reporting participant, or an admin, can confirm.
  if confirmed_by_uuid <> m.player1_id and confirmed_by_uuid <> m.player2_id
     and not coalesce(is_admin_user, false) then
    raise exception 'Only a match participant or an admin can confirm this result';
  end if;

  if confirmed_by_uuid = m.reported_by and not coalesce(is_admin_user, false) then
    raise exception 'The player who reported the score cannot confirm it themselves';
  end if;

  select rank into winner_rank from public.ladder_players
  where ladder_id = m.ladder_id and player_id = m.winner_id;

  loser_uuid := case when m.winner_id = m.player1_id then m.player2_id else m.player1_id end;

  select rank into loser_rank from public.ladder_players
  where ladder_id = m.ladder_id and player_id = loser_uuid;

  -- Only swap if the winner had the higher (worse) rank number.
  if winner_rank is not null and loser_rank is not null and winner_rank > loser_rank then
    perform swap_player_ranks(m.ladder_id, m.winner_id, loser_uuid);
  end if;

  update public.matches
  set status = 'confirmed', confirmed_by = confirmed_by_uuid, updated_at = now()
  where id = match_uuid;
end;
$$;

-- 3. dispute_match(): opponent flags a wrong result. No rank change --
--    an admin resolves disputes manually via the admin panel / SQL.
create or replace function dispute_match(
  match_uuid uuid,
  disputed_by_uuid uuid
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  m record;
begin
  select * into m from public.matches where id = match_uuid for update;
  if m is null then
    raise exception 'Match not found';
  end if;

  if m.status <> 'pending_confirmation' then
    raise exception 'Match is not pending confirmation';
  end if;

  if disputed_by_uuid <> m.player1_id and disputed_by_uuid <> m.player2_id then
    raise exception 'Only a match participant can dispute this result';
  end if;

  update public.matches
  set status = 'disputed', updated_at = now()
  where id = match_uuid;
end;
$$;

-- 4. auto_confirm_stale_matches(): safety net so a silent/ghosted
--    opponent can't permanently freeze a match in limbo. Runs daily via
--    pg_cron alongside expire_old_challenges(). Has its own direct swap
--    path (rather than calling confirm_match_and_swap(), which always
--    rejects the original reporter) since this IS the system auto-confirm.
create or replace function auto_confirm_stale_matches()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  m record;
  winner_rank integer;
  loser_rank integer;
  loser_uuid uuid;
begin
  for m in
    select * from public.matches
    where status = 'pending_confirmation'
      and created_at < now() - interval '48 hours'
  loop
    select rank into winner_rank from public.ladder_players
    where ladder_id = m.ladder_id and player_id = m.winner_id;

    loser_uuid := case when m.winner_id = m.player1_id then m.player2_id else m.player1_id end;

    select rank into loser_rank from public.ladder_players
    where ladder_id = m.ladder_id and player_id = loser_uuid;

    if winner_rank is not null and loser_rank is not null and winner_rank > loser_rank then
      perform swap_player_ranks(m.ladder_id, m.winner_id, loser_uuid);
    end if;

    update public.matches
    set status = 'confirmed', confirmed_by = null, updated_at = now()
    where id = m.id;
  end loop;
end;
$$;

-- Schedule the daily auto-confirm sweep (idempotent, same pattern as 021).
select cron.unschedule('auto-confirm-stale-matches')
where exists (select 1 from cron.job where jobname = 'auto-confirm-stale-matches');

select cron.schedule(
  'auto-confirm-stale-matches',
  '0 4 * * *', -- 4am UTC, an hour after the existing expiry job
  $$select public.auto_confirm_stale_matches();$$
);

-- Explicit grants (belt-and-suspenders, matches migration 022's pattern)
grant execute on function public.report_match(uuid, uuid, uuid, uuid, uuid, text, uuid) to authenticated;
grant execute on function public.confirm_match_and_swap(uuid, uuid) to authenticated;
grant execute on function public.dispute_match(uuid, uuid) to authenticated;

-- Verify both cron jobs exist
select jobname, schedule, active from cron.job where jobname in ('expire-old-challenges', 'auto-confirm-stale-matches');
