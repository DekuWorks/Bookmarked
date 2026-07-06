-- Reading notes & quote highlights for the Reading Room

create table public.reading_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_book_id uuid not null references public.user_books (id) on delete cascade,
  page_number integer check (page_number is null or page_number >= 0),
  chapter text check (chapter is null or char_length(trim(chapter)) <= 200),
  title text check (title is null or char_length(trim(title)) <= 200),
  note text check (note is null or char_length(note) <= 10000),
  quote text check (quote is null or char_length(quote) <= 5000),
  category text not null default 'general_note'
    check (category in (
      'favorite_quote',
      'character_development',
      'important_plot_point',
      'theory',
      'favorite_scene',
      'emotional_moment',
      'general_note'
    )),
  visibility text not null default 'private'
    check (visibility in ('private', 'friends_only', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_notes_content_check check (
    coalesce(nullif(trim(note), ''), nullif(trim(quote), '')) is not null
  )
);

create index reading_notes_user_id_created_at_idx
  on public.reading_notes (user_id, created_at desc);

create index reading_notes_user_book_id_created_at_idx
  on public.reading_notes (user_book_id, created_at desc);

create index reading_notes_category_idx
  on public.reading_notes (category);

create index reading_notes_visibility_idx
  on public.reading_notes (visibility)
  where visibility in ('friends_only', 'public');

create index reading_notes_search_text_idx
  on public.reading_notes
  using gin (to_tsvector('english', coalesce(note, '') || ' ' || coalesce(quote, '')));

drop trigger if exists reading_notes_set_updated_at on public.reading_notes;
create trigger reading_notes_set_updated_at
  before update on public.reading_notes
  for each row execute function public.set_updated_at();

-- Visibility helper (friends_only = mutual follows graph, same as shelf/custom shelf patterns)
create or replace function public.reading_note_visible_to_viewer(
  p_note_id uuid,
  p_viewer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_vis text;
begin
  if p_viewer_id is null then
    return false;
  end if;

  select user_id, visibility
  into v_owner_id, v_vis
  from public.reading_notes
  where id = p_note_id;

  if v_owner_id is null then
    return false;
  end if;

  if p_viewer_id = v_owner_id then
    return true;
  end if;

  if v_vis = 'private' then
    return false;
  end if;

  if v_vis = 'public' then
    return true;
  end if;

  return exists (
    select 1
    from public.follows
    where follower_id = p_viewer_id
      and following_id = v_owner_id
  );
end;
$$;

alter table public.reading_notes enable row level security;

drop policy if exists "reading_notes_select_visible" on public.reading_notes;
create policy "reading_notes_select_visible"
  on public.reading_notes for select
  using (public.reading_note_visible_to_viewer(id, auth.uid()));

drop policy if exists "reading_notes_insert_own" on public.reading_notes;
create policy "reading_notes_insert_own"
  on public.reading_notes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_books ub
      where ub.id = user_book_id
        and ub.user_id = auth.uid()
    )
  );

drop policy if exists "reading_notes_update_own" on public.reading_notes;
create policy "reading_notes_update_own"
  on public.reading_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "reading_notes_delete_own" on public.reading_notes;
create policy "reading_notes_delete_own"
  on public.reading_notes for delete
  using (auth.uid() = user_id);

-- Search prep: keyword + filter query for future global search UI
create or replace function public.search_reading_notes(
  p_user_id uuid default null,
  p_book_id uuid default null,
  p_user_book_id uuid default null,
  p_category text default null,
  p_page_number integer default null,
  p_keyword text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns setof public.reading_notes
language sql
stable
security invoker
set search_path = public
as $$
  select rn.*
  from public.reading_notes rn
  left join public.user_books ub on ub.id = rn.user_book_id
  where public.reading_note_visible_to_viewer(rn.id, auth.uid())
    and (p_user_id is null or rn.user_id = p_user_id)
    and (p_book_id is null or ub.book_id = p_book_id)
    and (p_user_book_id is null or rn.user_book_id = p_user_book_id)
    and (p_category is null or rn.category = p_category)
    and (p_page_number is null or rn.page_number = p_page_number)
    and (
      p_keyword is null
      or trim(p_keyword) = ''
      or to_tsvector('english', coalesce(rn.note, '') || ' ' || coalesce(rn.quote, ''))
         @@ plainto_tsquery('english', p_keyword)
    )
  order by rn.created_at desc
  limit greatest(1, least(coalesce(p_limit, 50), 100))
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Realtime (optional — journal-style refresh)
alter table public.reading_notes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.reading_notes;
exception
  when duplicate_object then null;
end $$;
