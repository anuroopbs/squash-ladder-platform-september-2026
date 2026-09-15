-- ============================================================================
-- Ladder System Overhaul — Database Migration
-- ============================================================================
-- Fixes: challenge validation, rank-swap atomicity, score validation,
--        7-day challenge expiry, partial unique constraints
-- ============================================================================

-- 1. CHALLENGE 1-3 POSITION RULE
--    Create a function to validate challenge rank gap before insertion
create or replace function validate_challenge_rank_gap()
returns trigger
language plpgsql
as $$
declare
  challenger_rank integer;
  challenged_rank integer;
begin
  -- Get the ranks of both players in the same ladder
  select rank into challenger_rank
  from public.ladder_players
  where ladder_id = new.ladder_id and player_id = new.challenger_id;

  select rank into challenged_rank
  from public.ladder_players
  where ladder_id = new.ladder_id and player_id = new.challenged_id;

  -- Both must be in the ladder
  if challenger_rank is null then
    raise exception 'Challenger is not in this ladder';
  end if;

  if challenged_rank is null then
    raise exception 'Challenged player is not in this ladder';
  end if;

  -- Challenged player MUST be ABOVE (lower rank number) the challenger
  if challenged_rank >= challenger_rank then
    raise exception 'You can only challenge players above you on the ladder';
  end if;

  -- Gap must be 1-3 positions above
  if (challenger_rank - challenged_rank) > 3 then
    raise exception 'You can only challenge players 1-3 positions above you';
  end if;

  return new;
end;
$$;

-- Attach the validation trigger to challenges
drop trigger if exists before_challenge_insert on public.challenges;
create trigger before_challenge_insert
  before insert on public.challenges
  for each row execute function validate_challenge_rank_gap();


-- 2. MAX 1 ACTIVE CHALLENGE PER PLAYER
--    Partial unique index: only one pending/accepted challenge per challenger
create unique index if not exists one_active_challenge_per_player
  on public.challenges (challenger_id)
  where status in ('pending', 'accepted');


-- 3. SCORE FORMAT VALIDATION
--    CHECK constraint: squash scores must be in format "11-8, 9-11, 11-6"
alter table public.matches
  drop constraint if exists valid_score_format;

alter table public.matches
  add constraint valid_score_format
  check (
    score ~ '^([0-9]{1,2}-[0-9]{1,2}(,\s)?){1,4}$'
  );


-- 4. RANK-SWAP FUNCTION (Atomic)
--    Swaps two players' ranks in a single transaction-safe operation
create or replace function swap_player_ranks(
  ladder_uuid uuid,
  player1_uuid uuid,
  player2_uuid uuid
)
returns void
language plpgsql
as $$
declare
  temp_rank integer;
  p1_rank integer;
  p2_rank integer;
begin
  -- Lock both rows for update to prevent race conditions
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

  -- Swap via temp variable
  update public.ladder_players set rank = -1 where player_id = player1_uuid and ladder_id = ladder_uuid;
  update public.ladder_players set rank = p1_rank where player_id = player2_uuid and ladder_id = ladder_uuid;
  update public.ladder_players set rank = p2_rank where player_id = player1_uuid and ladder_id = ladder_uuid;
end;
$$;


-- 5. CHALLENGE 7-DAY EXPIRY
--    Function to expire stale pending challenges
create or replace function expire_old_challenges()
returns void
language plpgsql
as $$
begin
  update public.challenges
  set status = 'expired', updated_at = now()
  where status = 'pending'
    and created_at < now() - interval '7 days';
end;
$$;

-- Create a scheduled job using pg_cron (if available) or manual approach
-- Note: pg_cron may not be available on all Supabase plans.
-- Alternative: call expire_old_challenges() from application code periodically.


-- 6. AUTO-JOIN LADDER FUNCTION
--    When a user joins a ladder, assign them the lowest rank (highest number)
create or replace function join_ladder(
  ladder_uuid uuid,
  player_uuid uuid
)
returns void
language plpgsql
as $$
declare
  max_rank integer;
begin
  -- Get current max rank in this ladder
  select coalesce(max(rank), 0) + 1 into max_rank
  from public.ladder_players
  where ladder_id = ladder_uuid;

  -- Insert player at the bottom
  insert into public.ladder_players (ladder_id, player_id, rank)
  values (ladder_uuid, player_uuid, max_rank);
end;
$$;


-- 7. REPORT MATCH AND AUTO-SWAP RANKS
--    Reports a match result and swaps ranks if the lower-ranked player wins
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
as $$
declare
  match_id uuid;
  winner_rank integer;
  loser_rank integer;
  loser_uuid uuid;
begin
  -- Insert the match record
  insert into public.matches (
    ladder_id, challenge_id, player1_id, player2_id,
    winner_id, score, status, reported_by, played_at
  ) values (
    ladder_uuid, challenge_uuid, p1_uuid, p2_uuid,
    winner_uuid, match_score, 'pending_confirmation', reported_by_uuid, current_date
  ) returning id into match_id;

  -- If the winner was the lower-ranked player, swap ranks
  select rank into winner_rank from public.ladder_players
  where ladder_id = ladder_uuid and player_id = winner_uuid;

  -- Determine loser
  if winner_uuid = p1_uuid then
    loser_uuid := p2_uuid;
  else
    loser_uuid := p1_uuid;
  end if;

  select rank into loser_rank from public.ladder_players
  where ladder_id = ladder_uuid and player_id = loser_uuid;

  -- Only swap if winner had a higher rank number (lower position)
  if winner_rank > loser_rank then
    perform swap_player_ranks(ladder_uuid, winner_uuid, loser_uuid);
  end if;

  -- Update challenge status to completed
  if challenge_uuid is not null then
    update public.challenges set status = 'completed', updated_at = now()
    where id = challenge_uuid;
  end if;

  return match_id;
end;
$$;


-- 8. UPDATE LADDER_STANDINGS VIEW to include more useful info
create or replace view public.ladder_standings as
select
  lp.ladder_id,
  lp.rank,
  lp.player_id,
  p.display_name,
  p.avatar_url,
  p.is_admin,
  lp.joined_at,
  l.name as ladder_name,
  c.name as club_name,
  c.slug as club_slug,
  ci.name as city_name,
  ci.slug as city_slug
from public.ladder_players lp
join public.profiles p on p.id = lp.player_id
join public.ladders l on l.id = lp.ladder_id
join public.clubs c on c.id = l.club_id
join public.cities ci on ci.id = c.city_id
order by lp.ladder_id, lp.rank;
