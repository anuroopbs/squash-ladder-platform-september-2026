-- ============================================================================
-- Remove Aditya Verma (rank 1) and Raghu Tedt (rank 4) from
-- P Karthik Squash Institute's ladder, keep NAWiN and Anuroop B Sobha.
-- Then re-rank so no gaps remain.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Step 1: Preview who will be removed (verify names match before deleting)
SELECT p.display_name, lp.rank, l.name AS ladder, c.name AS club
FROM public.ladder_players lp
JOIN public.profiles p ON p.id = lp.player_id
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
WHERE c.slug = 'p-karthik-squash-institute'
  AND p.display_name IN ('Aditya Verma', 'Raghu Tedt');

-- Step 2: Remove their challenges on this ladder (as challenger or challenged)
DELETE FROM public.challenges
WHERE ladder_id IN (
  SELECT l.id FROM public.ladders l
  JOIN public.clubs c ON c.id = l.club_id
  WHERE c.slug = 'p-karthik-squash-institute'
)
AND (
  challenger_id IN (SELECT id FROM public.profiles WHERE display_name IN ('Aditya Verma', 'Raghu Tedt'))
  OR challenged_id IN (SELECT id FROM public.profiles WHERE display_name IN ('Aditya Verma', 'Raghu Tedt'))
);

-- Step 3: Remove their ladder membership
DELETE FROM public.ladder_players
WHERE ladder_id IN (
  SELECT l.id FROM public.ladders l
  JOIN public.clubs c ON c.id = l.club_id
  WHERE c.slug = 'p-karthik-squash-institute'
)
AND player_id IN (
  SELECT id FROM public.profiles WHERE display_name IN ('Aditya Verma', 'Raghu Tedt')
);

-- Step 4: Re-rank the remaining players so ranks stay 1..N with no gaps
WITH re_ranked AS (
  SELECT lp.id, ROW_NUMBER() OVER (ORDER BY lp.rank) AS new_rank
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  WHERE c.slug = 'p-karthik-squash-institute'
)
UPDATE public.ladder_players
SET rank = re_ranked.new_rank
FROM re_ranked
WHERE public.ladder_players.id = re_ranked.id
  AND public.ladder_players.rank != re_ranked.new_rank;

-- Step 5: Verify final state
SELECT p.display_name, lp.rank
FROM public.ladder_players lp
JOIN public.profiles p ON p.id = lp.player_id
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
WHERE c.slug = 'p-karthik-squash-institute'
ORDER BY lp.rank;
