-- ============================================================================
-- Squash / Racket Sports Ladder Platform — Core Schema
-- Hierarchy: City -> Club -> Ladder -> (Ladder Players, Matches)
-- Target: Supabase (Postgres + auth.users + RLS)
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- profiles: one row per auth.users, holds app-level identity + admin flag
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- cities
-- ----------------------------------------------------------------------------
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null,
  latitude double precision,
  longitude double precision,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

create index if not exists cities_slug_idx on public.cities (slug);

-- ----------------------------------------------------------------------------
-- clubs (belong to a city)
-- ----------------------------------------------------------------------------
create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  address text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create trigger clubs_set_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

create index if not exists clubs_city_id_idx on public.clubs (city_id);

-- ----------------------------------------------------------------------------
-- ladders (belong to a club; a club can host more than one, e.g. per sport
-- or skill division, even though the v1 UI usually shows just one)
-- ----------------------------------------------------------------------------
create type public.ladder_sport as enum ('squash', 'padel', 'racquetball', 'other');

create table if not exists public.ladders (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  name text not null,
  slug text not null,
  sport public.ladder_sport not null default 'squash',
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (club_id, slug)
);

create trigger ladders_set_updated_at
  before update on public.ladders
  for each row execute function public.set_updated_at();

create index if not exists ladders_club_id_idx on public.ladders (club_id);

-- ----------------------------------------------------------------------------
-- ladder_players: junction table — a player can be in many ladders across
-- clubs/cities; rank is maintained here per ladder.
--
-- The (ladder_id, rank) constraint is declared deferrable and checked at
-- transaction end (not immediately) because the rank-movement trigger below
-- shifts several rows' ranks in one transaction — with an immediate unique
-- check, two rows can briefly both want the same rank number mid-shift and
-- Postgres would (wrongly) reject that as a violation.
-- ----------------------------------------------------------------------------
create table if not exists public.ladder_players (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  rank integer not null,
  joined_at timestamptz not null default now(),
  unique (ladder_id, player_id),
  constraint ladder_players_ladder_id_rank_key
    unique (ladder_id, rank) deferrable initially deferred
);

create index if not exists ladder_players_ladder_id_idx on public.ladder_players (ladder_id);
create index if not exists ladder_players_player_id_idx on public.ladder_players (player_id);

-- ----------------------------------------------------------------------------
-- challenges: a player challenges another within the same ladder
-- ----------------------------------------------------------------------------
create type public.challenge_status as enum ('pending', 'accepted', 'declined', 'expired', 'completed');

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders (id) on delete cascade,
  challenger_id uuid not null references public.profiles (id) on delete cascade,
  challenged_id uuid not null references public.profiles (id) on delete cascade,
  status public.challenge_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (challenger_id <> challenged_id)
);

create trigger challenges_set_updated_at
  before update on public.challenges
  for each row execute function public.set_updated_at();

create index if not exists challenges_ladder_id_idx on public.challenges (ladder_id);

-- ----------------------------------------------------------------------------
-- matches: a reported/confirmed result within a ladder; optionally linked
-- back to the challenge that spawned it
-- ----------------------------------------------------------------------------
create type public.match_status as enum ('pending_confirmation', 'confirmed', 'disputed');

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  ladder_id uuid not null references public.ladders (id) on delete cascade,
  challenge_id uuid references public.challenges (id) on delete set null,
  player1_id uuid not null references public.profiles (id) on delete cascade,
  player2_id uuid not null references public.profiles (id) on delete cascade,
  winner_id uuid not null references public.profiles (id) on delete cascade,
  score text not null, -- e.g. "11-8, 9-11, 11-6"
  status public.match_status not null default 'pending_confirmation',
  reported_by uuid not null references public.profiles (id) on delete cascade,
  confirmed_by uuid references public.profiles (id) on delete set null,
  played_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (player1_id <> player2_id),
  check (winner_id in (player1_id, player2_id))
);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create index if not exists matches_ladder_id_idx on public.matches (ladder_id);
create index if not exists matches_player1_id_idx on public.matches (player1_id);
create index if not exists matches_player2_id_idx on public.matches (player2_id);

