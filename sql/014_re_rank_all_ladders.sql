-- ============================================================================
-- RE-RANK ALL LADDERS GLOBALLY
-- Migration 014: Compacts rank sequences across every ladder so there are no
-- gaps left behind by player deletions. Run this after ANY player removal.
-- Re-run is idempotent — safe to execute multiple times.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

WITH re_ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY ladder_id ORDER BY rank) AS new_rank
  FROM public.ladder_players
)
UPDATE public.ladder_players
SET rank = re_ranked.new_rank
FROM re_ranked
WHERE public.ladder_players.id = re_ranked.id
  AND public.ladder_players.rank != re_ranked.new_rank;

-- Verify: should return 0 rows if ranks are already compacted
SELECT
  ladder_id,
  COUNT(*) AS total_players,
  MIN(rank) AS min_rank,
  MAX(rank) AS max_rank,
  MAX(rank) - COUNT(*) AS gap_count
FROM public.ladder_players
GROUP BY ladder_id
HAVING MAX(rank) != COUNT(*)
ORDER BY ladder_id;
