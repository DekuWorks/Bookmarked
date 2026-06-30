-- Reactions and threaded replies for book reviews and post comments

-- ---------------------------------------------------------------------------
-- review_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.review_reactions (
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (review_id, user_id)
);

create index if not exists review_reactions_user_id_idx
  on public.review_reactions (user_id);

alter table public.review_reactions enable row level security;

drop policy if exists "review_reactions_select_visible_review" on public.review_reactions;
create policy "review_reactions_select_visible_review"
  on public.review_reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_reactions.review_id
        and (r.visibility = 'public' or r.user_id = auth.uid())
    )
  );

drop policy if exists "review_reactions_insert_own" on public.review_reactions;
create policy "review_reactions_insert_own"
  on public.review_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.reviews r
      where r.id = review_reactions.review_id
        and (r.visibility = 'public' or r.user_id = auth.uid())
    )
  );

drop policy if exists "review_reactions_update_own" on public.review_reactions;
create policy "review_reactions_update_own"
  on public.review_reactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "review_reactions_delete_own" on public.review_reactions;
create policy "review_reactions_delete_own"
  on public.review_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- review_replies
-- ---------------------------------------------------------------------------
create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_reply_id uuid references public.review_replies (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists review_replies_review_id_created_idx
  on public.review_replies (review_id, created_at asc);

create index if not exists review_replies_parent_reply_id_idx
  on public.review_replies (parent_reply_id)
  where parent_reply_id is not null;

drop trigger if exists review_replies_set_updated_at on public.review_replies;
create trigger review_replies_set_updated_at
  before update on public.review_replies
  for each row execute function public.set_updated_at();

alter table public.review_replies enable row level security;

drop policy if exists "review_replies_select_visible_review" on public.review_replies;
create policy "review_replies_select_visible_review"
  on public.review_replies for select
  to authenticated
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_replies.review_id
        and (r.visibility = 'public' or r.user_id = auth.uid())
    )
  );

drop policy if exists "review_replies_insert_own" on public.review_replies;
create policy "review_replies_insert_own"
  on public.review_replies for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.reviews r
      where r.id = review_replies.review_id
        and (r.visibility = 'public' or r.user_id = auth.uid())
    )
  );

drop policy if exists "review_replies_update_own" on public.review_replies;
create policy "review_replies_update_own"
  on public.review_replies for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "review_replies_delete_own" on public.review_replies;
create policy "review_replies_delete_own"
  on public.review_replies for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_comment_reactions
-- ---------------------------------------------------------------------------
create table if not exists public.post_comment_reactions (
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reaction text not null check (reaction in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index if not exists post_comment_reactions_user_id_idx
  on public.post_comment_reactions (user_id);

alter table public.post_comment_reactions enable row level security;

drop policy if exists "post_comment_reactions_select_visible_comment" on public.post_comment_reactions;
create policy "post_comment_reactions_select_visible_comment"
  on public.post_comment_reactions for select
  to authenticated
  using (
    exists (
      select 1 from public.post_comments c
      join public.posts p on p.id = c.post_id
      where c.id = post_comment_reactions.comment_id
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

drop policy if exists "post_comment_reactions_insert_own" on public.post_comment_reactions;
create policy "post_comment_reactions_insert_own"
  on public.post_comment_reactions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.post_comments c
      join public.posts p on p.id = c.post_id
      where c.id = post_comment_reactions.comment_id
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

drop policy if exists "post_comment_reactions_update_own" on public.post_comment_reactions;
create policy "post_comment_reactions_update_own"
  on public.post_comment_reactions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "post_comment_reactions_delete_own" on public.post_comment_reactions;
create policy "post_comment_reactions_delete_own"
  on public.post_comment_reactions for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_comment_replies
-- ---------------------------------------------------------------------------
create table if not exists public.post_comment_replies (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.post_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_reply_id uuid references public.post_comment_replies (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_comment_replies_comment_id_created_idx
  on public.post_comment_replies (comment_id, created_at asc);

create index if not exists post_comment_replies_parent_reply_id_idx
  on public.post_comment_replies (parent_reply_id)
  where parent_reply_id is not null;

drop trigger if exists post_comment_replies_set_updated_at on public.post_comment_replies;
create trigger post_comment_replies_set_updated_at
  before update on public.post_comment_replies
  for each row execute function public.set_updated_at();

alter table public.post_comment_replies enable row level security;

drop policy if exists "post_comment_replies_select_visible_comment" on public.post_comment_replies;
create policy "post_comment_replies_select_visible_comment"
  on public.post_comment_replies for select
  to authenticated
  using (
    exists (
      select 1 from public.post_comments c
      join public.posts p on p.id = c.post_id
      where c.id = post_comment_replies.comment_id
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

drop policy if exists "post_comment_replies_insert_own" on public.post_comment_replies;
create policy "post_comment_replies_insert_own"
  on public.post_comment_replies for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.post_comments c
      join public.posts p on p.id = c.post_id
      where c.id = post_comment_replies.comment_id
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

drop policy if exists "post_comment_replies_update_own" on public.post_comment_replies;
create policy "post_comment_replies_update_own"
  on public.post_comment_replies for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "post_comment_replies_delete_own" on public.post_comment_replies;
create policy "post_comment_replies_delete_own"
  on public.post_comment_replies for delete
  to authenticated
  using (auth.uid() = user_id);
