-- User-created custom shelves (collections) with optional genre labels

create table public.user_shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1 and char_length(name) <= 80),
  slug text not null check (char_length(slug) >= 1 and char_length(slug) <= 64),
  genre text check (genre is null or char_length(trim(genre)) <= 80),
  visibility text not null default 'public'
    check (visibility in ('public', 'followers', 'private')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index user_shelves_user_id_idx on public.user_shelves (user_id, sort_order, created_at);

drop trigger if exists user_shelves_set_updated_at on public.user_shelves;
create trigger user_shelves_set_updated_at
  before update on public.user_shelves
  for each row execute function public.set_updated_at();

create table public.user_shelf_books (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references public.user_shelves (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (shelf_id, book_id)
);

create index user_shelf_books_shelf_id_idx on public.user_shelf_books (shelf_id);
create index user_shelf_books_user_id_idx on public.user_shelf_books (user_id, book_id);

create or replace function public.custom_shelf_visible_to_viewer(
  p_shelf_id uuid,
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
  from public.user_shelves
  where id = p_shelf_id;

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

alter table public.user_shelves enable row level security;
alter table public.user_shelf_books enable row level security;

create policy "user_shelves_select_visible"
  on public.user_shelves for select
  using (public.custom_shelf_visible_to_viewer(id, auth.uid()));

create policy "user_shelves_insert_own"
  on public.user_shelves for insert
  with check (auth.uid() = user_id);

create policy "user_shelves_update_own"
  on public.user_shelves for update
  using (auth.uid() = user_id);

create policy "user_shelves_delete_own"
  on public.user_shelves for delete
  using (auth.uid() = user_id);

create policy "user_shelf_books_select_visible"
  on public.user_shelf_books for select
  using (public.custom_shelf_visible_to_viewer(shelf_id, auth.uid()));

create policy "user_shelf_books_insert_own"
  on public.user_shelf_books for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_shelves s
      where s.id = shelf_id
        and s.user_id = auth.uid()
    )
  );

create policy "user_shelf_books_delete_own"
  on public.user_shelf_books for delete
  using (auth.uid() = user_id);
