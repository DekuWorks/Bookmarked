-- Feed book-only posts, session multi-moods, quote graphics vault, and
-- quote_graphic feed attachments. Additive. RLS keeps vaults private.

-- ---------------------------------------------------------------------------
-- posts: book-only body, quote graphic source, quote_graphic_id
-- ---------------------------------------------------------------------------
alter table public.posts
  add column if not exists quote_graphic_id uuid;

alter table public.posts
  drop constraint if exists posts_body_image_or_repost;

alter table public.posts
  add constraint posts_body_image_repost_or_book check (
    char_length(trim(body)) > 0
    or image_url is not null
    or repost_of_post_id is not null
    or book_id is not null
    or quote_graphic_id is not null
  );

alter table public.posts
  drop constraint if exists posts_source_type_check;

alter table public.posts
  add constraint posts_source_type_check
  check (
    source_type is null
    or source_type in (
      'review',
      'note',
      'post',
      'quote_graphic',
      'challenge_complete',
      'challenge_goal',
      'challenge_badge',
      'challenge_community_milestone'
    )
  );

-- ---------------------------------------------------------------------------
-- reading_sessions.moods — multi-select; mood stays first-tag snapshot
-- ---------------------------------------------------------------------------
alter table public.reading_sessions
  add column if not exists moods text[] not null default '{}';

update public.reading_sessions
set moods = array[trim(mood)]
where mood is not null
  and char_length(trim(mood)) > 0
  and (moods is null or cardinality(moods) = 0);

alter table public.reading_sessions
  drop constraint if exists reading_sessions_moods_check;

alter table public.reading_sessions
  add constraint reading_sessions_moods_check
  check (cardinality(moods) <= 12);

comment on column public.reading_sessions.moods is
  'Selected mood tags for this session. reading_sessions.mood remains the first tag for older analytics.';

-- ---------------------------------------------------------------------------
-- quote_graphics vault (private to owner)
-- ---------------------------------------------------------------------------
create table if not exists public.quote_graphics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reading_note_id uuid references public.reading_notes (id) on delete set null,
  book_id uuid references public.books (id) on delete set null,
  user_book_id uuid references public.user_books (id) on delete set null,
  quote_text text not null check (char_length(trim(quote_text)) >= 1),
  attribution text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists quote_graphics_user_id_created_idx
  on public.quote_graphics (user_id, created_at desc);

alter table public.quote_graphics enable row level security;

drop policy if exists "quote_graphics_select_own" on public.quote_graphics;
create policy "quote_graphics_select_own"
  on public.quote_graphics for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "quote_graphics_insert_own" on public.quote_graphics;
create policy "quote_graphics_insert_own"
  on public.quote_graphics for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "quote_graphics_update_own" on public.quote_graphics;
create policy "quote_graphics_update_own"
  on public.quote_graphics for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "quote_graphics_delete_own" on public.quote_graphics;
create policy "quote_graphics_delete_own"
  on public.quote_graphics for delete
  to authenticated
  using (auth.uid() = user_id);

alter table public.posts
  drop constraint if exists posts_quote_graphic_id_fkey;

alter table public.posts
  add constraint posts_quote_graphic_id_fkey
  foreign key (quote_graphic_id) references public.quote_graphics (id) on delete set null;

create index if not exists posts_quote_graphic_id_idx
  on public.posts (quote_graphic_id)
  where quote_graphic_id is not null;

-- Vault rows stay owner-only. Feed viewers see image_url / book_id on posts,
-- not another reader's private vault.

-- Reuse post-images for generated PNGs. Path: {userId}/quote-graphics/{id}.png
-- Existing post-images policies already scope uploads to auth.uid() folder.

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.quote_graphics;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;
