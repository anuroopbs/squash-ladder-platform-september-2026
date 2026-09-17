-- ============================================================================
-- DIAGNOSTIC: Show the REAL current state of every Dublin ladder
-- Run this first and share the result before we rename/clean anything.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

SELECT
  l.id AS ladder_id,
  l.name AS ladder_name,
  l.slug AS ladder_slug,
  c.name AS club_name,
  c.slug AS club_slug,
  ci.name AS city_name,
  (SELECT COUNT(*) FROM public.ladder_players lp WHERE lp.ladder_id = l.id) AS player_count,
  l.is_active,
  l.created_at
FROM public.ladders l
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE ci.slug = 'dublin'
ORDER BY c.name, l.created_at;
