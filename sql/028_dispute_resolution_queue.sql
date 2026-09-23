-- ============================================================================
-- Migration 028: Score dispute resolution queue
-- ============================================================================
-- Builds on 026 (match_confirmation_flow), which already lets either match
-- participant call dispute_match() to flag a wrong result -- that part was
-- already correct at the DB layer (disputed_by_uuid can be either
-- player1_id or player2_id). The gap found in a follow-up audit:
--   1. The UI only ever showed the "Dispute" button to the non-reporting
--      player (see MatchHistory.tsx needsMyConfirmation) -- the reporter
--      themselves had no way to flag their own mistake (e.g. a score typo)
--      before the opponent acted on it. Fixed client-side alongside this
--      migration.
--   2. Once a match hit status='disputed', nothing else could ever happen
--      to it -- no admin queue, no resolution function, ranks just stayed
--      frozen at whatever they were before the match. This migration adds
--      that resolution path.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

-- 1. resolve_disputed_match(): admin-only. Two outcomes:
--    a) 'confirm' -- admin decides on a final score/winner (can be the
--       original or a correction) and the swap happens now, same rank-swap
--       logic as confirm_match_and_swap().
--    b) 'void' -- admin throws the match out entirely (bad data, players
--       agree it never happened, etc). No rank change. The linked
--       challenge (if any) is reopened to 'accepted' so the players can
--       report a fresh result instead of being stuck with a used-up
--       challenge and no way to replay it.
create or replace function resolve_disputed_match(
  match_uuid uuid,
  admin_uuid uuid,
  resolution text, -- 'confirm' | 'void'
  final_winner_uuid uuid default null,
  final_score text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  m record;
  is_admin_user boolean;
  winner_rank integer;
  loser_rank integer;
  loser_uuid uuid;
  resolved_winner uuid;
  resolved_score text;
begin
  select is_admin into is_admin_user from public.profiles where id = admin_uuid;
  if not coalesce(is_admin_user, false) then
    raise exception 'Only an admin can resolve a disputed match';
  end if;

  if resolution not in ('confirm', 'void') then
    raise exception 'resolution must be ''confirm'' or ''void''';
  end if;

  select * into m from public.matches where id = match_uuid for update;
  if m is null then
    raise exception 'Match not found';
  end if;

  if m.status <> 'disputed' then
    raise exception 'Match is not currently disputed';
  end if;

  if resolution = 'void' then
    -- No rank change. Reopen the linked challenge (if any) so the two
    -- players can play again and report a clean result, rather than
    -- being permanently stuck with a used-up challenge and a voided match.
    if m.challenge_id is not null then
      update public.challenges
      set status = 'accepted', updated_at = now()
      where id = m.challenge_id and status = 'completed';
    end if;

    update public.matches
    set status = 'confirmed', confirmed_by = admin_uuid, score = 'VOID', updated_at = now()
    where id = match_uuid;

    return;
  end if;

  -- resolution = 'confirm': apply the admin's final call (defaults to the
  -- originally reported winner/score if the admin didn't override them).
  resolved_winner := coalesce(final_winner_uuid, m.winner_id);
  resolved_score := coalesce(final_score, m.score);

  if resolved_winner <> m.player1_id and resolved_winner <> m.player2_id then
    raise exception 'final_winner_uuid must be one of the two match participants';
  end if;

  select rank into winner_rank from public.ladder_players
  where ladder_id = m.ladder_id and player_id = resolved_winner;

  loser_uuid := case when resolved_winner = m.player1_id then m.player2_id else m.player1_id end;

  select rank into loser_rank from public.ladder_players
  where ladder_id = m.ladder_id and player_id = loser_uuid;

  if winner_rank is not null and loser_rank is not null and winner_rank > loser_rank then
    perform swap_player_ranks(m.ladder_id, resolved_winner, loser_uuid);
  end if;

  update public.matches
  set status = 'confirmed',
      confirmed_by = admin_uuid,
      winner_id = resolved_winner,
      score = resolved_score,
      updated_at = now()
  where id = match_uuid;
end;
$$;

grant execute on function public.resolve_disputed_match(uuid, uuid, text, uuid, text) to authenticated;

-- 2. Admins need to be able to SEE disputed matches with enough context
--    (player names, ladder/club/city) to resolve them sensibly. Deliberately
--    a security-definer FUNCTION (not a plain view) so the admin check
--    happens server-side and disputed match details never leak to a
--    regular authenticated user the way a bare `grant select` view would --
--    matches this codebase's existing pattern of admin-gated RPCs rather
--    than relying on view + RLS.
create or replace function get_disputed_matches(admin_uuid uuid)
returns table (
  match_id uuid,
  ladder_id uuid,
  player1_id uuid,
  player2_id uuid,
  winner_id uuid,
  score text,
  reported_by uuid,
  played_at date,
  updated_at timestamptz,
  player1_name text,
  player2_name text,
  reported_by_name text,
  ladder_name text,
  club_name text,
  club_slug text,
  city_name text,
  city_slug text
)
language plpgsql
security definer set search_path = public
as $$
declare
  is_admin_user boolean;
begin
  select is_admin into is_admin_user from public.profiles where id = admin_uuid;
  if not coalesce(is_admin_user, false) then
    raise exception 'Only an admin can view the dispute queue';
  end if;

  return query
  select
    m.id, m.ladder_id, m.player1_id, m.player2_id, m.winner_id, m.score,
    m.reported_by, m.played_at, m.updated_at,
    p1.display_name, p2.display_name, reporter.display_name,
    l.name, c.name, c.slug, ci.name, ci.slug
  from public.matches m
  join public.profiles p1 on p1.id = m.player1_id
  join public.profiles p2 on p2.id = m.player2_id
  join public.profiles reporter on reporter.id = m.reported_by
  join public.ladders l on l.id = m.ladder_id
  join public.clubs c on c.id = l.club_id
  join public.cities ci on ci.id = c.city_id
  where m.status = 'disputed'
  order by m.updated_at desc;
end;
$$;

grant execute on function public.get_disputed_matches(uuid) to authenticated;

-- Verify
select proname from pg_proc where proname in ('resolve_disputed_match', 'get_disputed_matches');
