-- ============================================================================
-- CLEANUP: Remove all fake players from Hyderabad/Secunderabad ladders
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Delete fake player rows from Hyderabad ladders
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

-- Step 2: Re-rank Secunderabad Club ladder (was 8 players, now 5)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY rank) as new_rank
  FROM public.ladder_players
  WHERE ladder_id = (
    SELECT l.id FROM public.ladders l
    JOIN public.clubs c ON c.id = l.club_id
    WHERE c.slug = 'secunderabad-club'
    LIMIT 1
  )
)
UPDATE public.ladder_players
SET rank = ranked.new_rank
FROM ranked
WHERE public.ladder_players.id = ranked.id;

-- Step 3: Re-rank P Karthik Squash Institute ladder (was 7 players, now 6)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY rank) as new_rank
  FROM public.ladder_players
  WHERE ladder_id = (
    SELECT l.id FROM public.ladders l
    JOIN public.clubs c ON c.id = l.club_id
    WHERE c.slug = 'p-karthik-squash-institute'
    LIMIT 1
  )
)
UPDATE public.ladder_players
SET rank = ranked.new_rank
FROM ranked
WHERE public.ladder_players.id = ranked.id;

-- Step 4: Delete orphaned fake profiles (not in any ladder)
DELETE FROM public.profiles
WHERE display_name IN ('Test Player', 'Live Deploy Test')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);

-- Step 5: Verify
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
