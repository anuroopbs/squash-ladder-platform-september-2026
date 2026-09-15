-- ============================================================================
-- CLEANUP FAKE PLAYERS — Run this in Supabase SQL Editor
-- ============================================================================
-- Rules:
-- 1. Hyderabad/Secunderabad: NO fake players at all
-- 2. Other cities: Keep 1 fake player max per ladder (only if ladder would be empty)
-- 3. Re-rank after removal
-- ============================================================================

-- Step 1: Delete ALL fake players from Hyderabad/Secunderabad ladders
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'hyderabad'
    AND p.display_name IN ('Test Player', 'Live Deploy Test', 'Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
);

-- Step 2: For other cities, delete all but one fake player per ladder
-- (keep the one with the lowest rank to minimize disruption)
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug != 'hyderabad'
    AND p.display_name IN ('Test Player', 'Live Deploy Test', 'Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
    AND lp.id NOT IN (
      -- Keep only the lowest-ranked fake player per ladder
      SELECT DISTINCT ON (lp2.ladder_id) lp2.id
      FROM public.ladder_players lp2
      JOIN public.ladders l2 ON l2.id = lp2.ladder_id
      JOIN public.clubs c2 ON c2.id = l2.club_id
      JOIN public.cities ci2 ON ci2.id = c2.city_id
      JOIN public.profiles p2 ON p2.id = lp2.player_id
      WHERE ci2.slug != 'hyderabad'
        AND p2.display_name IN ('Test Player', 'Live Deploy Test', 'Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
      ORDER BY lp2.ladder_id, lp2.rank ASC
    )
);

-- Step 3: Delete orphaned fake profiles (not in any ladder)
DELETE FROM public.profiles
WHERE display_name IN ('Test Player', 'Live Deploy Test', 'Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);

-- Step 4: Re-rank ALL ladders to close any gaps
WITH all_ladders AS (
  SELECT DISTINCT ladder_id FROM public.ladder_players
),
re_ranked AS (
  SELECT
    lp.id,
    lp.ladder_id,
    ROW_NUMBER() OVER (PARTITION BY lp.ladder_id ORDER BY lp.rank) as new_rank
  FROM public.ladder_players lp
)
UPDATE public.ladder_players
SET rank = re_ranked.new_rank
FROM re_ranked
WHERE public.ladder_players.id = re_ranked.id
  AND public.ladder_players.rank != re_ranked.new_rank;

-- Step 5: Verify final state
SELECT
  ci.slug as city,
  c.name as club,
  l.name as ladder,
  p.display_name as player,
  lp.rank
FROM public.ladder_players lp
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
JOIN public.profiles p ON p.id = lp.player_id
ORDER BY ci.slug, c.name, lp.rank;
