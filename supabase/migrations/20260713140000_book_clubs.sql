-- Book Clubs: public/semi-public reading groups around a book or theme.
-- Distinct from group DMs (conversations) — clubs are discoverable, have a
-- current book, a member roster, and a discussion feed. Mirrors the messaging
-- membership/role model (owner/member) and the posts visibility model.

-- ---------------------------------------------------------------------------
-- book_clubs
-- ---------------------------------------------------------------------------
create table if not exists public.book_clubs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  current_book_id uuid references public.books (id) on delete set null,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_clubs_name_not_empty check (char_length(trim(name)) > 0),
  constraint book_clubs_visibility_check check (visibility in ('public', 'private'))
);

create index if not exists book_clubs_visibility_created_idx
  on public.book_clubs (visibility, created_at desc);

create index if not exists book_clubs_owner_id_idx
  on public.book_clubs (owner_id);

drop trigger if exists book_clubs_set_updated_at on public.book_clubs;
create trigger book_clubs_set_updated_at
  before update on public.book_clubs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- book_club_members
-- ---------------------------------------------------------------------------
create table if not exists public.book_club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (club_id, user_id),
  constraint book_club_members_role_check check (role in ('owner', 'member'))
);

create index if not exists book_club_members_user_id_idx
  on public.book_club_members (user_id);

create index if not exists book_club_members_club_id_idx
  on public.book_club_members (club_id);

-- ---------------------------------------------------------------------------
-- book_club_posts (discussions)
-- ---------------------------------------------------------------------------
create table if not exists public.book_club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.book_clubs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  book_id uuid references public.books (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_club_posts_body_not_empty check (char_length(trim(body)) > 0)
);

create index if not exists book_club_posts_club_created_idx
  on public.book_club_posts (club_id, created_at desc);

create index if not exists book_club_posts_user_id_idx
  on public.book_club_posts (user_id);

drop trigger if exists book_club_posts_set_updated_at on public.book_club_posts;
create trigger book_club_posts_set_updated_at
  before update on public.book_club_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Helper: is the current user a member of this club?
-- SECURITY DEFINER to avoid RLS recursion between clubs and members.
-- ---------------------------------------------------------------------------
create or replace function public.user_is_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.book_club_members m
    where m.club_id = p_club_id
      and m.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS: book_clubs
-- ---------------------------------------------------------------------------
alter table public.book_clubs enable row level security;

drop policy if exists "book_clubs_select_visible" on public.book_clubs;
create policy "book_clubs_select_visible"
  on public.book_clubs for select
  to authenticated
  using (
    visibility = 'public'
    or owner_id = auth.uid()
    or public.user_is_club_member(id)
  );

drop policy if exists "book_clubs_insert_own" on public.book_clubs;
create policy "book_clubs_insert_own"
  on public.book_clubs for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "book_clubs_update_owner" on public.book_clubs;
create policy "book_clubs_update_owner"
  on public.book_clubs for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "book_clubs_delete_owner" on public.book_clubs;
create policy "book_clubs_delete_owner"
  on public.book_clubs for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- RLS: book_club_members
-- ---------------------------------------------------------------------------
alter table public.book_club_members enable row level security;

drop policy if exists "book_club_members_select_visible" on public.book_club_members;
create policy "book_club_members_select_visible"
  on public.book_club_members for select
  to authenticated
  using (
    public.user_is_club_member(club_id)
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and (c.visibility = 'public' or c.owner_id = auth.uid())
    )
  );

-- Self-join a public club (or the owner adding themselves to their own club),
-- plus the club owner adding any member.
drop policy if exists "book_club_members_insert" on public.book_club_members;
create policy "book_club_members_insert"
  on public.book_club_members for insert
  to authenticated
  with check (
    (
      auth.uid() = user_id
      and exists (
        select 1
        from public.book_clubs c
        where c.id = club_id
          and (c.visibility = 'public' or c.owner_id = auth.uid())
      )
    )
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and c.owner_id = auth.uid()
    )
  );

-- Members can leave (delete self); owners can remove any member.
drop policy if exists "book_club_members_delete" on public.book_club_members;
create policy "book_club_members_delete"
  on public.book_club_members for delete
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and c.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: book_club_posts (discussions)
-- ---------------------------------------------------------------------------
alter table public.book_club_posts enable row level security;

drop policy if exists "book_club_posts_select_visible" on public.book_club_posts;
create policy "book_club_posts_select_visible"
  on public.book_club_posts for select
  to authenticated
  using (
    public.user_is_club_member(club_id)
    or exists (
      select 1
      from public.book_clubs c
      where c.id = club_id
        and (c.visibility = 'public' or c.owner_id = auth.uid())
    )
  );

drop policy if exists "book_club_posts_insert_member" on public.book_club_posts;
create policy "book_club_posts_insert_member"
  on public.book_club_posts for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.user_is_club_member(club_id)
  );

drop policy if exists "book_club_posts_update_own" on public.book_club_posts;
create policy "book_club_posts_update_own"
  on public.book_club_posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "book_club_posts_delete_own" on public.book_club_posts;
create policy "book_club_posts_delete_own"
  on public.book_club_posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Realtime (optional — enable new discussion subscriptions)
alter table public.book_club_posts replica identity full;

-- ---------------------------------------------------------------------------
-- PostgREST profile embeds
-- ---------------------------------------------------------------------------
alter table public.book_club_members
  drop constraint if exists book_club_members_user_id_profiles_fkey;

alter table public.book_club_members
  add constraint book_club_members_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

alter table public.book_club_posts
  drop constraint if exists book_club_posts_user_id_profiles_fkey;

alter table public.book_club_posts
  add constraint book_club_posts_user_id_profiles_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;
