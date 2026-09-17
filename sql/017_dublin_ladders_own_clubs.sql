-- ============================================================================
-- Convert Dublin Squash Open + Dublin Women Squash Association into their
-- own clubs, directly under Dublin city (out of Mount Pleasant)
-- Corrects the earlier (never-actually-applied) plan in 010, which claimed
-- to move these two ladders into a wrapper "Dublin Squash" club -- that
-- INSERT/UPDATE never ran; both ladders were still sitting inside Mount
-- Pleasant until this migration. Verified via live diagnostic query before
-- writing this (see chat history around 2026-09-17).
-- Applied and confirmed live on squashladder.in/dublin.
-- ============================================================================

-- Step 1: Create the two new clubs under Dublin
INSERT INTO public.clubs (city_id, name, slug, description)
VALUES (
  (SELECT id FROM public.cities WHERE slug = 'dublin'),
  'Dublin Squash Open',
  'dublin-squash-open-club',
  'City-wide open squash ladder for Dublin.'
)
ON CONFLICT (city_id, slug) DO NOTHING;

INSERT INTO public.clubs (city_id, name, slug, description)
VALUES (
  (SELECT id FROM public.cities WHERE slug = 'dublin'),
  'Dublin Women Squash Association',
  'dublin-women-squash-club',
  'City-wide women''s squash ladder for Dublin.'
)
ON CONFLICT (city_id, slug) DO NOTHING;

-- Step 2: Move the existing ladders into their new clubs (players unaffected)
UPDATE public.ladders
SET club_id = (SELECT id FROM public.clubs WHERE slug = 'dublin-squash-open-club'),
    name = 'Ladder Ranking'
WHERE slug = 'dublin-squash-open';

UPDATE public.ladders
SET club_id = (SELECT id FROM public.clubs WHERE slug = 'dublin-women-squash-club'),
    name = 'Ladder Ranking'
WHERE slug = 'dublin-women-squash';

-- Step 3: Verify final state
SELECT
  ci.name AS city,
  c.name AS club,
  c.slug AS club_slug,
  l.name AS ladder,
  (SELECT COUNT(*) FROM public.ladder_players lp WHERE lp.ladder_id = l.id) AS player_count
FROM public.ladders l
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE ci.slug = 'dublin'
ORDER BY c.name;
