-- ============================================================================
-- REMOVE SPECIFIC PLAYERS FROM ALL LADDERS
-- Names to remove: Karthik Iyer, Sneha Pillai, Adithya Varma,
--   Anurup B Shobha Raghu TDT, Mira Krishnan, Rahul Boss, Abhishek Thapar
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

-- Step 1: See who will be affected (verify before deleting)
SELECT
  p.id,
  p.display_name,
  p.email,
  l.name AS ladder,
  c.name AS club,
  ci.name AS city
FROM public.profiles p
JOIN public.ladder_players lp ON lp.player_id = p.id
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
JOIN public.cities ci ON ci.id = c.city_id
WHERE p.display_name IN (
  'Karthik Iyer',
  'Sneha Pillai',
  'Adithya Varma',
  'Anurup B Shobha Raghu TDT',
  'Mira Krishnan',
  'Rahul Boss',
  'Abhishek Thapar'
)
ORDER BY p.display_name;

-- Step 2: Delete their ladder memberships
DELETE FROM public.ladder_players
WHERE player_id IN (
  SELECT id FROM public.profiles
  WHERE display_name IN (
    'Karthik Iyer',
    'Sneha Pillai',
    'Adithya Varma',
    'Anurop B Shobha Raghu TDT',
    'Mira Krishnan',
    'Rahul Boss',
    'Abhishek Thapar'
  )
);

-- Step 3: Delete their challenges (as challenger or challenged)
DELETE FROM public.challenges
WHERE challenger_id IN (
  SELECT id FROM public.profiles
  WHERE display_name IN (
    'Karthik Iyer',
    'Sneha Pillai',
    'Adithya Varma',
    'Anuroop B Shobha Raghu TDT',
    'Mira Krishnan',
    'Rahul Boss',
    'Abhishek Thapar'
  )
)
OR challenged_id IN (
  SELECT id FROM public.profiles
  WHERE display_name IN (
    'Karthik Iyer',
    'Sneha Pillai',
    'Adithya Varma',
    'Anuroop B Shobha Raghu TDT',
    'Mira Krishnan',
    'Rahul Boss',
    'Abhishek Thapar'
  )
);

-- Step 4: Delete their profiles (optional — only if they have no other data)
-- DELETE FROM public.profiles
-- WHERE display_name IN (
--   'Karthik Iyer',
--   'Sneha Pillai',
--   'Adithya Varma',
--   'Anuroop B Shobha Raghu TDT',
--   'Mira Krishnan',
--   'Rahul Boss',
--   'Abhishek Thapar'
-- );

-- Step 5: Verify removal
SELECT
  p.display_name,
  l.name AS ladder,
  c.name AS club
FROM public.profiles p
JOIN public.ladder_players lp ON lp.player_id = p.id
JOIN public.ladders l ON l.id = lp.ladder_id
JOIN public.clubs c ON c.id = l.club_id
WHERE p.display_name IN (
  'Karthik Iyer',
  'Sneha Pillai',
  'Adithya Varma',
  'Anuroop B Shobha Raghu TDT',
  'Mira Krishnan',
  'Rahul Boss',
  'Abhishek Thapar'
);
