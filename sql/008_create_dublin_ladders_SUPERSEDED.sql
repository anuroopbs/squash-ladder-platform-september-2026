-- ============================================================================
-- SQL TO RUN IN SUPABASE SQL EDITOR (creates two new Dublin ladders)
-- ============================================================================

-- 1. DUBLIN SQUASH OPEN (under Mount Pleasant club)
INSERT INTO public.ladders (club_id, name, slug, sport, is_active)
VALUES (
  (SELECT id FROM public.clubs WHERE slug = 'mount-pleasant'),
  'Dublin Squash Open',
  'dublin-squash-open',
  'squash',
  true
);

-- 2. DUBLIN WOMEN SQUASH ASSOCIATION (under Mount Pleasant club)
INSERT INTO public.ladders (club_id, name, slug, sport, is_active)
VALUES (
  (SELECT id FROM public.clubs WHERE slug = 'mount-pleasant'),
  'Dublin Women Squash Association',
  'dublin-women-squash',
  'squash',
  true
);

-- Verify
SELECT l.name as ladder, c.name as club, ci.name as city
FROM public.ladders l
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE ci.slug = 'dublin'
ORDER BY l.name;
