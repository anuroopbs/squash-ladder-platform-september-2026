-- ============================================================================
-- Migration 029: Stop leaking player email + phone to the public
-- ============================================================================
-- Found 2026-09-23: the original "profiles are publicly readable" policy
-- (001_schema.sql) plus the default table grant meant anyone holding the
-- public anon key (it ships inside the website) could run
--   GET /rest/v1/profiles?select=email,phone
-- and download every player's email and phone (30 rows, 28 emails, 6 phones
-- at the time). ladder_standings (sql/020) also exposed phone publicly; the
-- app only *displayed* it to ladder members, but the API returned it to all.
--
-- Fix:
--   1. Column-level privileges: anon/authenticated may only read the public
--      columns of profiles (id, display_name, avatar_url, is_admin,
--      created_at, updated_at). email and phone are no longer readable.
--      Row policies are unchanged, so names still show on every ladder.
--   2. get_my_profile(): a signed-in user reads their own full row.
--   3. get_ladder_contacts(ladder): phone numbers for a ladder, returned only
--      to members of that ladder (email too, and every ladder, for admins).
--   4. ladder_standings recreated without phone.
-- Server-side code that needs emails (notify routes, expiry reminder) uses
-- the service-role key and is unaffected.
-- Applied via the Supabase SQL Editor on 2026-09-23.
-- ============================================================================

begin;

create or replace function public.get_my_profile()
returns setof public.profiles
language sql stable security definer set search_path = public
as $$ select * from public.profiles where id = auth.uid() $$;

create or replace function public.get_ladder_contacts(ladder_uuid uuid default null)
returns table (player_id uuid, ladder_id uuid, phone text, email text)
language plpgsql stable security definer set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  if auth.uid() is null then
    return;
  end if;
  select coalesce(p.is_admin, false) into caller_is_admin
  from public.profiles p where p.id = auth.uid();

  if caller_is_admin then
    return query
      select lp.player_id, lp.ladder_id, p.phone, p.email
      from public.ladder_players lp join public.profiles p on p.id = lp.player_id
      where ladder_uuid is null or lp.ladder_id = ladder_uuid;
  elsif ladder_uuid is not null and exists (
    select 1 from public.ladder_players
    where ladder_id = ladder_uuid and player_id = auth.uid()
  ) then
    return query
      select lp.player_id, lp.ladder_id, p.phone, null::text
      from public.ladder_players lp join public.profiles p on p.id = lp.player_id
      where lp.ladder_id = ladder_uuid;
  end if;
end;
$$;

revoke all on function public.get_my_profile() from public, anon;
revoke all on function public.get_ladder_contacts(uuid) from public, anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_ladder_contacts(uuid) to authenticated;

drop view public.ladder_standings;
create view public.ladder_standings as
select lp.ladder_id, lp.rank, lp.player_id, p.display_name, p.avatar_url,
       p.is_admin, lp.joined_at, l.name as ladder_name, c.name as club_name,
       c.slug as club_slug, ci.name as city_name, ci.slug as city_slug
from public.ladder_players lp
join public.profiles p on p.id = lp.player_id
join public.ladders l on l.id = lp.ladder_id
join public.clubs c on c.id = l.club_id
join public.cities ci on ci.id = c.city_id
order by lp.ladder_id, lp.rank;
grant select on public.ladder_standings to anon, authenticated;

revoke select on public.profiles from anon, authenticated;
grant select (id, display_name, avatar_url, is_admin, created_at, updated_at)
  on public.profiles to anon, authenticated;

commit;
notify pgrst, 'reload schema';

-- Verify (as anon, via API): profiles?select=email must fail with 42501,
-- profiles?select=display_name must work, ladder_standings must load.
