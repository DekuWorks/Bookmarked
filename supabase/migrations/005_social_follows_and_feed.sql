-- Social: follows graph + feed visibility on activity events

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_id_idx on public.follows (follower_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated"
  on public.follows for select
  using (auth.role() = 'authenticated');

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- activity_events.visibility (public | followers | private)
-- ---------------------------------------------------------------------------
alter table public.activity_events
  add column if not exists visibility text not null default 'public';

alter table public.activity_events
  drop constraint if exists activity_events_visibility_check;

alter table public.activity_events
  add constraint activity_events_visibility_check
  check (visibility in ('public', 'followers', 'private'));

create index if not exists activity_events_visibility_created_idx
  on public.activity_events (visibility, created_at desc);
