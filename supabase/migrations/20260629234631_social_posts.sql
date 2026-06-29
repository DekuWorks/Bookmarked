-- Social posts: user-authored feed content with likes, comments, and reposts

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null default '',
  image_url text,
  book_id uuid references public.books (id) on delete set null,
  repost_of_post_id uuid references public.posts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(body)) > 0 or repost_of_post_id is not null)
);

create index if not exists posts_user_id_created_idx
  on public.posts (user_id, created_at desc);

create index if not exists posts_created_at_idx
  on public.posts (created_at desc);

create index if not exists posts_repost_of_post_id_idx
  on public.posts (repost_of_post_id)
  where repost_of_post_id is not null;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists "posts_select_following_or_self" on public.posts;
create policy "posts_select_following_or_self"
  on public.posts for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = posts.user_id
    )
    or exists (
      select 1 from public.posts repost
      where repost.repost_of_post_id = posts.id
        and (
          repost.user_id = auth.uid()
          or exists (
            select 1 from public.follows f2
            where f2.follower_id = auth.uid()
              and f2.following_id = repost.user_id
          )
        )
    )
  );

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_likes
-- ---------------------------------------------------------------------------
create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_likes_user_id_idx on public.post_likes (user_id);

alter table public.post_likes enable row level security;

drop policy if exists "post_likes_select_authenticated" on public.post_likes;
create policy "post_likes_select_authenticated"
  on public.post_likes for select
  to authenticated
  using (true);

drop policy if exists "post_likes_insert_own" on public.post_likes;
create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "post_likes_delete_own" on public.post_likes;
create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_comments
-- ---------------------------------------------------------------------------
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comments_post_id_created_idx
  on public.post_comments (post_id, created_at asc);

drop trigger if exists post_comments_set_updated_at on public.post_comments;
create trigger post_comments_set_updated_at
  before update on public.post_comments
  for each row execute function public.set_updated_at();

alter table public.post_comments enable row level security;

drop policy if exists "post_comments_select_visible_post" on public.post_comments;
create policy "post_comments_select_visible_post"
  on public.post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_comments.post_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid()
              and f.following_id = p.user_id
          )
          or exists (
            select 1 from public.posts repost
            where repost.repost_of_post_id = p.id
              and (
                repost.user_id = auth.uid()
                or exists (
                  select 1 from public.follows f2
                  where f2.follower_id = auth.uid()
                    and f2.following_id = repost.user_id
                )
              )
          )
        )
    )
  );

drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own"
  on public.post_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = post_comments.post_id
        and (
          p.user_id = auth.uid()
          or exists (
            select 1 from public.follows f
            where f.follower_id = auth.uid()
              and f.following_id = p.user_id
          )
        )
    )
  );

drop policy if exists "post_comments_update_own" on public.post_comments;
create policy "post_comments_update_own"
  on public.post_comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "post_comments_delete_own" on public.post_comments;
create policy "post_comments_delete_own"
  on public.post_comments for delete
  to authenticated
  using (auth.uid() = user_id);
