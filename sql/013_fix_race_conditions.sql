-- ============================================================================
-- FIX #1: Ensure join_ladder() and report_match_and_swap() are callable
--         via RPC by authenticated users (Postgres grants EXECUTE to PUBLIC
--         by default, but making it explicit avoids surprises if someone
--         REVOKEs the default in the future).
-- FIX #2: Make the ladder_players rank unique constraint DEFERRABLE so
--         swap_player_ranks() can swap two ranks directly without the
--         fragile "set to -1 as a scratch value" workaround, which relied
--         on -1 never colliding with a real rank (true today, but not
--         guaranteed by the schema).
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Explicit grants (belt-and-suspenders; Postgres defaults already allow this)
grant execute on function public.join_ladder(uuid, uuid) to authenticated;
grant execute on function public.report_match_and_swap(uuid, uuid, uuid, uuid, uuid, text, uuid) to authenticated;
grant execute on function public.swap_player_ranks(uuid, uuid, uuid) to authenticated;

-- Make the (ladder_id, rank) uniqueness check deferrable so a transaction
-- can update both players' ranks and only have Postgres verify uniqueness
-- at COMMIT time, instead of after every individual UPDATE statement.
alter table public.ladder_players
  drop constraint if exists ladder_players_ladder_id_rank_key;

alter table public.ladder_players
  add constraint ladder_players_ladder_id_rank_key
  unique (ladder_id, rank) deferrable initially deferred;

-- Rewrite swap_player_ranks() to swap directly instead of via a "-1" scratch
-- value — now safe because the constraint is deferred until COMMIT.
create or replace function swap_player_ranks(
  ladder_uuid uuid,
  player1_uuid uuid,
  player2_uuid uuid
)
returns void
language plpgsql
as $$
declare
  p1_rank integer;
  p2_rank integer;
begin
  -- Lock both rows for update to prevent concurrent modification
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

  -- Direct swap; the unique(ladder_id, rank) constraint is deferred so
  -- Postgres only checks uniqueness once both updates have run, at COMMIT.
  update public.ladder_players set rank = p2_rank where player_id = player1_uuid and ladder_id = ladder_uuid;
  update public.ladder_players set rank = p1_rank where player_id = player2_uuid and ladder_id = ladder_uuid;
end;
$$;

-- Verify
SELECT conname, condeferrable, condeferred
FROM pg_constraint
WHERE conname = 'ladder_players_ladder_id_rank_key';
