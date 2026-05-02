-- Bookmarked Phase 0 — core tables, RLS, and policies
-- Run in Supabase SQL Editor or via Supabase CLI.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at in sync
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  bio text,
  avatar_url text,
  favorite_genres text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_lower on public.profiles (lower(username));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  external_source text,
  external_id text,
  title text not null,
  author text,
  description text,
  cover_url text,
  page_count integer,
  published_date text,
  isbn text,
  created_at timestamptz not null default now(),
  unique (external_source, external_id)
);

-- ---------------------------------------------------------------------------
-- user_books
-- ---------------------------------------------------------------------------
create table if not exists public.user_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  shelf_status text not null
    check (shelf_status in ('want_to_read', 'currently_reading', 'read')),
  progress_pages integer not null default 0,
  progress_percent numeric not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  rating numeric,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id)
);

drop trigger if exists user_books_set_updated_at on public.user_books;
create trigger user_books_set_updated_at
  before update on public.user_books
  for each row execute function public.set_updated_at();

create index if not exists user_books_user_id_idx on public.user_books (user_id);
create index if not exists user_books_book_id_idx on public.user_books (book_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  rating numeric,
  review_body text,
  has_spoilers boolean not null default false,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create index if not exists reviews_book_id_idx on public.reviews (book_id);
create index if not exists reviews_user_id_idx on public.reviews (user_id);

-- ---------------------------------------------------------------------------
-- activity_events
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_id_idx on public.activity_events (user_id);
create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.user_books enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_events enable row level security;

-- profiles: public read; users manage own row
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- books: readable by authenticated users; inserts for signed-in users (catalog growth)
drop policy if exists "books_select_authenticated" on public.books;
create policy "books_select_authenticated"
  on public.books for select
  using (auth.role() = 'authenticated');

drop policy if exists "books_insert_authenticated" on public.books;
create policy "books_insert_authenticated"
  on public.books for insert
  with check (auth.role() = 'authenticated');

-- user_books: only owner
drop policy if exists "user_books_select_own" on public.user_books;
create policy "user_books_select_own"
  on public.user_books for select
  using (auth.uid() = user_id);

drop policy if exists "user_books_insert_own" on public.user_books;
create policy "user_books_insert_own"
  on public.user_books for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_books_update_own" on public.user_books;
create policy "user_books_update_own"
  on public.user_books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_books_delete_own" on public.user_books;
create policy "user_books_delete_own"
  on public.user_books for delete
  using (auth.uid() = user_id);

-- reviews: public reads for public reviews; full control for author
drop policy if exists "reviews_select_visible" on public.reviews;
create policy "reviews_select_visible"
  on public.reviews for select
  using (
    visibility = 'public'
    or user_id = auth.uid()
  );

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- activity: authenticated can read feed; users insert their own events
drop policy if exists "activity_select_authenticated" on public.activity_events;
create policy "activity_select_authenticated"
  on public.activity_events for select
  using (auth.role() = 'authenticated');

drop policy if exists "activity_insert_own" on public.activity_events;
create policy "activity_insert_own"
  on public.activity_events for insert
  with check (auth.uid() = user_id);
