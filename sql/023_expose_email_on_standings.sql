-- ============================================================================
-- Migration 023: Expose email on ladder_standings for notification sending
-- ============================================================================
-- Needed so the app can email a challenged player without a second query.
-- Same visibility pattern as phone (020): the view itself is publicly
-- readable, but application code only ever sends this to our own backend
-- API route (never rendered to other users in the UI) to trigger emails.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
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
  p.phone,
  p.email
from public.ladder_players lp
join public.profiles p on p.id = lp.player_id
join public.ladders l on l.id = lp.ladder_id
join public.clubs c on c.id = l.club_id
join public.cities ci on ci.id = c.city_id
order by lp.ladder_id, lp.rank;

-- Verify
select ladder_id, rank, display_name, phone, email from public.ladder_standings limit 5;
