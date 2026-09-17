-- ============================================================================
-- Migration 020: Expose phone on ladder_standings for signed-in members only
-- ============================================================================
-- Adds profiles.phone to the ladder_standings view so members can see each
-- other's contact number (to arrange matches). Visibility is enforced in
-- application code, not RLS: the view itself is publicly readable (same as
-- before), but the Club Hub page only passes `phone` down to the UI when
-- the visitor is signed in AND a member of that ladder. Anonymous/public
-- visitors browsing the ladder never see phone numbers rendered.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

create or replace view public.ladder_standings as
select
  lp.ladder_id,
  lp.rank,
  lp.player_id,
  p.display_name,
  p.avatar_url,
  p.is_admin,
  lp.joined_at,
  l.name as ladder_name,
  c.name as club_name,
  c.slug as club_slug,
  ci.name as city_name,
  ci.slug as city_slug,
  p.phone
from public.ladder_players lp
join public.profiles p on p.id = lp.player_id
join public.ladders l on l.id = lp.ladder_id
join public.clubs c on c.id = l.club_id
join public.cities ci on ci.id = c.city_id
order by lp.ladder_id, lp.rank;

-- Verify
select ladder_id, rank, display_name, phone from public.ladder_standings limit 5;
