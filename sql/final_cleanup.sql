-- ============================================================================
-- SQL TO RUN IN SUPABASE SQL EDITOR
-- https://supabase.com/dashboard → SQL Editor → New Query → Paste this
-- ============================================================================

-- ============================================================================
-- 1. ADD PHONE COLUMN (for mobile OTP login) — SAFE, NO DATA CHANGE
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
-- 2. DUBLIN MOUNT PLEASANT: Remove #1 and #2, rename #3 to "Test Player"
-- ============================================================================

DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant' AND lp.rank = 1
);

DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant' AND lp.rank = 2
);

-- Rename remaining player to "Test Player"
UPDATE public.profiles
SET display_name = 'Test Player'
WHERE id IN (
  SELECT lp.player_id FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'dublin' AND c.slug = 'mount-pleasant'
    AND p.display_name = 'Niamh Sullivan'
);

-- Re-rank Dublin
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
-- 3. DELHI GYMKHANA: Delete ALL players (leave empty — no fake Test Player)
--    Note: Cannot create a new profile without a matching auth.users row,
--    so we leave it empty. The first real user to join will become Rank #1.
-- ============================================================================

DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  WHERE ci.slug = 'delhi' AND c.slug = 'delhi-gymkhana-club'
);

-- Delete the now-orphaned fake profiles
DELETE FROM public.profiles
WHERE display_name IN ('Rohan Malhotra', 'Ananya Sharma', 'Karan Mehta')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);


-- ============================================================================
-- 4. REMOVE HYDERABAD FAKES
-- ============================================================================

DELETE FROM public.ladder_players
WHERE id IN (
  SELECT lp.id FROM public.ladder_players lp
  JOIN public.ladders l ON l.id = lp.ladder_id
  JOIN public.clubs c ON c.id = l.club_id
  JOIN public.cities ci ON ci.id = c.city_id
  JOIN public.profiles p ON p.id = lp.player_id
  WHERE ci.slug = 'hyderabad'
    AND p.display_name IN ('Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
);

DELETE FROM public.profiles
WHERE display_name IN ('Test Partner E2E', 'Rank Test A', 'Rank Test B', 'Robert')
  AND id NOT IN (SELECT player_id FROM public.ladder_players);

-- Re-rank Hyderabad
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
-- 5. VERIFY
-- ============================================================================

SELECT ci.slug as city, c.name as club, p.display_name as player, lp.rank
FROM public.ladder_players lp
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
JOIN public.profiles p ON p.id = lp.player_id
ORDER BY ci.slug, c.name, lp.rank;
