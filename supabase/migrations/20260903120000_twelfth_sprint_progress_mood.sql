-- Twelfth Sprint: per-user edition page count + private custom mood tags.
-- Additive only. Does not rewrite books.page_count or historical session moods.

-- ---------------------------------------------------------------------------
-- user_books.total_pages — reader's selected-edition page count (not catalog)
-- ---------------------------------------------------------------------------

alter table public.user_books
  add column if not exists total_pages integer;

alter table public.user_books
  drop constraint if exists user_books_total_pages_check;

alter table public.user_books
  add constraint user_books_total_pages_check
  check (total_pages is null or total_pages > 0);

comment on column public.user_books.total_pages is
  'Reader-owned page count for their selected edition. Does not update public.books.page_count.';

-- ---------------------------------------------------------------------------
-- Custom mood tags (private to creator). Sessions keep mood text on archive.
-- ---------------------------------------------------------------------------

create table if not exists public.user_mood_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1 and char_length(name) <= 32),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_mood_tags_user_id_lower_name_idx
  on public.user_mood_tags (user_id, lower(name));

create index if not exists user_mood_tags_user_id_idx
  on public.user_mood_tags (user_id, created_at);

alter table public.user_mood_tags enable row level security;

drop policy if exists "user_mood_tags_select_own" on public.user_mood_tags;
create policy "user_mood_tags_select_own"
  on public.user_mood_tags for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_mood_tags_insert_own" on public.user_mood_tags;
create policy "user_mood_tags_insert_own"
  on public.user_mood_tags for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_mood_tags_update_own" on public.user_mood_tags;
create policy "user_mood_tags_update_own"
  on public.user_mood_tags for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_mood_tags_delete_own" on public.user_mood_tags;
create policy "user_mood_tags_delete_own"
  on public.user_mood_tags for delete
  to authenticated
  using (auth.uid() = user_id);

-- Allow custom mood strings on sessions. Built-in names stay valid; history is unchanged.
alter table public.reading_sessions
  drop constraint if exists reading_sessions_mood_check;

alter table public.reading_sessions
  add constraint reading_sessions_mood_check
  check (mood is null or char_length(trim(mood)) >= 1 and char_length(mood) <= 32);