-- ----------------------------------------------------------------------------
-- Automatic rank movement on match confirmation.
--
-- Classic challenge-ladder algorithm: when a match's status changes to
-- 'confirmed', if the winner was ranked worse (a higher rank number) than
-- the loser, the winner takes the loser's old rank, and everyone who was
-- strictly between the two old ranks shifts down (worse) by exactly one.
-- If the higher-ranked player defended (won), nothing changes.
--
-- This needs a privilege escalation beyond what RLS grants a normal player
-- (the "admins can update ladder players" policy below only lets admins
-- change rank directly), so it runs as `security definer` — the same
-- pattern already used by handle_new_user() above — rather than a
-- service-role API route. No application code changes are needed for this;
-- the existing client-side confirm/dispute call in ChallengeHub already
-- triggers it purely by updating matches.status.
--
-- The `matches` table has no loser_id column, only player1_id/player2_id/
-- winner_id, so the loser is derived as "whichever of the two isn't the
-- winner" rather than read directly.
-- ----------------------------------------------------------------------------
create or replace function public.handle_match_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  winner_rank int;
  loser_rank int;
  computed_loser_id uuid;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' then
    computed_loser_id := case
      when new.winner_id = new.player1_id then new.player2_id
      else new.player1_id
    end;

    select rank into winner_rank from public.ladder_players
      where ladder_id = new.ladder_id and player_id = new.winner_id;
    select rank into loser_rank from public.ladder_players
      where ladder_id = new.ladder_id and player_id = computed_loser_id;

    if winner_rank is not null and loser_rank is not null and winner_rank > loser_rank then
      update public.ladder_players set rank = rank + 1
        where ladder_id = new.ladder_id and rank >= loser_rank and rank < winner_rank;
      update public.ladder_players set rank = loser_rank
        where ladder_id = new.ladder_id and player_id = new.winner_id;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_match_confirmed on public.matches;
create trigger on_match_confirmed
  after update on public.matches
  for each row
  execute function public.handle_match_confirmed();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.clubs enable row level security;
alter table public.ladders enable row level security;
alter table public.ladder_players enable row level security;
alter table public.challenges enable row level security;
alter table public.matches enable row level security;

-- profiles: everyone can read (needed to show names on ladders); a user can
-- only update their own row; admins can update any row.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- cities: publicly readable; any authenticated user can create one (this is
-- the "add my city" flow); only admins can update/delete.
create policy "cities are publicly readable"
  on public.cities for select
  using (true);

create policy "authenticated users can create cities"
  on public.cities for insert
  to authenticated
  with check (true);

create policy "admins can update cities"
  on public.cities for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can delete cities"
  on public.cities for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- clubs: same pattern as cities
create policy "clubs are publicly readable"
  on public.clubs for select
  using (true);

create policy "authenticated users can create clubs"
  on public.clubs for insert
  to authenticated
  with check (true);

create policy "admins can update clubs"
  on public.clubs for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can delete clubs"
  on public.clubs for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ladders: same pattern
create policy "ladders are publicly readable"
  on public.ladders for select
  using (true);

create policy "authenticated users can create ladders"
  on public.ladders for insert
  to authenticated
  with check (true);

create policy "admins can update ladders"
  on public.ladders for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create policy "admins can delete ladders"
  on public.ladders for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ladder_players: publicly readable (standings); a user can join a ladder
-- (insert their own row); rank changes normally happen automatically via
-- the on_match_confirmed trigger above, but admins can also update rank
-- directly (e.g. to fix a mistake); a user can remove themselves.
create policy "ladder players are publicly readable"
  on public.ladder_players for select
  using (true);

create policy "users can join a ladder as themselves"
  on public.ladder_players for insert
  to authenticated
  with check (player_id = auth.uid());

create policy "users can leave a ladder themselves"
  on public.ladder_players for delete
  using (player_id = auth.uid());

create policy "admins can update ladder players"
  on public.ladder_players for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- challenges: publicly readable within context of a ladder page; only the
-- challenger can create a challenge as themselves; either party can update
-- status (accept/decline).
create policy "challenges are publicly readable"
  on public.challenges for select
  using (true);

create policy "users can create challenges as themselves"
  on public.challenges for insert
  to authenticated
  with check (challenger_id = auth.uid());

create policy "participants can update a challenge"
  on public.challenges for update
  using (auth.uid() in (challenger_id, challenged_id));

-- matches: publicly readable; either participant can report a result;
-- the non-reporting participant (or an admin) can confirm/dispute it.
create policy "matches are publicly readable"
  on public.matches for select
  using (true);

create policy "participants can report a match"
  on public.matches for insert
  to authenticated
  with check (
    reported_by = auth.uid()
    and auth.uid() in (player1_id, player2_id)
  );

create policy "participants and admins can update a match"
  on public.matches for update
  using (
    auth.uid() in (player1_id, player2_id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============================================================================
-- Role grants
-- RLS policies above only restrict WHICH rows a role can see/touch — Postgres
-- still requires the base table privilege to exist first. Supabase's own
-- dashboard-created tables get this via a default-privileges template that
-- only applies to that flow; tables created by hand through the SQL editor
-- (like this script) need it granted explicitly, or every query fails with
-- "permission denied for table X" even though RLS is configured correctly.
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;

-- ============================================================================
-- Convenience view: ladder standings (players ordered by rank, with names)
-- ============================================================================
create or replace view public.ladder_standings as
select
  lp.ladder_id,
  lp.rank,
  lp.player_id,
  p.display_name,
  p.avatar_url,
  lp.joined_at
from public.ladder_players lp
join public.profiles p on p.id = lp.player_id
order by lp.ladder_id, lp.rank;
