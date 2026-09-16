-- ============================================================================
-- CLEAN UP STUCK CHALLENGES (Migration 015)
-- Root cause: ReportScoreModal previously always sent challenge_uuid=null to
-- report_match_and_swap(), so a challenge's status never flipped to
-- 'completed' after the match was actually played and confirmed. Because
-- only 1 active (pending/accepted) challenge is allowed per player, this
-- silently blocked players from creating new challenges after their first
-- one was played out.
--
-- This is now fixed going forward (ReportScoreModal looks up the related
-- challenge and passes its id). This migration cleans up the ALREADY STUCK
-- challenges: any pending/accepted challenge between two players who
-- already have a confirmed match between them is marked completed.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Step 1: Preview what will be marked completed
SELECT
  c.id AS challenge_id,
  c.status,
  cp.display_name AS challenger,
  ep.display_name AS challenged,
  c.created_at
FROM public.challenges c
JOIN public.profiles cp ON cp.id = c.challenger_id
JOIN public.profiles ep ON ep.id = c.challenged_id
WHERE c.status IN ('pending', 'accepted')
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.ladder_id = c.ladder_id
      AND (
        (m.player1_id = c.challenger_id AND m.player2_id = c.challenged_id)
        OR (m.player1_id = c.challenged_id AND m.player2_id = c.challenger_id)
      )
      AND m.played_at >= c.created_at
  );

-- Step 2: Mark them completed
UPDATE public.challenges c
SET status = 'completed', updated_at = now()
WHERE c.status IN ('pending', 'accepted')
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.ladder_id = c.ladder_id
      AND (
        (m.player1_id = c.challenger_id AND m.player2_id = c.challenged_id)
        OR (m.player1_id = c.challenged_id AND m.player2_id = c.challenger_id)
      )
      AND m.played_at >= c.created_at
  );

-- Step 3: Verify — should return 0 rows now
SELECT COUNT(*) AS still_stuck
FROM public.challenges c
WHERE c.status IN ('pending', 'accepted')
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.ladder_id = c.ladder_id
      AND (
        (m.player1_id = c.challenger_id AND m.player2_id = c.challenged_id)
        OR (m.player1_id = c.challenged_id AND m.player2_id = c.challenger_id)
      )
      AND m.played_at >= c.created_at
  );
