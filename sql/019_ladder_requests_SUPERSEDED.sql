-- ============================================================================
-- Migration 019: Ladder request table + RLS
-- Lets any visitor (logged in or not) submit a request for a new
-- city/club/ladder instead of the placeholder "coming soon" message.
-- Requests land in this table for manual review -- no auto-creation.
-- Run this in: https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih/sql/2aa03c76-3a39-48de-86d1-372d1ca5cbcd
-- ============================================================================

create type public.ladder_request_status as enum ('pending', 'approved', 'rejected');

create table if not exists public.ladder_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references public.profiles (id) on delete set null,
  requester_name text not null,
  requester_contact text not null, -- email or phone, whatever they gave
  city_name text not null,
  club_name text not null,
  sport public.ladder_sport not null default 'squash',
  notes text,
  status public.ladder_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger ladder_requests_set_updated_at
  before update on public.ladder_requests
  for each row execute function public.set_updated_at();

alter table public.ladder_requests enable row level security;

-- Anyone (including anonymous visitors) can submit a request
create policy "anyone can submit a ladder request"
  on public.ladder_requests for insert
  with check (true);

-- A signed-in user can see their own submitted requests (to check status)
create policy "users can view their own requests"
  on public.ladder_requests for select
  using (auth.uid() = requester_id);

-- Admins can see and manage all requests
create policy "admins can view all requests"
  on public.ladder_requests for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins can update requests"
  on public.ladder_requests for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Verify
select column_name, data_type from information_schema.columns
where table_schema = 'public' and table_name = 'ladder_requests'
order by ordinal_position;
