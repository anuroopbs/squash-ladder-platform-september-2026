-- ============================================================================
-- COMPLETE SQL — COPY PASTE ENTIRELY INTO SUPABASE SQL EDITOR
-- https://supabase.com/dashboard → SQL Editor → New Query → Paste ALL below
-- ============================================================================

-- ============================================================================
-- 1. ADD PHONE COLUMN (for mobile OTP login)
-- ============================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

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
-- 2. CREATE TWO NEW DUBLIN LADDERS
-- ============================================================================

-- Dublin Squash Open
INSERT INTO public.ladders (club_id, name, slug, sport, is_active)
VALUES (
  (SELECT id FROM public.clubs WHERE slug = 'mount-pleasant'),
  'Dublin Squash Open',
  'dublin-squash-open',
  'squash',
  true
) ON CONFLICT DO NOTHING;

-- Dublin Women Squash Association
INSERT INTO public.ladders (club_id, name, slug, sport, is_active)
VALUES (
  (SELECT id FROM public.clubs WHERE slug = 'mount-pleasant'),
  'Dublin Women Squash Association',
  'dublin-women-squash',
  'squash',
  true
) ON CONFLICT DO NOTHING;


-- ============================================================================
-- 3. REMOVE 17 DEGREES NORTH (Hyderabad)
-- ============================================================================

-- Delete its ladder(s)
DELETE FROM public.ladders
WHERE club_id IN (
  SELECT id FROM public.clubs WHERE slug = '17-degrees-north'
);

-- Delete the club
DELETE FROM public.clubs
WHERE slug = '17-degrees-north';


-- ============================================================================
-- 4. REMOVE PRESTIGE NIRVANA CLUB (Hyderabad)
-- ============================================================================

-- Delete its ladder(s)
DELETE FROM public.ladders
WHERE club_id IN (
  SELECT id FROM public.clubs WHERE slug = 'prestige-nirvana-club'
);

-- Delete the club
DELETE FROM public.clubs
WHERE slug = 'prestige-nirvana-club';


-- ============================================================================
-- 5. VERIFY RESULTS
-- ============================================================================

SELECT
  ci.name as city,
  c.name as club,
  l.name as ladder,
  COUNT(lp.id) as players
FROM public.cities ci
LEFT JOIN public.clubs c ON c.city_id = ci.id
LEFT JOIN public.ladders l ON l.club_id = c.id
LEFT JOIN public.ladder_players lp ON lp.ladder_id = l.id
GROUP BY ci.name, c.name, l.name
ORDER BY ci.name, c.name, l.name;
