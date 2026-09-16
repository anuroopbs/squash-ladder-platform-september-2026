-- ============================================================================
-- SQL TO RUN IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard → SQL Editor → New Query → Paste this
-- ============================================================================

-- ============================================================================
-- 1. DUBLIN MOUNT PLEASANT: Remove #1 and #2, rename #3 to "Test Player"
-- ============================================================================

-- Delete Aoife Byrne (Rank #1)
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant'
    AND lp.rank = 1
);

-- Delete Conor Walsh (Rank #2)
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant'
    AND lp.rank = 2
);

-- Rename Niamh Sullivan (now Rank #1 after deletions) to "Test Player"
UPDATE public.profiles
SET display_name = 'Test Player'
WHERE id IN (
  SELECT lp.player_id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant'
    AND p.display_name = 'Niamh Sullivan'
);

-- Re-rank Dublin Mount Pleasant
WITH re_ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY ladder_id ORDER BY rank) as new_rank
  FROM public.ladder_players
  WHERE ladder_id IN (
    SELECT l.id FROM public.ladders l
    JOIN public.clubs c ON c.id = l.club_id
    JOIN public.cities ci ON ci.id = c.city_id
    WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant'
  )
)
UPDATE public.ladder_players SET rank = re_ranked.new_rank
FROM re_ranked
WHERE public.ladder_players.id = re_ranked.id
  AND public.ladder_players.rank != re_ranked.new_rank;


-- ============================================================================
-- 2. DELHI GYMKHANA: Remove ALL players, keep only 1 "Test Player"
-- ============================================================================

-- Delete all players from Delhi Gymkhana
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  WHERE ci.slug = 'delhi' AND c.slug = 'delhi-gymkhana-club'
);

-- Delete the old fake profiles that were on Delhi Gymkhana (Rohan, Ananya, Karan)
DELETE FROM public.profiles
WHERE display_name IN ('Rohan Malhotra', 'Ananya Sharma', 'Karan Mehta')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);

-- Insert one Test Player profile
INSERT INTO public.profiles (id, display_name, is_admin)
VALUES (
  gen_random_uuid(),
  'Test Player',
  false
) ON CONFLICT DO NOTHING;

-- Add Test Player to Delhi Gymkhana ladder at Rank #1
INSERT INTO public.ladder_players (ladder_id, player_id, rank)
SELECT l.id, p.id, 1
FROM public.profiles p
CROSS JOIN public.ladders l
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE p.display_name = 'Test Player'
  AND ci.slug = 'delhi' AND c.slug = 'delhi-gymkhana-club'
  AND NOT EXISTS (
    SELECT 1 FROM public.ladder_players lp2
    WHERE lp2.ladder_id = l.id AND lp2.player_id = p.id
  );


-- ============================================================================
-- 3. ADD PHONE COLUMN (for mobile OTP login)
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update trigger to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 4. REMOVE FAKE PLAYERS FROM HYDERABAD (Secunderabad Club + P Karthik)
-- ============================================================================

-- Remove Test Partner E2E, Rank Test A, Rank Test B from Secunderabad Club
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'hyderabad'
    AND p.display_name IN ('Test Partner E2E', 'Rank Test A', 'Rank Test B')
);

-- Remove Robert from P Karthik Squash Institute
DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id
  FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'hyderabad' AND c.slug = 'p-karthik-squash-institute'
    AND p.display_name = 'Robert'
);

-- Delete orphaned fake profiles
DELETE FROM public.profiles
WHERE display_name IN ('Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);

-- Re-rank Hyderabad ladders
WITH re_ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY ladder_id ORDER BY rank) as new_rank
  FROM public.ladder_players
  WHERE ladder_id IN (
    SELECT l.id FROM public.ladders l
    JOIN public.clubs c ON c.id = l.club_id
    JOIN public.cities ci ON ci.id = c.city_id
    WHERE ci.slug = 'hyderabad'
  )
)
UPDATE public.ladder_players SET rank = re_ranked.new_rank
FROM re_ranked
WHERE public.ladder_players.id = re_ranked.id
  AND public.ladder_players.rank != re_ranked.new_rank;


-- ============================================================================
-- 5. VERIFY RESULTS
-- ============================================================================

SELECT ci.slug as city, c.name as club, p.display_name as player, lp.rank
FROM public.ladder_players lp
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
JOIN public.profiles p ON p.id = lp.player_id
ORDER BY ci.slug, c.name, lp.rank;
