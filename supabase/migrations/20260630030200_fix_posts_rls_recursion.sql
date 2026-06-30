-- Fix posts RLS infinite recursion: posts SELECT policy subqueried posts
-- (repost visibility), which re-evaluated the same policy. Use a security
-- definer helper like messaging and custom shelves.

create or replace function public.post_visible_to_viewer(
  p_post_id uuid,
  p_viewer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  if p_viewer_id is null or p_post_id is null then
    return false;
  end if;

  select user_id
  into v_author_id
  from public.posts
  where id = p_post_id;

  if v_author_id is null then
    return false;
  end if;

  if p_viewer_id = v_author_id then
    return true;
  end if;

  if exists (
    select 1
    from public.follows f
    where f.follower_id = p_viewer_id
      and f.following_id = v_author_id
  ) then
    return true;
  end if;

  return exists (
    select 1
    from public.posts repost
    where repost.repost_of_post_id = p_post_id
      and (
        repost.user_id = p_viewer_id
        or exists (
          select 1
          from public.follows f2
          where f2.follower_id = p_viewer_id
            and f2.following_id = repost.user_id
        )
      )
  );
end;
$$;

drop policy if exists "posts_select_following_or_self" on public.posts;
create policy "posts_select_following_or_self"
  on public.posts for select
  to authenticated
  using (
    auth.uid() = user_id
    or public.post_visible_to_viewer(id, auth.uid())
  );

drop policy if exists "post_comments_select_visible_post" on public.post_comments;
create policy "post_comments_select_visible_post"
  on public.post_comments for select
  to authenticated
  using (public.post_visible_to_viewer(post_id, auth.uid()));

drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own"
  on public.post_comments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.post_visible_to_viewer(post_id, auth.uid())
  );
