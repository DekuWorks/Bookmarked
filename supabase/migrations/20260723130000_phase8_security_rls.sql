-- Phase 8: security hardening — RLS visibility gaps and private message attachments

-- ---------------------------------------------------------------------------
-- activity_events: enforce visibility column in RLS (was client-only filtering)
-- ---------------------------------------------------------------------------

create or replace function public.activity_visible_to_viewer(
  p_owner_id uuid,
  p_visibility text,
  p_viewer_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_viewer_id is null then
    return false;
  end if;

  if p_viewer_id = p_owner_id then
    return true;
  end if;

  if p_visibility = 'private' then
    return false;
  end if;

  if p_visibility = 'public' then
    return true;
  end if;

  return exists (
    select 1
    from public.follows f
    where f.follower_id = p_viewer_id
      and f.following_id = p_owner_id
  );
end;
$$;

grant execute on function public.activity_visible_to_viewer(uuid, text, uuid) to authenticated;

drop policy if exists "activity_select_authenticated" on public.activity_events;
create policy "activity_select_visible"
  on public.activity_events for select
  to authenticated
  using (public.activity_visible_to_viewer(user_id, visibility, auth.uid()));

drop policy if exists "activity_update_own" on public.activity_events;
create policy "activity_update_own"
  on public.activity_events for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "activity_delete_own" on public.activity_events;
create policy "activity_delete_own"
  on public.activity_events for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_likes: gate SELECT on post visibility
-- ---------------------------------------------------------------------------

drop policy if exists "post_likes_select_authenticated" on public.post_likes;
create policy "post_likes_select_visible_post"
  on public.post_likes for select
  to authenticated
  using (public.post_visible_to_viewer(post_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- user_reading_note_categories: owner-only read (labels are personal)
-- ---------------------------------------------------------------------------

drop policy if exists "user_reading_note_categories_select" on public.user_reading_note_categories;
create policy "user_reading_note_categories_select_own"
  on public.user_reading_note_categories for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notifications: allow users to delete their own rows
-- ---------------------------------------------------------------------------

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- message-attachments storage: private bucket (signed URLs required)
-- ---------------------------------------------------------------------------

update storage.buckets
set public = false
where id = 'message-attachments';
