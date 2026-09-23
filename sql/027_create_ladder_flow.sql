-- ============================================================================
-- Migration 027: Self-service "Create a Ladder" flow
-- ============================================================================
-- Until now, the ONLY way to get a new city/club/ladder onto the platform
-- was DMing @dublinsquashmentor on Instagram (SupportContact.tsx,
-- GlobalExplorer.tsx) -- despite the RLS policies for authenticated users
-- to insert cities/clubs/ladders having existed since 001_schema.sql.
-- No UI was ever built to use that permission. This migration adds a
-- single atomic function backing a real self-service "Create a Ladder"
-- flow: any signed-in user can create a brand-new city+club+ladder, add
-- a new club to an existing city, or add a new ladder to an existing
-- club, in one step, with no approval queue (matches the direct,
-- self-service model requested -- note: a request/approval queue design
-- was tried before in 019_ladder_requests_SUPERSEDED.sql and explicitly
-- rejected in favor of the (now-being-replaced) Instagram DM flow).
--
-- Design: SECURITY DEFINER so slug-collision retry logic and the
-- 3-table insert (city? -> club? -> ladder) happen atomically and can't
-- partially fail. auth.uid() is read directly inside the function (not
-- trusted from a client-passed parameter) so a signed-in user can only
-- ever create ladders as themselves.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/new
-- ============================================================================

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(regexp_replace(lower(trim(input)), '[^a-z0-9\s-]', '', 'g'), '[\s-]+', '-', 'g'));
$$;

create or replace function create_ladder_full(
  p_city_id uuid,           -- null = create a new city
  p_city_name text,         -- required if p_city_id is null
  p_country text,           -- required if p_city_id is null
  p_club_id uuid,           -- null = create a new club
  p_club_name text,         -- required if p_club_id is null
  p_club_address text,      -- optional
  p_ladder_name text,       -- required
  p_sport public.ladder_sport default 'squash'
)
returns table (
  out_city_slug text,
  out_club_slug text,
  out_ladder_id uuid,
  out_ladder_slug text
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_city_id uuid;
  v_city_slug text;
  v_club_id uuid;
  v_club_slug text;
  v_ladder_id uuid;
  v_ladder_slug text;
  v_base_slug text;
  v_candidate text;
  v_suffix int;
begin
  if v_user is null then
    raise exception 'You must be signed in to create a ladder';
  end if;

  if p_ladder_name is null or trim(p_ladder_name) = '' then
    raise exception 'Ladder name is required';
  end if;

  -- ---- City: reuse existing, or create with a collision-safe slug ----
  if p_city_id is not null then
    select id, slug into v_city_id, v_city_slug from public.cities where id = p_city_id;
    if v_city_id is null then
      raise exception 'Selected city not found';
    end if;
  else
    if p_city_name is null or trim(p_city_name) = '' then
      raise exception 'City name is required';
    end if;
    if p_country is null or trim(p_country) = '' then
      raise exception 'Country is required';
    end if;

    v_base_slug := slugify(p_city_name);
    v_candidate := v_base_slug;
    v_suffix := 1;
    while exists (select 1 from public.cities where slug = v_candidate) loop
      v_suffix := v_suffix + 1;
      v_candidate := v_base_slug || '-' || v_suffix;
    end loop;

    insert into public.cities (name, slug, country, created_by)
    values (trim(p_city_name), v_candidate, trim(p_country), v_user)
    returning id, slug into v_city_id, v_city_slug;
  end if;

  -- ---- Club: reuse existing (must belong to the resolved city), or create ----
  if p_club_id is not null then
    select id, slug into v_club_id, v_club_slug
    from public.clubs where id = p_club_id and city_id = v_city_id;
    if v_club_id is null then
      raise exception 'Selected club not found in this city';
    end if;
  else
    if p_club_name is null or trim(p_club_name) = '' then
      raise exception 'Club name is required';
    end if;

    v_base_slug := slugify(p_club_name);
    v_candidate := v_base_slug;
    v_suffix := 1;
    while exists (select 1 from public.clubs where city_id = v_city_id and slug = v_candidate) loop
      v_suffix := v_suffix + 1;
      v_candidate := v_base_slug || '-' || v_suffix;
    end loop;

    insert into public.clubs (city_id, name, slug, address, created_by)
    values (v_city_id, trim(p_club_name), v_candidate, nullif(trim(coalesce(p_club_address, '')), ''), v_user)
    returning id, slug into v_club_id, v_club_slug;
  end if;

  -- ---- Ladder: always newly created under the resolved club ----
  v_base_slug := slugify(p_ladder_name);
  v_candidate := v_base_slug;
  v_suffix := 1;
  while exists (select 1 from public.ladders where club_id = v_club_id and slug = v_candidate) loop
    v_suffix := v_suffix + 1;
    v_candidate := v_base_slug || '-' || v_suffix;
  end loop;

  insert into public.ladders (club_id, name, slug, sport, is_active, created_by)
  values (v_club_id, trim(p_ladder_name), v_candidate, coalesce(p_sport, 'squash'), true, v_user)
  returning id, slug into v_ladder_id, v_ladder_slug;

  -- Creator auto-joins their own new ladder at rank 1 -- otherwise they'd
  -- have just built an empty ladder they can't even challenge anyone on.
  perform public.join_ladder(v_ladder_id, v_user);

  return query select v_city_slug, v_club_slug, v_ladder_id, v_ladder_slug;
end;
$$;

grant execute on function public.create_ladder_full(uuid, text, text, uuid, text, text, text, public.ladder_sport) to authenticated;

-- Verify
select proname, prosecdef as is_security_definer
from pg_proc
where proname in ('create_ladder_full', 'slugify');
