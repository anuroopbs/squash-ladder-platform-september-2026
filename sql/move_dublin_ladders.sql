-- ============================================================================
-- MOVE DUBLIN LADDERS TO THEIR OWN CLUB UNDER DUBLIN CITY
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Step 1: Create a dedicated club under Dublin city for city-wide ladders
INSERT INTO public.clubs (city_id, name, slug, description, is_active)
VALUES (
  (SELECT id FROM public.cities WHERE slug = 'dublin'),
  'Dublin Squash',
  'dublin-squash',
  'City-wide Dublin squash ladders open to all players.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Move the two Dublin ladders from Mount Pleasant to the new club
UPDATE public.ladders
SET club_id = (SELECT id FROM public.clubs WHERE slug = 'dublin-squash')
WHERE slug IN ('dublin-squash-open', 'dublin-women-squash');

-- Step 3: Verify — both ladders should now show under "Dublin Squash" club, not Mount Pleasant
SELECT
  l.name AS ladder,
  c.name AS club,
  ci.name AS city
FROM public.ladders l
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE ci.slug = 'dublin'
ORDER BY c.name, l.name;
